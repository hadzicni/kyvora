package dev.kyvora.api.settings.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.kyvora.api.settings.entity.SystemSetting;

public interface SystemSettingRepository extends JpaRepository<SystemSetting, String> {
}
