import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import usersHandler from '../api/users.js';
import loginHandler from '../api/auth/login.js';
import signupHandler from '../api/auth/signup.js';
import diagnosticsHandler from '../api/diagnostics.js';
import productsHandler from '../api/products.js';
import downloadTemplateHandler from '../api/products/download-template.js';
import uploadExcelHandler from '../api/products/upload-excel.js';
import categoriesHandler from '../api/categories.js';
import clientsHandler from '../api/clients.js';
import commissionRatesHandler from '../api/commission-rates.js';
import productImagesHandler from '../api/product-images.js';
import userAvatarsHandler from '../api/user-avatars.js';
import userPersonalIdsHandler from '../api/user-personal-ids.js';
import otpHandler from '../api/otp.js';
import resetPasswordHandler from '../api/auth/reset-password.js';
import syncHandler from '../api/integrations/sync.js';
import testHandler from '../api/integrations/test.js';
import listHandler from '../api/integrations/list.js';
import supabaseConfigHandler from '../api/supabase-config.js';
import ordersHandler from '../api/orders/index.js';
import orderByIdHandler from '../api/orders/[id].js';
import coworkerPermissionsHandler from '../api/coworker-permissions.js';

const app = express();
app.use(express.json({ limit: '50mb' })); // Increase limit for base64 image uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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
app.all('/api/users/profile', toRoute(usersHandler));
app.all('/api/users/hierarchy', (req, res) => {
  req.query = { ...req.query, endpoint: 'hierarchy' };
  return usersHandler(req, res);
});
app.all('/api/users/wallet', (req, res) => {
  req.query = { ...req.query, endpoint: 'wallet' };
  return usersHandler(req, res);
});
app.all('/api/products', toRoute(productsHandler));
app.get('/api/products/download-template', toRoute(downloadTemplateHandler));
app.post('/api/products/upload-excel', upload.single('file'), async (req, res) => {
  // Attach file buffer to request body for handler
  if (req.file) {
    req.body.fileBuffer = req.file.buffer;
    req.body.fileName = req.file.originalname;
  }
  return uploadExcelHandler(req, res);
});
app.all('/api/categories', toRoute(categoriesHandler));
app.all('/api/clients', toRoute(clientsHandler));
app.all('/api/orders', toRoute(ordersHandler));
app.get('/api/orders/:id', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return orderByIdHandler(req, res);
});
app.put('/api/orders/:id', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return orderByIdHandler(req, res);
});
app.delete('/api/orders/:id', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return orderByIdHandler(req, res);
});
app.all('/api/commission-rates', toRoute(commissionRatesHandler));
app.all('/api/product-images', toRoute(productImagesHandler));
app.all('/api/user-avatars', toRoute(userAvatarsHandler));
app.all('/api/user-personal-ids', toRoute(userPersonalIdsHandler));
app.all('/api/otp', toRoute(otpHandler));
app.all('/api/integrations/sync', toRoute(syncHandler));
app.all('/api/integrations/test', toRoute(testHandler));
app.all('/api/integrations/list', toRoute(listHandler));
app.all('/api/supabase-config', toRoute(supabaseConfigHandler));
app.all('/api/test-supabase-config', toRoute((await import('../api/test-supabase-config.js')).default));
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
app.all('/api/auth/reset-password', toRoute(resetPasswordHandler));
app.all('/api/coworker-permissions', toRoute(coworkerPermissionsHandler));
app.all('/api/seed-admin', (req, res) => {
  req.query = { ...req.query, endpoint: 'seed-admin' };
  return usersHandler(req, res);
});

const port = process.env.API_PORT || 3001;
app.listen(port, () => {
  console.log(`Dev API server listening on http://localhost:${port}`);
});
