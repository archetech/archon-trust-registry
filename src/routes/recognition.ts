import { Router, Request, Response } from 'express';
import { config } from '../config.js';
import { resolveToDID } from '../lib/name-resolver.js';

const router = Router();

// In-memory list of recognized authorities (could be loaded from config/DB)
// For now, this is a stub - recognition relationships would be stored as credentials
const recognizedAuthorities: Map<string, {
  recognition_type: 'unilateral' | 'bilateral';
  scope: string[];
}> = new Map();

interface RecognitionQuery {
  authority_id: string;
  entity_id: string;
  action?: string;
  resource?: string;
  context?: {
    time?: string;
    [key: string]: any;
  };
}

/**
 * Process recognition query (shared by GET and POST)
 */
async function processRecognitionQuery(query: RecognitionQuery, res: Response) {
  const timeRequested = new Date().toISOString();
  
  const { authority_id, entity_id, action, resource, context } = query;
  
  // Validate required params
  if (!authority_id) {
    return res.status(400).json({ error: 'Missing required parameter: authority_id' });
  }
  if (!entity_id) {
    return res.status(400).json({ error: 'Missing required parameter: entity_id' });
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
  
  try {
    const timeEvaluated = context?.time || timeRequested;
    
    // Check if we recognize this authority
    const recognition = recognizedAuthorities.get(resolvedEntity);
    
    // ToIP TRQP v2.0 compliant response
    if (recognition) {
      return res.json({
        entity_id: resolvedEntity,
        authority_id: resolvedAuthority,
        action: action || 'recognize',
        resource: resource || recognition.scope.join(','),
        recognized: true,
        time_requested: timeRequested,
        time_evaluated: timeEvaluated,
        message: `${resolvedEntity} is recognized by ${resolvedAuthority} (${recognition.recognition_type}).`
      });
    } else {
      return res.json({
        entity_id: resolvedEntity,
        authority_id: resolvedAuthority,
        action: action || 'recognize',
        resource: resource || null,
        recognized: false,
        time_requested: timeRequested,
        time_evaluated: timeEvaluated,
        message: `${resolvedEntity} is not recognized by ${resolvedAuthority}.`
      });
    }
  } catch (error) {
    console.error('Recognition check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * TRQP v2.0 Recognition Query (normative)
 * POST /recognition
 * 
 * Body:
 *   - authority_id: DID of this registry (the recognizing authority)
 *   - entity_id: DID of the authority being checked for recognition
 *   - action: (optional) Recognition action type
 *   - resource: (optional) Scope of recognition
 *   - context: (optional) { time: ISO8601 string, ... }
 */
router.post('/', async (req: Request, res: Response) => {
  const query: RecognitionQuery = {
    authority_id: req.body.authority_id,
    entity_id: req.body.entity_id,
    action: req.body.action,
    resource: req.body.resource,
    context: req.body.context
  };
  
  return processRecognitionQuery(query, res);
});

/**
 * TRQP Recognition Query (GET - backwards compatible)
 * GET /recognition?authority_id=...&recognized_authority_id=...
 */
router.get('/', async (req: Request, res: Response) => {
  // Map old param name to new
  const entityId = (req.query.entity_id || req.query.recognized_authority_id) as string;
  
  const query: RecognitionQuery = {
    authority_id: req.query.authority_id as string,
    entity_id: entityId,
    action: req.query.action as string | undefined,
    resource: req.query.resource as string | undefined
  };
  
  return processRecognitionQuery(query, res);
});

/**
 * List all recognized authorities
 * GET /recognition/list
 */
router.get('/list', async (_req: Request, res: Response) => {
  const authorities = Array.from(recognizedAuthorities.entries()).map(([did, info]) => ({
    entity_id: did,
    recognized: true,
    recognition_type: info.recognition_type,
    scope: info.scope
  }));
  
  return res.json({
    authority_id: config.registryDid,
    recognized_authorities: authorities,
    time_requested: new Date().toISOString()
  });
});

export default router;
