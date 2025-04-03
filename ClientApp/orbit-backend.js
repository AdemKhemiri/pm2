// server.js
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config()

const app = express();
app.use(express.json());
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL);

const GatewaySchema = new mongoose.Schema({
    gateway_id: String,
});
const GatewayModel = mongoose.model('gateways', GatewaySchema);

const PeriodSchema = new mongoose.Schema({
    licenseKey: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LicenseModel',
        required: true
    },
    date_debut: {
        type: Date,
        default: Date.now
    },
    date_fin: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'upcoming', 'canceled'],
        default: 'upcoming'
    },
});
const LicensePeriodModel = mongoose.model('LicensePeriod', PeriodSchema);

const LicenseUserInfoSchema = new mongoose.Schema({
//   licenseKey: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'LicenseModel',
//     required: true
//   },
  globalIP: {
    type: String,
  },
  country: String,
  city: String,
  coordinates: {
    // Simple storage without geospatial indexing
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
    licenseKey: String,
    currentPeriod: { type: mongoose.Schema.Types.ObjectId, ref: 'LicensePeriodModel' },
    gateways: [{
        gateway: {type: mongoose.Schema.Types.ObjectId, ref: 'GatewayModel'},
        userInfo: { type: mongoose.Schema.Types.ObjectId, ref: 'LicenseUserInfoModel' }
    }],
    // userInfo: { type: mongoose.Schema.Types.ObjectId, ref: 'LicenseUserInfoModel' },
    users: [String],
    isActive: Boolean,
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
            g => g.gateway.toString() === gateway
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
        // console.log(license, uuid);

        const data = await LicenseModel.findOne({ licenseKey: license }).populate({
            path: 'gateways.gateway',
            model: 'gateways',
        }).populate({
            path: 'gateways.userInfo',
            model: 'LicenseUserInfo'
        });
        // console.log(data);

        const response = {
            gateways: data.gateways.map(gateway => {
                if (!gateway.userInfo || gateway.userInfo.uuid === uuid) {
                    return gateway.gateway
                }
            }).filter(Boolean),
            isActive: data.isActive
        }
        return res.json({ success: true, data: response });
    } catch (err) {
        res.status(500).json({success: false, data: {}, message: err.message });
    }
});

// Start server
const PORT = 7000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
