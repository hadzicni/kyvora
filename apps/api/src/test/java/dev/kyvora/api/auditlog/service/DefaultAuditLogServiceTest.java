package dev.kyvora.api.auditlog.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
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
import dev.kyvora.api.auth.security.CurrentUserProvider;

class DefaultAuditLogServiceTest {

	private final AuditLogRepository repository = org.mockito.Mockito.mock(AuditLogRepository.class);
	private final AuditLogMapper mapper = org.mockito.Mockito.mock(AuditLogMapper.class);
	private final CurrentUserProvider currentUserProvider = org.mockito.Mockito.mock(CurrentUserProvider.class);
	private final DefaultAuditLogService service = new DefaultAuditLogService(repository, mapper, currentUserProvider);

	@Test
	void pullEventsUseCurrentActor() {
		when(currentUserProvider.currentActor()).thenReturn("system");
		UUID agentId = UUID.randomUUID();
		AgentChangedEvent event = new AgentChangedEvent(
				AgentEventType.AGENT_PULL_SUCCEEDED,
				agentId,
				"Agent 01",
				null,
				"0.1.0",
				AgentStatus.ONLINE,
				Instant.now(),
				null,
				null,
				null,
				Instant.now());

		service.recordAgentChange(event);

		ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
		verify(repository).save(captor.capture());
		assertThat(captor.getValue().getActor()).isEqualTo("system");
	}

	@Test
	void nonHeartbeatAgentEventsKeepCurrentActor() {
		when(currentUserProvider.currentActor()).thenReturn("system");
		AgentChangedEvent event = new AgentChangedEvent(
				AgentEventType.AGENT_CONFIGURED,
				UUID.randomUUID(),
				"Agent 01",
				"node01.example.com",
				"0.1.0",
				AgentStatus.UNKNOWN,
				null,
				null,
				null,
				null,
				Instant.now());

		service.recordAgentChange(event);

		ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
		verify(repository).save(captor.capture());
		assertThat(captor.getValue().getActor()).isEqualTo("system");
	}
}
