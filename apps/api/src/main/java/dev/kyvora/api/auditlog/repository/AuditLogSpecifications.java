package dev.kyvora.api.auditlog.repository;

import org.springframework.data.jpa.domain.Specification;

import dev.kyvora.api.auditlog.dto.AuditLogFilter;
import dev.kyvora.api.auditlog.entity.AuditLog;

public final class AuditLogSpecifications {

	private AuditLogSpecifications() {
	}

	public static Specification<AuditLog> byFilter(AuditLogFilter filter) {
		return Specification
				.where(hasAggregateType(filter.aggregateType()))
				.and(hasAggregateId(filter.aggregateId()))
				.and(hasEventType(filter.eventType()));
	}

	private static Specification<AuditLog> hasAggregateType(String aggregateType) {
		return (root, query, criteriaBuilder) -> {
			if (aggregateType == null || aggregateType.isBlank()) {
				return criteriaBuilder.conjunction();
			}
			return criteriaBuilder.equal(root.get("aggregateType"), aggregateType);
		};
	}

	private static Specification<AuditLog> hasAggregateId(Object aggregateId) {
		return (root, query, criteriaBuilder) -> {
			if (aggregateId == null) {
				return criteriaBuilder.conjunction();
			}
			return criteriaBuilder.equal(root.get("aggregateId"), aggregateId);
		};
	}

	private static Specification<AuditLog> hasEventType(Object eventType) {
		return (root, query, criteriaBuilder) -> {
			if (eventType == null) {
				return criteriaBuilder.conjunction();
			}
			return criteriaBuilder.equal(root.get("eventType"), eventType);
		};
	}
}
