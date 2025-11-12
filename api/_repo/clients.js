import { getSupabase } from '../_db.js';

/**
 * Get completed orders count for a client
 */
async function getCompletedOrdersCount(clientId) {
  const supabase = getSupabase();
  
  // Ensure clientId is converted to number for proper comparison
  const clientIdNum = typeof clientId === 'string' ? parseInt(clientId, 10) : Number(clientId);
  
  if (isNaN(clientIdNum) || clientIdNum <= 0) {
    console.warn(`Invalid clientId for completed orders count: ${clientId}`);
    return 0;
  }
  
  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientIdNum)
    .eq('status', 'completed');
  
  if (error) {
    console.error(`Error counting completed orders for client ${clientIdNum}:`, error);
    return 0;
  }
  
  console.log(`Client ${clientIdNum} has ${count || 0} completed orders`);
  return count || 0;
}

/**
 * Normalize client data
 */
function normalize(c) {
  return {
    id: c.id,
    name: c.name || '',
    phone: c.phone || null,
    email: c.email || null,
    gender: c.gender || null,
    birthday: c.birthday || null,
    location: c.location || null,
    description: c.description || null,
    order_count: c.order_count || 0,
    completed_orders_count: c.orders_made || 0, // Use orders_made column from database
    created_by: c.created_by || null,
    created_by_user: c.created_by_user || null, // Joined user data
    created_at: c.created_at,
    updated_at: c.updated_at
  };
}

/**
 * List all clients with creator information
 */
export async function listClients(userId = null) {
  const supabase = getSupabase();

  let query = supabase
    .from('clients')
    .select(`
      id,
      name,
      phone,
      email,
      gender,
      birthday,
      location,
      description,
      order_count,
      orders_made,
      created_by,
      created_at,
      updated_at,
      created_by_user:users!clients_created_by_fkey (
        id,
        name,
        refer_code
      )
    `);

  // Filter by user if userId is provided
  if (userId !== null && userId !== undefined) {
    // Ensure userId is converted to number for proper comparison
    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : Number(userId);
    
    // Only filter if userIdNum is a valid number
    if (!isNaN(userIdNum)) {
      query = query.eq('created_by', userIdNum);
    }
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    // Check if table doesn't exist
    if (error.code === '42P01') {
      console.warn('Clients table does not exist yet');
      return [];
    }
    throw new Error(`Error fetching clients: ${error.message}`);
  }

  // Orders made count is now stored in the orders_made column, no need to calculate
  return (data || []).map(normalize);
}

/**
 * Get client by ID
 */
export async function getClientById(id) {
  const supabase = getSupabase();

  const { data: client, error } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      phone,
      email,
      gender,
      birthday,
      location,
      description,
      order_count,
      orders_made,
      created_by,
      created_at,
      updated_at,
      created_by_user:users!clients_created_by_fkey (
        id,
        name,
        refer_code
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Error fetching client: ${error.message}`);
  }

  // Orders made count is now stored in the orders_made column, no need to calculate
  return normalize(client);
}

/**
 * Create a new client
 */
export async function createClient(clientData, userId) {
  const supabase = getSupabase();

  const { data: client, error } = await supabase
    .from('clients')
    .insert([{
      name: clientData.name,
      phone: clientData.phone || null,
      email: clientData.email || null,
      gender: clientData.gender || null,
      birthday: clientData.birthday || null,
      location: clientData.location || null,
      description: clientData.description || null,
      created_by: userId || null
    }])
    .select(`
      *,
      created_by_user:users!clients_created_by_fkey (
        id,
        name,
        refer_code
      )
    `)
    .single();

  if (error) {
    throw new Error(`Error creating client: ${error.message}`);
  }

  return normalize(client);
}

/**
 * Update client
 */
export async function updateClient(id, clientData) {
  const supabase = getSupabase();

  const updateData = {};
  if (clientData.name !== undefined) updateData.name = clientData.name;
  if (clientData.phone !== undefined) updateData.phone = clientData.phone;
  if (clientData.email !== undefined) updateData.email = clientData.email;
  if (clientData.gender !== undefined) updateData.gender = clientData.gender;
  if (clientData.birthday !== undefined) updateData.birthday = clientData.birthday;
  if (clientData.location !== undefined) updateData.location = clientData.location;
  if (clientData.description !== undefined) updateData.description = clientData.description;

  const { data: client, error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      created_by_user:users!clients_created_by_fkey (
        id,
        name,
        refer_code
      )
    `)
    .single();

  if (error) {
    throw new Error(`Error updating client: ${error.message}`);
  }

  return normalize(client);
}

/**
 * Delete client
 */
export async function deleteClient(id) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting client: ${error.message}`);
  }

  return { success: true };
}

