// server.mjs
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = process.env.PORT || 8080;

// Serve the built Vite files
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// SPA fallback – send index.html for any unknown route
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`ATL Ghetto Monopoly listening on port ${port}`);
});
