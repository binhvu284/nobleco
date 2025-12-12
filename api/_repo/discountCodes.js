import { getSupabase } from '../_db.js';

/**
 * Normalize discount code data
 */
function normalize(discount) {
  if (!discount) return null;
  return {
    id: discount.id,
    code: discount.code,
    discount_rate: parseFloat(discount.discount_rate) || 0,
    status: discount.status || 'active',
    description: discount.description || null,
    usage_count: parseInt(discount.usage_count) || 0,
    max_usage: discount.max_usage ? parseInt(discount.max_usage) : null,
    valid_from: discount.valid_from || null,
    valid_until: discount.valid_until || null,
    created_at: discount.created_at,
    updated_at: discount.updated_at
  };
}

/**
 * Get all discount codes
 */
export async function getAllDiscountCodes() {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42P01') {
      console.warn('Discount codes table does not exist yet');
      return [];
    }
    throw new Error(`Error fetching discount codes: ${error.message}`);
  }

  return (data || []).map(normalize);
}

/**
 * Get discount code by ID
 */
export async function getDiscountCodeById(id) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Error fetching discount code: ${error.message}`);
  }

  return normalize(data);
}

/**
 * Get discount code by code string
 */
export async function getDiscountCodeByCode(code) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Error fetching discount code: ${error.message}`);
  }

  return normalize(data);
}

/**
 * Create a new discount code
 */
export async function createDiscountCode(discountData) {
  const supabase = getSupabase();
  
  const {
    code,
    discount_rate,
    description,
    max_usage,
    valid_from,
    valid_until,
    status = 'active'
  } = discountData;

  // Validate required fields
  if (!code || discount_rate === undefined) {
    throw new Error('Code and discount_rate are required');
  }

  // Validate discount rate
  if (discount_rate < 0 || discount_rate > 100) {
    throw new Error('Discount rate must be between 0 and 100');
  }

  // Validate date range
  if (valid_from && valid_until && new Date(valid_from) > new Date(valid_until)) {
    throw new Error('valid_from must be before or equal to valid_until');
  }

  const insertData = {
    code: code.toUpperCase().trim(),
    discount_rate: parseFloat(discount_rate),
    status,
    description: description || null,
    max_usage: max_usage ? parseInt(max_usage) : null,
    valid_from: valid_from || null,
    valid_until: valid_until || null,
    usage_count: 0
  };

  const { data, error } = await supabase
    .from('discount_codes')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Discount code already exists');
    }
    throw new Error(`Error creating discount code: ${error.message}`);
  }

  return normalize(data);
}

/**
 * Update a discount code
 */
export async function updateDiscountCode(id, updateData) {
  const supabase = getSupabase();
  
  const {
    code,
    discount_rate,
    description,
    max_usage,
    valid_from,
    valid_until,
    status
  } = updateData;

  const updateFields = {
    updated_at: new Date().toISOString()
  };

  if (code !== undefined) {
    updateFields.code = code.toUpperCase().trim();
  }
  if (discount_rate !== undefined) {
    if (discount_rate < 0 || discount_rate > 100) {
      throw new Error('Discount rate must be between 0 and 100');
    }
    updateFields.discount_rate = parseFloat(discount_rate);
  }
  if (status !== undefined) {
    updateFields.status = status;
  }
  if (description !== undefined) {
    updateFields.description = description || null;
  }
  if (max_usage !== undefined) {
    updateFields.max_usage = max_usage ? parseInt(max_usage) : null;
  }
  if (valid_from !== undefined) {
    updateFields.valid_from = valid_from || null;
  }
  if (valid_until !== undefined) {
    updateFields.valid_until = valid_until || null;
  }

  // Validate date range if both dates are provided
  if (updateFields.valid_from && updateFields.valid_until) {
    if (new Date(updateFields.valid_from) > new Date(updateFields.valid_until)) {
      throw new Error('valid_from must be before or equal to valid_until');
    }
  }

  const { data, error } = await supabase
    .from('discount_codes')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Discount code not found');
    }
    if (error.code === '23505') {
      throw new Error('Discount code already exists');
    }
    throw new Error(`Error updating discount code: ${error.message}`);
  }

  return normalize(data);
}

/**
 * Toggle discount code status
 */
export async function toggleDiscountCodeStatus(id) {
  const supabase = getSupabase();
  
  // First get current status
  const current = await getDiscountCodeById(id);
  if (!current) {
    throw new Error('Discount code not found');
  }

  const newStatus = current.status === 'active' ? 'inactive' : 'active';
  
  return await updateDiscountCode(id, { status: newStatus });
}

/**
 * Increment usage count for a discount code
 */
export async function incrementDiscountCodeUsage(code) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .rpc('increment_discount_usage', { discount_code: code.toUpperCase() });

  if (error) {
    // If RPC doesn't exist, do it manually
    const discount = await getDiscountCodeByCode(code);
    if (!discount) {
      throw new Error('Discount code not found');
    }

    const newUsageCount = (discount.usage_count || 0) + 1;
    return await updateDiscountCode(discount.id, { usage_count: newUsageCount });
  }

  return normalize(data);
}

/**
 * Delete a discount code
 */
export async function deleteDiscountCode(id) {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('discount_codes')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Error deleting discount code: ${error.message}`);
  }

  return true;
}

/**
 * Validate if a discount code can be used
 */
export async function validateDiscountCode(code) {
  const discount = await getDiscountCodeByCode(code);
  
  if (!discount) {
    return { valid: false, error: 'Discount code not found' };
  }

  if (discount.status !== 'active') {
    return { valid: false, error: 'Discount code is inactive' };
  }

  // Check usage limit
  if (discount.max_usage !== null && discount.usage_count >= discount.max_usage) {
    return { valid: false, error: 'Discount code has reached its usage limit' };
  }

  // Check validity period
  const now = new Date();
  
  // For valid_from, compare dates properly accounting for timezone
  // If valid_from is set, the code should be valid from the start of that day (in UTC)
  if (discount.valid_from) {
    const validFromDate = new Date(discount.valid_from);
    // Get UTC dates for comparison to avoid timezone issues
    const validFromUTC = new Date(Date.UTC(
      validFromDate.getUTCFullYear(),
      validFromDate.getUTCMonth(),
      validFromDate.getUTCDate()
    ));
    const nowUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ));
    
    // Code is valid if valid_from date is today or earlier
    if (validFromUTC > nowUTC) {
      return { valid: false, error: 'Discount code is not yet valid' };
    }
  }
  
  // For valid_until, compare at end of day (23:59:59) so codes are valid until the end of the day
  if (discount.valid_until) {
    const validUntilDate = new Date(discount.valid_until);
    // Get end of day in UTC
    const validUntilEndOfDayUTC = new Date(Date.UTC(
      validUntilDate.getUTCFullYear(),
      validUntilDate.getUTCMonth(),
      validUntilDate.getUTCDate(),
      23, 59, 59, 999
    ));
    
    // Code is expired if valid_until is before now
    if (validUntilEndOfDayUTC < now) {
      return { valid: false, error: 'Discount code has expired' };
    }
  }

  return { valid: true, discount };
}

