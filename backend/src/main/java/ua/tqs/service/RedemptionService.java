package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.dto.RedemptionResponse;
import ua.tqs.exception.InsufficientPointsException;
import ua.tqs.exception.RewardNotAvailableException;
import ua.tqs.exception.RewardNotFoundException;
import ua.tqs.exception.UserNotFoundException;
import ua.tqs.model.Redemption;
import ua.tqs.model.Reward;
import ua.tqs.model.User;
import ua.tqs.repository.RedemptionRepository;
import ua.tqs.repository.RewardRepository;
import ua.tqs.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedemptionService {

    private final RedemptionRepository redemptionRepository;
    private final RewardRepository rewardRepository;
    private final UserRepository userRepository;

    /**
     * Redeem a reward for the current user.
     * Validates that user has enough points and reward is available.
     */
    @Transactional
    public RedemptionResponse redeemReward(Long userId, Long rewardId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Reward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new RewardNotFoundException(rewardId));

        // Check if reward is active
        if (!reward.getActive()) {
            throw new RewardNotAvailableException("This reward is no longer active");
        }

        // Check date availability
        LocalDateTime now = LocalDateTime.now();
        if (reward.getAvailableFrom() != null && now.isBefore(reward.getAvailableFrom())) {
            throw new RewardNotAvailableException("This reward is not yet available");
        }
        if (reward.getAvailableUntil() != null && now.isAfter(reward.getAvailableUntil())) {
            throw new RewardNotAvailableException("This reward is no longer available");
        }

        // Check quantity availability
        if (reward.getQuantity() != null) {
            long redemptionCount = redemptionRepository.countByReward(reward);
            if (redemptionCount >= reward.getQuantity()) {
                throw new RewardNotAvailableException("This reward is out of stock");
            }
        }

        // Check if user has enough points
        if (user.getPoints() < reward.getPointsCost()) {
            throw new InsufficientPointsException(
                    "You need " + reward.getPointsCost() + " points but only have " + user.getPoints());
        }

        // Deduct points from user
        user.setPoints(user.getPoints() - reward.getPointsCost());
        userRepository.save(user);

        // Create redemption
        Redemption redemption = Redemption.builder()
                .user(user)
                .reward(reward)
                .pointsSpent(reward.getPointsCost())
                .build();

        Redemption savedRedemption = redemptionRepository.save(redemption);
        log.info("User {} redeemed reward '{}' for {} points. Code: {}", 
                userId, reward.getTitle(), reward.getPointsCost(), savedRedemption.getCode());

        return RedemptionResponse.fromRedemption(savedRedemption);
    }

    /**
     * Get all redemptions for a user.
     */
    @Transactional(readOnly = true)
    public List<RedemptionResponse> getUserRedemptions(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        List<Redemption> redemptions = redemptionRepository.findByUserOrderByRedeemedAtDesc(user);
        log.debug("Retrieved {} redemptions for user {}", redemptions.size(), userId);

        return redemptions.stream()
                .map(RedemptionResponse::fromRedemption)
                .collect(Collectors.toList());
    }

    /**
     * Get total points spent by a user.
     */
    @Transactional(readOnly = true)
    public Long getTotalPointsSpent(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException(userId));

        Long total = redemptionRepository.sumPointsSpentByUser(user);
        return total != null ? total : 0L;
    }
}
