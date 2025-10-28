import * as categoriesRepo from './_repo/categories.js';

/**
 * Categories API Handler
 * Handles CRUD operations for categories
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
    // GET - List all categories or get by ID
    if (req.method === 'GET') {
      const { id } = req.query;

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

