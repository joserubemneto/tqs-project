package ua.tqs.repository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.config.PostgresTestContainerConfig;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for UserRepository using Testcontainers with PostgreSQL.
 * 
 * These tests run against a real PostgreSQL database container to verify:
 * - Flyway migrations are applied correctly
 * - PostgreSQL-specific behavior (constraints, indexes)
 * - Repository query methods work with real SQL
 */
@SpringBootTest
@Transactional
class UserRepositoryContainerIT extends PostgresTestContainerConfig {

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("PostgreSQL Container Verification")
    class ContainerVerification {

        @Test
        @DisplayName("should connect to PostgreSQL container successfully")
        void shouldConnectToPostgresContainer() {
            assertThat(postgres.isRunning()).isTrue();
            assertThat(postgres.getDatabaseName()).isEqualTo("testdb");
        }

        @Test
        @DisplayName("should have Flyway migrations applied")
        void shouldHaveFlywayMigrationsApplied() {
            // If we can save and retrieve a user, the schema is correctly set up
            User user = User.builder()
                    .email("flyway-test@ua.pt")
                    .password("password")
                    .name("Flyway Test")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            User saved = userRepository.save(user);
            
            assertThat(saved.getId()).isNotNull();
            assertThat(userRepository.findById(saved.getId())).isPresent();
        }
    }

    @Nested
    @DisplayName("existsByEmail()")
    class ExistsByEmail {

        @Test
        @DisplayName("should return true when email exists in PostgreSQL")
        void shouldReturnTrueWhenEmailExists() {
            User user = User.builder()
                    .email("exists@ua.pt")
                    .password("password")
                    .name("Existing User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();
            userRepository.save(user);

            assertThat(userRepository.existsByEmail("exists@ua.pt")).isTrue();
        }

        @Test
        @DisplayName("should return false when email does not exist")
        void shouldReturnFalseWhenEmailDoesNotExist() {
            assertThat(userRepository.existsByEmail("nonexistent@ua.pt")).isFalse();
        }

        @Test
        @DisplayName("should be case sensitive in PostgreSQL")
        void shouldBeCaseSensitive() {
            User user = User.builder()
                    .email("CaseSensitive@ua.pt")
                    .password("password")
                    .name("Case User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();
            userRepository.save(user);

            assertThat(userRepository.existsByEmail("CaseSensitive@ua.pt")).isTrue();
            assertThat(userRepository.existsByEmail("casesensitive@ua.pt")).isFalse();
        }
    }

    @Nested
    @DisplayName("findByEmail()")
    class FindByEmail {

        @Test
        @DisplayName("should return user when email exists")
        void shouldReturnUserWhenEmailExists() {
            User user = User.builder()
                    .email("findme@ua.pt")
                    .password("encodedPassword")
                    .name("Find Me")
                    .role(UserRole.VOLUNTEER)
                    .points(100)
                    .bio("Test bio")
                    .build();
            userRepository.save(user);

            Optional<User> found = userRepository.findByEmail("findme@ua.pt");

            assertThat(found).isPresent();
            assertThat(found.get().getName()).isEqualTo("Find Me");
            assertThat(found.get().getPoints()).isEqualTo(100);
            assertThat(found.get().getBio()).isEqualTo("Test bio");
        }

        @Test
        @DisplayName("should return empty when email does not exist")
        void shouldReturnEmptyWhenEmailDoesNotExist() {
            Optional<User> found = userRepository.findByEmail("ghost@ua.pt");

            assertThat(found).isEmpty();
        }
    }

    @Nested
    @DisplayName("findByRole()")
    class FindByRole {

        @Test
        @DisplayName("should return users with specific role")
        void shouldReturnUsersWithSpecificRole() {
            User volunteer = User.builder()
                    .email("volunteer@ua.pt")
                    .password("password")
                    .name("Volunteer")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            User promoter = User.builder()
                    .email("promoter@ua.pt")
                    .password("password")
                    .name("Promoter")
                    .role(UserRole.PROMOTER)
                    .points(0)
                    .build();

            userRepository.save(volunteer);
            userRepository.save(promoter);

            List<User> volunteers = userRepository.findByRole(UserRole.VOLUNTEER);
            List<User> promoters = userRepository.findByRole(UserRole.PROMOTER);

            assertThat(volunteers).hasSize(1);
            assertThat(volunteers.get(0).getName()).isEqualTo("Volunteer");
            assertThat(promoters).hasSize(1);
            assertThat(promoters.get(0).getName()).isEqualTo("Promoter");
        }

        @Test
        @DisplayName("should return empty list when no users with role")
        void shouldReturnEmptyListWhenNoUsersWithRole() {
            List<User> admins = userRepository.findByRole(UserRole.ADMIN);

            assertThat(admins).isEmpty();
        }
    }

    @Nested
    @DisplayName("findTop10ByOrderByPointsDesc()")
    class Leaderboard {

        @Test
        @DisplayName("should return users ordered by points descending")
        void shouldReturnUsersOrderedByPointsDesc() {
            for (int i = 1; i <= 15; i++) {
                User user = User.builder()
                        .email("user" + i + "@ua.pt")
                        .password("password")
                        .name("User " + i)
                        .role(UserRole.VOLUNTEER)
                        .points(i * 10)
                        .build();
                userRepository.save(user);
            }

            List<User> leaderboard = userRepository.findTop10ByOrderByPointsDesc();

            assertThat(leaderboard).hasSize(10);
            assertThat(leaderboard.get(0).getPoints()).isEqualTo(150);
            assertThat(leaderboard.get(9).getPoints()).isEqualTo(60);
        }

        @Test
        @DisplayName("should return all users if less than 10")
        void shouldReturnAllUsersIfLessThan10() {
            for (int i = 1; i <= 5; i++) {
                User user = User.builder()
                        .email("user" + i + "@ua.pt")
                        .password("password")
                        .name("User " + i)
                        .role(UserRole.VOLUNTEER)
                        .points(i * 10)
                        .build();
                userRepository.save(user);
            }

            List<User> leaderboard = userRepository.findTop10ByOrderByPointsDesc();

            assertThat(leaderboard).hasSize(5);
        }
    }

    @Nested
    @DisplayName("Email Unique Constraint (PostgreSQL)")
    class EmailUniqueConstraint {

        @Test
        @DisplayName("should enforce unique constraint on email")
        void shouldEnforceUniqueEmail() {
            User user1 = User.builder()
                    .email("unique@ua.pt")
                    .password("password1")
                    .name("User 1")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();
            userRepository.saveAndFlush(user1);

            User user2 = User.builder()
                    .email("unique@ua.pt")
                    .password("password2")
                    .name("User 2")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            assertThatThrownBy(() -> {
                userRepository.saveAndFlush(user2);
            }).isInstanceOf(Exception.class);
        }

        @Test
        @DisplayName("should allow different emails")
        void shouldAllowDifferentEmails() {
            User user1 = User.builder()
                    .email("user1@ua.pt")
                    .password("password1")
                    .name("User 1")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            User user2 = User.builder()
                    .email("user2@ua.pt")
                    .password("password2")
                    .name("User 2")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            userRepository.save(user1);
            userRepository.save(user2);
            userRepository.flush();

            assertThat(userRepository.count()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("Timestamp Auto-generation (PostgreSQL)")
    class TimestampGeneration {

        @Test
        @DisplayName("should auto-generate createdAt timestamp")
        void shouldAutoGenerateCreatedAt() {
            User user = User.builder()
                    .email("timestamp@ua.pt")
                    .password("password")
                    .name("Timestamp User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            User saved = userRepository.saveAndFlush(user);

            assertThat(saved.getCreatedAt()).isNotNull();
        }

        @Test
        @DisplayName("should auto-generate updatedAt timestamp")
        void shouldAutoGenerateUpdatedAt() {
            User user = User.builder()
                    .email("update@ua.pt")
                    .password("password")
                    .name("Update User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            User saved = userRepository.saveAndFlush(user);

            assertThat(saved.getUpdatedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("CRUD Operations")
    class CrudOperations {

        @Test
        @DisplayName("should create and read user")
        void shouldCreateAndReadUser() {
            User user = User.builder()
                    .email("crud@ua.pt")
                    .password("encodedPassword")
                    .name("CRUD User")
                    .role(UserRole.PROMOTER)
                    .points(50)
                    .bio("A bio")
                    .build();

            User saved = userRepository.save(user);
            User found = userRepository.findById(saved.getId()).orElseThrow();

            assertThat(found.getEmail()).isEqualTo("crud@ua.pt");
            assertThat(found.getPassword()).isEqualTo("encodedPassword");
            assertThat(found.getName()).isEqualTo("CRUD User");
            assertThat(found.getRole()).isEqualTo(UserRole.PROMOTER);
            assertThat(found.getPoints()).isEqualTo(50);
            assertThat(found.getBio()).isEqualTo("A bio");
        }

        @Test
        @DisplayName("should update user")
        void shouldUpdateUser() {
            User user = User.builder()
                    .email("update-test@ua.pt")
                    .password("password")
                    .name("Original Name")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            User saved = userRepository.saveAndFlush(user);
            saved.setName("Updated Name");
            saved.setPoints(100);
            userRepository.saveAndFlush(saved);

            User found = userRepository.findById(saved.getId()).orElseThrow();
            assertThat(found.getName()).isEqualTo("Updated Name");
            assertThat(found.getPoints()).isEqualTo(100);
        }

        @Test
        @DisplayName("should delete user")
        void shouldDeleteUser() {
            User user = User.builder()
                    .email("delete@ua.pt")
                    .password("password")
                    .name("Delete User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            User saved = userRepository.save(user);
            Long id = saved.getId();

            userRepository.delete(saved);
            userRepository.flush();

            assertThat(userRepository.findById(id)).isEmpty();
        }
    }
}
