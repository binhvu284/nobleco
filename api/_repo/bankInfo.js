import { getSupabase } from '../_db.js';

/**
 * Get bank info for a user
 */
export async function getBankInfo(userId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('bank_info')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw error;
  }

  return data;
}

/**
 * Create or update bank info for a user
 */
export async function upsertBankInfo(userId, { bank_name, bank_owner_name, bank_number }) {
  const supabase = getSupabase();
  
  const bankInfoData = {
    user_id: userId,
    bank_name,
    bank_owner_name,
    bank_number
  };

  const { data, error } = await supabase
    .from('bank_info')
    .upsert(bankInfoData, {
      onConflict: 'user_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Delete bank info for a user
 */
export async function deleteBankInfo(userId) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('bank_info')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw error;
  }

  return true;
}

