package dev.kyvora.api.agent.service;

import java.util.concurrent.TimeUnit;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class AgentOfflineDetectionJob {

	private final AgentService agentService;

	public AgentOfflineDetectionJob(AgentService agentService) {
		this.agentService = agentService;
	}

	@Scheduled(
			initialDelayString = "${kyvora.agent.offline-check-interval-seconds:30}",
			fixedDelayString = "${kyvora.agent.offline-check-interval-seconds:30}",
			timeUnit = TimeUnit.SECONDS)
	public void markStaleAgentsOffline() {
		agentService.markStaleOnlineAgentsOffline();
	}
}
