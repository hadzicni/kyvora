package dev.kyvora.api.serverinventory.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import dev.kyvora.api.serverinventory.entity.ServerInventory;

public interface ServerInventoryRepository extends JpaRepository<ServerInventory, UUID>, JpaSpecificationExecutor<ServerInventory> {

	boolean existsByHostnameIgnoreCase(String hostname);

	boolean existsByHostnameIgnoreCaseAndIdNot(String hostname, UUID id);

	boolean existsByIpAddress(String ipAddress);

	boolean existsByIpAddressAndIdNot(String ipAddress, UUID id);
}
