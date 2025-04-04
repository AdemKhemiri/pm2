// app.js
const express = require('express');
const app = express();
const PORT = 8001;

// Read the gateway from the environment
const gateway = process.env.GATEWAY || 'default';

// ** Crash test PM2
// throw new Error("Simulated PM2 crash for testing!");
app.get('/', (req, res) => {
    if (gateway === 'default'){
       res.send(`Access Denied: Default getway`);
    }
  res.send(`Node.js App is running with gateway: ${gateway}`);
});

// setInterval(() => {
//     console.log("Date Time", new Date().toUTCString());

// }, 3000);



app.listen(PORT, () => {
  console.log(`App running on http://localhost:${PORT}`);
});
