# Archon Trust Registry

**ToIP-compliant Trust Registry Query Protocol (TRQP) implementation powered by Archon Protocol.**

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## What is this?

A trust registry answers one question: **"Is this entity authorized to do this thing?"**

This server implements the [ToIP Trust Registry Query Protocol (TRQP) v2.0](https://trustoverip.github.io/tswg-trust-registry-protocol/) specification, exposing Archon's group/credential infrastructure through a standardized API.

## Quick Start

```bash
# Clone
git clone https://github.com/archetech/archon-trust-registry.git
cd archon-trust-registry

# Install
npm install

# Configure
cp .env.example .env
# Edit .env with your registry DID and group DIDs

# Run
npm run dev
```

## API Endpoints

### Authorization Query
*"Can entity X do action Y?"*

```http
GET /trqp/v1/authorization?authority_id=<registry-did>&entity_id=<entity-did>&action=issue&resource=MembershipCredential
```

**Response:**
```json
{
  "authorized": true,
  "statement": { "type": "GroupMembership", "role": "admin" }
}
```

### Recognition Query
*"Do we trust authority Y?"*

```http
GET /trqp/v1/recognition?authority_id=<registry-did>&recognized_authority_id=<other-authority-did>
```

### Metadata
*"What does this registry govern?"*

```http
GET /trqp/v1/metadata
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `REGISTRY_DID` | DID of this trust registry | required |
| `REGISTRY_NAME` | Human-readable name | `Archon Trust Registry` |
| `GATEKEEPER_URL` | Archon Gatekeeper API | `https://archon.technology` |
| `PORT` | Server port | `4260` |
| `OWNER_GROUP` | DID of owner group | - |
| `ADMIN_GROUP` | DID of admin group | - |
| `MODERATOR_GROUP` | DID of moderator group | - |
| `MEMBER_GROUP` | DID of member group | - |

## Role → Action Mapping

Configurable in `roles.json`:

| Role | Actions |
|------|---------|
| owner | issue, verify, hold, present, revoke |
| admin | issue, verify, hold, present, revoke |
| moderator | verify, hold, present |
| member | verify, hold, present |

## Architecture

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  TRQP Consumer  │────▶│  Archon Trust        │────▶│  Gatekeeper     │
│  (verifier app) │     │  Registry Server     │     │  (group checks) │
└─────────────────┘     └──────────────────────┘     └─────────────────┘
```

## Links

- [ToIP TRQP Specification](https://trustoverip.github.io/tswg-trust-registry-protocol/)
- [Archon Protocol](https://archon.technology)
- [Proposal Document](./PROPOSAL.md)

## License

Apache-2.0 © [Archetech](https://archetech.com)
