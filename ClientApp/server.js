const express = require("express");
const { exec } = require("child_process");
const app = express();
const port = 8080;


app.use(express.json());
app.use(express.static("public"));
// const filePath = "D:/Work/Orbit/pm2/ClientApp/app.js"
const filePath = "C:/Program Files (x86)/Orbit/ClientApp/app.js"

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
