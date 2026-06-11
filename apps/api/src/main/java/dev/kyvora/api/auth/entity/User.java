package dev.kyvora.api.auth.entity;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, unique = true, length = 320)
	private String email;

	@Column(name = "password_hash", nullable = false)
	private String passwordHash;

	@Column(name = "display_name", nullable = false, length = 120)
	private String displayName;

	@ElementCollection(fetch = FetchType.EAGER)
	@CollectionTable(name = "user_permissions", joinColumns = @JoinColumn(name = "user_id"))
	@Enumerated(EnumType.STRING)
	@Column(name = "permission", nullable = false, length = 64)
	private Set<UserPermission> permissions = EnumSet.noneOf(UserPermission.class);

	@Column(nullable = false)
	private boolean enabled = true;

	@Column(name = "must_change_password", nullable = false)
	private boolean mustChangePassword = false;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@Column(name = "last_login_at")
	private Instant lastLoginAt;

	protected User() {
	}

	public User(String email, String passwordHash, String displayName, Set<UserPermission> permissions, boolean enabled) {
		this.email = email;
		this.passwordHash = passwordHash;
		this.displayName = displayName;
		setPermissions(permissions);
		this.enabled = enabled;
	}

	@PrePersist
	void beforeCreate() {
		Instant now = Instant.now();
		if (createdAt == null) {
			createdAt = now;
		}
		if (updatedAt == null) {
			updatedAt = now;
		}
	}

	@PreUpdate
	void beforeUpdate() {
		updatedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public String getEmail() {
		return email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public String getDisplayName() {
		return displayName;
	}

	public Set<UserPermission> getPermissions() {
		return Set.copyOf(permissions);
	}

	public boolean isEnabled() {
		return enabled;
	}

	public boolean isMustChangePassword() {
		return mustChangePassword;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public Instant getLastLoginAt() {
		return lastLoginAt;
	}

	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public void setPermissions(Set<UserPermission> permissions) {
		this.permissions = permissions == null || permissions.isEmpty()
				? EnumSet.noneOf(UserPermission.class)
				: EnumSet.copyOf(permissions);
	}

	public void setEnabled(boolean enabled) {
		this.enabled = enabled;
	}

	public void setMustChangePassword(boolean mustChangePassword) {
		this.mustChangePassword = mustChangePassword;
	}

	public void markLoginSuccessful() {
		this.lastLoginAt = Instant.now();
	}
}
