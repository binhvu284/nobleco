import { getSupabase } from '../_db.js';

/**
 * Get products by category ID
 */
export default async function handler(req, res) {
  // CORS headers for development
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { categoryId } = req.query;

    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    const supabase = getSupabase();

    // Get products for this category through the junction table
    const { data: productCategories, error: junctionError } = await supabase
      .from('product_categories')
      .select('product_id')
      .eq('category_id', parseInt(categoryId));

    if (junctionError) {
      if (junctionError.code === '42P01') {
        console.warn('product_categories table does not exist yet');
        return res.status(200).json([]);
      }
      throw new Error(`Error fetching product categories: ${junctionError.message}`);
    }

    if (!productCategories || productCategories.length === 0) {
      return res.status(200).json([]);
    }

    // Get the product IDs
    const productIds = productCategories.map(pc => pc.product_id);

    // Fetch the actual products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, slug, sku, short_description, price, stock, status')
      .in('id', productIds)
      .order('name', { ascending: true });

    if (productsError) {
      if (productsError.code === '42P01') {
        console.warn('products table does not exist yet');
        return res.status(200).json([]);
      }
      throw new Error(`Error fetching products: ${productsError.message}`);
    }

    return res.status(200).json(products || []);
  } catch (error) {
    console.error('Category Products API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

