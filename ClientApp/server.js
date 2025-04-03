const express = require("express");
const { exec } = require("child_process");
const getMachineUUID = require("./utils/uuid");
const app = express();
const port = 8080;


app.use(express.json());
app.use(express.static("public"));
const filePath = "D:/Work/Orbit/pm2/ClientApp/app.js"
// const filePath = "C:/Program Files (x86)/Orbit/ClientApp/app.js"

let isActive = false

app.get('/get-UUID', (req, res) => {

    const machineId = getMachineUUID();
    if (machineId) {
        return res.status(200).json({ uuid: machineId });
    }

    const interfaces = require('os').networkInterfaces().WiFi;
    interfaces?.forEach(interface => {
        if (interface.family === 'IPv4') {
           return res.json({ mac: interface.mac });
        }
    });
});
app.post('/save-gateway', async (req, res) => {
    try {
        const { gateway } = req.body;

        process.env.GATEWAY = gateway;
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
    // ** This section should send a request to mongodb to check if the gateaway is active
    try {
        const uuid = getMachineUUID()
        if (!license) {
            return res.status(400).json({ error: "License key is required" });
        }
        await fetch(`http://localhost:7000/license/${license}/${uuid}`)
            .then(res => res.json())
            .then(data => {
                isActive = data.data.isActive
                return res.json(data);
            });
    } catch (error) {
        isActive = false
        return res.json({ isActive, gateways: [] });
    }
})
app.get("/control/:action", (req, res) => {
    const action = req.params.action;
    let command;

    switch(action) {
        case 'kill':
            command = `pm2 ${action}`;
            break;
        case 'save':
            command = 'pm2 save --force';
            break;
        case 'stop':
        case 'restart':
            command = `pm2 ${action} all`;
            break;
        default:
            command = `pm2 ${action} "${filePath}"`;
    }

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing ${command}:`, stderr);
            return res.status(500).json({
                success: false,
                message: `Failed to ${action} the app`,
                error: stderr
            });
        }
        console.log(`Successfully executed ${command}:`, stdout);
        res.json({
            success: true,
            message: `App has successfully ${action}ed`
        });
    });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
