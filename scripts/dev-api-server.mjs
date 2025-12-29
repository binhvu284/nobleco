import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import usersHandler from '../api/users.js';
import loginHandler from '../api/auth/login.js';
import signupHandler from '../api/auth/signup.js';
import diagnosticsHandler from '../api/diagnostics.js';
import productsHandler from '../api/products.js';
import downloadTemplateHandler from '../api/products/download-template.js';
import downloadCenterstoneTemplateHandler from '../api/centerstones/download-template.js';
import uploadExcelHandler from '../api/products/upload-excel.js';
import categoriesHandler from '../api/categories.js';
import clientsHandler from '../api/clients.js';
import commissionRatesHandler from '../api/commission-rates.js';
import productImagesHandler from '../api/product-images.js';
import userAvatarsHandler from '../api/user-avatars.js';
import userPersonalIdsHandler from '../api/user-personal-ids.js';
import otpHandler from '../api/otp.js';
import resetPasswordHandler from '../api/auth/reset-password.js';
import verifyPasswordHandler from '../api/users/verify-password.js';
import changePasswordHandler from '../api/users/change-password.js';
import syncHandler from '../api/integrations/sync.js';
import testHandler from '../api/integrations/test.js';
import listHandler from '../api/integrations/list.js';
import supabaseConfigHandler from '../api/supabase-config.js';
import ordersHandler from '../api/orders/index.js';
import orderByIdHandler from '../api/orders/[id].js';
import coworkerPermissionsHandler from '../api/coworker-permissions.js';
import bankInfoHandler from '../api/bank-info.js';
import withdrawRequestsHandler from '../api/withdraw-requests.js';
import adminWithdrawRequestsHandler from '../api/admin-withdraw-requests.js';
import dashboardMetricsHandler from '../api/admin/dashboard-metrics.js';
import productMetricsHandler from '../api/admin/product-metrics.js';
import userDashboardMetricsHandler from '../api/user/dashboard-metrics.js';
import statsHandler from '../api/stats.js';
import sepayWebhookHandler from '../api/sepay/webhook.js';
import createPaymentHandler from '../api/orders/[id]/create-payment.js';
import paymentStatusHandler from '../api/orders/[id]/payment-status.js';
import testPaymentHandler from '../api/orders/[id]/test-payment.js';
import paymentConfigHandler from '../api/payment-config.js';
import discountCodesHandler from '../api/discount-codes.js';
import centerstonesHandler from '../api/centerstones.js';
import centerstoneCategoriesHandler from '../api/centerstone-categories.js';
import centerstoneImagesHandler from '../api/centerstone-images.js';
import uploadCenterstoneExcelHandler from '../api/centerstones/upload-excel.js';

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
app.all('/api/centerstones', toRoute(centerstonesHandler));
app.get('/api/centerstones/download-template', toRoute(downloadCenterstoneTemplateHandler));
app.post('/api/centerstones/upload-excel', upload.single('file'), async (req, res) => {
  // Attach file buffer to request body for handler
  if (req.file) {
    req.body.fileBuffer = req.file.buffer;
    req.body.fileName = req.file.originalname;
  }
  return uploadCenterstoneExcelHandler(req, res);
});
app.all('/api/centerstone-categories', toRoute(centerstoneCategoriesHandler));
app.all('/api/centerstone-images', toRoute(centerstoneImagesHandler));
app.all('/api/clients', toRoute(clientsHandler));
app.all('/api/orders', toRoute(ordersHandler));
// Register specific routes BEFORE generic :id route to avoid conflicts
app.post('/api/orders/:id/create-payment', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return createPaymentHandler(req, res);
});
app.get('/api/orders/:id/payment-status', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return paymentStatusHandler(req, res);
});
app.post('/api/orders/:id/test-payment', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return testPaymentHandler(req, res);
});
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
app.all('/api/users/verify-password', toRoute(verifyPasswordHandler));
app.all('/api/users/change-password', toRoute(changePasswordHandler));
app.all('/api/coworker-permissions', toRoute(coworkerPermissionsHandler));
app.all('/api/bank-info', toRoute(bankInfoHandler));
app.all('/api/withdraw-requests', toRoute(withdrawRequestsHandler));
app.all('/api/admin-withdraw-requests', toRoute(adminWithdrawRequestsHandler));
app.all('/api/admin/dashboard-metrics', toRoute(dashboardMetricsHandler));
app.all('/api/admin/product-metrics', toRoute(productMetricsHandler));
app.all('/api/user/dashboard-metrics', toRoute(userDashboardMetricsHandler));
app.all('/api/stats', toRoute(statsHandler));
app.all('/api/sepay/webhook', toRoute(sepayWebhookHandler));
app.all('/api/payment-config', toRoute(paymentConfigHandler));
app.all('/api/discount-codes', toRoute(discountCodesHandler));
app.get('/api/discount-codes/:id', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return discountCodesHandler(req, res);
});
app.put('/api/discount-codes/:id', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return discountCodesHandler(req, res);
});
app.patch('/api/discount-codes/:id', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return discountCodesHandler(req, res);
});
app.delete('/api/discount-codes/:id', (req, res) => {
  req.query = { ...req.query, id: req.params.id };
  return discountCodesHandler(req, res);
});
app.all('/api/seed-admin', (req, res) => {
  req.query = { ...req.query, endpoint: 'seed-admin' };
  return usersHandler(req, res);
});

const port = process.env.API_PORT || 3001;
app.listen(port, () => {
  console.log(`Dev API server listening on http://localhost:${port}`);
});
