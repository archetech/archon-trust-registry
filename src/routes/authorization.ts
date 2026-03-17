import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { checkAuthorization } from '../lib/gatekeeper-client.js';
import { resolveToDID } from '../lib/name-resolver.js';

const router = Router();

interface AuthorizationQuery {
  authority_id: string;
  entity_id: string;
  action: string;
  resource?: string;
  context?: {
    time?: string;
    [key: string]: any;
  };
}

/**
 * Process authorization query (shared by GET and POST)
 */
async function processAuthorizationQuery(query: AuthorizationQuery, res: Response) {
  const timeRequested = new Date().toISOString();
  
  const { authority_id, entity_id, action, resource, context } = query;
  
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
  const resolvedAuthority = await resolveToDID(authority_id);
  const resolvedEntity = await resolveToDID(entity_id);
  
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
  if (!config.supportedActions.includes(action)) {
    return res.status(400).json({ 
      error: `Unsupported action: ${action}. Supported: ${config.supportedActions.join(', ')}` 
    });
  }
  
  try {
    // Use context.time if provided, otherwise current time
    const timeEvaluated = context?.time || timeRequested;
    
    const result = await checkAuthorization(
      resolvedEntity,
      action,
      resource
    );
    
    // ToIP TRQP v2.0 compliant response
    if (result.authorized) {
      return res.json({
        entity_id: resolvedEntity,
        authority_id: resolvedAuthority,
        action,
        resource: resource || null,
        authorized: true,
        time_requested: timeRequested,
        time_evaluated: timeEvaluated,
        message: `${resolvedEntity} is authorized for ${action}${resource ? '+' + resource : ''} by ${resolvedAuthority} (role: ${result.role}).`
      });
    } else {
      return res.json({
        entity_id: resolvedEntity,
        authority_id: resolvedAuthority,
        action,
        resource: resource || null,
        authorized: false,
        time_requested: timeRequested,
        time_evaluated: timeEvaluated,
        message: result.error || `${resolvedEntity} is not authorized for ${action} by ${resolvedAuthority}.`
      });
    }
  } catch (error) {
    console.error('Authorization check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * TRQP v2.0 Authorization Query (normative)
 * POST /authorization
 * 
 * Body:
 *   - authority_id: DID or name of the governing authority
 *   - entity_id: DID or name of the entity being queried
 *   - action: Action type (issue, verify, hold, present, revoke)
 *   - resource: (optional) Schema DID or credential type
 *   - context: (optional) { time: ISO8601 string, ... }
 */
router.post('/', async (req: Request, res: Response) => {
  const query: AuthorizationQuery = {
    authority_id: req.body.authority_id,
    entity_id: req.body.entity_id,
    action: req.body.action,
    resource: req.body.resource,
    context: req.body.context
  };
  
  return processAuthorizationQuery(query, res);
});

/**
 * TRQP Authorization Query (GET - backwards compatible)
 * GET /authorization?authority_id=...&entity_id=...&action=...
 */
router.get('/', async (req: Request, res: Response) => {
  const query: AuthorizationQuery = {
    authority_id: req.query.authority_id as string,
    entity_id: req.query.entity_id as string,
    action: req.query.action as string,
    resource: req.query.resource as string | undefined
  };
  
  return processAuthorizationQuery(query, res);
});

export default router;
