package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import ua.tqs.dto.UserPageResponse;
import ua.tqs.dto.UserResponse;
import ua.tqs.exception.SelfRoleChangeException;
import ua.tqs.exception.UserNotFoundException;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.UserRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AdminService adminService;

    private User testUser1;
    private User testUser2;
    private User adminUser;

    @BeforeEach
    void setUp() {
        testUser1 = User.builder()
                .id(1L)
                .email("volunteer@ua.pt")
                .password("encoded")
                .name("Volunteer User")
                .role(UserRole.VOLUNTEER)
                .points(100)
                .build();

        testUser2 = User.builder()
                .id(2L)
                .email("promoter@ua.pt")
                .password("encoded")
                .name("Promoter User")
                .role(UserRole.PROMOTER)
                .points(50)
                .build();

        adminUser = User.builder()
                .id(3L)
                .email("admin@ua.pt")
                .password("encoded")
                .name("Admin User")
                .role(UserRole.ADMIN)
                .points(0)
                .build();
    }

    @Nested
    @DisplayName("getUsers()")
    class GetUsersMethod {

        @Test
        @DisplayName("should return paginated users without filters")
        void shouldReturnPaginatedUsers() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(testUser1, testUser2), pageable, 2);
            when(userRepository.findAll(pageable)).thenReturn(userPage);

            // Act
            UserPageResponse response = adminService.getUsers(pageable, null, null);

            // Assert
            assertThat(response.getUsers()).hasSize(2);
            assertThat(response.getTotalElements()).isEqualTo(2);
            assertThat(response.getCurrentPage()).isEqualTo(0);
            assertThat(response.getTotalPages()).isEqualTo(1);
            verify(userRepository).findAll(pageable);
        }

        @Test
        @DisplayName("should filter users by search term")
        void shouldFilterBySearchTerm() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(testUser1), pageable, 1);
            when(userRepository.findByNameOrEmailContaining("volunteer", pageable)).thenReturn(userPage);

            // Act
            UserPageResponse response = adminService.getUsers(pageable, "volunteer", null);

            // Assert
            assertThat(response.getUsers()).hasSize(1);
            assertThat(response.getUsers().get(0).getEmail()).isEqualTo("volunteer@ua.pt");
            verify(userRepository).findByNameOrEmailContaining("volunteer", pageable);
        }

        @Test
        @DisplayName("should filter users by role")
        void shouldFilterByRole() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(testUser2), pageable, 1);
            when(userRepository.findByRole(UserRole.PROMOTER, pageable)).thenReturn(userPage);

            // Act
            UserPageResponse response = adminService.getUsers(pageable, null, UserRole.PROMOTER);

            // Assert
            assertThat(response.getUsers()).hasSize(1);
            assertThat(response.getUsers().get(0).getRole()).isEqualTo(UserRole.PROMOTER);
            verify(userRepository).findByRole(UserRole.PROMOTER, pageable);
        }

        @Test
        @DisplayName("should filter users by search and role combined")
        void shouldFilterBySearchAndRole() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(testUser2), pageable, 1);
            when(userRepository.findByRoleAndNameOrEmailContaining(UserRole.PROMOTER, "promoter", pageable))
                    .thenReturn(userPage);

            // Act
            UserPageResponse response = adminService.getUsers(pageable, "promoter", UserRole.PROMOTER);

            // Assert
            assertThat(response.getUsers()).hasSize(1);
            verify(userRepository).findByRoleAndNameOrEmailContaining(UserRole.PROMOTER, "promoter", pageable);
        }

        @Test
        @DisplayName("should return empty page when no users match")
        void shouldReturnEmptyPageWhenNoMatch() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            when(userRepository.findByNameOrEmailContaining("nonexistent", pageable)).thenReturn(emptyPage);

            // Act
            UserPageResponse response = adminService.getUsers(pageable, "nonexistent", null);

            // Assert
            assertThat(response.getUsers()).isEmpty();
            assertThat(response.getTotalElements()).isEqualTo(0);
        }

        @Test
        @DisplayName("should map User to UserResponse correctly")
        void shouldMapUserToUserResponse() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(testUser1), pageable, 1);
            when(userRepository.findAll(pageable)).thenReturn(userPage);

            // Act
            UserPageResponse response = adminService.getUsers(pageable, null, null);

            // Assert
            UserResponse userResponse = response.getUsers().get(0);
            assertThat(userResponse.getId()).isEqualTo(testUser1.getId());
            assertThat(userResponse.getEmail()).isEqualTo(testUser1.getEmail());
            assertThat(userResponse.getName()).isEqualTo(testUser1.getName());
            assertThat(userResponse.getRole()).isEqualTo(testUser1.getRole());
            assertThat(userResponse.getPoints()).isEqualTo(testUser1.getPoints());
        }

        @Test
        @DisplayName("should trim search term before searching")
        void shouldTrimSearchTerm() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(testUser1), pageable, 1);
            when(userRepository.findByNameOrEmailContaining("volunteer", pageable)).thenReturn(userPage);

            // Act
            UserPageResponse response = adminService.getUsers(pageable, "  volunteer  ", null);

            // Assert
            verify(userRepository).findByNameOrEmailContaining("volunteer", pageable);
        }

        @Test
        @DisplayName("should treat empty search string as no search")
        void shouldTreatEmptySearchAsNoSearch() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<User> userPage = new PageImpl<>(List.of(testUser1, testUser2), pageable, 2);
            when(userRepository.findAll(pageable)).thenReturn(userPage);

            // Act
            UserPageResponse response = adminService.getUsers(pageable, "   ", null);

            // Assert
            verify(userRepository).findAll(pageable);
            verify(userRepository, never()).findByNameOrEmailContaining(any(), any());
        }
    }

    @Nested
    @DisplayName("updateUserRole()")
    class UpdateUserRoleMethod {

        @Test
        @DisplayName("should update user role successfully")
        void shouldUpdateUserRoleSuccessfully() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser1));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            UserResponse response = adminService.updateUserRole(1L, UserRole.PROMOTER, 3L);

            // Assert
            assertThat(response.getRole()).isEqualTo(UserRole.PROMOTER);
            verify(userRepository).findById(1L);
            verify(userRepository).save(argThat(user -> user.getRole() == UserRole.PROMOTER));
        }

        @Test
        @DisplayName("should throw SelfRoleChangeException when admin tries to change own role")
        void shouldThrowExceptionWhenChangingOwnRole() {
            // Act & Assert
            assertThatThrownBy(() -> adminService.updateUserRole(3L, UserRole.VOLUNTEER, 3L))
                    .isInstanceOf(SelfRoleChangeException.class)
                    .hasMessageContaining("cannot change your own role");

            verify(userRepository, never()).findById(any());
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw UserNotFoundException when user does not exist")
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> adminService.updateUserRole(999L, UserRole.ADMIN, 1L))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessageContaining("999");

            verify(userRepository).findById(999L);
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("should allow changing user role to ADMIN")
        void shouldAllowChangingToAdmin() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser1));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            UserResponse response = adminService.updateUserRole(1L, UserRole.ADMIN, 3L);

            // Assert
            assertThat(response.getRole()).isEqualTo(UserRole.ADMIN);
        }

        @Test
        @DisplayName("should allow changing user role from ADMIN to another role")
        void shouldAllowChangingFromAdmin() {
            // Arrange
            User anotherAdmin = User.builder()
                    .id(4L)
                    .email("admin2@ua.pt")
                    .password("encoded")
                    .name("Another Admin")
                    .role(UserRole.ADMIN)
                    .build();

            when(userRepository.findById(4L)).thenReturn(Optional.of(anotherAdmin));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            UserResponse response = adminService.updateUserRole(4L, UserRole.VOLUNTEER, 3L);

            // Assert
            assertThat(response.getRole()).isEqualTo(UserRole.VOLUNTEER);
        }

        @Test
        @DisplayName("should return correct UserResponse after update")
        void shouldReturnCorrectUserResponse() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser1));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            UserResponse response = adminService.updateUserRole(1L, UserRole.PARTNER, 3L);

            // Assert
            assertThat(response.getId()).isEqualTo(testUser1.getId());
            assertThat(response.getEmail()).isEqualTo(testUser1.getEmail());
            assertThat(response.getName()).isEqualTo(testUser1.getName());
            assertThat(response.getRole()).isEqualTo(UserRole.PARTNER);
            assertThat(response.getPoints()).isEqualTo(testUser1.getPoints());
        }
    }
}
