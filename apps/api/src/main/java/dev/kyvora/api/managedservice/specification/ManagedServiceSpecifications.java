package dev.kyvora.api.managedservice.specification;

import java.util.Collection;
import java.util.List;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import dev.kyvora.api.managedservice.dto.ManagedServiceFilter;
import dev.kyvora.api.managedservice.entity.ManagedService;
import dev.kyvora.api.managedservice.mapper.ManagedServiceMapper;
import jakarta.persistence.criteria.SetJoin;

public final class ManagedServiceSpecifications {

	private ManagedServiceSpecifications() {
	}

	public static Specification<ManagedService> byFilter(ManagedServiceFilter filter, ManagedServiceMapper mapper) {
		Specification<ManagedService> specification = (root, query, cb) -> cb.conjunction();
		if (filter == null) {
			return specification;
		}
		if (StringUtils.hasText(filter.q())) {
			specification = specification.and(searchAcrossServiceFields(filter.q()));
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
		if (filter.protocol() != null) {
			specification = specification.and((root, query, cb) -> cb.equal(root.get("protocol"), filter.protocol()));
		}
		if (filter.category() != null) {
			specification = specification.and((root, query, cb) -> cb.equal(root.get("category"), filter.category()));
		}
		if (filter.linkedServerId() != null) {
			specification = specification.and((root, query, cb) -> cb.equal(root.get("linkedServer").get("id"), filter.linkedServerId()));
		}
		if (hasTags(filter.tags())) {
			specification = specification.and(hasAnyTag(mapper.normalizeTags(filter.tags())));
		}
		return specification;
	}

	private static Specification<ManagedService> containsIgnoreCase(String field, String value) {
		String pattern = "%" + value.trim().toLowerCase() + "%";
		return (root, query, cb) -> cb.like(cb.lower(root.get(field)), pattern);
	}

	private static Specification<ManagedService> searchAcrossServiceFields(String value) {
		String pattern = "%" + value.trim().toLowerCase() + "%";
		return (root, query, cb) -> cb.or(
				cb.like(cb.lower(root.get("name")), pattern),
				cb.like(cb.lower(root.get("description")), pattern),
				cb.like(cb.lower(root.get("url")), pattern),
				cb.like(cb.lower(root.get("hostname")), pattern),
				cb.like(cb.lower(root.get("ipAddress")), pattern),
				cb.like(cb.lower(root.get("notes")), pattern));
	}

	private static boolean hasTags(Collection<String> tags) {
		return tags != null && tags.stream().anyMatch(StringUtils::hasText);
	}

	private static Specification<ManagedService> hasAnyTag(Collection<String> tags) {
		List<String> normalized = tags.stream()
				.filter(StringUtils::hasText)
				.map(String::trim)
				.map(String::toLowerCase)
				.distinct()
				.toList();
		return (root, query, cb) -> {
			query.distinct(true);
			SetJoin<ManagedService, String> tagJoin = root.joinSet("tags");
			return cb.lower(tagJoin).in(normalized);
		};
	}
}
