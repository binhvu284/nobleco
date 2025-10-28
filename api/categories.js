import * as categoriesRepo from './_repo/categories.js';
import { getSupabase } from './_db.js';

/**
 * Categories API Handler
 * Handles CRUD operations for categories and category products
 */
export default async function handler(req, res) {
  // CORS headers for development
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // GET - List all categories, get by ID, or get products by category
    if (req.method === 'GET') {
      const { id, categoryId } = req.query;

      // Get products by category ID
      if (categoryId) {
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
      }

      // Get category by ID

      if (id) {
        const category = await categoriesRepo.getCategoryById(parseInt(id));
        return res.status(200).json(category);
      }

      const categories = await categoriesRepo.listCategories();
      return res.status(200).json(categories);
    }

    // POST - Create new category
    if (req.method === 'POST') {
      const categoryData = req.body;

      if (!categoryData.name || !categoryData.slug) {
        return res.status(400).json({ error: 'Name and slug are required' });
      }

      const category = await categoriesRepo.createCategory(categoryData);
      return res.status(201).json(category);
    }

    // PATCH - Update category
    if (req.method === 'PATCH') {
      const { id } = req.query;
      const categoryData = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Category ID is required' });
      }

      const category = await categoriesRepo.updateCategory(parseInt(id), categoryData);
      return res.status(200).json(category);
    }

    // PUT - Update category status
    if (req.method === 'PUT') {
      const { id, status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ error: 'ID and status are required' });
      }

      const category = await categoriesRepo.updateCategoryStatus(parseInt(id), status);
      return res.status(200).json(category);
    }

    // DELETE - Delete category
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Category ID is required' });
      }

      await categoriesRepo.deleteCategory(parseInt(id));
      return res.status(200).json({ success: true, message: 'Category deleted successfully' });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Categories API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

