import { 
  listCenterstones, 
  getCenterstoneById, 
  createCenterstone, 
  updateCenterstone, 
  deleteCenterstone,
  updateCenterstoneCategories,
  updateCenterstoneStock,
  updateCenterstoneStatus
} from './_repo/centerstones.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  try {
    if (method === 'GET') {
      // GET /api/centerstones - List all centerstones
      // GET /api/centerstones?id=123 - Get single centerstone
      // GET /api/centerstones?includeImages=true - Include images in response
      try {
        const { id, includeImages } = req.query;
        const shouldIncludeImages = includeImages === 'true' || includeImages === true;

        if (id) {
          const centerstone = await getCenterstoneById(id, shouldIncludeImages);
          return res.status(200).json(centerstone);
        } else {
          const centerstones = await listCenterstones(shouldIncludeImages);
          return res.status(200).json(centerstones);
        }
      } catch (error) {
        console.error('GET centerstones error:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch centerstones' });
      }
    }

    if (method === 'POST') {
      // POST /api/centerstones - Create new centerstone
      // Support both old format (centerstone object) and new format (flat fields)
      let centerstoneData, categoryIds, primaryCategoryId, userId;
      
      if (req.body.centerstone) {
        // Old format: { centerstone: {...}, categoryIds: [...], userId: ... }
        centerstoneData = req.body.centerstone;
        categoryIds = req.body.categoryIds;
        primaryCategoryId = req.body.primaryCategoryId;
        userId = req.body.userId;
      } else {
        // New format: flat fields from AddProductModal
        centerstoneData = {
          name: req.body.name || null, // Optional for centerstone - will use SKU if empty
          sku: req.body.sku || null,
          short_description: req.body.short_description || 'No description available',
          long_description: req.body.long_description || null,
          price: req.body.price,
          stock: req.body.stock || 0,
          status: req.body.status || 'active',
          // Specification fields
          serial_number: req.body.serial_number || null,
          supplier_id: req.body.supplier_id || null,
          jewelry_specifications: req.body.jewelry_specifications || null,
          inventory_value: req.body.inventory_value || null,
          // New centerstone specification fields
          shape_and_polished: req.body.shape_and_polished || null,
          origin: req.body.origin || null,
          item_serial: req.body.item_serial || null,
          country_of_origin: req.body.country_of_origin || null,
          certification_number: req.body.certification_number || null,
          size_mm: req.body.size_mm || null,
          color: req.body.color || null,
          clarity: req.body.clarity || null,
          weight_ct: req.body.weight_ct || null,
          pcs: req.body.pcs || null,
          cut_grade: req.body.cut_grade || null,
          treatment: req.body.treatment || null
        };
        categoryIds = req.body.category_ids || req.body.categoryIds || [];
        primaryCategoryId = categoryIds.length > 0 ? categoryIds[0] : null;
        userId = req.body.userId || null; // Can be null if not authenticated
      }

      // For centerstone: name is optional (will use SKU if empty), but price is required
      // SKU is also required (will be generated if not provided)
      if (!centerstoneData || centerstoneData.price === undefined) {
        return res.status(400).json({ 
          error: 'Missing required fields: price is required' 
        });
      }

      const newCenterstone = await createCenterstone(centerstoneData, userId);

      // Add categories if provided
      if (categoryIds && categoryIds.length > 0) {
        await updateCenterstoneCategories(newCenterstone.id, categoryIds, primaryCategoryId);
      }

      // Fetch the complete centerstone with categories
      const completeCenterstone = await getCenterstoneById(newCenterstone.id);

      return res.status(201).json(completeCenterstone);
    }

    if (method === 'PATCH') {
      // PATCH /api/centerstones - Update centerstone
      const { id, centerstone, categoryIds, primaryCategoryId, userId } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Centerstone ID is required' });
      }

      // Update centerstone data
      if (centerstone) {
        await updateCenterstone(id, centerstone, userId);
      }

      // Update categories if provided AND not empty
      // If categoryIds is undefined, skip category update (preserve existing)
      // If categoryIds is empty array [], skip category update (preserve existing)
      // Only update if categoryIds has items
      if (categoryIds !== undefined && Array.isArray(categoryIds) && categoryIds.length > 0) {
        await updateCenterstoneCategories(id, categoryIds, primaryCategoryId);
      }

      // Fetch the complete updated centerstone
      const updatedCenterstone = await getCenterstoneById(id);

      return res.status(200).json(updatedCenterstone);
    }

    if (method === 'PUT') {
      // PUT /api/centerstones - Quick updates (stock, status)
      const { id, stock, status } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Centerstone ID is required' });
      }

      let updatedCenterstone;

      if (stock !== undefined) {
        updatedCenterstone = await updateCenterstoneStock(id, stock);
      } else if (status) {
        updatedCenterstone = await updateCenterstoneStatus(id, status);
      } else {
        return res.status(400).json({ error: 'No update data provided' });
      }

      // Fetch complete centerstone with categories
      const completeCenterstone = await getCenterstoneById(updatedCenterstone.id);

      return res.status(200).json(completeCenterstone);
    }

    if (method === 'DELETE') {
      // DELETE /api/centerstones?id=123 - Delete centerstone
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Centerstone ID is required' });
      }

      await deleteCenterstone(id);

      return res.status(200).json({ success: true, message: 'Centerstone deleted successfully' });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error('Centerstones API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

