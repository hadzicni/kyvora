package dev.kyvora.api.settings.dto;

import java.time.Instant;

import dev.kyvora.api.settings.entity.SettingValueType;

public record SettingItemResponse(
		String key,
		Object value,
		SettingValueType valueType,
		String description,
		Instant updatedAt,
		String updatedBy) {
}
