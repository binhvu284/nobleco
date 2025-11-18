import { getSupabase } from '../_db.js';

/**
 * Get all permissions for a coworker
 */
export async function getCoworkerPermissions(coworkerId) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('coworker_permissions')
    .select('page_path, page_name')
    .eq('coworker_id', coworkerId);

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Check if coworker has access to a specific page
 */
export async function hasCoworkerPermission(coworkerId, pagePath) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('coworker_permissions')
    .select('id')
    .eq('coworker_id', coworkerId)
    .eq('page_path', pagePath)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return !!data;
}

/**
 * Add permission for a coworker
 */
export async function addCoworkerPermission(coworkerId, pagePath, pageName) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('coworker_permissions')
    .insert({
      coworker_id: coworkerId,
      page_path: pagePath,
      page_name: pageName
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Remove permission for a coworker
 */
export async function removeCoworkerPermission(coworkerId, pagePath) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('coworker_permissions')
    .delete()
    .eq('coworker_id', coworkerId)
    .eq('page_path', pagePath);

  if (error) throw new Error(error.message);
  return true;
}

/**
 * Set permissions for a coworker (replace all existing permissions)
 */
export async function setCoworkerPermissions(coworkerId, permissions) {
  const supabase = getSupabase();
  
  // First, delete all existing permissions
  const { error: deleteError } = await supabase
    .from('coworker_permissions')
    .delete()
    .eq('coworker_id', coworkerId);

  if (deleteError) throw new Error(deleteError.message);

  // Then, insert new permissions
  if (permissions && permissions.length > 0) {
    const permissionData = permissions.map(p => ({
      coworker_id: coworkerId,
      page_path: p.page_path,
      page_name: p.page_name
    }));

    const { data, error: insertError } = await supabase
      .from('coworker_permissions')
      .insert(permissionData)
      .select();

    if (insertError) throw new Error(insertError.message);
    return data;
  }

  return [];
}

