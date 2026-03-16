import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { checkAuthorization } from '../lib/gatekeeper-client.js';

const router = Router();

/**
 * TRQP Authorization Query
 * GET /trqp/v1/authorization
 * 
 * Query params:
 *   - authority_id: DID of the governing authority
 *   - entity_id: DID of the entity being queried
 *   - action: Action type (issue, verify, hold, present, revoke)
 *   - resource: (optional) Schema DID or credential type
 */
router.get('/', async (req: Request, res: Response) => {
  const { authority_id, entity_id, action, resource } = req.query;
  
  // Validate required params
  if (!authority_id) {
    return res.status(400).json({ error: 'Missing required parameter: authority_id' });
  }
  if (!entity_id) {
    return res.status(400).json({ error: 'Missing required parameter: entity_id' });
  }
  if (!action) {
    return res.status(400).json({ error: 'Missing required parameter: action' });
  }
  
  // Validate authority_id matches this registry
  if (authority_id !== config.registryDid) {
    return res.status(400).json({ 
      error: `This registry only serves authority: ${config.registryDid}` 
    });
  }
  
  // Validate action is supported
  if (!config.supportedActions.includes(action as string)) {
    return res.status(400).json({ 
      error: `Unsupported action: ${action}. Supported: ${config.supportedActions.join(', ')}` 
    });
  }
  
  try {
    const result = await checkAuthorization(
      entity_id as string,
      action as string,
      resource as string | undefined
    );
    
    if (result.authorized) {
      return res.json({
        authorized: true,
        authority_id,
        entity_id,
        action,
        resource: resource || null,
        statement: {
          type: 'GroupMembership',
          role: result.role
        }
      });
    } else {
      return res.json({
        authorized: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Authorization check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
