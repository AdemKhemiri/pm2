const express = require("express");
const { exec } = require("child_process");
const os = require("os")
const getMachineUUID = require("./utils/uuid");
const trackLicenseLocation = require("./utils/location");
const getUserInfo = require("./utils/userInfo");
const app = express();
const port = 8080;


app.use(express.json());
app.use(express.static("public"));
const filePath = "D:/Work/Orbit/pm2/ClientApp/app.js"
// const filePath = "C:/Program Files (x86)/Orbit/ClientApp/app.js"

let isActive = false


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
    fetch('http://localhost:7000/save-user-info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(object)
    }).then(res => res.json()).then(data => {
        return res.json(data);
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
                // console.log(data);

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
