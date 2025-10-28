import { 
  listProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct,
  updateProductCategories,
  updateProductStock,
  updateProductStatus
} from './_repo/products.js';

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
      // GET /api/products - List all products
      // GET /api/products?id=123 - Get single product
      try {
        const { id } = req.query;

        if (id) {
          const product = await getProductById(id);
          return res.status(200).json(product);
        } else {
          const products = await listProducts();
          return res.status(200).json(products);
        }
      } catch (error) {
        console.error('GET products error:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch products' });
      }
    }

    if (method === 'POST') {
      // POST /api/products - Create new product
      const { product, categoryIds, primaryCategoryId, userId } = req.body;

      if (!product || !product.name || !product.slug || !product.short_description || product.price === undefined) {
        return res.status(400).json({ 
          error: 'Missing required fields: name, slug, short_description, price' 
        });
      }

      const newProduct = await createProduct(product, userId);

      // Add categories if provided
      if (categoryIds && categoryIds.length > 0) {
        await updateProductCategories(newProduct.id, categoryIds, primaryCategoryId);
      }

      // Fetch the complete product with categories
      const completeProduct = await getProductById(newProduct.id);

      return res.status(201).json(completeProduct);
    }

    if (method === 'PATCH') {
      // PATCH /api/products - Update product
      const { id, product, categoryIds, primaryCategoryId, userId } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      // Update product data
      if (product) {
        await updateProduct(id, product, userId);
      }

      // Update categories if provided
      if (categoryIds !== undefined) {
        await updateProductCategories(id, categoryIds, primaryCategoryId);
      }

      // Fetch the complete updated product
      const updatedProduct = await getProductById(id);

      return res.status(200).json(updatedProduct);
    }

    if (method === 'PUT') {
      // PUT /api/products - Quick updates (stock, status)
      const { id, stock, status } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      let updatedProduct;

      if (stock !== undefined) {
        updatedProduct = await updateProductStock(id, stock);
      } else if (status) {
        updatedProduct = await updateProductStatus(id, status);
      } else {
        return res.status(400).json({ error: 'No update data provided' });
      }

      // Fetch complete product with categories
      const completeProduct = await getProductById(updatedProduct.id);

      return res.status(200).json(completeProduct);
    }

    if (method === 'DELETE') {
      // DELETE /api/products?id=123 - Delete product
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Product ID is required' });
      }

      await deleteProduct(id);

      return res.status(200).json({ success: true, message: 'Product deleted successfully' });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error('Products API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

