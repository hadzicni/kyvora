package dev.kyvora.api.serverinventory.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.agent.repository.AgentRepository;
import dev.kyvora.api.auditlog.service.AuditLogService;
import dev.kyvora.api.serverinventory.dto.ServerInventoryCreateRequest;
import dev.kyvora.api.serverinventory.dto.ServerInventoryFilter;
import dev.kyvora.api.serverinventory.dto.ServerInventorySearchRequest;
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

@Service
@Transactional
public class DefaultServerInventoryService implements ServerInventoryService {

	private final ServerInventoryRepository repository;
	private final AgentRepository agentRepository;
	private final ServerInventoryMapper mapper;
	private final AuditLogService auditLogService;

	public DefaultServerInventoryService(
			ServerInventoryRepository repository,
			AgentRepository agentRepository,
			ServerInventoryMapper mapper,
			AuditLogService auditLogService) {
		this.repository = repository;
		this.agentRepository = agentRepository;
		this.mapper = mapper;
		this.auditLogService = auditLogService;
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
		return mapper.toResponse(saved);
	}

	@Override
	public ServerInventoryResponse update(UUID id, ServerInventoryUpdateRequest request) {
		ServerInventory entity = getRequiredEntity(id);
		validateUniqueFields(request.hostname(), request.ipAddress(), id);
		mapper.updateEntity(entity, request);
		ServerInventory saved = repository.save(entity);
		handleInventoryEvent(ServerInventoryChangedEvent.from(ServerInventoryEventType.SERVER_UPDATED, saved));
		return mapper.toResponse(saved);
	}

	@Override
	public void delete(UUID id) {
		ServerInventory entity = getRequiredEntity(id);
		handleInventoryEvent(ServerInventoryChangedEvent.from(ServerInventoryEventType.SERVER_DELETED, entity));
		repository.delete(entity);
	}

	private void handleInventoryEvent(ServerInventoryChangedEvent event) {
		auditLogService.recordServerInventoryChange(event);
	}

	private ServerInventory getRequiredEntity(UUID id) {
		return repository.findById(id).orElseThrow(() -> new ServerInventoryNotFoundException(id));
	}

	private void validateUniqueFields(String hostname, String ipAddress, UUID id) {
		if (id == null) {
			if (repository.existsByHostnameIgnoreCase(hostname)) {
				throw new DuplicateServerInventoryException("hostname", hostname);
			}
			if (repository.existsByIpAddress(ipAddress)) {
				throw new DuplicateServerInventoryException("ipAddress", ipAddress);
			}
			return;
		}

		if (repository.existsByHostnameIgnoreCaseAndIdNot(hostname, id)) {
			throw new DuplicateServerInventoryException("hostname", hostname);
		}
		if (repository.existsByIpAddressAndIdNot(ipAddress, id)) {
			throw new DuplicateServerInventoryException("ipAddress", ipAddress);
		}
	}
}
