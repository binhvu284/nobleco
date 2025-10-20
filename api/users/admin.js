import { listAdminUsers } from '../_repo/users.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      try {
        const adminUsers = await listAdminUsers();
        return res.status(200).json(adminUsers);
      } catch (e) {
        return res.status(500).json({ error: e.message });
      }
    }

    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
