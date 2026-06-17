package dev.kyvora.api.agent.service;

import java.util.concurrent.TimeUnit;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
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
		int markedOffline = agentService.markStaleOnlineAgentsOffline();
		if (markedOffline > 0) {
			log.warn("Agent offline detection marked {} agents offline", markedOffline);
		}
	}
}
