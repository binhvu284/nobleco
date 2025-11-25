import { getSupabase } from '../_db.js';

/**
 * Get pending withdraw requests for a user
 */
export async function getPendingWithdrawRequests(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('withdraw_request')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('request_date', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get all withdraw requests for a user (for admin)
 */
export async function getWithdrawRequestsByUserId(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('withdraw_request')
    .select('*')
    .eq('user_id', userId)
    .order('request_date', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Create a withdraw request
 */
export async function createWithdrawRequest({
  user_id,
  amount,
  point,
  exchange_rate,
  bank_name,
  bank_owner_name,
  bank_number
}) {
  const supabase = getSupabase();
  
  const requestData = {
    user_id,
    amount,
    point,
    exchange_rate: exchange_rate || null,
    bank_name,
    bank_owner_name,
    bank_number,
    status: 'pending'
  };

  const { data, error } = await supabase
    .from('withdraw_request')
    .insert(requestData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update withdraw request status (for admin)
 */
export async function updateWithdrawRequestStatus(requestId, {
  status,
  processed_by,
  admin_notes,
  completed_date
}) {
  const supabase = getSupabase();
  
  const updateData = {
    status,
    processed_by: processed_by || null,
    admin_notes: admin_notes || null,
    completed_date: completed_date || null
  };

  const { data, error } = await supabase
    .from('withdraw_request')
    .update(updateData)
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get withdraw request by ID
 */
export async function getWithdrawRequestById(requestId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('withdraw_request')
    .select('*')
    .eq('id', requestId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete withdraw request
 */
export async function deleteWithdrawRequest(requestId) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('withdraw_request')
    .delete()
    .eq('id', requestId);

  if (error) {
    throw error;
  }

  return { success: true };
}

