package dev.kyvora.api.agent.entity;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "agent_host_facts")
public class AgentHostFacts {

	@Id
	@Column(name = "agent_id")
	private UUID agentId;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "agent_id", insertable = false, updatable = false)
	private Agent agent;

	@Column(length = 253)
	private String hostname;

	@Column(name = "operating_system", length = 120)
	private String operatingSystem;

	@Column(length = 120)
	private String platform;

	@Column(name = "kernel_version", length = 120)
	private String kernelVersion;

	@Column(length = 64)
	private String architecture;

	@Column(name = "cpu_count")
	private Integer cpuCount;

	@Column(name = "memory_total_bytes")
	private Long memoryTotalBytes;

	@Column(name = "disk_total_bytes")
	private Long diskTotalBytes;

	@Column(name = "disk_free_bytes")
	private Long diskFreeBytes;

	@Column(name = "uptime_seconds")
	private Long uptimeSeconds;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(name = "ip_addresses", columnDefinition = "jsonb")
	private List<String> ipAddresses = new ArrayList<>();

	@Column(name = "agent_version", length = 64)
	private String agentVersion;

	@Column(name = "collected_at")
	private Instant collectedAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected AgentHostFacts() {
	}

	public AgentHostFacts(Agent agent) {
		this.agentId = agent.getId();
	}

	@PrePersist
	@PreUpdate
	public void beforeSave() {
		updatedAt = Instant.now();
	}

	public UUID getAgentId() {
		return agentId;
	}

	public Agent getAgent() {
		return agent;
	}

	public String getHostname() {
		return hostname;
	}

	public void setHostname(String hostname) {
		this.hostname = hostname;
	}

	public String getOperatingSystem() {
		return operatingSystem;
	}

	public void setOperatingSystem(String operatingSystem) {
		this.operatingSystem = operatingSystem;
	}

	public String getPlatform() {
		return platform;
	}

	public void setPlatform(String platform) {
		this.platform = platform;
	}

	public String getKernelVersion() {
		return kernelVersion;
	}

	public void setKernelVersion(String kernelVersion) {
		this.kernelVersion = kernelVersion;
	}

	public String getArchitecture() {
		return architecture;
	}

	public void setArchitecture(String architecture) {
		this.architecture = architecture;
	}

	public Integer getCpuCount() {
		return cpuCount;
	}

	public void setCpuCount(Integer cpuCount) {
		this.cpuCount = cpuCount;
	}

	public Long getMemoryTotalBytes() {
		return memoryTotalBytes;
	}

	public void setMemoryTotalBytes(Long memoryTotalBytes) {
		this.memoryTotalBytes = memoryTotalBytes;
	}

	public Long getDiskTotalBytes() {
		return diskTotalBytes;
	}

	public void setDiskTotalBytes(Long diskTotalBytes) {
		this.diskTotalBytes = diskTotalBytes;
	}

	public Long getDiskFreeBytes() {
		return diskFreeBytes;
	}

	public void setDiskFreeBytes(Long diskFreeBytes) {
		this.diskFreeBytes = diskFreeBytes;
	}

	public Long getUptimeSeconds() {
		return uptimeSeconds;
	}

	public void setUptimeSeconds(Long uptimeSeconds) {
		this.uptimeSeconds = uptimeSeconds;
	}

	public List<String> getIpAddresses() {
		return ipAddresses == null ? List.of() : List.copyOf(ipAddresses);
	}

	public void setIpAddresses(List<String> ipAddresses) {
		this.ipAddresses = ipAddresses == null ? new ArrayList<>() : new ArrayList<>(ipAddresses);
	}

	public String getAgentVersion() {
		return agentVersion;
	}

	public void setAgentVersion(String agentVersion) {
		this.agentVersion = agentVersion;
	}

	public Instant getCollectedAt() {
		return collectedAt;
	}

	public void setCollectedAt(Instant collectedAt) {
		this.collectedAt = collectedAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
