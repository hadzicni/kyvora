package dev.kyvora.api.auth.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.entity.UserPermission;

public interface UserRepository extends JpaRepository<User, UUID> {

	Optional<User> findByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCase(String email);

	@Query("select count(u) from User u join u.permissions p where p = :permission and u.enabled = true")
	long countEnabledUsersWithPermission(UserPermission permission);
}
