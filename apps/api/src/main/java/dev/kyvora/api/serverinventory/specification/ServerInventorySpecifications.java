package dev.kyvora.api.serverinventory.specification;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import dev.kyvora.api.serverinventory.dto.ServerInventoryFilter;
import dev.kyvora.api.serverinventory.entity.ServerInventory;
import dev.kyvora.api.serverinventory.mapper.ServerInventoryMapper;
import jakarta.persistence.criteria.SetJoin;

public final class ServerInventorySpecifications {

	private ServerInventorySpecifications() {
	}

	public static Specification<ServerInventory> byFilter(ServerInventoryFilter filter, ServerInventoryMapper mapper) {
		Specification<ServerInventory> specification = (root, query, cb) -> cb.conjunction();
		if (filter == null) {
			return specification;
		}
		if (StringUtils.hasText(filter.q())) {
			specification = specification.and(searchAcrossInventoryFields(filter.q()));
		}
		if (StringUtils.hasText(filter.name())) {
			specification = specification.and(containsIgnoreCase("name", filter.name()));
		}
		if (StringUtils.hasText(filter.hostname())) {
			specification = specification.and(containsIgnoreCase("hostname", mapper.normalizeHostname(filter.hostname())));
		}
		if (StringUtils.hasText(filter.ipAddress())) {
			specification = specification.and(containsIgnoreCase("ipAddress", filter.ipAddress()));
		}
		if (filter.status() != null) {
			specification = specification.and((root, query, cb) -> cb.equal(root.get("status"), filter.status()));
		}
		if (hasTags(filter.tags())) {
			specification = specification.and(hasAnyTag(mapper.normalizeTags(filter.tags())));
		}
		return specification;
	}

	private static Specification<ServerInventory> containsIgnoreCase(String field, String value) {
		String pattern = "%" + value.trim().toLowerCase() + "%";
		return (root, query, cb) -> cb.like(cb.lower(root.get(field)), pattern);
	}

	private static Specification<ServerInventory> searchAcrossInventoryFields(String value) {
		String pattern = "%" + value.trim().toLowerCase() + "%";
		return (root, query, cb) -> cb.or(
				cb.like(cb.lower(root.get("name")), pattern),
				cb.like(cb.lower(root.get("hostname")), pattern),
				cb.like(cb.lower(root.get("ipAddress")), pattern));
	}

	private static boolean hasTags(Collection<String> tags) {
		return tags != null && tags.stream().anyMatch(StringUtils::hasText);
	}

	private static Specification<ServerInventory> hasAnyTag(Collection<String> tags) {
		List<String> normalized = tags.stream()
				.filter(StringUtils::hasText)
				.map(String::trim)
				.map(String::toLowerCase)
				.distinct()
				.toList();
		return (root, query, cb) -> {
			query.distinct(true);
			SetJoin<ServerInventory, String> tagJoin = root.joinSet("tags");
			return cb.lower(tagJoin).in(normalized);
		};
	}
}
