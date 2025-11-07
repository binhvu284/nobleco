import { getPersonalID, upsertPersonalID, deletePersonalID, updatePersonalIDVerification, uploadToStorage, deleteStorageFiles } from './_repo/personalIds.js';
import { getSupabase } from './_db.js';

/**
 * Helper to read request body
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Extract user ID from auth token
 */
function getUserIdFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];
  if (!authHeader) return null;
  
  // Token format: "ok.{userId}" based on login.js
  const token = authHeader.replace('Bearer ', '').replace('ok.', '');
  const userId = parseInt(token);
  return isNaN(userId) ? null : userId;
}

/**
 * Check if user is admin
 */
async function isAdmin(userId) {
  if (!userId) return false;
  const supabase = getSupabase();
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  return data?.role === 'admin';
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Auth-Token');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;
  const { userId, action } = req.query;
  const currentUserId = getUserIdFromRequest(req);

  try {
    if (method === 'GET') {
      // GET /api/user-personal-ids?userId=123 - Get personal ID for a user
      const targetUserId = userId || currentUserId;
      
      if (!targetUserId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      // Users can only view their own, admins can view any
      if (currentUserId && parseInt(targetUserId) !== currentUserId) {
        const userIsAdmin = await isAdmin(currentUserId);
        if (!userIsAdmin) {
          return res.status(403).json({ error: 'Forbidden: You can only view your own personal ID' });
        }
      }

      try {
        const personalID = await getPersonalID(parseInt(targetUserId));
        return res.status(200).json(personalID || {});
      } catch (error) {
        console.error('GET personal ID error:', error);
        return res.status(500).json({ 
          error: error.message || 'Failed to fetch personal ID' 
        });
      }
    }

    if (method === 'POST') {
      // POST /api/user-personal-ids - Upload personal ID images
      // Expects JSON with base64 encoded images
      
      if (!currentUserId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const targetUserId = userId ? parseInt(userId) : currentUserId;
      
      // Users can only upload their own, admins can upload for any user
      if (targetUserId !== currentUserId) {
        const userIsAdmin = await isAdmin(currentUserId);
        if (!userIsAdmin) {
          return res.status(403).json({ error: 'Forbidden: You can only upload your own personal ID' });
        }
      }

      try {
        // Express already parses JSON body, so use req.body directly
        // Fallback to readBody only if req.body is not available (for Vercel)
        let body;
        if (req.body && Object.keys(req.body).length > 0) {
          body = req.body;
        } else {
          try {
            body = await readBody(req);
          } catch (e) {
            // If readBody fails, body might already be parsed
            body = req.body || {};
          }
        }

        const { frontImage, backImage, fileName, storagePath, mimeType } = body;

        if (!frontImage && !backImage) {
          return res.status(400).json({ error: 'At least one image (front or back) is required' });
        }

        // Get existing personal ID to preserve other side
        const existing = await getPersonalID(targetUserId);
        
        let frontImagePath = existing?.front_image_path || null;
        let frontImageUrl = existing?.front_image_url || null;
        let backImagePath = existing?.back_image_path || null;
        let backImageUrl = existing?.back_image_url || null;

        // Handle front image upload
        if (frontImage) {
          // Use provided storagePath or construct from fileName, or generate new
          const frontStoragePath = storagePath || (fileName ? `${targetUserId}/${fileName}` : `${targetUserId}/front_${Date.now()}.jpg`);
          
          // Convert base64 to buffer
          const buffer = Buffer.from(frontImage, 'base64');
          
          // Upload to storage
          const uploadResult = await uploadToStorage(frontStoragePath, buffer, {
            contentType: mimeType || 'image/jpeg',
            upsert: true,
          });
          
          frontImagePath = uploadResult.path;
          frontImageUrl = uploadResult.url;
        }

        // Handle back image upload
        if (backImage) {
          // Use provided storagePath or construct from fileName, or generate new
          const backStoragePath = storagePath || (fileName ? `${targetUserId}/${fileName}` : `${targetUserId}/back_${Date.now()}.jpg`);
          
          // Convert base64 to buffer
          const buffer = Buffer.from(backImage, 'base64');
          
          // Upload to storage
          const uploadResult = await uploadToStorage(backStoragePath, buffer, {
            contentType: mimeType || 'image/jpeg',
            upsert: true,
          });
          
          backImagePath = uploadResult.path;
          backImageUrl = uploadResult.url;
        }

        // Save to database
        const result = await upsertPersonalID({
          userId: targetUserId,
          frontImagePath,
          frontImageUrl,
          backImagePath,
          backImageUrl,
          fileSize: frontImage ? Buffer.from(frontImage, 'base64').length : (backImage ? Buffer.from(backImage, 'base64').length : null),
          mimeType: mimeType || 'image/jpeg',
        });

        return res.status(200).json(result);
      } catch (error) {
        console.error('POST personal ID error:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({ 
          error: error.message || 'Failed to upload personal ID',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    }

    if (method === 'DELETE') {
      // DELETE /api/user-personal-ids?userId=123 - Delete personal ID
      const targetUserId = userId ? parseInt(userId) : currentUserId;
      
      if (!targetUserId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      if (!currentUserId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Users can only delete their own, admins can delete any
      if (targetUserId !== currentUserId) {
        const userIsAdmin = await isAdmin(currentUserId);
        if (!userIsAdmin) {
          return res.status(403).json({ error: 'Forbidden: You can only delete your own personal ID' });
        }
      }

      try {
        // Get personal ID to delete files from storage
        const personalID = await getPersonalID(targetUserId);
        const filesToDelete = [];
        
        if (personalID?.front_image_path) {
          filesToDelete.push(personalID.front_image_path);
        }
        if (personalID?.back_image_path) {
          filesToDelete.push(personalID.back_image_path);
        }

        // Delete from database
        await deletePersonalID(targetUserId);
        
        // Delete files from storage
        if (filesToDelete.length > 0) {
          await deleteStorageFiles(filesToDelete);
        }

        return res.status(200).json({ success: true });
      } catch (error) {
        console.error('DELETE personal ID error:', error);
        return res.status(500).json({ 
          error: error.message || 'Failed to delete personal ID' 
        });
      }
    }

    if (method === 'PATCH') {
      // PATCH /api/user-personal-ids?userId=123&action=verify - Admin verify personal ID
      if (!currentUserId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const userIsAdmin = await isAdmin(currentUserId);
      if (!userIsAdmin) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      const targetUserId = parseInt(userId);
      if (!targetUserId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      if (action === 'verify') {
        const body = req.body || await readBody(req);
        const { verified } = body;

        if (typeof verified !== 'boolean') {
          return res.status(400).json({ error: 'verified must be a boolean' });
        }

        try {
          const result = await updatePersonalIDVerification(targetUserId, verified, currentUserId);
          return res.status(200).json(result);
        } catch (error) {
          console.error('PATCH verify personal ID error:', error);
          return res.status(500).json({ 
            error: error.message || 'Failed to update verification status' 
          });
        }
      }

      return res.status(400).json({ error: 'Invalid action. Use: verify' });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PATCH', 'OPTIONS']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error('Personal ID API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

