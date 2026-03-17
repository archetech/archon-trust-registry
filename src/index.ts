#!/usr/bin/env node

import 'dotenv/config';
import express from 'express';
import { config } from './config.js';
import authorizationRoutes from './routes/authorization.js';
import recognitionRoutes from './routes/recognition.js';
import metadataRoutes from './routes/metadata.js';

const app = express();

// Middleware
app.use(express.json());

// CORS - open trust registry
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Handle OPTIONS preflight for CORS
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ToIP TRQP v2.0 Normative Routes (root level)
app.use('/authorization', authorizationRoutes);
app.use('/recognition', recognitionRoutes);
app.use('/metadata', metadataRoutes);

// Legacy routes with /trqp/v1 prefix (backwards compatibility)
app.use('/trqp/v1/authorization', authorizationRoutes);
app.use('/trqp/v1/recognition', recognitionRoutes);
app.use('/trqp/v1/metadata', metadataRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    trqp_version: '2.0',
    registry_id: config.registryDid,
    time_requested: new Date().toISOString()
  });
});
app.get('/trqp/v1/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    trqp_version: '2.0',
    registry_id: config.registryDid,
    time_requested: new Date().toISOString()
  });
});

// Root endpoint - registry info
app.get('/', (_req, res) => {
  res.json({
    name: config.registryName,
    registry_id: config.registryDid,
    authority_id: config.registryDid,
    protocol: 'ToIP TRQP v2.0',
    endpoints: {
      authorization: '/authorization (POST recommended, GET supported)',
      recognition: '/recognition (POST recommended, GET supported)',
      metadata: '/metadata',
      health: '/health'
    },
    legacy_endpoints: {
      authorization: '/trqp/v1/authorization',
      recognition: '/trqp/v1/recognition',
      metadata: '/trqp/v1/metadata'
    },
    docs: 'https://trustoverip.github.io/tswg-trust-registry-protocol/',
    time_requested: new Date().toISOString()
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║        Archon Trust Registry Server v0.2.0                ║
║            ToIP TRQP v2.0 Conformant                      ║
╠═══════════════════════════════════════════════════════════╣
║  Port:       ${String(config.port).padEnd(43)}║
║  Registry:   ${(config.registryDid || '(not configured)').slice(0, 43).padEnd(43)}║
║  Gatekeeper: ${config.gatekeeperUrl.slice(0, 43).padEnd(43)}║
╠═══════════════════════════════════════════════════════════╣
║  TRQP v2.0 Endpoints (normative):                         ║
║    POST /authorization    - Authorization query           ║
║    POST /recognition      - Recognition query             ║
║    GET  /metadata         - Registry metadata             ║
║    GET  /health           - Health check                  ║
╠═══════════════════════════════════════════════════════════╣
║  Legacy Endpoints (backwards compatible):                 ║
║    GET  /trqp/v1/authorization                            ║
║    GET  /trqp/v1/recognition                              ║
║    GET  /trqp/v1/metadata                                 ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
