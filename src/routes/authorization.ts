import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { checkAuthorization } from '../lib/gatekeeper-client.js';
import { resolveToDID, isDID } from '../lib/name-resolver.js';

const router = Router();

/**
 * TRQP Authorization Query
 * GET /trqp/v1/authorization
 * 
 * Query params:
 *   - authority_id: DID or name of the governing authority (e.g., "archon-social")
 *   - entity_id: DID or name of the entity being queried (e.g., "genitrix")
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
  
  // Resolve names to DIDs
  const resolvedAuthority = await resolveToDID(authority_id as string);
  const resolvedEntity = await resolveToDID(entity_id as string);
  
  if (!resolvedAuthority) {
    return res.status(400).json({ error: `Could not resolve authority: ${authority_id}` });
  }
  if (!resolvedEntity) {
    return res.status(400).json({ error: `Could not resolve entity: ${entity_id}` });
  }
  
  // Validate authority_id matches this registry
  if (resolvedAuthority !== config.registryDid) {
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
      resolvedEntity,
      action as string,
      resource as string | undefined
    );
    
    if (result.authorized) {
      return res.json({
        authorized: true,
        authority_id: resolvedAuthority,
        entity_id: resolvedEntity,
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
