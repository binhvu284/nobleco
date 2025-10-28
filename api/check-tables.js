import { getSupabase } from './_db.js';

export default async function handler(req, res) {
  try {
    const supabase = getSupabase();
    const results = {
      products: { exists: false, count: 0, error: null },
      categories: { exists: false, count: 0, error: null },
      product_categories: { exists: false, count: 0, error: null }
    };

    // Check products table
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true });
    
    if (productsError) {
      results.products.error = productsError.message;
      results.products.exists = false;
    } else {
      results.products.exists = true;
      results.products.count = products?.length || 0;
    }

    // Check categories table
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true });
    
    if (categoriesError) {
      results.categories.error = categoriesError.message;
      results.categories.exists = false;
    } else {
      results.categories.exists = true;
      results.categories.count = categories?.length || 0;
    }

    // Check product_categories table
    const { data: productCategories, error: pcError } = await supabase
      .from('product_categories')
      .select('id', { count: 'exact', head: true });
    
    if (pcError) {
      results.product_categories.error = pcError.message;
      results.product_categories.exists = false;
    } else {
      results.product_categories.exists = true;
      results.product_categories.count = productCategories?.length || 0;
    }

    return res.status(200).json({
      success: true,
      tables: results,
      message: results.products.exists && results.categories.exists && results.product_categories.exists
        ? 'All tables exist and are ready!'
        : 'Some tables are missing. Please run update_database.sql in Supabase.'
    });

  } catch (error) {
    console.error('Check tables error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
}

