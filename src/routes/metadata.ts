import { Router, Request, Response } from 'express';
import { config } from '../config.js';

const router = Router();

/**
 * TRQP v2.0 Registry Metadata
 * GET /metadata
 * 
 * Returns information about what this registry governs
 */
router.get('/', async (_req: Request, res: Response) => {
  return res.json({
    // Core identifiers
    registry_id: config.registryDid,
    authority_id: config.registryDid,
    
    // Descriptive metadata
    name: config.registryName,
    description: 'ToIP TRQP v2.0 compliant Trust Registry powered by Archon Protocol',
    governance_framework: null, // URL to governance docs if available
    
    // Protocol info
    trqp_version: '2.0',
    supported_query_types: ['authorization', 'recognition'],
    supported_actions: config.supportedActions,
    
    // Implementation details
    resource_format: config.resourceFormat,
    roles: Object.entries(config.roles).map(([name, role]) => ({
      name,
      actions: role.actions,
      description: role.description
    })),
    
    // Endpoints (both /trqp/v1/ prefixed and root)
    endpoints: {
      authorization: '/authorization',
      recognition: '/recognition',
      metadata: '/metadata'
    },
    
    // Timing
    time_requested: new Date().toISOString()
  });
});

/**
 * Health check
 * GET /trqp/v1/health
 */
router.get('/health', async (_req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    registry_id: config.registryDid,
    timestamp: new Date().toISOString()
  });
});

export default router;
