// app.js
const express = require('express');
const app = express();
const PORT = 8001;

// Read the gateway from the environment
const gateway = process.env.GATEWAY || 'default';

app.get('/', (req, res) => {
    if (gateway === 'default'){
       res.send(`Access Denied: Default getway`);
    }
  res.send(`Node.js App is running with gateway: ${gateway}`);
});


app.listen(PORT, () => {
  console.log(`App running on http://localhost:${PORT}`);
});
