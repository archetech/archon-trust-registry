import { Router, Request, Response } from 'express';
import { config } from '../config.js';

const router = Router();

// In-memory list of recognized authorities (could be loaded from config/DB)
// For now, this is a stub - recognition relationships would be stored as credentials
const recognizedAuthorities: Map<string, {
  recognition_type: 'unilateral' | 'bilateral';
  scope: string[];
}> = new Map();

/**
 * TRQP Recognition Query
 * GET /trqp/v1/recognition
 * 
 * Query params:
 *   - authority_id: DID of the querying authority (this registry)
 *   - recognized_authority_id: DID of the authority being checked
 *   - scope: (optional) Scope of recognition
 */
router.get('/', async (req: Request, res: Response) => {
  const { authority_id, recognized_authority_id, scope } = req.query;
  
  // Validate required params
  if (!authority_id) {
    return res.status(400).json({ error: 'Missing required parameter: authority_id' });
  }
  if (!recognized_authority_id) {
    return res.status(400).json({ error: 'Missing required parameter: recognized_authority_id' });
  }
  
  // Validate authority_id matches this registry
  if (authority_id !== config.registryDid) {
    return res.status(400).json({ 
      error: `This registry only serves authority: ${config.registryDid}` 
    });
  }
  
  try {
    // Check if we recognize this authority
    const recognition = recognizedAuthorities.get(recognized_authority_id as string);
    
    if (recognition) {
      return res.json({
        recognized: true,
        authority_id,
        recognized_authority_id,
        recognition_type: recognition.recognition_type,
        scope: recognition.scope
      });
    } else {
      return res.json({
        recognized: false,
        error: 'Authority not in recognized list'
      });
    }
  } catch (error) {
    console.error('Recognition check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * List all recognized authorities
 * GET /trqp/v1/recognition/list
 */
router.get('/list', async (_req: Request, res: Response) => {
  const authorities = Array.from(recognizedAuthorities.entries()).map(([did, info]) => ({
    authority_id: did,
    ...info
  }));
  
  return res.json({
    authority_id: config.registryDid,
    recognized_authorities: authorities
  });
});

export default router;
