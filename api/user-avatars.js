import { getSupabase } from './_db.js';
import {
  getUserAvatar,
  upsertUserAvatar,
  deleteUserAvatar
} from './_repo/userAvatars.js';

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
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  const { userId } = req.query;

  try {
    if (method === 'GET') {
      // GET /api/user-avatars?userId=123 - Get avatar for a user
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      try {
        const avatar = await getUserAvatar(parseInt(userId));
        return res.status(200).json(avatar);
      } catch (error) {
        console.error('GET user avatar error:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch user avatar' });
      }
    }

    if (method === 'POST') {
      // POST /api/user-avatars?userId=123 - Upload and create/update avatar record
      // Note: File upload should be handled separately via Supabase Storage client-side
      // This endpoint just creates/updates the database record after upload
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const body = req.body || await readBody(req);
      const { storage_path, url, file_size, width, height, mime_type, viewport_x, viewport_y, viewport_size } = body;

      if (!storage_path || !url) {
        return res.status(400).json({ 
          error: 'Missing required fields: storage_path and url' 
        });
      }

      try {
        const result = await upsertUserAvatar(parseInt(userId), {
          storage_path,
          url,
          file_size: file_size || null,
          width: width || null,
          height: height || null,
          mime_type: mime_type || null,
          viewport_x: viewport_x !== null && viewport_x !== undefined ? parseFloat(viewport_x) : null,
          viewport_y: viewport_y !== null && viewport_y !== undefined ? parseFloat(viewport_y) : null,
          viewport_size: viewport_size !== null && viewport_size !== undefined ? parseFloat(viewport_size) : null
        });
        return res.status(200).json(result);
      } catch (error) {
        console.error('POST user avatar error:', error);
        return res.status(500).json({ 
          error: error.message || 'Failed to create/update user avatar',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }

    if (method === 'DELETE') {
      // DELETE /api/user-avatars?userId=123 - Delete avatar
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      try {
        const result = await deleteUserAvatar(parseInt(userId));
        return res.status(200).json(result);
      } catch (error) {
        console.error('DELETE user avatar error:', error);
        return res.status(500).json({ error: error.message || 'Failed to delete user avatar' });
      }
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'OPTIONS']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error('User avatars API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

