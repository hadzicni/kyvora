package dev.kyvora.api.settings.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "system_settings")
public class SystemSetting {

	@Id
	@Column(name = "\"key\"", nullable = false, length = 120)
	private String key;

	@Column(name = "\"value\"", nullable = false, columnDefinition = "text")
	private String value;

	@Enumerated(EnumType.STRING)
	@Column(name = "value_type", length = 32)
	private SettingValueType valueType;

	@Column(columnDefinition = "text")
	private String description;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@Column(name = "updated_by", length = 120)
	private String updatedBy;

	protected SystemSetting() {
	}

	public SystemSetting(String key, String value, SettingValueType valueType, String description) {
		this.key = key;
		this.value = value;
		this.valueType = valueType;
		this.description = description;
	}

	@PrePersist
	@PreUpdate
	public void beforeSave() {
		updatedAt = Instant.now();
	}

	public String getKey() {
		return key;
	}

	public String getValue() {
		return value;
	}

	public void setValue(String value) {
		this.value = value;
	}

	public SettingValueType getValueType() {
		return valueType;
	}

	public String getDescription() {
		return description;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public String getUpdatedBy() {
		return updatedBy;
	}

	public void setUpdatedBy(String updatedBy) {
		this.updatedBy = updatedBy;
	}
}
