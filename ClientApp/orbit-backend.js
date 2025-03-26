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
    license: String,
    date_debut: Date,
    date_fin: Date,
    gateways: [{type: mongoose.Schema.Types.ObjectId, ref: 'GatewayModel'}],
    users: [String],
    isActive: Boolean
});
const LicenseModel = mongoose.model('licenses', LicenseSchema);

// API Endpoints
app.get('/license/:license', async (req, res) => {
    try {
        const { license } =  req.params

        const data = await LicenseModel.findOne({ license }).populate({
            path: 'gateways',
            model: 'gateways',
        });
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
