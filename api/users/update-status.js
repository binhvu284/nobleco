import { updateUserStatus } from '../_repo/users.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'PUT') {
      const { userId, status } = req.body;

      // Validate input
      if (!userId || !status) {
        return res.status(400).json({ error: 'User ID and status are required' });
      }

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({ error: 'Status must be either "active" or "inactive"' });
      }

      try {
        const result = await updateUserStatus(userId, status);
        return res.status(200).json({ 
          success: true, 
          message: 'User status updated successfully',
          user: result 
        });
      } catch (e) {
        console.error('Error updating user status:', e);
        return res.status(500).json({ error: e.message });
      }
    }

    res.setHeader('Allow', 'PUT');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    console.error('Error in update-status handler:', e);
    return res.status(500).json({ error: e.message });
  }
}
