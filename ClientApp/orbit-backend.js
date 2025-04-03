// server.js
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config()
const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL);

const GatewaySchema = new mongoose.Schema({
    gateway_id: String,
});
const GatewayModel = mongoose.model('gateways', GatewaySchema);


// Server Type Schema
const LicenseSchema = new mongoose.Schema({
    key: String,
    date_debut: Date,
    date_fin: Date,
    gateways: [{type: mongoose.Schema.Types.ObjectId, ref: 'GatewayModel'}],
    uuid: String,
    users: [String],
    isActive: Boolean,
},{ timestamps: true });
const LicenseModel = mongoose.model('licenses', LicenseSchema);

// API Endpoints
app.get('/license/:license/:uuid', async (req, res) => {
    try {
        const { license, uuid } =  req.params
        // console.log(license, uuid);

        const data = await LicenseModel.findOne({ key: license }).populate({
            path: 'gateways',
            model: 'gateways',
        });
        if(!data.uuid) {
            data.uuid = uuid;
            await data.save();
        }
        if (data.uuid !== uuid) {
           return res.status(401).json({success: false, data: {}, message: "Invalid License" });
        }
        const response = {
            gateways: data.gateways,
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
