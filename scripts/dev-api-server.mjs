import 'dotenv/config';
import express from 'express';
import usersHandler from '../api/users.js';
import loginHandler from '../api/auth/login.js';
import signupHandler from '../api/auth/signup.js';
import diagnosticsHandler from '../api/diagnostics.js';
import productsHandler from '../api/products.js';
import categoriesHandler from '../api/categories.js';
import clientsHandler from '../api/clients.js';
import commissionRatesHandler from '../api/commission-rates.js';
import productImagesHandler from '../api/product-images.js';
import syncHandler from '../api/integrations/sync.js';
import testHandler from '../api/integrations/test.js';
import listHandler from '../api/integrations/list.js';

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
app.get('/api/users/:id', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return usersHandler(req, res);
});
app.all('/api/users/hierarchy', (req, res) => {
  req.query = { ...req.query, endpoint: 'hierarchy' };
  return usersHandler(req, res);
});
app.all('/api/users/wallet', (req, res) => {
  req.query = { ...req.query, endpoint: 'wallet' };
  return usersHandler(req, res);
});
app.all('/api/products', toRoute(productsHandler));
app.all('/api/categories', toRoute(categoriesHandler));
app.all('/api/clients', toRoute(clientsHandler));
app.all('/api/commission-rates', toRoute(commissionRatesHandler));
app.all('/api/product-images', toRoute(productImagesHandler));
app.all('/api/integrations/sync', toRoute(syncHandler));
app.all('/api/integrations/test', toRoute(testHandler));
app.all('/api/integrations/list', toRoute(listHandler));
app.all('/api/check-tables', (req, res) => {
  req.query = { ...req.query, endpoint: 'tables' };
  return diagnosticsHandler(req, res);
});
app.all('/api/health', (req, res) => {
  req.query = { ...req.query, endpoint: 'health' };
  return diagnosticsHandler(req, res);
});
app.all('/api/diagnostics', toRoute(diagnosticsHandler));
app.all('/api/auth/login', toRoute(loginHandler));
app.all('/api/auth/signup', toRoute(signupHandler));
app.all('/api/seed-admin', (req, res) => {
  req.query = { ...req.query, endpoint: 'seed-admin' };
  return usersHandler(req, res);
});

const port = process.env.API_PORT || 3001;
app.listen(port, () => {
  console.log(`Dev API server listening on http://localhost:${port}`);
});
