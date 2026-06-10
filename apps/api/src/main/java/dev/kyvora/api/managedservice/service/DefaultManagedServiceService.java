package dev.kyvora.api.managedservice.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.managedservice.dto.ManagedServiceCreateRequest;
import dev.kyvora.api.managedservice.dto.ManagedServiceFilter;
import dev.kyvora.api.managedservice.dto.ManagedServiceResponse;
import dev.kyvora.api.managedservice.dto.ManagedServiceUpdateRequest;
import dev.kyvora.api.managedservice.entity.ManagedService;
import dev.kyvora.api.managedservice.exception.ManagedServiceNotFoundException;
import dev.kyvora.api.managedservice.mapper.ManagedServiceMapper;
import dev.kyvora.api.managedservice.repository.ManagedServiceRepository;
import dev.kyvora.api.managedservice.specification.ManagedServiceSpecifications;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.exception.ServerInventoryNotFoundException;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@Service
@Transactional
public class DefaultManagedServiceService implements ManagedServiceService {

	private final ManagedServiceRepository repository;
	private final ServerInventoryRepository serverInventoryRepository;
	private final ManagedServiceMapper mapper;

	public DefaultManagedServiceService(
			ManagedServiceRepository repository,
			ServerInventoryRepository serverInventoryRepository,
			ManagedServiceMapper mapper) {
		this.repository = repository;
		this.serverInventoryRepository = serverInventoryRepository;
		this.mapper = mapper;
	}

	@Override
	@Transactional(readOnly = true)
	public Page<ManagedServiceResponse> findAll(ManagedServiceFilter filter, Pageable pageable) {
		return repository.findAll(ManagedServiceSpecifications.byFilter(filter, mapper), pageable).map(mapper::toResponse);
	}

	@Override
	@Transactional(readOnly = true)
	public ManagedServiceResponse findById(UUID id) {
		return mapper.toResponse(getRequiredEntity(id));
	}

	@Override
	public ManagedServiceResponse create(ManagedServiceCreateRequest request) {
		ServerInventory linkedServer = resolveLinkedServer(request.linkedServerId());
		ManagedService saved = repository.save(mapper.toEntity(request, linkedServer));
		return mapper.toResponse(saved);
	}

	@Override
	public ManagedServiceResponse update(UUID id, ManagedServiceUpdateRequest request) {
		ManagedService entity = getRequiredEntity(id);
		ServerInventory linkedServer = resolveLinkedServer(request.linkedServerId());
		mapper.updateEntity(entity, request, linkedServer);
		return mapper.toResponse(repository.save(entity));
	}

	@Override
	public void delete(UUID id) {
		repository.delete(getRequiredEntity(id));
	}

	private ManagedService getRequiredEntity(UUID id) {
		return repository.findById(id).orElseThrow(() -> new ManagedServiceNotFoundException(id));
	}

	private ServerInventory resolveLinkedServer(UUID linkedServerId) {
		if (linkedServerId == null) {
			return null;
		}
		return serverInventoryRepository.findById(linkedServerId)
				.orElseThrow(() -> new ServerInventoryNotFoundException(linkedServerId));
	}
}
