import 'dotenv/config';
import express from 'express';
import usersHandler from '../api/users.js';
import userByIdHandler from '../api/users/[id].js';
import hierarchyHandler from '../api/users/hierarchy.js';
import walletHandler from '../api/users/wallet.js';
import loginHandler from '../api/auth/login.js';
import signupHandler from '../api/auth/signup.js';
import healthHandler from '../api/health.js';
import diagnosticsHandler from '../api/diagnostics.js';
import productsHandler from '../api/products.js';
import categoriesHandler from '../api/categories.js';
import categoryProductsHandler from '../api/categories/products.js';
import checkTablesHandler from '../api/check-tables.js';

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
app.all('/api/users/hierarchy', toRoute(hierarchyHandler));
app.all('/api/users/wallet', toRoute(walletHandler));
app.get('/api/users/:id', toRoute(userByIdHandler));
app.all('/api/products', toRoute(productsHandler));
app.all('/api/categories', toRoute(categoriesHandler));
app.all('/api/categories/products', toRoute(categoryProductsHandler));
app.all('/api/check-tables', toRoute(checkTablesHandler));
app.all('/api/health', toRoute(healthHandler));
app.all('/api/diagnostics', toRoute(diagnosticsHandler));
app.all('/api/auth/login', toRoute(loginHandler));
app.all('/api/auth/signup', toRoute(signupHandler));

const port = process.env.API_PORT || 3001;
app.listen(port, () => {
  console.log(`Dev API server listening on http://localhost:${port}`);
});
