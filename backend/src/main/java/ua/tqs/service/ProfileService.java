package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.dto.ProfileResponse;
import ua.tqs.dto.SkillResponse;
import ua.tqs.dto.UpdateProfileRequest;
import ua.tqs.exception.UserNotFoundException;
import ua.tqs.model.Skill;
import ua.tqs.model.User;
import ua.tqs.model.enums.SkillCategory;
import ua.tqs.repository.SkillRepository;
import ua.tqs.repository.UserRepository;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final SkillRepository skillRepository;

    /**
     * Get the current user's profile including their skills.
     */
    @Transactional(readOnly = true)
    public ProfileResponse getCurrentUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        log.debug("Retrieved profile for user {}", userId);
        return ProfileResponse.fromUser(user);
    }

    /**
     * Update the current user's profile (name, bio, skills).
     */
    @Transactional
    public ProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        // Update name
        user.setName(request.getName());

        // Update bio (can be null or empty)
        user.setBio(request.getBio());

        // Update skills if provided
        if (request.getSkillIds() != null) {
            Set<Skill> newSkills = new HashSet<>();
            for (Long skillId : request.getSkillIds()) {
                skillRepository.findById(skillId)
                        .ifPresent(newSkills::add);
            }
            user.setSkills(newSkills);
        }

        User savedUser = userRepository.save(user);
        log.info("Profile updated for user {}", userId);

        return ProfileResponse.fromUser(savedUser);
    }

    /**
     * Get all available skills.
     */
    @Transactional(readOnly = true)
    public List<SkillResponse> getAllSkills() {
        return skillRepository.findAll().stream()
                .map(SkillResponse::fromSkill)
                .collect(Collectors.toList());
    }

    /**
     * Get skills filtered by category.
     */
    @Transactional(readOnly = true)
    public List<SkillResponse> getSkillsByCategory(SkillCategory category) {
        return skillRepository.findByCategory(category).stream()
                .map(SkillResponse::fromSkill)
                .collect(Collectors.toList());
    }
}
