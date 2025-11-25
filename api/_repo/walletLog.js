import { getSupabase } from '../_db.js';

/**
 * Get wallet logs for a user
 */
export async function getWalletLogsByUserId(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('wallet_log')
    .select('*')
    .eq('user_id', userId)
    .order('log_time', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Create a wallet log entry
 */
export async function createWalletLog({
  user_id,
  log_type,
  point_amount,
  balance_after,
  related_order_id,
  related_withdraw_request_id,
  description
}) {
  const supabase = getSupabase();
  
  const logData = {
    user_id,
    log_type,
    point_amount,
    balance_after: balance_after || null,
    related_order_id: related_order_id || null,
    related_withdraw_request_id: related_withdraw_request_id || null,
    description: description || null
  };

  const { data, error } = await supabase
    .from('wallet_log')
    .insert(logData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Update user points balance
 */
export async function updateUserPoints(userId, newBalance) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('users')
    .update({ points: newBalance })
    .eq('id', userId)
    .select('points')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

