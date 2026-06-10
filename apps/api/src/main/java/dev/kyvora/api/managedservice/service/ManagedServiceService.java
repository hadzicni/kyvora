package dev.kyvora.api.managedservice.service;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import dev.kyvora.api.managedservice.dto.ManagedServiceCreateRequest;
import dev.kyvora.api.managedservice.dto.ManagedServiceFilter;
import dev.kyvora.api.managedservice.dto.ManagedServiceResponse;
import dev.kyvora.api.managedservice.dto.ManagedServiceUpdateRequest;

public interface ManagedServiceService {

	Page<ManagedServiceResponse> findAll(ManagedServiceFilter filter, Pageable pageable);

	ManagedServiceResponse findById(UUID id);

	ManagedServiceResponse create(ManagedServiceCreateRequest request);

	ManagedServiceResponse update(UUID id, ManagedServiceUpdateRequest request);

	void delete(UUID id);
}
