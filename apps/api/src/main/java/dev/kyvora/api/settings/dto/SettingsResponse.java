package dev.kyvora.api.settings.dto;

import java.util.List;

public record SettingsResponse(List<SettingItemResponse> settings) {
}
