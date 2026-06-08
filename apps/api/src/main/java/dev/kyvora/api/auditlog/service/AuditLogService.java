package dev.kyvora.api.auditlog.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import dev.kyvora.api.auditlog.dto.AuditLogFilter;
import dev.kyvora.api.auditlog.dto.AuditLogResponse;
import dev.kyvora.api.agent.event.AgentChangedEvent;
import dev.kyvora.api.serverinventory.event.ServerInventoryChangedEvent;

public interface AuditLogService {

	Page<AuditLogResponse> findAll(AuditLogFilter filter, Pageable pageable);

	void recordServerInventoryChange(ServerInventoryChangedEvent event);

	void recordAgentChange(AgentChangedEvent event);
}
