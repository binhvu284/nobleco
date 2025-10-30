import { 
  listClients, 
  getClientById, 
  createClient, 
  updateClient, 
  deleteClient
} from './_repo/clients.js';

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

  try {
    if (method === 'GET') {
      // GET /api/clients - List all clients
      // GET /api/clients?id=123 - Get single client
      try {
        const { id } = req.query;

        if (id) {
          const client = await getClientById(id);
          return res.status(200).json(client);
        } else {
          const clients = await listClients();
          return res.status(200).json(clients);
        }
      } catch (error) {
        console.error('GET clients error:', error);
        return res.status(500).json({ error: error.message || 'Failed to fetch clients' });
      }
    }

    if (method === 'POST') {
      // POST /api/clients - Create new client
      const { client, userId } = req.body;

      if (!client || !client.name) {
        return res.status(400).json({ 
          error: 'Missing required fields: name' 
        });
      }

      const newClient = await createClient(client, userId);
      return res.status(201).json(newClient);
    }

    if (method === 'PATCH') {
      // PATCH /api/clients - Update client
      const { id } = req.query;
      const clientData = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Client ID is required' });
      }

      const updatedClient = await updateClient(parseInt(id), clientData);
      return res.status(200).json(updatedClient);
    }

    if (method === 'DELETE') {
      // DELETE /api/clients?id=123 - Delete client
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Client ID is required' });
      }

      await deleteClient(id);
      return res.status(200).json({ success: true, message: 'Client deleted successfully' });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE']);
    return res.status(405).json({ error: `Method ${method} Not Allowed` });

  } catch (error) {
    console.error('Clients API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}

