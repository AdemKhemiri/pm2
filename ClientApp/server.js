const express = require("express");
const { exec } = require("child_process");
const app = express();
const port = 8080;

app.use(express.static("public"));

app.get("/control/:action", (req, res) => {
    const action = req.params.action;
    if (action === 'kill') {
        exec(`pm2 ${action}`, (error, stdout, stderr) => {
            if (error) {
                return res.json({ success: false, message: `Failed to ${action} the app`, error: stderr });
            }
            
            res.json({ success: true, message: `App has successfully ${action}ed` });
        });
    } else if (action === 'save') {
        exec(`pm2 save --force`, (error, stdout, stderr) => {
            if (error) {
                return res.json({ success: false, message: `Failed to ${action} the app`, error: stderr });
            }
            res.json({ success: true, message: `App has successfully ${action}d` });
        });
    } else if (action === 'stop' || action === 'restart') {
        exec(`pm2 ${action} all`, (error, stdout, stderr) => {
            if (error) {
                return res.json({ success: false, message: `Failed to ${action} the app`, error: stderr });
            }
            res.json({ success: true, message: `App has successfully ${action}d` });
        });
    } 
    else {
        exec(`pm2 ${action} "C:/Ems/data-reading.js"`, (error, stdout, stderr) => {
            if (error) {
                return res.json({ success: false, message: `Failed to ${action} the app`, error: stderr });
            }
            res.json({ success: true, message: `App has successfully ${action}ed` });
        });
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
