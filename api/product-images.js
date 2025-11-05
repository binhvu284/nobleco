import { getSupabase } from './_db.js';
import {
  getProductImages,
  getProductImageById,
  createProductImage,
  updateProductImage,
  deleteProductImage,
  reorderProductImages
} from './_repo/productImages.js';

/**
 * Helper function to read request body
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  const { productId, imageId } = req.query;

  try {
    if (method === 'GET') {
      // GET /api/product-images?productId=123 - Get all images for a product
      // GET /api/product-images?imageId=456 - Get single image
      if (imageId) {
        try {
          const image = await getProductImageById(imageId);
          return res.status(200).json(image);
        } catch (error) {
          console.error('GET product image error:', error);
          return res.status(500).json({ error: error.message || 'Failed to fetch product image' });
        }
      } else if (productId) {
        try {
          const images = await getProductImages(productId);
          return res.status(200).json(images);
        } catch (error) {
          console.error('GET product images error:', error);
          return res.status(500).json({ error: error.message || 'Failed to fetch product images' });
        }
      } else {
        return res.status(400).json({ error: 'productId or imageId is required' });
      }
    }

    if (method === 'POST') {
      // POST /api/product-images - Upload and create image record
      // Note: File upload should be handled separately via Supabase Storage client-side
      // This endpoint just creates the database record after upload
      const body = req.body || await readBody(req);
      const { product_id, storage_path, url, alt_text, sort_order, is_featured, file_size, width, height, mime_type } = body;

      if (!product_id || !storage_path || !url) {
        return res.status(400).json({ 
          error: 'Missing required fields: product_id, storage_path, and url' 
        });
      }

      try {
        const imageData = {
          storage_path,
          url,
          alt_text: alt_text || null,
          sort_order: sort_order !== undefined ? sort_order : null,
          is_featured: is_featured || false,
          file_size: file_size || null,
          width: width || null,
          height: height || null,
          mime_type: mime_type || null
        };

        const image = await createProductImage(product_id, imageData);
        return res.status(201).json(image);
      } catch (error) {
        console.error('POST product image error:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          product_id,
          imageData
        });
        return res.status(500).json({ 
          error: error.message || 'Failed to create product image',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }

    if (method === 'PATCH') {
      // PATCH /api/product-images?imageId=456 - Update image
      // PATCH /api/product-images?productId=123 - Reorder images
      const body = req.body || await readBody(req);

      if (imageId) {
        // Update single image
        const { alt_text, sort_order, is_featured } = body;
        const updates = {};

        if (alt_text !== undefined) updates.alt_text = alt_text;
        if (sort_order !== undefined) updates.sort_order = sort_order;
        if (is_featured !== undefined) updates.is_featured = is_featured;

        if (Object.keys(updates).length === 0) {
          return res.status(400).json({ error: 'No update data provided' });
        }

        try {
          const image = await updateProductImage(imageId, updates);
          return res.status(200).json(image);
        } catch (error) {
          console.error('PATCH product image error:', error);
          return res.status(500).json({ error: error.message || 'Failed to update product image' });
        }
      } else if (productId && body.imageIds) {
        // Reorder images
        try {
          await reorderProductImages(productId, body.imageIds);
          const images = await getProductImages(productId);
          return res.status(200).json({ success: true, images });
        } catch (error) {
          console.error('PATCH reorder images error:', error);
          return res.status(500).json({ error: error.message || 'Failed to reorder product images' });
        }
      } else {
        return res.status(400).json({ error: 'imageId or productId with imageIds is required' });
      }
    }

    if (method === 'DELETE') {
      // DELETE /api/product-images?imageId=456 - Delete image
      if (!imageId) {
        return res.status(400).json({ error: 'imageId is required' });
      }

      try {
        const result = await deleteProductImage(imageId);
        return res.status(200).json(result);
      } catch (error) {
        console.error('DELETE product image error:', error);
        return res.status(500).json({ error: error.message || 'Failed to delete product image' });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error('Product images API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

