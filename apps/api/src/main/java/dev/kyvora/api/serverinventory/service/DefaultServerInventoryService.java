package dev.kyvora.api.serverinventory.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.serverinventory.dto.ServerInventoryCreateRequest;
import dev.kyvora.api.serverinventory.dto.ServerInventoryResponse;
import dev.kyvora.api.serverinventory.dto.ServerInventoryUpdateRequest;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.exception.ServerInventoryNotFoundException;
import dev.kyvora.api.serverinventory.mapper.ServerInventoryMapper;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@Service
@Transactional
public class DefaultServerInventoryService implements ServerInventoryService {

	private final ServerInventoryRepository repository;
	private final ServerInventoryMapper mapper;

	public DefaultServerInventoryService(ServerInventoryRepository repository, ServerInventoryMapper mapper) {
		this.repository = repository;
		this.mapper = mapper;
	}

	@Override
	@Transactional(readOnly = true)
	public List<ServerInventoryResponse> findAll() {
		return mapper.toResponses(repository.findAll());
	}

	@Override
	@Transactional(readOnly = true)
	public ServerInventoryResponse findById(UUID id) {
		return mapper.toResponse(getRequiredEntity(id));
	}

	@Override
	public ServerInventoryResponse create(ServerInventoryCreateRequest request) {
		ServerInventory saved = repository.save(mapper.toEntity(request));
		return mapper.toResponse(saved);
	}

	@Override
	public ServerInventoryResponse update(UUID id, ServerInventoryUpdateRequest request) {
		ServerInventory entity = getRequiredEntity(id);
		mapper.updateEntity(entity, request);
		return mapper.toResponse(repository.save(entity));
	}

	@Override
	public void delete(UUID id) {
		ServerInventory entity = getRequiredEntity(id);
		repository.delete(entity);
	}

	private ServerInventory getRequiredEntity(UUID id) {
		return repository.findById(id).orElseThrow(() -> new ServerInventoryNotFoundException(id));
	}
}
