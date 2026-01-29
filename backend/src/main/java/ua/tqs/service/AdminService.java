package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.dto.UserPageResponse;
import ua.tqs.dto.UserResponse;
import ua.tqs.exception.SelfRoleChangeException;
import ua.tqs.exception.UserNotFoundException;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.UserRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;

    /**
     * Get paginated list of users with optional search and role filter.
     */
    @Transactional(readOnly = true)
    public UserPageResponse getUsers(Pageable pageable, String search, UserRole roleFilter) {
        Page<User> userPage;

        boolean hasSearch = search != null && !search.trim().isEmpty();
        boolean hasRoleFilter = roleFilter != null;

        if (hasSearch && hasRoleFilter) {
            userPage = userRepository.findByRoleAndNameOrEmailContaining(roleFilter, search.trim(), pageable);
        } else if (hasSearch) {
            userPage = userRepository.findByNameOrEmailContaining(search.trim(), pageable);
        } else if (hasRoleFilter) {
            userPage = userRepository.findByRole(roleFilter, pageable);
        } else {
            userPage = userRepository.findAll(pageable);
        }

        List<UserResponse> users = userPage.getContent().stream()
                .map(UserResponse::fromUser)
                .toList();

        return UserPageResponse.builder()
                .users(users)
                .currentPage(userPage.getNumber())
                .totalPages(userPage.getTotalPages())
                .totalElements(userPage.getTotalElements())
                .pageSize(userPage.getSize())
                .hasNext(userPage.hasNext())
                .hasPrevious(userPage.hasPrevious())
                .build();
    }

    /**
     * Update a user's role. Prevents admin from changing their own role.
     */
    @Transactional
    public UserResponse updateUserRole(Long userId, UserRole newRole, Long currentUserId) {
        // Prevent self role change
        if (userId.equals(currentUserId)) {
            log.warn("Admin {} attempted to change their own role", currentUserId);
            throw new SelfRoleChangeException("You cannot change your own role to prevent lockout");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        UserRole oldRole = user.getRole();
        user.setRole(newRole);
        User savedUser = userRepository.save(user);

        log.info("User {} role changed from {} to {} by admin {}", userId, oldRole, newRole, currentUserId);

        return UserResponse.fromUser(savedUser);
    }
}
