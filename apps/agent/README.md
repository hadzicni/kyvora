# Kyvora Agent

Kyvora Agent officially supports Linux with systemd only. Windows, macOS,
launchd, Windows Service, and other service managers are not supported.

The agent exposes a small authenticated HTTP API on the managed Linux host.
The Kyvora API pulls health, capabilities, host facts, metrics, and service
metadata from that local API. The agent does not initiate registration, status,
or metrics writes to the Kyvora API.

The default listener is conservative: `127.0.0.1:9187`. If the Kyvora API runs
on another host, bind the agent to a trusted private interface and protect the
port with host or network firewall rules. Do not expose the agent port to the
public internet.

## Build

Build release-style Linux binaries from the repository root:

```bash
scripts/build-agent.sh
```

The script writes:

```text
apps/agent/dist/kyvora-agent-linux-amd64
apps/agent/dist/kyvora-agent-linux-arm64
```

## Install As A Service

Prerequisites:

- Linux
- systemd
- root or sudo access
- a prebuilt binary from `scripts/build-agent.sh`, or Go installed so the
  installer can build from source

Install:

```bash
sudo scripts/install-agent.sh
```

The installer is Linux-only and fails clearly when systemd is unavailable. It
creates or updates:

```text
/usr/local/bin/kyvora-agent
/etc/kyvora/agent.yaml
/etc/kyvora/agent.secret
/etc/systemd/system/kyvora-agent.service
```

It also creates the unprivileged `kyvora-agent` system user and group. Existing
config and secret files are preserved during upgrades.

## Configuration

The systemd service starts the agent with:

```bash
/usr/local/bin/kyvora-agent --config /etc/kyvora/agent.yaml
```

Default config:

```yaml
server:
  listenAddress: "127.0.0.1"
  listenPort: 9187

security:
  sharedSecretFile: "/etc/kyvora/agent.secret"

logging:
  level: "info"
```

Optional fields:

```yaml
server:
  hostname: "node01.example.internal"
  id: "server-inventory-id"
  enabledCapabilities: ["health", "capabilities", "system", "metrics", "services"]

agent:
  name: "node01-agent"
  version: "0.1.0"

timeouts:
  readSeconds: 5
  writeSeconds: 10
  shutdownSeconds: 5
```

Edit the config and restart:

```bash
sudo nano /etc/kyvora/agent.yaml
sudo systemctl restart kyvora-agent
```

## Secret Handling

The shared secret is stored in:

```text
/etc/kyvora/agent.secret
```

The installer generates this file if missing and does not print the secret.
Default permissions are:

```text
/etc/kyvora              root:kyvora-agent 0750
/etc/kyvora/agent.yaml   root:kyvora-agent 0640
/etc/kyvora/agent.secret root:kyvora-agent 0640
```

Rotate the secret:

```bash
sudo sh -c 'umask 027 && openssl rand -base64 48 > /etc/kyvora/agent.secret'
sudo chown root:kyvora-agent /etc/kyvora/agent.secret
sudo chmod 0640 /etc/kyvora/agent.secret
sudo systemctl restart kyvora-agent
```

Then update the agent connection secret in Kyvora. The secret is required on
every HTTP request through the `X-Kyvora-Agent-Secret` header. It is never
returned by the agent API.

## Service Operations

```bash
sudo systemctl status kyvora-agent
sudo systemctl stop kyvora-agent
sudo systemctl start kyvora-agent
sudo systemctl restart kyvora-agent
sudo journalctl -u kyvora-agent -f
```

Logs go to journald.

## Connect To Kyvora

In the Kyvora web UI, create or select a server inventory entry and configure
an agent connection with:

- scheme: `http`
- host: the Linux host or private interface address reachable by the Kyvora API
- port: the configured `listenPort`, default `9187`
- secret: the contents of `/etc/kyvora/agent.secret`

If the API runs on the same host as the agent, use:

```text
http://127.0.0.1:9187
```

If the API runs on another host, change `listenAddress` to a private interface
address and restrict inbound traffic to trusted Kyvora API hosts.

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

Missing or invalid authentication returns `401`.

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

The agent does not collect secrets, environment variables, process lists,
usernames, or file contents.

## Uninstall

Remove the service and binary while preserving config and secrets:

```bash
sudo scripts/uninstall-agent.sh
```

Remove config and secret files explicitly:

```bash
sudo scripts/uninstall-agent.sh --purge-config
```

The uninstaller only targets the Kyvora Agent service unit, binary, and
optionally `/etc/kyvora/agent.yaml` plus `/etc/kyvora/agent.secret`.

## Troubleshooting

Check service state:

```bash
sudo systemctl status kyvora-agent
```

Follow logs:

```bash
sudo journalctl -u kyvora-agent -f
```

Validate config permissions:

```bash
sudo ls -l /etc/kyvora/agent.yaml /etc/kyvora/agent.secret
```

Common issues:

- `systemd does not appear to be running`: install on a Linux host booted with
  systemd.
- `shared secret is required`: ensure `/etc/kyvora/agent.secret` exists and is
  readable by the `kyvora-agent` group.
- Kyvora cannot pull the agent: verify `listenAddress`, firewall rules, the
  configured URL, and the shared secret.
