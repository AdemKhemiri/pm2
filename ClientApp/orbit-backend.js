// server.js
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config()

const app = express();
app.use(express.json());
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL);

const PeriodSchema = new mongoose.Schema({
    license: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LicenseModel',
        required: true
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
        type: String,
        enum: ['active', 'expired', 'upcoming', 'canceled'],
        default: 'active'
    },
});
const LicensePeriodModel = mongoose.model('LicensePeriod', PeriodSchema);

const LicenseUserInfoSchema = new mongoose.Schema({
  globalIP: {
    type: String,
  },
  country: String,
  city: String,
  coordinates: {
    lat: Number,
    lon: Number
  },
  uuid: String,
  username: String,
  hostname: String,
  cpuModel: String,
}, { timestamps: true });
const LicenseUserInfoModel = mongoose.model('LicenseUserInfo', LicenseUserInfoSchema);

// License Schema
const LicenseSchema = new mongoose.Schema({
    licenseKey: { type: String, required: true, unique: true },
    currentPeriod: { type: mongoose.Schema.Types.ObjectId, ref: 'LicensePeriod' },
    gateways: [{
        gateway: String,
        userInfo: { type: mongoose.Schema.Types.ObjectId, ref: 'LicenseUserInfoModel' },
        super_user_id: String
    }],
    users: [String],
    isActive: { type: Boolean, default: true },
    maxGateways: { type: Number, default: 1 }
},{ timestamps: true });
const LicenseModel = mongoose.model('licenses', LicenseSchema);

app.post('/save-user-info', async (req, res) => {
    try {
        const { licenseKey, gateway, ...userData } = req.body;

        // Validate required fields
        if (!licenseKey || !gateway) {
            return res.status(400).json({
                success: false,
                message: "Both licenseKey and gateway are required"
            });
        }

        // Find the license
        const license = await LicenseModel.findOne({ licenseKey });
        if (!license) {
            return res.status(404).json({
                success: false,
                message: "License not found"
            });
        }

        // Check if gateway exists in this license
        const gatewayIndex = license.gateways.findIndex(
            g => g.gateway === gateway
        );

        if (gatewayIndex === -1) {
            return res.status(404).json({
                success: false,
                message: "Gateway not found in this license"
            });
        }
        if (license.gateways[gatewayIndex].userInfo) {
            return res.status(400).json({
                success: false,
                message: "User info already exists for this gateway"
            });
        }
        // Create and save user info
        const userInfo = new LicenseUserInfoModel(userData);
        await userInfo.save();

        // Update the specific gateway's userInfo
        license.gateways[gatewayIndex].userInfo = userInfo._id;
        await license.save();

        return res.status(201).json({
            success: true,
            message: "User info saved to gateway"
        });

    } catch (err) {
        console.error("Error saving user info:", err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});


app.get('/license/:license/:uuid', async (req, res) => {

    try {
        const { license, uuid } =  req.params
        console.log(license, uuid);

        const data = await LicenseModel.findOne({ licenseKey: license })
        .populate({
            path: 'gateways.userInfo',
            model: 'LicenseUserInfo'
        }).populate('currentPeriod');
        // console.log(data);
        console.log(data);

        const response = {
            gateways: data.gateways.map(gateway => {
                if (!gateway.userInfo || gateway.userInfo.uuid === uuid) {
                    return gateway.gateway
                }
            }).filter(Boolean),
            isActive: data.currentPeriod.status === 'active',
            status: data.currentPeriod.status
        }
        return res.json({ success: true, data: response });
    } catch (err) {
        res.status(500).json({success: false, data: {}, message: err.message });
    }
});

// Create a new license
app.post('/licenses', async (req, res) => {
    try {
        const { licenseKey, startDate, endDate, ...licenseData } = req.body;

        // Create license first
        const newLicense = new LicenseModel({
            licenseKey,
            ...licenseData
        });

        // Create initial period
        const newPeriod = new LicensePeriodModel({
            license: newLicense._id,
            startDate,
            endDate
        });

        // Save both in transaction
        await mongoose.connection.transaction(async (session) => {
            await newLicense.save({ session });
            await newPeriod.save({ session });

            // Link the period to license
            newLicense.currentPeriod = newPeriod._id;
            await newLicense.save({ session });
        });

        res.status(201).json({
            success: true,
            data: await LicenseModel.findById(newLicense._id).populate('currentPeriod')
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Adding a New Period (Renewal)
app.post('/licenses/:id/periods', async (req, res) => {
    try {
        const { id } = req.params;
        const { startDate, endDate } = req.body;
        // Deactivate old period
        await LicensePeriodModel.updateOne(
            { license: id, status: 'active' },
            { status: 'expired' }
        );

        // Create new period
        const newPeriod = new LicensePeriodModel({
            license: id,
            startDate,
            endDate
        });

        await newPeriod.save();

        // Update license's current period reference
        const updatedLicense = await LicenseModel.findByIdAndUpdate(
            id,
            { currentPeriod: newPeriod._id },
            { new: true }
        ).populate('currentPeriod');

        res.status(201).json({
            success: true,
            data: updatedLicense
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Querying License with Period History
app.get('/licenses/history/:id', async (req, res) => {
    try {
        const { id } = req.params
        const license = await LicenseModel.findById(id)
            .populate('currentPeriod');

        const periods = await LicensePeriodModel.find({
            license: id
        }).sort({ startDate: -1 });

        res.json({
            success: true,
            data: {
                ...license.toObject(),
                periodHistory: periods
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// When handling an incoming request
app.get('/get-ip', (req, res) => {
    // Try these headers in order
    const ip = req.headers['x-forwarded-for'] ||
               req.headers['x-real-ip'] ||
               req.ip;
    console.log('Server public IP as seen by client:', ip);
    res.json({ ip });
});

// Start server
const PORT = 7000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
