/**
 * Payment Configuration API
 * Returns merchant bank account info for QR code generation
 */

import { getSupabase } from './_db.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get merchant bank account from environment or database
    // This should match the bank account configured in Sepay dashboard
    const bankAccount = {
      bank_name: process.env.MERCHANT_BANK_NAME || '',
      bank_code: process.env.MERCHANT_BANK_CODE || '', // BIN code (e.g., '970422' for Vietcombank)
      account_number: process.env.MERCHANT_BANK_ACCOUNT || '',
      account_owner: process.env.MERCHANT_BANK_OWNER || ''
    };

    // If no env vars, try to get from database (admin user's bank info)
    if (!bankAccount.account_number) {
      const supabase = getSupabase();
      const { data: adminUser } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (adminUser) {
        const { data: bankInfo } = await supabase
          .from('bank_info')
          .select('bank_name, bank_number, bank_owner_name')
          .eq('user_id', adminUser.id)
          .single();

        if (bankInfo) {
          bankAccount.bank_name = bankInfo.bank_name;
          bankAccount.account_number = bankInfo.bank_number;
          bankAccount.account_owner = bankInfo.bank_owner_name;
          // Map bank name to BIN code (common Vietnamese banks)
          const bankCodeMap = {
            'Vietcombank': '970422',
            'VietinBank': '970415',
            'BIDV': '970418',
            'Agribank': '970405',
            'Techcombank': '970407',
            'ACB': '970416',
            'TPBank': '970423',
            'VPBank': '970432',
            'MBBank': '970422',
            'Sacombank': '970403'
          };
          bankAccount.bank_code = bankCodeMap[bankInfo.bank_name] || '';
        }
      }
    }

    return res.status(200).json({
      success: true,
      bank_account: bankAccount
    });

  } catch (error) {
    console.error('Error getting payment config:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

