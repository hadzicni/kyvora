package dev.kyvora.api.managedservice.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.kyvora.api.managedservice.entity.ManagedService;

public interface ManagedServiceRepository extends JpaRepository<ManagedService, UUID>, JpaSpecificationExecutor<ManagedService> {

	@Query("""
			select distinct service
			from ManagedService service
			left join service.tags tag
			where lower(service.name) like lower(concat('%', :query, '%'))
				or lower(coalesce(service.description, '')) like lower(concat('%', :query, '%'))
				or lower(coalesce(service.url, '')) like lower(concat('%', :query, '%'))
				or lower(coalesce(service.hostname, '')) like lower(concat('%', :query, '%'))
				or lower(coalesce(service.ipAddress, '')) like lower(concat('%', :query, '%'))
				or lower(coalesce(tag, '')) like lower(concat('%', :query, '%'))
			""")
	List<ManagedService> search(@Param("query") String query, Pageable pageable);
}
