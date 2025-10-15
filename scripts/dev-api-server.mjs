import 'dotenv/config';
import express from 'express';
import usersHandler from '../api/users.js';
import loginHandler from '../api/auth/login.js';
import healthHandler from '../api/health.js';
import diagnosticsHandler from '../api/diagnostics.js';

const app = express();
app.use(express.json());

// Adapter to map Vercel-style (req, res) handlers to Express routes
function toRoute(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (e) {
      res.status(500).json({ error: e?.message || 'Internal Error' });
    }
  };
}

app.all('/api/users', toRoute(usersHandler));
app.all('/api/health', toRoute(healthHandler));
app.all('/api/diagnostics', toRoute(diagnosticsHandler));
app.all('/api/auth/login', toRoute(loginHandler));

const port = process.env.API_PORT || 3001;
app.listen(port, () => {
  console.log(`Dev API server listening on http://localhost:${port}`);
});
