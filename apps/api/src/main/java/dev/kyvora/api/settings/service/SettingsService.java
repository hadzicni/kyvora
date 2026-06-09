package dev.kyvora.api.settings.service;

import dev.kyvora.api.settings.dto.SettingsResponse;
import dev.kyvora.api.settings.dto.UpdateSettingsRequest;

public interface SettingsService {

	SettingsResponse findAll();

	SettingsResponse update(UpdateSettingsRequest request);

	long getLongSettingOrDefault(String key, long fallback);
}
