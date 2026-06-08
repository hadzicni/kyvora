# Kyvora Agent

The Go agent is enrolled from the Kyvora web UI and authenticates heartbeats
with an agent token. It does not log in with admin credentials and does not
register itself automatically.

## Enrollment

1. Log in to the Kyvora web dashboard.
2. Create or select a server inventory entry.
3. Enroll an agent for that server from Agents or the server detail page.
4. Copy the one-time token and run command.
5. Start the agent.

Example:

```bash
KYVORA_API_URL=http://localhost:8080 \
KYVORA_AGENT_ID=<agent-id> \
KYVORA_AGENT_TOKEN=<agent-token> \
npm run dev:agent
```

Agent tokens are shown only once. Do not commit tokens or store them in
browser-exposed environment variables. Pending enrollments can be canceled from
the web UI before the agent connects; cancellation removes the pending agent and
revokes the token.

Tokens can be rotated from the server detail Agent Setup section. Rotation
generates a new one-time plaintext token and invalidates the old token
immediately. Kyvora stores only the token hash and does not re-show old tokens
after the setup dialog is closed.

Successful heartbeats update the assigned agent status and the linked server
status and last-seen timestamp. Server status is managed by agent heartbeats
and offline detection, not manual editing.

Agents must send heartbeats regularly. If the API does not receive a heartbeat
within `KYVORA_AGENT_OFFLINE_THRESHOLD_SECONDS` seconds, Kyvora marks the agent
and its linked server offline during the scheduled offline check. `OFFLINE`
means the backend has not received a heartbeat recently.

## Configuration

```env
KYVORA_API_URL=http://localhost:8080
KYVORA_AGENT_ID=<agent-id>
KYVORA_AGENT_TOKEN=<agent-token>
KYVORA_AGENT_NAME=local-agent
KYVORA_AGENT_HOSTNAME=<os-hostname>
KYVORA_AGENT_VERSION=0.1.0
KYVORA_HEARTBEAT_INTERVAL_SECONDS=30
```

`KYVORA_AGENT_ID` and `KYVORA_AGENT_TOKEN` are required. `KYVORA_API_URL`
defaults to `http://localhost:8080`.

Heartbeats are sent to:

```text
POST /api/v1/agents/{id}/heartbeat
X-Kyvora-Agent-Token: <agent-token>
```

If the API returns `401` or `403`, the agent logs that the token is invalid or
revoked and exits.
