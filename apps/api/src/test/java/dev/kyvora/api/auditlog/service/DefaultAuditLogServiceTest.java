package dev.kyvora.api.auditlog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import dev.kyvora.api.agent.entity.AgentStatus;
import dev.kyvora.api.agent.event.AgentChangedEvent;
import dev.kyvora.api.agent.event.AgentEventType;
import dev.kyvora.api.auditlog.entity.AuditLog;
import dev.kyvora.api.auditlog.mapper.AuditLogMapper;
import dev.kyvora.api.auditlog.repository.AuditLogRepository;

class DefaultAuditLogServiceTest {

	private final AuditLogRepository repository = org.mockito.Mockito.mock(AuditLogRepository.class);
	private final AuditLogMapper mapper = org.mockito.Mockito.mock(AuditLogMapper.class);
	private final DefaultAuditLogService service = new DefaultAuditLogService(repository, mapper);

	@Test
	void heartbeatActorFallsBackToAgentIdWhenHostnameIsUnknown() {
		UUID agentId = UUID.randomUUID();
		AgentChangedEvent event = new AgentChangedEvent(
				AgentEventType.AGENT_HEARTBEAT_RECEIVED,
				agentId,
				"Agent 01",
				null,
				"0.1.0",
				AgentStatus.ONLINE,
				Instant.now(),
				Instant.now());

		service.recordAgentChange(event);

		ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
		verify(repository).save(captor.capture());
		assertThat(captor.getValue().getActor()).isEqualTo("agent:" + agentId);
	}

	@Test
	void nonHeartbeatAgentEventsKeepCurrentActor() {
		AgentChangedEvent event = new AgentChangedEvent(
				AgentEventType.AGENT_REGISTERED,
				UUID.randomUUID(),
				"Agent 01",
				"node01.example.com",
				"0.1.0",
				AgentStatus.PENDING,
				null,
				Instant.now());

		service.recordAgentChange(event);

		ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
		verify(repository).save(captor.capture());
		assertThat(captor.getValue().getActor()).isEqualTo("system");
	}
}
