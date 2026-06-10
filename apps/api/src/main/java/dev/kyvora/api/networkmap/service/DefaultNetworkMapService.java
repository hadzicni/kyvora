package dev.kyvora.api.networkmap.service;

import java.net.Inet4Address;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import dev.kyvora.api.agent.entity.Agent;
import dev.kyvora.api.agent.entity.AgentHostFacts;
import dev.kyvora.api.agent.repository.AgentRepository;
import dev.kyvora.api.networkmap.dto.NetworkMapEdgeResponse;
import dev.kyvora.api.networkmap.dto.NetworkMapNodeResponse;
import dev.kyvora.api.networkmap.dto.NetworkMapNodeSource;
import dev.kyvora.api.networkmap.dto.NetworkMapNodeType;
import dev.kyvora.api.networkmap.dto.NetworkMapResponse;
import dev.kyvora.api.networkmap.dto.NetworkMapSubnetResponse;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.entity.ServerStatus;
import dev.kyvora.api.serverinventory.repository.ServerInventoryRepository;

@Service
@Transactional(readOnly = true)
public class DefaultNetworkMapService implements NetworkMapService {

	private static final String UNKNOWN_SUBNET_ID = "subnet-unknown";
	private static final String UNKNOWN_SUBNET_LABEL = "Unassigned subnet";

	private final ServerInventoryRepository serverRepository;
	private final AgentRepository agentRepository;

	public DefaultNetworkMapService(ServerInventoryRepository serverRepository, AgentRepository agentRepository) {
		this.serverRepository = serverRepository;
		this.agentRepository = agentRepository;
	}

	@Override
	public NetworkMapResponse getNetworkMap() {
		Map<UUID, Agent> agentsByServerId = agentsByServerId();
		Map<String, SubnetBuilder> subnets = new LinkedHashMap<>();
		List<NetworkMapNodeResponse> serverNodes = new ArrayList<>();

		for (ServerInventory server : serverRepository.findAll()) {
			Agent agent = agentsByServerId.get(server.getId());
			AgentHostFacts facts = agent == null ? null : agent.getHostFacts();
			String primaryIp = choosePrimaryIp(server, facts);
			SubnetDescriptor subnet = subnetFor(primaryIp);
			SubnetBuilder subnetBuilder = subnets.computeIfAbsent(subnet.id(), key -> new SubnetBuilder(subnet));
			subnetBuilder.nodeCount++;

			serverNodes.add(toServerNode(server, facts, subnet.id(), primaryIp));
		}

		List<NetworkMapNodeResponse> nodes = new ArrayList<>();
		List<NetworkMapEdgeResponse> edges = new ArrayList<>();

		for (SubnetBuilder subnet : subnets.values()) {
			NetworkMapNodeResponse gateway = toGatewayNode(subnet.descriptor);
			nodes.add(gateway);
			for (NetworkMapNodeResponse serverNode : serverNodes.stream()
					.filter(node -> node.subnetId().equals(subnet.descriptor.id()))
					.sorted(Comparator.comparing(NetworkMapNodeResponse::ipAddress, Comparator.nullsLast(String::compareTo)))
					.toList()) {
				nodes.add(serverNode);
				edges.add(new NetworkMapEdgeResponse(
						"edge-" + gateway.id() + "-" + serverNode.id(),
						gateway.id(),
						serverNode.id(),
						"subnet"));
			}
		}

		List<NetworkMapSubnetResponse> subnetResponses = subnets.values().stream()
				.map(subnet -> new NetworkMapSubnetResponse(
						subnet.descriptor.id(),
						subnet.descriptor.cidr(),
						subnet.descriptor.label(),
						subnet.nodeCount))
				.toList();

		return new NetworkMapResponse(subnetResponses, nodes, edges, Instant.now());
	}

	private Map<UUID, Agent> agentsByServerId() {
		Map<UUID, Agent> agentsByServerId = new LinkedHashMap<>();
		for (Agent agent : agentRepository.findAllLinkedWithHostFacts()) {
			if (agent.getServer() != null) {
				agentsByServerId.put(agent.getServer().getId(), agent);
			}
		}
		return agentsByServerId;
	}

	private NetworkMapNodeResponse toServerNode(
			ServerInventory server,
			AgentHostFacts facts,
			String subnetId,
			String primaryIp) {
		List<String> factIps = facts == null ? List.of() : facts.getIpAddresses();
		String hostname = firstNonBlank(facts == null ? null : facts.getHostname(), server.getHostname());
		String operatingSystem = firstNonBlank(facts == null ? null : facts.getOperatingSystem(), server.getOperatingSystem());

		return new NetworkMapNodeResponse(
				"server-" + server.getId(),
				NetworkMapNodeType.SERVER,
				NetworkMapNodeSource.INVENTORY,
				subnetId,
				server.getId().toString(),
				server.getName(),
				hostname,
				primaryIp,
				hostname,
				server.getStatus(),
				operatingSystem,
				factIps,
				server.getTags(),
				List.of(),
				List.of(),
				server.getLastSeenAt());
	}

	private NetworkMapNodeResponse toGatewayNode(SubnetDescriptor subnet) {
		return new NetworkMapNodeResponse(
				"gateway-" + subnet.id(),
				NetworkMapNodeType.GATEWAY,
				NetworkMapNodeSource.INFERRED,
				subnet.id(),
				null,
				subnet.gatewayLabel(),
				null,
				subnet.gatewayIp(),
				null,
				ServerStatus.UNKNOWN,
				null,
				List.of(),
				List.of(),
				List.of(),
				List.of(),
				null);
	}

	private String choosePrimaryIp(ServerInventory server, AgentHostFacts facts) {
		if (isPresent(server.getIpAddress())) {
			return server.getIpAddress().trim();
		}
		if (facts == null) {
			return null;
		}
		return facts.getIpAddresses().stream().filter(this::isPresent).findFirst().orElse(null);
	}

	private SubnetDescriptor subnetFor(String ipAddress) {
		if (!isPresent(ipAddress)) {
			return new SubnetDescriptor(
					UNKNOWN_SUBNET_ID,
					UNKNOWN_SUBNET_LABEL,
					UNKNOWN_SUBNET_LABEL,
					null,
					"Gateway");
		}

		try {
			InetAddress parsed = InetAddress.getByName(ipAddress);
			if (parsed instanceof Inet4Address) {
				byte[] octets = parsed.getAddress();
				int first = Byte.toUnsignedInt(octets[0]);
				int second = Byte.toUnsignedInt(octets[1]);
				int third = Byte.toUnsignedInt(octets[2]);
				String cidr = first + "." + second + "." + third + ".0/24";
				String gatewayIp = first + "." + second + "." + third + ".1";
				String id = "subnet-" + first + "-" + second + "-" + third + "-0-24";
				return new SubnetDescriptor(id, cidr, cidr, gatewayIp, "Gateway " + gatewayIp);
			}
		} catch (UnknownHostException exception) {
			return new SubnetDescriptor(
					UNKNOWN_SUBNET_ID,
					UNKNOWN_SUBNET_LABEL,
					UNKNOWN_SUBNET_LABEL,
					null,
					"Gateway");
		}

		String normalized = ipAddress.trim().replace(':', '-');
		return new SubnetDescriptor(
				"subnet-ipv6-" + normalized,
				ipAddress + "/64",
				ipAddress + "/64",
				null,
				"Gateway");
	}

	private String firstNonBlank(String first, String fallback) {
		return isPresent(first) ? first.trim() : fallback;
	}

	private boolean isPresent(String value) {
		return value != null && !value.isBlank();
	}

	private record SubnetDescriptor(String id, String cidr, String label, String gatewayIp, String gatewayLabel) {
	}

	private static final class SubnetBuilder {
		private final SubnetDescriptor descriptor;
		private int nodeCount;

		private SubnetBuilder(SubnetDescriptor descriptor) {
			this.descriptor = descriptor;
		}
	}
}
