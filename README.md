# Archon Trust Registry

**ToIP TRQP v2.0 compliant Trust Registry powered by Archon Protocol.**

[![TRQP v2.0](https://img.shields.io/badge/TRQP-v2.0-green.svg)](https://trustoverip.github.io/tswg-trust-registry-protocol/)

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

## API Endpoints (ToIP TRQP v2.0)

### Authorization Query (Normative)
*"Can entity X do action Y?"*

```http
POST /authorization
Content-Type: application/json

{
  "authority_id": "archon-social",
  "entity_id": "flaxscrip", 
  "action": "issue",
  "resource": "MembershipCredential",
  "context": { "time": "2026-03-17T10:00:00Z" }
}
```

**Response:**
```json
{
  "entity_id": "did:cid:bagaaiera...",
  "authority_id": "did:cid:bagaaiera...",
  "action": "issue",
  "resource": "MembershipCredential",
  "authorized": true,
  "time_requested": "2026-03-17T10:00:00Z",
  "time_evaluated": "2026-03-17T10:00:00Z",
  "message": "did:cid:... is authorized for issue+MembershipCredential (role: admin)."
}
```

### Recognition Query (Normative)
*"Do we recognize authority Y?"*

```http
POST /recognition
Content-Type: application/json

{
  "authority_id": "archon-social",
  "entity_id": "did:web:riaa.com",
  "action": "recognize",
  "resource": "MusicRights"
}
```

### Metadata
*"What does this registry govern?"*

```http
GET /metadata
```

### Legacy GET Endpoints (Backwards Compatible)
```http
GET /trqp/v1/authorization?authority_id=...&entity_id=...&action=...
GET /trqp/v1/recognition?authority_id=...&recognized_authority_id=...
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
