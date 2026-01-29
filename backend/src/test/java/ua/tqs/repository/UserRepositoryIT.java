package ua.tqs.repository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserRepositoryIT {

    @Autowired
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        userRepository.deleteAll();
    }

    @Nested
    @DisplayName("existsByEmail()")
    class ExistsByEmail {

        @Test
        @DisplayName("should return true when email exists")
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
        @DisplayName("should be case sensitive")
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
                    .password("password")
                    .name("Find Me")
                    .role(UserRole.VOLUNTEER)
                    .points(100)
                    .build();
            userRepository.save(user);

            Optional<User> found = userRepository.findByEmail("findme@ua.pt");

            assertThat(found).isPresent();
            assertThat(found.get().getName()).isEqualTo("Find Me");
            assertThat(found.get().getPoints()).isEqualTo(100);
        }

        @Test
        @DisplayName("should return empty when email does not exist")
        void shouldReturnEmptyWhenEmailDoesNotExist() {
            Optional<User> found = userRepository.findByEmail("ghost@ua.pt");

            assertThat(found).isEmpty();
        }
    }

    @Nested
    @DisplayName("Email Unique Constraint")
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
            userRepository.save(user1);
            userRepository.flush();

            User user2 = User.builder()
                    .email("unique@ua.pt")
                    .password("password2")
                    .name("User 2")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            assertThatThrownBy(() -> {
                userRepository.save(user2);
                userRepository.flush();
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
    @DisplayName("save()")
    class SaveMethod {

        @Test
        @DisplayName("should generate id on save")
        void shouldGenerateIdOnSave() {
            User user = User.builder()
                    .email("newuser@ua.pt")
                    .password("password")
                    .name("New User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            User saved = userRepository.save(user);

            assertThat(saved.getId()).isNotNull();
        }

        @Test
        @DisplayName("should set createdAt timestamp")
        void shouldSetCreatedAtTimestamp() {
            User user = User.builder()
                    .email("timestamp@ua.pt")
                    .password("password")
                    .name("Timestamp User")
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();

            User saved = userRepository.save(user);
            userRepository.flush();

            assertThat(saved.getCreatedAt()).isNotNull();
        }

        @Test
        @DisplayName("should persist all user fields")
        void shouldPersistAllFields() {
            User user = User.builder()
                    .email("complete@ua.pt")
                    .password("encodedPassword")
                    .name("Complete User")
                    .role(UserRole.PROMOTER)
                    .points(50)
                    .bio("A short bio")
                    .build();

            User saved = userRepository.save(user);
            userRepository.flush();

            User found = userRepository.findById(saved.getId()).orElseThrow();
            assertThat(found.getEmail()).isEqualTo("complete@ua.pt");
            assertThat(found.getPassword()).isEqualTo("encodedPassword");
            assertThat(found.getName()).isEqualTo("Complete User");
            assertThat(found.getRole()).isEqualTo(UserRole.PROMOTER);
            assertThat(found.getPoints()).isEqualTo(50);
            assertThat(found.getBio()).isEqualTo("A short bio");
        }
    }
}
