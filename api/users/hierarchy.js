import { getUserHierarchy, getIndirectInferiors, calculateCommissions } from '../_repo/users.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      try {
        // Get hierarchy data (superior and direct inferiors)
        const hierarchyData = await getUserHierarchy(userId);
        
        // Get indirect inferiors for each direct inferior
        const inferiorsWithIndirect = await Promise.all(
          hierarchyData.inferiors.map(async (inferior) => {
            const indirectInferiors = await getIndirectInferiors(inferior.id);
            const commissions = await calculateCommissions(inferior.id);
            
            return {
              ...inferior,
              inferiors_list: indirectInferiors,
              direct_commission: commissions.direct_commission,
              indirect_commission: commissions.indirect_commission
            };
          })
        );

        return res.status(200).json({
          superior: hierarchyData.superior,
          inferiors: inferiorsWithIndirect
        });
      } catch (e) {
        console.error('Error fetching hierarchy data:', e);
        return res.status(500).json({ error: e.message });
      }
    }

    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  } catch (e) {
    console.error('Hierarchy API error:', e);
    return res.status(500).json({ error: e.message });
  }
}