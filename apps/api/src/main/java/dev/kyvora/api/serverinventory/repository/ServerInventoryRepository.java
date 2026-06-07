package dev.kyvora.api.serverinventory.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.kyvora.api.serverinventory.entity.ServerInventory;

public interface ServerInventoryRepository extends JpaRepository<ServerInventory, UUID> {
}
