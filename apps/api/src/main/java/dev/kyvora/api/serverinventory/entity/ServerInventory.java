package dev.kyvora.api.serverinventory.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "server_inventory")
public class ServerInventory {

	@Id
	@GeneratedValue
	private UUID id;

	@Column(nullable = false, length = 120)
	private String name;

	@Column(nullable = false, length = 253, unique = true)
	private String hostname;

	@Column(name = "ip_address", nullable = false, length = 45)
	private String ipAddress;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 16)
	private ServerStatus status;

	protected ServerInventory() {
	}

	public ServerInventory(String name, String hostname, String ipAddress, ServerStatus status) {
		this.name = name;
		this.hostname = hostname;
		this.ipAddress = ipAddress;
		this.status = status;
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

	public ServerStatus getStatus() {
		return status;
	}

	public void setStatus(ServerStatus status) {
		this.status = status;
	}
}
