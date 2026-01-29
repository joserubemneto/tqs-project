package ua.tqs.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.dto.CreateRewardRequest;
import ua.tqs.dto.RewardResponse;
import ua.tqs.dto.UpdateRewardRequest;
import ua.tqs.exception.PartnerNotFoundException;
import ua.tqs.exception.RewardNotFoundException;
import ua.tqs.exception.RewardValidationException;
import ua.tqs.model.Partner;
import ua.tqs.model.Reward;
import ua.tqs.repository.PartnerRepository;
import ua.tqs.repository.RedemptionRepository;
import ua.tqs.repository.RewardRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RewardService {

    private final RewardRepository rewardRepository;
    private final PartnerRepository partnerRepository;
    private final RedemptionRepository redemptionRepository;

    /**
     * Create a new reward (admin only).
     */
    @Transactional
    public RewardResponse createReward(CreateRewardRequest request) {
        // Validate dates if both are provided
        if (request.getAvailableFrom() != null && request.getAvailableUntil() != null) {
            if (request.getAvailableUntil().isBefore(request.getAvailableFrom()) ||
                request.getAvailableUntil().isEqual(request.getAvailableFrom())) {
                throw new RewardValidationException("Available until date must be after available from date");
            }
        }

        // Get partner if provided
        Partner partner = null;
        if (request.getPartnerId() != null) {
            partner = partnerRepository.findById(request.getPartnerId())
                    .orElseThrow(() -> new PartnerNotFoundException(request.getPartnerId()));
        }

        // Build the reward entity
        Reward reward = Reward.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .pointsCost(request.getPointsCost())
                .type(request.getType())
                .partner(partner)
                .quantity(request.getQuantity())
                .active(true)
                .availableFrom(request.getAvailableFrom())
                .availableUntil(request.getAvailableUntil())
                .build();

        Reward savedReward = rewardRepository.save(reward);
        log.info("Created reward '{}' (id: {})", savedReward.getTitle(), savedReward.getId());

        return RewardResponse.fromReward(savedReward, 0L);
    }

    /**
     * Update an existing reward (admin only).
     */
    @Transactional
    public RewardResponse updateReward(Long rewardId, UpdateRewardRequest request) {
        Reward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new RewardNotFoundException(rewardId));

        // Apply updates only for non-null fields
        if (request.getTitle() != null) {
            reward.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            reward.setDescription(request.getDescription());
        }
        if (request.getPointsCost() != null) {
            reward.setPointsCost(request.getPointsCost());
        }
        if (request.getType() != null) {
            reward.setType(request.getType());
        }
        if (request.getQuantity() != null) {
            reward.setQuantity(request.getQuantity());
        }
        if (request.getActive() != null) {
            reward.setActive(request.getActive());
        }

        // Handle partner update
        if (request.getPartnerId() != null) {
            Partner partner = partnerRepository.findById(request.getPartnerId())
                    .orElseThrow(() -> new PartnerNotFoundException(request.getPartnerId()));
            reward.setPartner(partner);
        }

        // Handle date updates with validation
        LocalDateTime newAvailableFrom = request.getAvailableFrom() != null ? 
                request.getAvailableFrom() : reward.getAvailableFrom();
        LocalDateTime newAvailableUntil = request.getAvailableUntil() != null ? 
                request.getAvailableUntil() : reward.getAvailableUntil();

        if (newAvailableFrom != null && newAvailableUntil != null) {
            if (newAvailableUntil.isBefore(newAvailableFrom) || 
                newAvailableUntil.isEqual(newAvailableFrom)) {
                throw new RewardValidationException("Available until date must be after available from date");
            }
        }

        if (request.getAvailableFrom() != null) {
            reward.setAvailableFrom(request.getAvailableFrom());
        }
        if (request.getAvailableUntil() != null) {
            reward.setAvailableUntil(request.getAvailableUntil());
        }

        Reward savedReward = rewardRepository.save(reward);
        log.info("Updated reward '{}' (id: {})", savedReward.getTitle(), savedReward.getId());

        long redemptionCount = redemptionRepository.countByReward(savedReward);
        return RewardResponse.fromReward(savedReward, redemptionCount);
    }

    /**
     * Get a single reward by ID.
     */
    @Transactional(readOnly = true)
    public RewardResponse getRewardById(Long rewardId) {
        Reward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new RewardNotFoundException(rewardId));
        log.debug("Retrieved reward '{}' (id: {})", reward.getTitle(), rewardId);

        long redemptionCount = redemptionRepository.countByReward(reward);
        return RewardResponse.fromReward(reward, redemptionCount);
    }

    /**
     * Get all rewards (admin view with pagination).
     */
    @Transactional(readOnly = true)
    public Page<RewardResponse> getAllRewards(Pageable pageable) {
        Page<Reward> rewards = rewardRepository.findAll(pageable);
        log.debug("Retrieved {} rewards", rewards.getTotalElements());

        return rewards.map(reward -> {
            long redemptionCount = redemptionRepository.countByReward(reward);
            return RewardResponse.fromReward(reward, redemptionCount);
        });
    }

    /**
     * Get available rewards for volunteers (active, within date range, with remaining quantity).
     */
    @Transactional(readOnly = true)
    public List<RewardResponse> getAvailableRewards() {
        LocalDateTime now = LocalDateTime.now();
        List<Reward> rewards = rewardRepository.findAvailableRewards(now);
        log.debug("Retrieved {} available rewards", rewards.size());

        return rewards.stream()
                .map(reward -> {
                    long redemptionCount = redemptionRepository.countByReward(reward);
                    return RewardResponse.fromReward(reward, redemptionCount);
                })
                .filter(response -> response.getRemainingQuantity() == null || response.getRemainingQuantity() > 0)
                .collect(Collectors.toList());
    }

    /**
     * Deactivate a reward (soft delete).
     */
    @Transactional
    public void deactivateReward(Long rewardId) {
        Reward reward = rewardRepository.findById(rewardId)
                .orElseThrow(() -> new RewardNotFoundException(rewardId));

        reward.setActive(false);
        rewardRepository.save(reward);
        log.info("Deactivated reward '{}' (id: {})", reward.getTitle(), rewardId);
    }
}
