import { getSupabase } from './_db.js';
import { getDBConfig, getSupabaseEnv } from './_config.js';

function redact(value) {
  if (!value) return null;
  if (typeof value !== 'string') return null;
  if (value.length <= 8) return '***';
  return `${value.slice(0, 4)}***${value.slice(-4)}`;
}

export default async function handler(req, res) {
  try {
    const { query } = req;
    const endpoint = query?.endpoint || query?.type || 'full';

    // Handle health check endpoint
    if (endpoint === 'health' || req.url?.includes('/health')) {
      try {
        const supabase = getSupabase();
        const { error } = await supabase.from('users').select('id').limit(1);
        if (error) throw error;
        return res.status(200).json({ ok: true });
      } catch (e) {
        return res.status(500).json({ ok: false, error: e.message });
      }
    }

    // Handle check-tables endpoint
    if (endpoint === 'tables' || req.url?.includes('/tables')) {
      const supabase = getSupabase();
      const results = {
        products: { exists: false, count: 0, error: null },
        categories: { exists: false, count: 0, error: null },
        product_categories: { exists: false, count: 0, error: null },
        clients: { exists: false, count: 0, error: null }
      };

      // Check products table
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true });
      
      if (productsError) {
        results.products.error = productsError.message;
        results.products.exists = false;
      } else {
        results.products.exists = true;
        results.products.count = products?.length || 0;
      }

      // Check categories table
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true });
      
      if (categoriesError) {
        results.categories.error = categoriesError.message;
        results.categories.exists = false;
      } else {
        results.categories.exists = true;
        results.categories.count = categories?.length || 0;
      }

      // Check product_categories table
      const { data: productCategories, error: pcError } = await supabase
        .from('product_categories')
        .select('id', { count: 'exact', head: true });
      
      if (pcError) {
        results.product_categories.error = pcError.message;
        results.product_categories.exists = false;
      } else {
        results.product_categories.exists = true;
        results.product_categories.count = productCategories?.length || 0;
      }

      // Check clients table
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id', { count: 'exact', head: true });
      
      if (clientsError) {
        results.clients.error = clientsError.message;
        results.clients.exists = false;
      } else {
        results.clients.exists = true;
        results.clients.count = clients?.length || 0;
      }

      return res.status(200).json({
        success: true,
        tables: results,
        message: results.products.exists && results.categories.exists && results.product_categories.exists && results.clients.exists
          ? 'All tables exist and are ready!'
          : 'Some tables are missing. Please run update_database.sql in Supabase.'
      });
    }

    // Full diagnostics (default)
    const { url, key } = getSupabaseEnv();
    const hasUrl = Boolean(url);
    const hasKey = Boolean(key);
    const sanitizedUrl = redact(url || '');
    const sanitizedKey = redact(key || '');
    const config = getDBConfig();

    let ping = null;
    let error = null;
    if (hasUrl && hasKey) {
      try {
        const supabase = getSupabase();
        const { error: testError } = await supabase.from(config.table).select(config.col.id).limit(1);
        if (testError) throw testError;
        ping = { ok: true };
      } catch (e) {
        error = e?.message || String(e);
      }
    } else {
      error = 'Missing Supabase env variables';
    }

    return res.status(error ? 500 : 200).json({
      env: { hasUrl, hasKey, url: sanitizedUrl, key: sanitizedKey },
      db: { table: config.table, columns: config.col },
      ping,
      error,
    });
  } catch (e) {
    return res.status(500).json({ error: e?.message || String(e) });
  }
}
