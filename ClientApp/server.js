const express = require("express");
const { exec } = require("child_process");
const app = express();
const port = 8080;


app.use(express.json());
app.use(express.static("public"));
const filePath = "D:/Work/Orbit/pm2/ClientApp/app.js"
let isActive = false

app.get('/get-mac-address', (req, res) => {
    const interface = require('os').version()
    return res.json({ mac: interface });

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
app.get("/fetch-gateways/:license", (req, res) => {
    const { license } = req.params
    // ** This section should send a request to mongodb to check if the gateaway is active
    try {
        fetch(`http://localhost:7000/license/${license}`)
            .then(res => res.json())
            .then(data => {
                isActive = data.data.isActive
                return res.json(data);
            });
    } catch (error) {
        isActive = false
        return res.json({ isActive, gateways: [] });
    }
    // if (gateway === "test1") {
    //     process.env.GATEWAY = gateway; // sending the gateway to the client app
    //     isActive = true
    // } else {
    //     isActive = false
    // }

})
app.get("/control/:action", (req, res) => {
    if (!isActive) {
        return res.json({ success: false, message: `Gateway is not valid` });
    }
    const action = req.params.action;
    if (action === 'kill') {
        exec(`pm2 ${action}`, (error, stdout, stderr) => {
            if (error) {
                return res.json({ success: false, message: `Failed to ${action} the app`, error: stderr });
            }

           return res.json({ success: true, message: `App has successfully ${action}ed` });
        });
    } else if (action === 'save') {
        exec(`pm2 save --force`, (error, stdout, stderr) => {
            if (error) {
                return res.json({ success: false, message: `Failed to ${action} the app`, error: stderr });
            }
           return res.json({ success: true, message: `App has successfully ${action}d` });
        });
    } else if (action === 'stop' || action === 'restart') {
        exec(`pm2 ${action} all`, (error, stdout, stderr) => {
            if (error) {
                return res.json({ success: false, message: `Failed to ${action} the app`, error: stderr });
            }
           return res.json({ success: true, message: `App has successfully ${action}ed` });
        });
    } else {
        exec(`pm2 ${action} ${filePath}`, (error, stdout, stderr) => {
            if (error) {
                return res.json({ success: false, message: `Failed to ${action} the app`, error: stderr });
            }
            return res.json({ success: true, message: `App has successfully ${action}ed` });
        });
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
