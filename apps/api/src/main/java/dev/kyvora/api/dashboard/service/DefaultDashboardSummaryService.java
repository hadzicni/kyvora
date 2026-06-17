package dev.kyvora.api.dashboard.service;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.dashboard.dto.DashboardSummaryResponse;
import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional(readOnly = true)
@Slf4j
public class DefaultDashboardSummaryService implements DashboardSummaryService {

	private final ServerInventoryRepository repository;

	public DefaultDashboardSummaryService(ServerInventoryRepository repository) {
		this.repository = repository;
	}

	@Override
	public DashboardSummaryResponse getSummary() {
		log.debug("Building dashboard summary");
		return new DashboardSummaryResponse(
				repository.count(),
				repository.countByStatus(ServerStatus.ONLINE),
				repository.countByStatus(ServerStatus.OFFLINE),
				repository.countByStatus(ServerStatus.UNKNOWN),
				Instant.now());
	}
}
