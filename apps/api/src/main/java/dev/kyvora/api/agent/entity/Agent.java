package dev.kyvora.api.agent.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import dev.kyvora.api.serverinventory.entity.ServerInventory;

@Entity
@Table(name = "agents")
public class Agent {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(nullable = false, length = 253)
	private String hostname;

	@Column(nullable = false, length = 64)
	private String version;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private AgentStatus status;

	@Column(name = "last_seen_at")
	private Instant lastSeenAt;

	@Column(name = "base_url", nullable = false, length = 512)
	private String baseUrl;

	@Column(name = "shared_secret", nullable = false, length = 512)
	private String sharedSecret;

	@Column(name = "pull_enabled", nullable = false)
	private boolean pullEnabled = true;

	@Column(name = "last_pull_at")
	private Instant lastPullAt;

	@Column(name = "last_successful_pull_at")
	private Instant lastSuccessfulPullAt;

	@Column(name = "last_pull_error", length = 1000)
	private String lastPullError;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "capabilities", columnDefinition = "jsonb")
	private List<String> capabilities = new ArrayList<>();

	@Column(name = "registered_at", nullable = false, updatable = false)
	private Instant registeredAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "server_id")
	private ServerInventory server;

	@OneToOne(mappedBy = "agent", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
	private AgentHostFacts hostFacts;

	protected Agent() {
	}

	public Agent(String name, String hostname, String version, AgentStatus status, ServerInventory server, String baseUrl, String sharedSecret) {
		this.name = name;
		this.hostname = hostname;
		this.version = version;
		this.status = status;
		this.server = server;
		this.baseUrl = baseUrl;
		this.sharedSecret = sharedSecret;
	}

	@PrePersist
	public void beforeCreate() {
		Instant now = Instant.now();
		if (registeredAt == null) {
			registeredAt = now;
		}
		updatedAt = now;
	}

	@PreUpdate
	public void beforeUpdate() {
		updatedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getHostname() {
		return hostname;
	}

	public void setHostname(String hostname) {
		this.hostname = hostname;
	}

	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
	}

	public AgentStatus getStatus() {
		return status;
	}

	public void setStatus(AgentStatus status) {
		this.status = status;
	}

	public Instant getLastSeenAt() {
		return lastSeenAt;
	}

	public void setLastSeenAt(Instant lastSeenAt) {
		this.lastSeenAt = lastSeenAt;
	}

	public Instant getRegisteredAt() {
		return registeredAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public String getBaseUrl() {
		return baseUrl;
	}

	public void setBaseUrl(String baseUrl) {
		this.baseUrl = baseUrl;
	}

	public String getSharedSecret() {
		return sharedSecret;
	}

	public void setSharedSecret(String sharedSecret) {
		this.sharedSecret = sharedSecret;
	}

	public boolean isPullEnabled() {
		return pullEnabled;
	}

	public void setPullEnabled(boolean pullEnabled) {
		this.pullEnabled = pullEnabled;
	}

	public Instant getLastPullAt() {
		return lastPullAt;
	}

	public void setLastPullAt(Instant lastPullAt) {
		this.lastPullAt = lastPullAt;
	}

	public Instant getLastSuccessfulPullAt() {
		return lastSuccessfulPullAt;
	}

	public void setLastSuccessfulPullAt(Instant lastSuccessfulPullAt) {
		this.lastSuccessfulPullAt = lastSuccessfulPullAt;
	}

	public String getLastPullError() {
		return lastPullError;
	}

	public void setLastPullError(String lastPullError) {
		this.lastPullError = lastPullError;
	}

	public List<String> getCapabilities() {
		return capabilities == null ? List.of() : List.copyOf(capabilities);
	}

	public void setCapabilities(List<String> capabilities) {
		this.capabilities = capabilities == null ? new ArrayList<>() : new ArrayList<>(capabilities);
	}

	public ServerInventory getServer() {
		return server;
	}

	public void setServer(ServerInventory server) {
		this.server = server;
	}

	public AgentHostFacts getHostFacts() {
		return hostFacts;
	}

	public void setHostFacts(AgentHostFacts hostFacts) {
		this.hostFacts = hostFacts;
	}
}
