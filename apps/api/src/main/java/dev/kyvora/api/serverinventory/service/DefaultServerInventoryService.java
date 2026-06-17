package dev.kyvora.api.serverinventory.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.agent.repository.AgentRepository;
import dev.kyvora.api.auditlog.service.AuditLogService;
import dev.kyvora.api.auth.security.AuthenticatedUser;
import dev.kyvora.api.auth.security.CurrentUserProvider;
import dev.kyvora.api.notification.dto.CreateNotificationCommand;
import dev.kyvora.api.notification.entity.NotificationSeverity;
import dev.kyvora.api.notification.service.NotificationService;
import dev.kyvora.api.serverinventory.dto.ServerInventoryCreateRequest;
import dev.kyvora.api.serverinventory.dto.ServerInventoryFilter;
import dev.kyvora.api.serverinventory.dto.ServerInventoryResponse;
import dev.kyvora.api.serverinventory.dto.ServerInventoryUpdateRequest;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.event.ServerInventoryChangedEvent;
import dev.kyvora.api.serverinventory.event.ServerInventoryEventType;
import dev.kyvora.api.serverinventory.exception.DuplicateServerInventoryException;
import dev.kyvora.api.serverinventory.exception.ServerInventoryNotFoundException;
import dev.kyvora.api.serverinventory.mapper.ServerInventoryMapper;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;
import dev.kyvora.api.serverinventory.specification.ServerInventorySpecifications;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@Slf4j
public class DefaultServerInventoryService implements ServerInventoryService {

	private final ServerInventoryRepository repository;
	private final AgentRepository agentRepository;
	private final ServerInventoryMapper mapper;
	private final AuditLogService auditLogService;
	private final NotificationService notificationService;
	private final CurrentUserProvider currentUserProvider;

	public DefaultServerInventoryService(
			ServerInventoryRepository repository,
			AgentRepository agentRepository,
			ServerInventoryMapper mapper,
			AuditLogService auditLogService,
			NotificationService notificationService,
			CurrentUserProvider currentUserProvider) {
		this.repository = repository;
		this.agentRepository = agentRepository;
		this.mapper = mapper;
		this.auditLogService = auditLogService;
		this.notificationService = notificationService;
		this.currentUserProvider = currentUserProvider;
	}

	@Override
	@Transactional(readOnly = true)
	public Page<ServerInventoryResponse> findAll(ServerInventoryFilter filter, Pageable pageable) {
		return repository.findAll(ServerInventorySpecifications.byFilter(filter, mapper), pageable).map(mapper::toResponse);
	}

	@Override
	@Transactional(readOnly = true)
	public ServerInventoryResponse findById(UUID id) {
		ServerInventory server = getRequiredEntity(id);
		return mapper.toResponse(
				server,
				agentRepository.findByServerId(id).map(agent -> agent.getHostFacts()).orElse(null));
	}

	@Override
	public ServerInventoryResponse create(ServerInventoryCreateRequest request) {
		validateUniqueFields(request.hostname(), request.ipAddress(), null);
		ServerInventory saved = repository.save(mapper.toEntity(request));
		handleInventoryEvent(ServerInventoryChangedEvent.from(ServerInventoryEventType.SERVER_CREATED, saved));
		log.info("Created server inventory item {}", saved.getId());
		notifyCurrentUser(
				"Server created",
				saved.getName() + " was added to inventory.",
				NotificationSeverity.SUCCESS,
				saved);
		return mapper.toResponse(saved);
	}

	@Override
	public ServerInventoryResponse update(UUID id, ServerInventoryUpdateRequest request) {
		ServerInventory entity = getRequiredEntity(id);
		validateUniqueFields(request.hostname(), request.ipAddress(), id);
		mapper.updateEntity(entity, request);
		ServerInventory saved = repository.save(entity);
		handleInventoryEvent(ServerInventoryChangedEvent.from(ServerInventoryEventType.SERVER_UPDATED, saved));
		log.info("Updated server inventory item {}", saved.getId());
		return mapper.toResponse(saved);
	}

	@Override
	public void delete(UUID id) {
		ServerInventory entity = getRequiredEntity(id);
		handleInventoryEvent(ServerInventoryChangedEvent.from(ServerInventoryEventType.SERVER_DELETED, entity));
		notifyCurrentUser(
				"Server deleted",
				entity.getName() + " was removed from inventory.",
				NotificationSeverity.INFO,
				entity);
		repository.delete(entity);
		log.info("Deleted server inventory item {}", id);
	}

	private void handleInventoryEvent(ServerInventoryChangedEvent event) {
		auditLogService.recordServerInventoryChange(event);
	}

	private ServerInventory getRequiredEntity(UUID id) {
		return repository.findById(id).orElseThrow(() -> new ServerInventoryNotFoundException(id));
	}

	private void notifyCurrentUser(
			String title,
			String message,
			NotificationSeverity severity,
			ServerInventory server) {
		AuthenticatedUser principal = currentPrincipal();
		if (principal == null) {
			log.debug("Skipping notification '{}' because no authenticated user is available", title);
			return;
		}

		notificationService.create(new CreateNotificationCommand(
				principal.id(),
				title,
				message,
				severity,
				"SERVER",
				server.getId().toString(),
				"/servers/" + server.getId(),
				true));
	}

	private AuthenticatedUser currentPrincipal() {
		return currentUserProvider.currentPrincipal();
	}

	private void validateUniqueFields(String hostname, String ipAddress, UUID id) {
		if (id == null) {
			if (repository.existsByHostnameIgnoreCase(hostname)) {
				log.warn("Server inventory create rejected because hostname already exists");
				throw new DuplicateServerInventoryException("hostname", hostname);
			}
			if (repository.existsByIpAddress(ipAddress)) {
				log.warn("Server inventory create rejected because IP address already exists");
				throw new DuplicateServerInventoryException("ipAddress", ipAddress);
			}
			return;
		}

		if (repository.existsByHostnameIgnoreCaseAndIdNot(hostname, id)) {
			log.warn("Server inventory update rejected for {} because hostname already exists", id);
			throw new DuplicateServerInventoryException("hostname", hostname);
		}
		if (repository.existsByIpAddressAndIdNot(ipAddress, id)) {
			log.warn("Server inventory update rejected for {} because IP address already exists", id);
			throw new DuplicateServerInventoryException("ipAddress", ipAddress);
		}
	}
}
