import { getSupabase } from '../_db.js';

// Log webhook event
export async function logWebhookEvent(webhookData) {
  const supabase = getSupabase();
  
  const {
    webhook_type,
    event_type,
    order_id,
    payload,
    signature,
    processed = false,
    processing_error = null,
    response_data = null
  } = webhookData;

  const { data, error } = await supabase
    .from('webhook_logs')
    .insert({
      webhook_type,
      event_type,
      order_id,
      payload,
      signature,
      processed,
      processing_error,
      response_data,
      processed_at: processed ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error) {
    console.error('Error logging webhook event:', error);
    throw new Error(`Failed to log webhook event: ${error.message}`);
  }

  return data;
}

// Update webhook log processing status
export async function updateWebhookLogStatus(logId, updates) {
  const supabase = getSupabase();
  
  const updateData = {
    ...updates,
    processed_at: updates.processed ? new Date().toISOString() : null
  };

  const { data, error } = await supabase
    .from('webhook_logs')
    .update(updateData)
    .eq('id', logId)
    .select()
    .single();

  if (error) {
    console.error('Error updating webhook log:', error);
    throw new Error(`Failed to update webhook log: ${error.message}`);
  }

  return data;
}

// Get webhook logs by order ID
export async function getWebhookLogsByOrderId(orderId) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching webhook logs:', error);
    throw new Error(`Failed to fetch webhook logs: ${error.message}`);
  }

  return data || [];
}

