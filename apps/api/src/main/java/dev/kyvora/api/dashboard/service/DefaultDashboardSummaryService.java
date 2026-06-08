package dev.kyvora.api.dashboard.service;

import java.time.Instant;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.dashboard.dto.DashboardSummaryResponse;
import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@Service
@Transactional(readOnly = true)
public class DefaultDashboardSummaryService implements DashboardSummaryService {

	private final ServerInventoryRepository repository;

	public DefaultDashboardSummaryService(ServerInventoryRepository repository) {
		this.repository = repository;
	}

	@Override
	public DashboardSummaryResponse getSummary() {
		return new DashboardSummaryResponse(
				repository.count(),
				repository.countByStatus(ServerStatus.ONLINE),
				repository.countByStatus(ServerStatus.OFFLINE),
				repository.countByStatus(ServerStatus.UNKNOWN),
				Instant.now());
	}
}
