package dev.kyvora.api.serverinventory.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "server_inventory")
public class ServerInventory {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(nullable = false, length = 253, unique = true)
	private String hostname;

	@Column(name = "ip_address", nullable = false, length = 45)
	private String ipAddress;

	@Column(length = 2000)
	private String description;

	@ElementCollection(fetch = FetchType.LAZY)
	@CollectionTable(name = "server_inventory_tags", joinColumns = @JoinColumn(name = "server_inventory_id"))
	@Column(name = "tag", nullable = false, length = 50)
	private Set<String> tags = new LinkedHashSet<>();

	@Column(name = "operating_system", length = 120)
	private String operatingSystem;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private ServerStatus status;

	@Column(name = "last_seen_at")
	private Instant lastSeenAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected ServerInventory() {
	}

	public ServerInventory(
			String name,
			String hostname,
			String ipAddress,
			String description,
			Set<String> tags,
			String operatingSystem,
			ServerStatus status,
			Instant lastSeenAt) {
		this.name = name;
		this.hostname = hostname;
		this.ipAddress = ipAddress;
		this.description = description;
		setTags(tags);
		this.operatingSystem = operatingSystem;
		this.status = status;
		this.lastSeenAt = lastSeenAt;
	}

	@PrePersist
	public void beforeCreate() {
		Instant now = Instant.now();
		if (createdAt == null) {
			createdAt = now;
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

	public String getIpAddress() {
		return ipAddress;
	}

	public void setIpAddress(String ipAddress) {
		this.ipAddress = ipAddress;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public List<String> getTags() {
		return new ArrayList<>(tags);
	}

	public void setTags(Set<String> tags) {
		this.tags.clear();
		if (tags != null) {
			this.tags.addAll(tags);
		}
	}

	public String getOperatingSystem() {
		return operatingSystem;
	}

	public void setOperatingSystem(String operatingSystem) {
		this.operatingSystem = operatingSystem;
	}

	public ServerStatus getStatus() {
		return status;
	}

	public void setStatus(ServerStatus status) {
		this.status = status;
	}

	public Instant getLastSeenAt() {
		return lastSeenAt;
	}

	public void setLastSeenAt(Instant lastSeenAt) {
		this.lastSeenAt = lastSeenAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
