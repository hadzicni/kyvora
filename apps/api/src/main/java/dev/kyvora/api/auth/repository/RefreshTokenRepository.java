package dev.kyvora.api.auth.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import dev.kyvora.api.auth.entity.RefreshToken;
import dev.kyvora.api.auth.entity.User;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

	Optional<RefreshToken> findByTokenHash(String tokenHash);

	void deleteByUser(User user);
}
