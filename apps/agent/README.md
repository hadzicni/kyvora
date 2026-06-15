# Kyvora Agent

The Kyvora Agent exposes a small HTTP API on the managed server. The Kyvora API
pulls health, capabilities, host facts, metrics, and service metadata from that
local API over a secured channel. The agent does not register itself with
Kyvora and does not push heartbeats or metrics.

The agent version is part of the single Kyvora product release version recorded
in the repository root `VERSION` file.

## Pull-based operation

1. Start the agent on the managed server with a private listen address and a
   shared secret.
2. Create or select a server inventory entry in Kyvora.
3. Configure an agent connection record with the agent base URL and shared
   secret.
4. Use Pull now or the backend polling flow to retrieve the latest agent state.

Example:

```bash
KYVORA_AGENT_LISTEN_ADDRESS=127.0.0.1 \
KYVORA_AGENT_LISTEN_PORT=9288 \
KYVORA_AGENT_SHARED_SECRET=<shared-secret> \
npm run dev:agent
```

The agent port is sensitive. Bind it to localhost or a trusted private
interface unless the deployment adds stronger protection such as mTLS and
network policy. Never expose the agent port directly to the public internet.

## Configuration

```env
KYVORA_AGENT_LISTEN_ADDRESS=127.0.0.1
KYVORA_AGENT_LISTEN_PORT=9288
KYVORA_AGENT_SHARED_SECRET=<shared-secret>
KYVORA_AGENT_NAME=local-agent
KYVORA_AGENT_HOSTNAME=<os-hostname>
KYVORA_AGENT_READ_TIMEOUT_SECONDS=5
KYVORA_AGENT_WRITE_TIMEOUT_SECONDS=5
KYVORA_AGENT_SHUTDOWN_TIMEOUT_SECONDS=5
```

`KYVORA_AGENT_SHARED_SECRET` is required. It is checked on every request using
the `X-Kyvora-Agent-Secret` header. The agent never logs the shared secret.

## HTTP API

All endpoints return structured JSON and require the shared secret header.

```text
GET /health
GET /capabilities
GET /system
GET /metrics
GET /services
POST /actions/{actionName}
X-Kyvora-Agent-Secret: <shared-secret>
```

`/system` returns the latest host facts snapshot when available:

- hostname
- operating system / platform
- kernel version
- architecture
- CPU count
- total memory
- total and free root disk space
- uptime
- IP addresses
- agent version
- collection timestamp

Host facts are latest inventory snapshots, not metrics history. The agent does
not collect secrets, environment variables, process lists, usernames, or file
contents. Collection is best-effort on Linux and macOS; unsupported facts are
omitted from the response. Other platforms degrade gracefully.

`POST /actions/{actionName}` is intentionally limited to predefined actions.
The initial implementation returns an unsupported-action response and does not
offer arbitrary shell execution.
