require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/hello', (req, res) => {
  res.json({ message: "Hello from my GCP VM" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});