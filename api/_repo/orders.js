import { getSupabase } from '../_db.js';

// Normalize order shape
function normalizeOrder(o) {
  if (!o) return null;
  
  // Handle creator avatar - it might be an array or object
  let creatorAvatar = null;
  if (o.creator_avatar) {
    if (Array.isArray(o.creator_avatar) && o.creator_avatar.length > 0) {
      creatorAvatar = o.creator_avatar[0];
    } else if (typeof o.creator_avatar === 'object' && o.creator_avatar.url) {
      creatorAvatar = o.creator_avatar;
    }
  }
  
  // Merge avatar into creator if creator exists
  let creator = o.creator || null;
  if (creator && creatorAvatar) {
    creator = {
      ...creator,
      avatar: creatorAvatar
    };
  }
  
  return {
    id: o.id,
    order_number: o.order_number,
    subtotal_amount: parseFloat(o.subtotal_amount || 0),
    discount_amount: parseFloat(o.discount_amount || 0),
    tax_amount: parseFloat(o.tax_amount || 0),
    total_amount: parseFloat(o.total_amount || 0),
    status: o.status || 'pending',
    payment_method: o.payment_method,
    payment_status: o.payment_status || 'pending',
    payment_date: o.payment_date,
    client_id: o.client_id,
    client: o.client || null, // Preserve client data
    created_by: o.created_by,
    creator: creator, // Preserve creator data with avatar for admin
    notes: o.notes,
    shipping_address: o.shipping_address,
    discount_code: o.discount_code || null,
    discount_rate: o.discount_rate ? parseFloat(o.discount_rate) : null,
    sepay_order_id: o.sepay_order_id || null,
    sepay_transaction_id: o.sepay_transaction_id || null,
    webhook_received_at: o.webhook_received_at || null,
    payment_confirmed_by: o.payment_confirmed_by || 'manual',
    created_at: o.created_at,
    updated_at: o.updated_at,
    completed_at: o.completed_at,
    cancelled_at: o.cancelled_at,
  };
}

// Generate unique order number
function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const year = new Date().getFullYear();
  return `ORD-${year}-${timestamp.toString().slice(-6)}${random}`;
}

// Create order
export async function createOrder(orderData) {
  const supabase = getSupabase();
  
  const {
    client_id,
    created_by,
    cartItems,
    subtotal_amount,
    discount_amount,
    tax_amount,
    total_amount,
    notes,
    shipping_address,
    discount_code,
    discount_rate
  } = orderData;

  console.log('createOrder called with:', {
    client_id,
    created_by,
    cartItems_count: cartItems?.length,
    subtotal_amount,
    total_amount
  });

  // Generate order number
  const order_number = generateOrderNumber();

  // Create order
  const orderPayload = {
    order_number,
    client_id: client_id || null, // Allow null client_id (can be set later)
    created_by,
    subtotal_amount: parseFloat(subtotal_amount || 0),
    discount_amount: parseFloat(discount_amount || 0),
    tax_amount: parseFloat(tax_amount || 0),
    total_amount: parseFloat(total_amount || 0),
    status: 'processing',
    payment_status: 'pending',
    notes: notes || null,
    shipping_address: shipping_address || null,
    discount_code: discount_code || null,
    discount_rate: discount_rate ? parseFloat(discount_rate) : null
  };

  console.log('Inserting order with payload:', orderPayload);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderPayload)
    .select()
    .single();

  if (orderError) {
    console.error('Error creating order:', orderError);
    throw new Error(`Failed to create order: ${orderError.message}`);
  }

  console.log('Order created with ID:', order.id);

  // Create order items
  if (cartItems && cartItems.length > 0) {
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_sku: item.product.sku || null,
      product_price: parseFloat(item.product.price || 0),
      quantity: parseInt(item.quantity || 1, 10),
      unit_price: parseFloat(item.product.price || 0),
      discount_amount: 0, // Can be calculated per item if needed
      line_total: parseFloat(item.product.price || 0) * parseInt(item.quantity || 1, 10)
    }));

    console.log('Inserting order items:', orderItems.length, 'items');

    const { data: insertedItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select();

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Rollback order creation if items fail
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    console.log('Order items created successfully:', insertedItems?.length);
  } else {
    console.warn('No cart items provided for order');
  }

  // Fetch order with client info
  const { data: orderWithClient, error: fetchError } = await supabase
    .from('orders')
    .select(`
      *,
      client:clients(id, name, phone, email, gender, location)
    `)
    .eq('id', order.id)
    .single();

  if (fetchError) {
    console.error('Error fetching order with client:', fetchError);
    // Return the order even if client fetch fails
    console.log('Returning order without client info');
    return normalizeOrder(order);
  }

  console.log('Order fetched successfully with client info');
  return normalizeOrder(orderWithClient);
}

// Get orders by user
export async function getOrdersByUser(userId) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      client:clients(id, name, phone, email, gender, location)
    `)
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  
  if (!data || data.length === 0) {
    return [];
  }

  // Optimize: Get all order items in a single query instead of N queries
  const orderIds = data.map(order => order.id);
  const { data: allItems, error: itemsError } = await supabase
    .from('order_items')
    .select('order_id')
    .in('order_id', orderIds);
  
  if (itemsError) {
    console.error('Error fetching order items:', itemsError);
    // Fallback: return orders with item_count 0
    return (data || []).map(order => ({ ...normalizeOrder(order), item_count: 0 }));
  }

  // Count items per order
  const itemCounts = {};
  (allItems || []).forEach(item => {
    itemCounts[item.order_id] = (itemCounts[item.order_id] || 0) + 1;
  });

  // Map orders with item counts
  return (data || []).map(order => ({
    ...normalizeOrder(order),
    item_count: itemCounts[order.id] || 0
  }));
}

// Get all orders (admin)
export async function getAllOrders() {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      client:clients(id, name, phone, email, gender, location),
      creator:users!orders_created_by_fkey(id, name, email),
      creator_avatar:users!orders_created_by_fkey(user_avatars(url, viewport_x, viewport_y, viewport_size, width, height))
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  
  if (!data || data.length === 0) {
    return [];
  }

  // Optimize: Get all order items in a single query instead of N queries
  const orderIds = data.map(order => order.id);
  const { data: allItems, error: itemsError } = await supabase
    .from('order_items')
    .select('order_id')
    .in('order_id', orderIds);
  
  if (itemsError) {
    console.error('Error fetching order items:', itemsError);
    // Fallback: return orders with item_count 0
    return (data || []).map(order => ({ ...normalizeOrder(order), item_count: 0 }));
  }

  // Count items per order
  const itemCounts = {};
  (allItems || []).forEach(item => {
    itemCounts[item.order_id] = (itemCounts[item.order_id] || 0) + 1;
  });

  // Map orders with item counts
  return (data || []).map(order => ({
    ...normalizeOrder(order),
    item_count: itemCounts[order.id] || 0
  }));
}

// Get order by ID
export async function getOrderById(orderId) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      client:clients(id, name, phone, email, gender, location),
      creator:users!orders_created_by_fkey(id, name, email),
      creator_avatar:users!orders_created_by_fkey(user_avatars(url, viewport_x, viewport_y, viewport_size, width, height))
    `)
    .eq('id', orderId)
    .single();

  if (error) throw new Error(error.message);
  return normalizeOrder(data);
}

// Update order items
export async function updateOrderItems(orderId, cartItems) {
  const supabase = getSupabase();
  
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('cartItems is required and must be a non-empty array');
  }

  // Get existing order items
  const { data: existingItems, error: fetchError } = await supabase
    .from('order_items')
    .select('id, product_id')
    .eq('order_id', orderId);

  if (fetchError) {
    throw new Error(`Failed to fetch existing order items: ${fetchError.message}`);
  }

  const existingItemMap = {};
  (existingItems || []).forEach(item => {
    existingItemMap[item.product_id] = item.id;
  });

  // Separate items into updates and inserts
  const itemsToUpdate = [];
  const itemsToInsert = [];
  const productIdsInCart = cartItems.map(item => item.product.id);

  cartItems.forEach(item => {
    const existingItemId = existingItemMap[item.product.id];
    const quantity = parseInt(item.quantity || 1, 10);
    const unitPrice = parseFloat(item.product.price || 0);
    const lineTotal = unitPrice * quantity;

    const itemData = {
      order_id: orderId,
      product_id: item.product.id,
      product_name: item.product.name || '',
      product_sku: item.product.sku || null,
      product_price: unitPrice,
      quantity: quantity,
      unit_price: unitPrice,
      discount_amount: 0, // Can be calculated per item if needed
      line_total: lineTotal,
      updated_at: new Date().toISOString()
    };

    if (existingItemId) {
      // Update existing item
      itemsToUpdate.push({ ...itemData, id: existingItemId });
    } else {
      // Insert new item
      itemsToInsert.push(itemData);
    }
  });

  // Delete items that are no longer in cart
  const itemsToDelete = (existingItems || []).filter(item => !productIdsInCart.includes(item.product_id));
  
  if (itemsToDelete.length > 0) {
    const deleteIds = itemsToDelete.map(item => item.id);
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .in('id', deleteIds);

    if (deleteError) {
      throw new Error(`Failed to delete order items: ${deleteError.message}`);
    }
  }

  // Update existing items
  if (itemsToUpdate.length > 0) {
    for (const item of itemsToUpdate) {
      const { id, ...updateData } = item;
      const { error: updateError } = await supabase
        .from('order_items')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        throw new Error(`Failed to update order item: ${updateError.message}`);
      }
    }
  }

  // Insert new items
  if (itemsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('order_items')
      .insert(itemsToInsert);

    if (insertError) {
      throw new Error(`Failed to insert order items: ${insertError.message}`);
    }
  }

  console.log('Order items updated successfully');
  return true;
}

// Update order
export async function updateOrder(orderId, updates) {
  const supabase = getSupabase();
  
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  // Remove cartItems from updateData if present (handled separately)
  delete updateData.cartItems;

  // If status is completed, set completed_at
  if (updates.status === 'completed' && !updates.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  // If status is cancelled, set cancelled_at
  if (updates.status === 'cancelled' && !updates.cancelled_at) {
    updateData.cancelled_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select(`
      *,
      client:clients(id, name, phone, email, gender, location)
    `)
    .single();

  if (error) throw new Error(error.message);
  return normalizeOrder(data);
}

// Delete order
export async function deleteOrder(orderId) {
  const supabase = getSupabase();
  
  // Delete order items first (due to foreign key constraint)
  const { error: itemsError } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId);

  if (itemsError) throw new Error(itemsError.message);

  // Delete order
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) throw new Error(error.message);
  return true;
}

// Get order items
export async function getOrderItems(orderId) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('order_items')
    .select(`
      *,
      product:products(id, name, slug, sku, images:product_images(url, alt_text))
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

