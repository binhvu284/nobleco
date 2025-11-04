import { getSupabase } from '../_db.js';

// Normalize commission rate shape
function normalize(rate) {
  if (!rate) return null;
  return {
    id: rate.id,
    user_level: rate.user_level,
    self_commission: parseFloat(rate.self_commission) || 0,
    level_1_down: parseFloat(rate.level_1_down) || 0,
    level_2_down: parseFloat(rate.level_2_down) || 0,
    created_at: rate.created_at,
    updated_at: rate.updated_at
  };
}

/**
 * Get all commission rates
 */
export async function listCommissionRates() {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('commission_rates')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      console.warn('Commission rates table does not exist yet');
      return [];
    }
    throw new Error(`Error fetching commission rates: ${error.message}`);
  }

  return (data || []).map(normalize);
}

/**
 * Get commission rate by user level
 */
export async function getCommissionRateByLevel(userLevel) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('commission_rates')
    .select('*')
    .eq('user_level', userLevel)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Error fetching commission rate: ${error.message}`);
  }

  return normalize(data);
}

/**
 * Update commission rate by user level
 */
export async function updateCommissionRate(userLevel, rateData) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('commission_rates')
    .update({
      self_commission: rateData.self_commission,
      level_1_down: rateData.level_1_down,
      level_2_down: rateData.level_2_down,
      updated_at: new Date().toISOString()
    })
    .eq('user_level', userLevel)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating commission rate: ${error.message}`);
  }

  return normalize(data);
}

/**
 * Update multiple commission rates
 */
export async function updateCommissionRates(rates) {
  const supabase = getSupabase();
  
  // Update each rate individually (Supabase doesn't support bulk update with different values easily)
  const updates = [];
  for (const rate of rates) {
    try {
      const updated = await updateCommissionRate(rate.user_level, {
        self_commission: rate.self_commission,
        level_1_down: rate.level_1_down,
        level_2_down: rate.level_2_down
      });
      updates.push(updated);
    } catch (error) {
      console.error(`Error updating rate for ${rate.user_level}:`, error);
      throw error;
    }
  }

  return updates;
}

