import { getSupabase } from '../_db.js';
import { getCommissionRateByLevel } from './commissionRates.js';

// Calculate and process commissions for an order
export async function processOrderCommissions(orderId, userId, orderAmount) {
  const supabase = getSupabase();
  
  try {
    // Get order creator user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, level, refer_code, referred_by, points')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message}`);
    }

    // Get commission rates for user level
    const commissionRates = await getCommissionRateByLevel(user.level?.toLowerCase() || 'guest');
    
    if (!commissionRates) {
      console.warn(`No commission rates found for level: ${user.level}`);
      return { commissions: [] };
    }

    const commissions = [];

    // 1. Self commission (commission from own order)
    if (commissionRates.self_commission > 0) {
      const selfCommissionAmount = (orderAmount * commissionRates.self_commission) / 100;
      const commission = await transferCommission({
        userId: user.id,
        orderId,
        commissionType: 'self',
        orderAmount,
        commissionRate: commissionRates.self_commission,
        commissionAmount: selfCommissionAmount
      });
      commissions.push(commission);
    }

    // 2. Level 1 commission (from direct referrals)
    if (commissionRates.level_1_down > 0 && user.referred_by) {
      const { data: level1User, error: level1Error } = await supabase
        .from('users')
        .select('id, level, points')
        .eq('refer_code', user.referred_by)
        .single();

      if (!level1Error && level1User) {
        const level1CommissionAmount = (orderAmount * commissionRates.level_1_down) / 100;
        const commission = await transferCommission({
          userId: level1User.id,
          orderId,
          commissionType: 'level1',
          orderAmount,
          commissionRate: commissionRates.level_1_down,
          commissionAmount: level1CommissionAmount
        });
        commissions.push(commission);
      }
    }

    // 3. Level 2 commission (from indirect referrals)
    if (commissionRates.level_2_down > 0 && user.referred_by) {
      // Get level 1 user
      const { data: level1User, error: level1Error } = await supabase
        .from('users')
        .select('referred_by')
        .eq('refer_code', user.referred_by)
        .single();

      if (!level1Error && level1User && level1User.referred_by) {
        // Get level 2 user
        const { data: level2User, error: level2Error } = await supabase
          .from('users')
          .select('id, level, points')
          .eq('refer_code', level1User.referred_by)
          .single();

        if (!level2Error && level2User) {
          const level2CommissionAmount = (orderAmount * commissionRates.level_2_down) / 100;
          const commission = await transferCommission({
            userId: level2User.id,
            orderId,
            commissionType: 'level2',
            orderAmount,
            commissionRate: commissionRates.level_2_down,
            commissionAmount: level2CommissionAmount
          });
          commissions.push(commission);
        }
      }
    }

    return { commissions };
  } catch (error) {
    console.error('Error processing order commissions:', error);
    throw error;
  }
}

// Transfer commission to user wallet
async function transferCommission({ userId, orderId, commissionType, orderAmount, commissionRate, commissionAmount }) {
  const supabase = getSupabase();
  
  try {
    // Get current user points
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }

    const pointsBefore = user.points || 0;
    const pointsAfter = pointsBefore + Math.floor(commissionAmount);

    // Create commission transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('commission_transactions')
      .insert({
        user_id: userId,
        order_id: orderId,
        commission_type: commissionType,
        order_amount: orderAmount,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        points_before: pointsBefore,
        points_after: pointsAfter,
        status: 'pending'
      })
      .select()
      .single();

    if (transactionError) {
      throw new Error(`Failed to create commission transaction: ${transactionError.message}`);
    }

    // Update user points
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        points: pointsAfter,
        commission: (user.commission || 0) + Math.floor(commissionAmount)
      })
      .eq('id', userId);

    if (updateError) {
      // Rollback transaction status
      await supabase
        .from('commission_transactions')
        .update({ status: 'failed', processing_error: updateError.message })
        .eq('id', transaction.id);
      
      throw new Error(`Failed to update user points: ${updateError.message}`);
    }

    // Mark transaction as completed
    const { data: completedTransaction, error: completeError } = await supabase
      .from('commission_transactions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', transaction.id)
      .select()
      .single();

    if (completeError) {
      console.error('Error updating commission transaction status:', completeError);
      // Don't throw - commission was transferred successfully
    }

    return completedTransaction || transaction;
  } catch (error) {
    console.error('Error transferring commission:', error);
    throw error;
  }
}

// Get commission transactions for a user
export async function getUserCommissionTransactions(userId) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('commission_transactions')
    .select(`
      *,
      order:orders(id, order_number, total_amount, created_at)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching commission transactions:', error);
    throw new Error(`Failed to fetch commission transactions: ${error.message}`);
  }

  return data || [];
}

// Get commission transactions for an order
export async function getOrderCommissionTransactions(orderId) {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('commission_transactions')
    .select(`
      *,
      user:users(id, name, email)
    `)
    .eq('order_id', orderId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching order commission transactions:', error);
    throw new Error(`Failed to fetch order commission transactions: ${error.message}`);
  }

  return data || [];
}

