package dev.kyvora.api.agent.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "agents")
public class Agent {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(nullable = false, length = 253, unique = true)
	private String hostname;

	@Column(nullable = false, length = 64)
	private String version;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private AgentStatus status;

	@Column(name = "last_seen_at")
	private Instant lastSeenAt;

	@Column(name = "registered_at", nullable = false, updatable = false)
	private Instant registeredAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Agent() {
	}

	public Agent(String name, String hostname, String version, AgentStatus status) {
		this.name = name;
		this.hostname = hostname;
		this.version = version;
		this.status = status;
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
}
