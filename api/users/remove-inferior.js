import { getSupabase } from '../_db.js';

export default async function handler(req, res) {
  console.log('Remove inferior API called:', req.method, req.url);
  
  try {
    if (req.method === 'POST') {
      const { inferiorId } = req.body;
      console.log('Request body:', req.body);
      console.log('Inferior ID:', inferiorId);
      
      if (!inferiorId) {
        console.log('No inferiorId provided');
        return res.status(400).json({ error: 'inferiorId is required' });
      }

      try {
        console.log('Calling removeInferior function with ID:', inferiorId);
        
        // Validate that inferiorId is a number
        const numericId = parseInt(inferiorId);
        if (isNaN(numericId)) {
          console.log('Invalid inferiorId:', inferiorId);
          return res.status(400).json({ error: 'inferiorId must be a valid number' });
        }
        
        // Get Supabase client
        const supabase = getSupabase();
        console.log('Supabase client created');
        
        // Remove the inferior by setting their referred_by to null
        const { data, error } = await supabase
          .from('users')
          .update({ referred_by: null })
          .eq('id', numericId)
          .select('id, name, email')
          .single();
        
        if (error) {
          console.error('Supabase error:', error);
          throw new Error(error.message);
        }
        
        console.log('Successfully removed inferior:', data);
        
        return res.status(200).json({
          success: true,
          message: 'Inferior removed successfully',
          removedInferior: data
        });
      } catch (e) {
        console.error('Error removing inferior:', e);
        console.error('Error stack:', e.stack);
        return res.status(500).json({ error: e.message });
      }
    }

    console.log('Method not allowed:', req.method);
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    console.error('Remove inferior API error:', e);
    return res.status(500).json({ error: e.message });
  }
}
