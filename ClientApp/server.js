const express = require("express");
const { exec } = require("child_process");
const os = require("os")
const fs = require('fs');
const pm2 = require('pm2');
const axios = require('axios'); // Added axios import

const getMachineUUID = require("./utils/uuid");
const trackLicenseLocation = require("./utils/location");
const getUserInfo = require("./utils/userInfo");

const app = express();

app.use(express.json());

// app.use(express.static("protected-public"));
app.use(express.static("public"));

const filePath = "data-reading.js"
// const filePath = "C:/Program Files (x86)/Orbit/ClientApp/app.js"
let isActive = false
const port = 6300;

app.get('/save-user-info/:license/:gateway', async(req, res) => {
    const { license, gateway } = req.params
    const machineUUID = getMachineUUID();
    const userInfo = getUserInfo();
    const location = await trackLicenseLocation()

    const object = {
        licenseKey: license,
        gateway: gateway,
        uuid: machineUUID,
        ...userInfo,
        ...location
    }
    if (!license || !machineUUID || !userInfo || !location) {
        return res.status(400).json({ error: "Something went wrong" });
    }

    try {
        const response = await axios.post('http://localhost:7000/save-user-info', object);
        return res.json(response.data);
    } catch (error) {
        return res.status(error.response?.status || 500).json({ error: error.message });
    }
});

app.post('/save-gateway', async (req, res) => {
    try {
        const { gateway } = req.body;
        if (!gateway) {
            return res.status(400).json({
                success: false,
                message: "Gateway is required"
            });
        }
        const data = {
            gateway: gateway
        };
        fs.writeFileSync('gateway.json', JSON.stringify(data, null, 2));
        res.json({
            success: true,
            gateway: gateway
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

app.get("/fetch-gateways/:license", async(req, res) => {
    const { license } = req.params

    try {
        const uuid = getMachineUUID()

        if (!license || !uuid) {
            return res.status(400).json({ error: "License key is required" });
        }

        const response = await axios.get(`http://localhost:7000/license/${license}/${uuid}`);
        isActive = response.data.data.isActive;
        return res.json(response.data);
    } catch (error) {
        console.log(error);
        isActive = false
        return res.json({ isActive, gateways: [] });
    }
});

app.get("/control/:action", (req, res) => {
    const action = req.params.action;

    pm2.connect((err) => {
        if (err) {
            console.error('PM2 connection error:', err);
            return res.status(500).json({ error: 'Failed to connect to PM2' });
        }
        const handlePM2Action = (err) => {
            if (err) {
                console.error(`PM2 ${action} error:`, err);
                return res.status(500).json({
                    success: false,
                    message: `Failed to ${action}`,
                    error: err.message
                });
            }

            res.json({
                success: true,
                message: `The App has successfully ${action}ed`
            });
        };

        switch (action) {
            case 'kill':
                pm2.killDaemon(handlePM2Action);
                break;
            case 'restart':
                pm2.restart('all', handlePM2Action);
                break;
            case 'stop':
                pm2.stop('all', handlePM2Action);
                break;
            case 'save':
                pm2.dump(handlePM2Action);
                break;
            default:
                pm2.start(filePath, handlePM2Action);
        }
    });
});

app.get('/pm2/status', (req, res) => {
    pm2.connect((err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to connect to PM2' });
        }

        pm2.list((err, processes) => {
            if (err) {
                console.error('PM2 list error:', err);
                return res.status(500).json({ error: 'Failed to fetch PM2 processes' });
            }

            const simplified = processes.map(proc => ({
                id: proc.pm_id,
                name: proc.name,
                status: proc.pm2_env.status,
                cpu: proc.monit.cpu,
                memory: proc.monit.memory,
            }));

            res.json({ processes: simplified });
        });
    });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
