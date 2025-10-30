import { getSupabase } from '../_db.js';

/**
 * Normalize client data
 */
function normalize(c) {
  return {
    id: c.id,
    name: c.name || '',
    phone: c.phone || null,
    email: c.email || null,
    birthday: c.birthday || null,
    location: c.location || null,
    description: c.description || null,
    order_count: c.order_count || 0,
    created_by: c.created_by || null,
    created_by_user: c.created_by_user || null, // Joined user data
    created_at: c.created_at,
    updated_at: c.updated_at
  };
}

/**
 * List all clients with creator information
 */
export async function listClients() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      created_by_user:users!clients_created_by_fkey (
        id,
        name,
        refer_code
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    // Check if table doesn't exist
    if (error.code === '42P01') {
      console.warn('Clients table does not exist yet');
      return [];
    }
    throw new Error(`Error fetching clients: ${error.message}`);
  }

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
      *,
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

