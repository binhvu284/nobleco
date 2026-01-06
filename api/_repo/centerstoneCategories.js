import { getSupabase } from '../_db.js';

/**
 * Normalize centerstone category data
 */
function normalize(c) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description || null,
    parent_id: c.parent_id || null,
    level: c.level || 0,
    color: c.color || '#3B82F6',
    status: c.status || 'active',
    is_featured: c.is_featured || false,
    product_count: c.product_count || 0,
    created_at: c.created_at,
    updated_at: c.updated_at
  };
}

/**
 * List all centerstone categories
 */
export async function listCenterstoneCategories() {
  try {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('centerstone_categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01') {
        console.warn('Centerstone_categories table does not exist yet');
        return [];
      }
      throw new Error(`Error fetching centerstone categories: ${error.message || error}`);
    }

    return (data || []).map(normalize);
  } catch (error) {
    // Handle network errors or other unexpected errors
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      console.error('Network error connecting to Supabase:', error.message);
      // Return empty array instead of throwing to prevent API crashes
      return [];
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Get centerstone category by ID
 */
export async function getCenterstoneCategoryById(id) {
  try {
    const supabase = getSupabase();

    const { data: category, error } = await supabase
      .from('centerstone_categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01') {
        console.warn('Centerstone_categories table does not exist yet');
        throw new Error('Centerstone category not found');
      }
      throw new Error(`Error fetching centerstone category: ${error.message || error}`);
    }

    return normalize(category);
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      console.error('Network error connecting to Supabase:', error.message);
      throw new Error('Unable to connect to database. Please check your connection.');
    }
    throw error;
  }
}

/**
 * Create a new centerstone category
 */
export async function createCenterstoneCategory(categoryData) {
  const supabase = getSupabase();

  const { data: category, error } = await supabase
    .from('centerstone_categories')
    .insert([{
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description || null,
      parent_id: categoryData.parent_id || null,
      level: categoryData.level || 0,
      color: categoryData.color || '#3B82F6',
      status: categoryData.status || 'active',
      is_featured: categoryData.is_featured || false
    }])
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating centerstone category: ${error.message}`);
  }

  return normalize(category);
}

/**
 * Update centerstone category
 */
export async function updateCenterstoneCategory(id, categoryData) {
  const supabase = getSupabase();

  const updateData = {};
  if (categoryData.name !== undefined) updateData.name = categoryData.name;
  if (categoryData.slug !== undefined) updateData.slug = categoryData.slug;
  if (categoryData.description !== undefined) updateData.description = categoryData.description;
  if (categoryData.parent_id !== undefined) updateData.parent_id = categoryData.parent_id;
  if (categoryData.level !== undefined) updateData.level = categoryData.level;
  if (categoryData.color !== undefined) updateData.color = categoryData.color;
  if (categoryData.status !== undefined) updateData.status = categoryData.status;
  if (categoryData.is_featured !== undefined) updateData.is_featured = categoryData.is_featured;

  const { data: category, error } = await supabase
    .from('centerstone_categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating centerstone category: ${error.message}`);
  }

  return normalize(category);
}

/**
 * Delete centerstone category
 */
export async function deleteCenterstoneCategory(categoryId) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('centerstone_categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    throw new Error(`Error deleting centerstone category: ${error.message}`);
  }

  return { success: true };
}

/**
 * Update centerstone category status
 */
export async function updateCenterstoneCategoryStatus(id, newStatus) {
  const supabase = getSupabase();

  const { data: category, error } = await supabase
    .from('centerstone_categories')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating centerstone category status: ${error.message}`);
  }

  return normalize(category);
}

