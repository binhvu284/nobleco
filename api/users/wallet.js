import { getSupabase } from '../_db.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      try {
        const supabase = getSupabase();
        
        // Get user's basic wallet information
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, name, email, points, level, commission, created_at')
          .eq('id', userId)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
          return res.status(500).json({ error: 'Failed to fetch user data' });
        }

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Get commission rates based on user level
        const commissionRates = getCommissionRates(user.level);

        // Get transaction history (we'll create a simple version for now)
        // In a real app, you'd have a separate transactions table
        const transactions = await getTransactionHistory(userId);

        // Set cache headers for better performance
        res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60'); // 1 minute cache
        
        return res.status(200).json({
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            balance: user.points || 0,
            level: user.level,
            commission: user.commission || 0,
            joinedDate: user.created_at
          },
          commissionRates,
          transactions
        });
      } catch (e) {
        console.error('Error fetching wallet data:', e);
        return res.status(500).json({ error: e.message });
      }
    }

    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    console.error('Wallet API error:', e);
    return res.status(500).json({ error: e.message });
  }
}

// Get commission rates based on user level
function getCommissionRates(level) {
  const rates = {
    'guest': {
      self: 0,
      level1: 0,
      level2: 0
    },
    'member': {
      self: 2,
      level1: 1,
      level2: 0
    },
    'unit manager': {
      self: 5,
      level1: 2,
      level2: 1
    },
    'brand manager': {
      self: 8,
      level1: 3,
      level2: 2
    }
  };

  return rates[level] || rates['guest'];
}

// Get transaction history (simplified version)
async function getTransactionHistory(userId) {
  // For now, we'll return a simple transaction history
  // In a real app, you'd query a transactions table
  const supabase = getSupabase();
  
  try {
    // This is a placeholder - in a real app you'd have a transactions table
    // For now, we'll return some sample data based on the user's balance
    const { data: user } = await supabase
      .from('users')
      .select('points, created_at')
      .eq('id', userId)
      .single();

    if (!user) return [];

    // Generate some sample transactions based on user's balance
    const transactions = [];
    const currentBalance = user.points || 0;
    
    if (currentBalance > 0) {
      // Add some commission transactions
      const commissionAmount = Math.min(currentBalance, 100);
      transactions.push({
        id: 1,
        type: 'commission',
        amount: commissionAmount,
        description: 'Commission from network sales',
        date: new Date().toISOString(),
        status: 'completed'
      });

      // Add a withdrawal if balance is high enough
      if (currentBalance > 200) {
        transactions.push({
          id: 2,
          type: 'withdrawal',
          amount: -Math.min(currentBalance - 100, 200),
          description: 'Withdrawal to bank account',
          date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          status: 'completed'
        });
      }
    }

    return transactions;
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    return [];
  }
}
