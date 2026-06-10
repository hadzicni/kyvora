package dev.kyvora.api.managedservice.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import dev.kyvora.api.serverinventory.entity.ServerInventory;
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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "managed_services")
public class ManagedService {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(length = 2000)
	private String description;

	@Column(length = 2048)
	private String url;

	@Column(length = 253)
	private String hostname;

	@Column(name = "ip_address", length = 45)
	private String ipAddress;

	private Integer port;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private ManagedServiceProtocol protocol;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private ManagedServiceCategory category;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private ManagedServiceStatus status;

	@ElementCollection(fetch = FetchType.LAZY)
	@CollectionTable(name = "managed_service_tags", joinColumns = @JoinColumn(name = "managed_service_id"))
	@Column(name = "tag", nullable = false, length = 50)
	private Set<String> tags = new LinkedHashSet<>();

	@Column(length = 10000)
	private String notes;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "server_inventory_id")
	private ServerInventory linkedServer;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected ManagedService() {
	}

	public ManagedService(
			String name,
			String description,
			String url,
			String hostname,
			String ipAddress,
			Integer port,
			ManagedServiceProtocol protocol,
			ManagedServiceCategory category,
			ManagedServiceStatus status,
			Set<String> tags,
			String notes,
			ServerInventory linkedServer) {
		this.name = name;
		this.description = description;
		this.url = url;
		this.hostname = hostname;
		this.ipAddress = ipAddress;
		this.port = port;
		this.protocol = protocol;
		this.category = category;
		this.status = status;
		setTags(tags);
		this.notes = notes;
		this.linkedServer = linkedServer;
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

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
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

	public Integer getPort() {
		return port;
	}

	public void setPort(Integer port) {
		this.port = port;
	}

	public ManagedServiceProtocol getProtocol() {
		return protocol;
	}

	public void setProtocol(ManagedServiceProtocol protocol) {
		this.protocol = protocol;
	}

	public ManagedServiceCategory getCategory() {
		return category;
	}

	public void setCategory(ManagedServiceCategory category) {
		this.category = category;
	}

	public ManagedServiceStatus getStatus() {
		return status;
	}

	public void setStatus(ManagedServiceStatus status) {
		this.status = status;
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

	public String getNotes() {
		return notes;
	}

	public void setNotes(String notes) {
		this.notes = notes;
	}

	public ServerInventory getLinkedServer() {
		return linkedServer;
	}

	public void setLinkedServer(ServerInventory linkedServer) {
		this.linkedServer = linkedServer;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
