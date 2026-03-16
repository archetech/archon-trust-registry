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
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Routes
app.use('/trqp/v1/authorization', authorizationRoutes);
app.use('/trqp/v1/recognition', recognitionRoutes);
app.use('/trqp/v1/metadata', metadataRoutes);
app.use('/trqp/v1/health', metadataRoutes);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: config.registryName,
    registry_id: config.registryDid,
    protocol: 'ToIP TRQP v2.0',
    endpoints: {
      authorization: '/trqp/v1/authorization',
      recognition: '/trqp/v1/recognition',
      metadata: '/trqp/v1/metadata',
      health: '/trqp/v1/health'
    },
    docs: 'https://trustoverip.github.io/tswg-trust-registry-protocol/'
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
║           Archon Trust Registry Server v0.1.0             ║
╠═══════════════════════════════════════════════════════════╣
║  Protocol:   ToIP TRQP v2.0                               ║
║  Port:       ${String(config.port).padEnd(43)}║
║  Registry:   ${(config.registryDid || '(not configured)').slice(0, 43).padEnd(43)}║
║  Gatekeeper: ${config.gatekeeperUrl.slice(0, 43).padEnd(43)}║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║    GET /trqp/v1/authorization                             ║
║    GET /trqp/v1/recognition                               ║
║    GET /trqp/v1/metadata                                  ║
║    GET /trqp/v1/health                                    ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
