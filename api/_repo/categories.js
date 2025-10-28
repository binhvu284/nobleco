import { getSupabase } from '../_db.js';

/**
 * Normalize category data
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
 * List all categories
 */
export async function listCategories() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    // Check if table doesn't exist
    if (error.code === '42P01') {
      console.warn('Categories table does not exist yet');
      return [];
    }
    throw new Error(`Error fetching categories: ${error.message}`);
  }

  return (data || []).map(normalize);
}

/**
 * Get category by ID
 */
export async function getCategoryById(id) {
  const supabase = getSupabase();

  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Error fetching category: ${error.message}`);
  }

  return normalize(category);
}

/**
 * Create a new category
 */
export async function createCategory(categoryData) {
  const supabase = getSupabase();

  const { data: category, error } = await supabase
    .from('categories')
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
    throw new Error(`Error creating category: ${error.message}`);
  }

  return normalize(category);
}

/**
 * Update category
 */
export async function updateCategory(id, categoryData) {
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
    .from('categories')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating category: ${error.message}`);
  }

  return normalize(category);
}

/**
 * Delete category
 */
export async function deleteCategory(categoryId) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId);

  if (error) {
    throw new Error(`Error deleting category: ${error.message}`);
  }

  return { success: true };
}

/**
 * Update category status
 */
export async function updateCategoryStatus(id, newStatus) {
  const supabase = getSupabase();

  const { data: category, error } = await supabase
    .from('categories')
    .update({ status: newStatus })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating category status: ${error.message}`);
  }

  return normalize(category);
}

