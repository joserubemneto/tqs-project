package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.tqs.dto.RedemptionResponse;
import ua.tqs.exception.InsufficientPointsException;
import ua.tqs.exception.RewardNotAvailableException;
import ua.tqs.exception.RewardNotFoundException;
import ua.tqs.exception.UserNotFoundException;
import ua.tqs.model.Partner;
import ua.tqs.model.Redemption;
import ua.tqs.model.Reward;
import ua.tqs.model.User;
import ua.tqs.model.enums.RewardType;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.RedemptionRepository;
import ua.tqs.repository.RewardRepository;
import ua.tqs.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RedemptionServiceTest {

    @Mock
    private RedemptionRepository redemptionRepository;

    @Mock
    private RewardRepository rewardRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RedemptionService redemptionService;

    private User volunteer;
    private Reward reward;
    private Partner partner;
    private Redemption redemption;

    @BeforeEach
    void setUp() {
        partner = Partner.builder()
                .id(1L)
                .name("UA Cafeteria")
                .description("University cafeteria partner")
                .active(true)
                .build();

        volunteer = User.builder()
                .id(1L)
                .name("Test Volunteer")
                .email("volunteer@ua.pt")
                .password("password")
                .role(UserRole.VOLUNTEER)
                .points(100)
                .createdAt(LocalDateTime.now())
                .build();

        reward = Reward.builder()
                .id(1L)
                .title("Free Coffee")
                .description("Get a free coffee")
                .pointsCost(50)
                .type(RewardType.PARTNER_VOUCHER)
                .partner(partner)
                .quantity(10)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        redemption = Redemption.builder()
                .id(1L)
                .user(volunteer)
                .reward(reward)
                .code("ABC12345")
                .pointsSpent(50)
                .redeemedAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("redeemReward()")
    class RedeemRewardMethod {

        @Test
        @DisplayName("should successfully redeem reward with sufficient points")
        void shouldRedeemRewardWithSufficientPoints() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(rewardRepository.findById(1L)).thenReturn(Optional.of(reward));
            when(redemptionRepository.countByReward(reward)).thenReturn(0L);
            when(userRepository.save(any(User.class))).thenReturn(volunteer);
            when(redemptionRepository.save(any(Redemption.class))).thenReturn(redemption);

            // Act
            RedemptionResponse response = redemptionService.redeemReward(1L, 1L);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getCode()).isEqualTo("ABC12345");
            assertThat(response.getPointsSpent()).isEqualTo(50);
            assertThat(response.getReward()).isNotNull();
            assertThat(response.getReward().getTitle()).isEqualTo("Free Coffee");
            
            verify(userRepository).save(argThat(user -> user.getPoints() == 50));
            verify(redemptionRepository).save(any(Redemption.class));
        }

        @Test
        @DisplayName("should throw UserNotFoundException when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> redemptionService.redeemReward(999L, 1L))
                    .isInstanceOf(UserNotFoundException.class);
        }

        @Test
        @DisplayName("should throw RewardNotFoundException when reward not found")
        void shouldThrowExceptionWhenRewardNotFound() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(rewardRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> redemptionService.redeemReward(1L, 999L))
                    .isInstanceOf(RewardNotFoundException.class);
        }

        @Test
        @DisplayName("should throw RewardNotAvailableException when reward is inactive")
        void shouldThrowExceptionWhenRewardInactive() {
            // Arrange
            reward.setActive(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(rewardRepository.findById(1L)).thenReturn(Optional.of(reward));

            // Act & Assert
            assertThatThrownBy(() -> redemptionService.redeemReward(1L, 1L))
                    .isInstanceOf(RewardNotAvailableException.class)
                    .hasMessageContaining("no longer active");
        }

        @Test
        @DisplayName("should throw RewardNotAvailableException when reward not yet available")
        void shouldThrowExceptionWhenRewardNotYetAvailable() {
            // Arrange
            reward.setAvailableFrom(LocalDateTime.now().plusDays(7));
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(rewardRepository.findById(1L)).thenReturn(Optional.of(reward));

            // Act & Assert
            assertThatThrownBy(() -> redemptionService.redeemReward(1L, 1L))
                    .isInstanceOf(RewardNotAvailableException.class)
                    .hasMessageContaining("not yet available");
        }

        @Test
        @DisplayName("should throw RewardNotAvailableException when reward expired")
        void shouldThrowExceptionWhenRewardExpired() {
            // Arrange
            reward.setAvailableUntil(LocalDateTime.now().minusDays(1));
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(rewardRepository.findById(1L)).thenReturn(Optional.of(reward));

            // Act & Assert
            assertThatThrownBy(() -> redemptionService.redeemReward(1L, 1L))
                    .isInstanceOf(RewardNotAvailableException.class)
                    .hasMessageContaining("no longer available");
        }

        @Test
        @DisplayName("should throw RewardNotAvailableException when reward out of stock")
        void shouldThrowExceptionWhenRewardOutOfStock() {
            // Arrange
            reward.setQuantity(10);
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(rewardRepository.findById(1L)).thenReturn(Optional.of(reward));
            when(redemptionRepository.countByReward(reward)).thenReturn(10L);

            // Act & Assert
            assertThatThrownBy(() -> redemptionService.redeemReward(1L, 1L))
                    .isInstanceOf(RewardNotAvailableException.class)
                    .hasMessageContaining("out of stock");
        }

        @Test
        @DisplayName("should throw InsufficientPointsException when user has insufficient points")
        void shouldThrowExceptionWhenInsufficientPoints() {
            // Arrange
            volunteer.setPoints(30); // Less than reward cost of 50
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(rewardRepository.findById(1L)).thenReturn(Optional.of(reward));
            when(redemptionRepository.countByReward(reward)).thenReturn(0L);

            // Act & Assert
            assertThatThrownBy(() -> redemptionService.redeemReward(1L, 1L))
                    .isInstanceOf(InsufficientPointsException.class)
                    .hasMessageContaining("need 50 points but only have 30");
        }

        @Test
        @DisplayName("should allow redemption when quantity is null (unlimited)")
        void shouldAllowRedemptionWhenQuantityUnlimited() {
            // Arrange
            reward.setQuantity(null);
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(rewardRepository.findById(1L)).thenReturn(Optional.of(reward));
            when(userRepository.save(any(User.class))).thenReturn(volunteer);
            when(redemptionRepository.save(any(Redemption.class))).thenReturn(redemption);

            // Act
            RedemptionResponse response = redemptionService.redeemReward(1L, 1L);

            // Assert
            assertThat(response).isNotNull();
            verify(redemptionRepository, never()).countByReward(any());
        }

        @Test
        @DisplayName("should allow redemption when dates are within range")
        void shouldAllowRedemptionWhenDatesInRange() {
            // Arrange
            reward.setAvailableFrom(LocalDateTime.now().minusDays(1));
            reward.setAvailableUntil(LocalDateTime.now().plusDays(1));
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(rewardRepository.findById(1L)).thenReturn(Optional.of(reward));
            when(redemptionRepository.countByReward(reward)).thenReturn(0L);
            when(userRepository.save(any(User.class))).thenReturn(volunteer);
            when(redemptionRepository.save(any(Redemption.class))).thenReturn(redemption);

            // Act
            RedemptionResponse response = redemptionService.redeemReward(1L, 1L);

            // Assert
            assertThat(response).isNotNull();
        }
    }

    @Nested
    @DisplayName("getUserRedemptions()")
    class GetUserRedemptionsMethod {

        @Test
        @DisplayName("should return list of user redemptions")
        void shouldReturnUserRedemptions() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(redemptionRepository.findByUserOrderByRedeemedAtDesc(volunteer))
                    .thenReturn(List.of(redemption));

            // Act
            List<RedemptionResponse> redemptions = redemptionService.getUserRedemptions(1L);

            // Assert
            assertThat(redemptions).hasSize(1);
            assertThat(redemptions.get(0).getCode()).isEqualTo("ABC12345");
            assertThat(redemptions.get(0).getReward().getTitle()).isEqualTo("Free Coffee");
        }

        @Test
        @DisplayName("should return empty list when user has no redemptions")
        void shouldReturnEmptyListWhenNoRedemptions() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(redemptionRepository.findByUserOrderByRedeemedAtDesc(volunteer))
                    .thenReturn(List.of());

            // Act
            List<RedemptionResponse> redemptions = redemptionService.getUserRedemptions(1L);

            // Assert
            assertThat(redemptions).isEmpty();
        }

        @Test
        @DisplayName("should throw UserNotFoundException when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> redemptionService.getUserRedemptions(999L))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("getTotalPointsSpent()")
    class GetTotalPointsSpentMethod {

        @Test
        @DisplayName("should return total points spent by user")
        void shouldReturnTotalPointsSpent() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(redemptionRepository.sumPointsSpentByUser(volunteer)).thenReturn(150L);

            // Act
            Long totalPoints = redemptionService.getTotalPointsSpent(1L);

            // Assert
            assertThat(totalPoints).isEqualTo(150L);
        }

        @Test
        @DisplayName("should return 0 when user has no redemptions")
        void shouldReturnZeroWhenNoRedemptions() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(volunteer));
            when(redemptionRepository.sumPointsSpentByUser(volunteer)).thenReturn(null);

            // Act
            Long totalPoints = redemptionService.getTotalPointsSpent(1L);

            // Assert
            assertThat(totalPoints).isZero();
        }

        @Test
        @DisplayName("should throw UserNotFoundException when user not found")
        void shouldThrowExceptionWhenUserNotFound() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> redemptionService.getTotalPointsSpent(999L))
                    .isInstanceOf(UserNotFoundException.class);
        }
    }
}
