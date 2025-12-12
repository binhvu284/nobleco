import { getSupabase } from '../_db.js';
import { getCommissionRateByLevel } from './commissionRates.js';
import { createWalletLog } from './walletLog.js';

// Calculate and process commissions for an order
export async function processOrderCommissions(orderId, userId, orderAmount) {
  const supabase = getSupabase();
  
  try {
    console.log(`Processing commissions for order ${orderId}, user ${userId}, amount ${orderAmount}`);
    
    // Get order creator user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, level, refer_code, referred_by, points')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error(`User not found: ${userError?.message}`);
    }

    console.log(`User found: ${user.id}, level: ${user.level}, referred_by: ${user.referred_by}`);

    const commissions = [];
    
    // Track which users receive commissions to prevent duplicates
    const commissionRecipients = new Set();

    // 1. Self commission - Order creator gets commission based on THEIR OWN commission rate
    const orderCreatorRates = await getCommissionRateByLevel(user.level?.toLowerCase() || 'guest');
    if (orderCreatorRates && orderCreatorRates.self_commission > 0) {
      const selfCommissionAmount = (orderAmount * orderCreatorRates.self_commission) / 100;
      const commission = await transferCommission({
        userId: user.id,
        orderId,
        commissionType: 'self',
        orderAmount,
        commissionRate: orderCreatorRates.self_commission,
        commissionAmount: selfCommissionAmount
      });
      commissions.push(commission);
      commissionRecipients.add(user.id);
      console.log(`✅ Self commission: ${user.id} receives ${selfCommissionAmount.toLocaleString()} points (${orderCreatorRates.self_commission}%)`);
    }

    // 2. Level 1 commission - Direct referrer gets commission based on THEIR OWN commission rate
    if (user.referred_by) {
      const { data: level1User, error: level1Error } = await supabase
        .from('users')
        .select('id, level, points')
        .eq('refer_code', user.referred_by)
        .single();

      if (!level1Error && level1User) {
        // CRITICAL: Ensure Level 1 user is NOT the order creator
        if (level1User.id === user.id) {
          console.warn(`⚠️ Skipping Level 1 commission: Level 1 user (${level1User.id}) is the same as order creator (${user.id})`);
        } else if (commissionRecipients.has(level1User.id)) {
          console.warn(`⚠️ Skipping Level 1 commission: Level 1 user (${level1User.id}) already received a commission for this order`);
        } else {
          // Get Level 1 user's commission rates (for Level 1 referrals)
          const level1Rates = await getCommissionRateByLevel(level1User.level?.toLowerCase() || 'guest');
          if (level1Rates && level1Rates.level_1_down > 0) {
            const level1CommissionAmount = (orderAmount * level1Rates.level_1_down) / 100;
            const commission = await transferCommission({
              userId: level1User.id,
              orderId,
              commissionType: 'level1',
              orderAmount,
              commissionRate: level1Rates.level_1_down,
              commissionAmount: level1CommissionAmount
            });
            commissions.push(commission);
            commissionRecipients.add(level1User.id);
            console.log(`✅ Level 1 commission: ${level1User.id} receives ${level1CommissionAmount.toLocaleString()} points (${level1Rates.level_1_down}%)`);
          }
        }
      }
    }

    // 3. Level 2 commission - Indirect referrer gets commission based on THEIR OWN commission rate
    if (user.referred_by) {
      // Get level 1 user first
      const { data: level1User, error: level1Error } = await supabase
        .from('users')
        .select('id, referred_by')
        .eq('refer_code', user.referred_by)
        .single();

      if (!level1Error && level1User && level1User.referred_by) {
        // CRITICAL: Ensure Level 1 user is NOT the order creator
        if (level1User.id === user.id) {
          console.warn(`⚠️ Skipping Level 2 commission: Level 1 user (${level1User.id}) is the same as order creator (${user.id})`);
        } else {
          // Get level 2 user
          const { data: level2User, error: level2Error } = await supabase
            .from('users')
            .select('id, level, points')
            .eq('refer_code', level1User.referred_by)
            .single();

          if (!level2Error && level2User) {
            // CRITICAL: Ensure Level 2 user is NOT the order creator AND NOT the Level 1 user
            if (level2User.id === user.id) {
              console.warn(`⚠️ Skipping Level 2 commission: Level 2 user (${level2User.id}) is the same as order creator (${user.id})`);
            } else if (level2User.id === level1User.id) {
              console.warn(`⚠️ Skipping Level 2 commission: Level 2 user (${level2User.id}) is the same as Level 1 user (${level1User.id})`);
            } else if (commissionRecipients.has(level2User.id)) {
              console.warn(`⚠️ Skipping Level 2 commission: Level 2 user (${level2User.id}) already received a commission for this order`);
            } else {
              // Get Level 2 user's commission rates (for Level 2 referrals)
              const level2Rates = await getCommissionRateByLevel(level2User.level?.toLowerCase() || 'guest');
              if (level2Rates && level2Rates.level_2_down > 0) {
                const level2CommissionAmount = (orderAmount * level2Rates.level_2_down) / 100;
                const commission = await transferCommission({
                  userId: level2User.id,
                  orderId,
                  commissionType: 'level2',
                  orderAmount,
                  commissionRate: level2Rates.level_2_down,
                  commissionAmount: level2CommissionAmount
                });
                commissions.push(commission);
                commissionRecipients.add(level2User.id);
                console.log(`✅ Level 2 commission: ${level2User.id} receives ${level2CommissionAmount.toLocaleString()} points (${level2Rates.level_2_down}%)`);
              }
            }
          }
        }
      }
    }

    console.log(`Commissions processed successfully for order ${orderId}: ${commissions.length} commission(s) created`);
    return { commissions };
  } catch (error) {
    console.error('Error processing order commissions:', error);
    console.error('Error details:', {
      orderId,
      userId,
      orderAmount,
      errorMessage: error.message,
      errorStack: error.stack
    });
    throw error;
  }
}

// Transfer commission to user wallet
async function transferCommission({ userId, orderId, commissionType, orderAmount, commissionRate, commissionAmount }) {
  const supabase = getSupabase();
  
  try {
    // Get current user points and commission
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('points, commission')
      .eq('id', userId)
      .single();

    if (userError) {
      throw new Error(`Failed to fetch user: ${userError.message}`);
    }

    const pointsBefore = user.points || 0;
    const pointsAfter = pointsBefore + Math.floor(commissionAmount);
    const commissionBefore = user.commission || 0;
    const commissionAfter = commissionBefore + Math.floor(commissionAmount);

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

    // Update user points in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        points: pointsAfter,
        commission: commissionAfter
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

    // Create wallet log entry for commission - THIS IS CRITICAL
    // If this fails, we need to know about it, but we won't rollback the commission
    const commissionTypeLabel = {
      'self': 'Commission (Your Order)',
      'level1': 'Commission (Level 1 Referral)',
      'level2': 'Commission (Level 2 Referral)'
    }[commissionType] || 'Commission';

    try {
      const walletLogResult = await createWalletLog({
        user_id: userId,
        log_type: 'Commission',
        point_amount: Math.floor(commissionAmount),
        balance_after: pointsAfter,
        related_order_id: orderId,
        description: `${commissionTypeLabel}: ${Math.floor(commissionAmount).toLocaleString()} points from order (${commissionRate}% of ${orderAmount.toLocaleString('vi-VN')} ₫)`
      });
      
      console.log(`✅ Wallet log created successfully for commission:`, {
        userId,
        orderId,
        commissionType,
        amount: Math.floor(commissionAmount),
        logId: walletLogResult?.id
      });
    } catch (walletLogError) {
      // Log the error with full details - this is critical for debugging
      // Make it VERY visible in the logs
      console.error('='.repeat(80));
      console.error('❌ CRITICAL ERROR: Wallet log creation FAILED for commission');
      console.error('='.repeat(80));
      console.error('Details:', {
        userId,
        orderId,
        commissionType,
        commissionAmount: Math.floor(commissionAmount),
        pointsAfter,
        errorMessage: walletLogError.message,
        errorCode: walletLogError.code,
        errorDetails: walletLogError.details,
        errorHint: walletLogError.hint,
        fullError: walletLogError
      });
      console.error('Stack trace:', walletLogError.stack);
      console.error('='.repeat(80));
      console.error('⚠️  WARNING: Commission was added to wallet but log was NOT created!');
      console.error('⚠️  This means the transaction history will not show this commission.');
      console.error('='.repeat(80));
      
      // Don't throw - commission was transferred successfully, log is just for history
      // But we've made the error VERY visible so it can be fixed
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

