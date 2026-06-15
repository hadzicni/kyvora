package dev.kyvora.api.auditlog.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.kyvora.api.auditlog.entity.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog> {

	@Query("""
			select auditLog
			from AuditLog auditLog
			where lower(auditLog.actor) like lower(concat('%', :query, '%'))
				or lower(auditLog.message) like lower(concat('%', :query, '%'))
				or lower(auditLog.aggregateType) like lower(concat('%', :query, '%'))
			""")
	List<AuditLog> search(@Param("query") String query, Pageable pageable);
}
