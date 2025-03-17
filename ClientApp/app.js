const express = require('express');
const app = express();
const PORT = 8001;

app.get('/', (req, res) => {
  res.send('Node.js App is running...');
});

app.listen(PORT, () => {
  console.log(`App running on http://localhost:${PORT}`);
});
