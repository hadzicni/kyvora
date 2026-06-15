package dev.kyvora.api.auth.repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import dev.kyvora.api.auth.entity.User;
import dev.kyvora.api.auth.entity.UserPermission;

public interface UserRepository extends JpaRepository<User, UUID> {

	Optional<User> findByEmailIgnoreCase(String email);

	boolean existsByEmailIgnoreCase(String email);

	@Query("select count(u) from User u join u.permissions p where p = :permission and u.enabled = true")
	long countEnabledUsersWithPermission(UserPermission permission);

	@Query("""
			select user
			from User user
			where lower(user.displayName) like lower(concat('%', :query, '%'))
				or lower(user.email) like lower(concat('%', :query, '%'))
			""")
	List<User> search(@Param("query") String query, Pageable pageable);
}
