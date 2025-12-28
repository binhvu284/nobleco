import * as centerstoneCategoriesRepo from './_repo/centerstoneCategories.js';
import { getSupabase } from './_db.js';

/**
 * Centerstone Categories API Handler
 * Handles CRUD operations for centerstone categories and category-centerstone relationships
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
    // GET - List all centerstone categories, get by ID, or get centerstones by category
    if (req.method === 'GET') {
      const { id, categoryId } = req.query;

      // Get centerstones by category ID
      if (categoryId) {
        const supabase = getSupabase();

        // Get centerstones for this category through the junction table
        const { data: centerstoneCategories, error: junctionError } = await supabase
          .from('centerstone_category_relations')
          .select('centerstone_id')
          .eq('category_id', parseInt(categoryId));

        if (junctionError) {
          if (junctionError.code === '42P01') {
            console.warn('centerstone_category_relations table does not exist yet');
            return res.status(200).json([]);
          }
          throw new Error(`Error fetching centerstone categories: ${junctionError.message}`);
        }

        if (!centerstoneCategories || centerstoneCategories.length === 0) {
          return res.status(200).json([]);
        }

        // Get the centerstone IDs
        const centerstoneIds = centerstoneCategories.map(cc => cc.centerstone_id);

        // Fetch the actual centerstones
        const { data: centerstones, error: centerstonesError } = await supabase
          .from('centerstones')
          .select('id, name, slug, sku, short_description, price, stock, status')
          .in('id', centerstoneIds)
          .order('name', { ascending: true });

        if (centerstonesError) {
          if (centerstonesError.code === '42P01') {
            console.warn('centerstones table does not exist yet');
            return res.status(200).json([]);
          }
          throw new Error(`Error fetching centerstones: ${centerstonesError.message}`);
        }

        return res.status(200).json(centerstones || []);
      }

      // Get category by ID
      if (id) {
        const category = await centerstoneCategoriesRepo.getCenterstoneCategoryById(parseInt(id));
        return res.status(200).json(category);
      }

      const categories = await centerstoneCategoriesRepo.listCenterstoneCategories();
      return res.status(200).json(categories);
    }

    // POST - Create new centerstone category
    if (req.method === 'POST') {
      const categoryData = req.body;

      if (!categoryData.name || !categoryData.slug) {
        return res.status(400).json({ error: 'Name and slug are required' });
      }

      const category = await centerstoneCategoriesRepo.createCenterstoneCategory(categoryData);
      return res.status(201).json(category);
    }

    // PATCH - Update centerstone category
    if (req.method === 'PATCH') {
      const { id } = req.query;
      const categoryData = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Category ID is required' });
      }

      const category = await centerstoneCategoriesRepo.updateCenterstoneCategory(parseInt(id), categoryData);
      return res.status(200).json(category);
    }

    // PUT - Update centerstone category status
    if (req.method === 'PUT') {
      const { id, status } = req.body;

      if (!id || !status) {
        return res.status(400).json({ error: 'ID and status are required' });
      }

      const category = await centerstoneCategoriesRepo.updateCenterstoneCategoryStatus(parseInt(id), status);
      return res.status(200).json(category);
    }

    // DELETE - Delete centerstone category
    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Category ID is required' });
      }

      await centerstoneCategoriesRepo.deleteCenterstoneCategory(parseInt(id));
      return res.status(200).json({ success: true, message: 'Category deleted successfully' });
    }

    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Centerstone Categories API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

