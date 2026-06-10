package dev.kyvora.api.managedservice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import dev.kyvora.api.managedservice.entity.ManagedService;

import java.util.UUID;

public interface ManagedServiceRepository extends JpaRepository<ManagedService, UUID>, JpaSpecificationExecutor<ManagedService> {
}
