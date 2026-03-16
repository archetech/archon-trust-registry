import { Router, Request, Response } from 'express';
import { config } from '../config.js';

const router = Router();

/**
 * TRQP Registry Metadata
 * GET /trqp/v1/metadata
 * 
 * Returns information about what this registry governs
 */
router.get('/', async (_req: Request, res: Response) => {
  return res.json({
    registry_id: config.registryDid,
    name: config.registryName,
    description: 'ToIP-compliant Trust Registry powered by Archon Protocol',
    governance_framework: null, // URL to governance docs if available
    trqp_version: '2.0',
    supported_actions: config.supportedActions,
    resource_format: config.resourceFormat,
    roles: Object.entries(config.roles).map(([name, role]) => ({
      name,
      actions: role.actions,
      description: role.description
    })),
    endpoints: {
      authorization: '/trqp/v1/authorization',
      recognition: '/trqp/v1/recognition',
      metadata: '/trqp/v1/metadata'
    },
    gatekeeper: config.gatekeeperUrl
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
