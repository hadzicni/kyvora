package dev.kyvora.api.serverinventory.repository;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.entity.ServerStatus;
import java.util.List;

public interface ServerInventoryRepository extends JpaRepository<ServerInventory, UUID>, JpaSpecificationExecutor<ServerInventory> {

	long countByStatus(ServerStatus status);

	boolean existsByHostnameIgnoreCase(String hostname);

	boolean existsByHostnameIgnoreCaseAndIdNot(String hostname, UUID id);

	boolean existsByIpAddress(String ipAddress);

	boolean existsByIpAddressAndIdNot(String ipAddress, UUID id);

	@Query("""
			select distinct server
			from ServerInventory server
			left join server.tags tag
			where lower(server.name) like lower(concat('%', :query, '%'))
				or lower(server.hostname) like lower(concat('%', :query, '%'))
				or lower(server.ipAddress) like lower(concat('%', :query, '%'))
				or lower(coalesce(server.operatingSystem, '')) like lower(concat('%', :query, '%'))
				or lower(coalesce(tag, '')) like lower(concat('%', :query, '%'))
			""")
	List<ServerInventory> search(@Param("query") String query, Pageable pageable);
}
