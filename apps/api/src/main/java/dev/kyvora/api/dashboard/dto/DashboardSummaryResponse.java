package dev.kyvora.api.dashboard.dto;

import java.time.Instant;

public record DashboardSummaryResponse(
		long totalServers,
		long onlineServers,
		long offlineServers,
		long unknownServers,
		Instant generatedAt) {
}
