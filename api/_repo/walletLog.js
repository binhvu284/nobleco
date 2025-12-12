import { getSupabase } from '../_db.js';

/**
 * Verify wallet_log table exists and is accessible
 */
async function verifyWalletLogTable() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('wallet_log')
    .select('id')
    .limit(1);

  if (error) {
    // Check if it's a "relation does not exist" error
    if (error.code === '42P01' || error.message?.includes('does not exist')) {
      console.error('❌ CRITICAL: wallet_log table does not exist in the database!');
      console.error('Please create the table using the following SQL:');
      console.error(`
CREATE TABLE IF NOT EXISTS wallet_log (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  log_type TEXT NOT NULL CHECK (log_type IN ('Commission', 'Withdraw', 'Bonus')),
  point_amount INTEGER NOT NULL,
  balance_after INTEGER,
  related_order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  related_withdraw_request_id BIGINT REFERENCES withdraw_requests(id) ON DELETE SET NULL,
  description TEXT,
  log_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wallet_log_user_id_idx ON wallet_log(user_id);
CREATE INDEX IF NOT EXISTS wallet_log_log_time_idx ON wallet_log(log_time DESC);
CREATE INDEX IF NOT EXISTS wallet_log_related_order_id_idx ON wallet_log(related_order_id);
      `);
      throw new Error('wallet_log table does not exist. Please create it first.');
    }
    throw error;
  }
  return true;
}

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
  
  // Verify table exists first (only log if it doesn't, don't fail silently)
  try {
    await verifyWalletLogTable();
  } catch (verifyError) {
    // Re-throw the error so it's visible
    throw verifyError;
  }
  
  const logData = {
    user_id,
    log_type,
    point_amount,
    balance_after: balance_after || null,
    related_order_id: related_order_id || null,
    related_withdraw_request_id: related_withdraw_request_id || null,
    description: description || null
  };

  console.log('Creating wallet log with data:', logData);

  const { data, error } = await supabase
    .from('wallet_log')
    .insert(logData)
    .select()
    .single();

  if (error) {
    console.error('='.repeat(80));
    console.error('❌ ERROR creating wallet log:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error details:', error.details);
    console.error('Error hint:', error.hint);
    console.error('Log data attempted:', logData);
    console.error('='.repeat(80));
    throw new Error(`Failed to create wallet log: ${error.message} (Code: ${error.code})`);
  }

  console.log('✅ Wallet log created successfully:', data);
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

