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
import ua.tqs.dto.CreateRewardRequest;
import ua.tqs.dto.RewardResponse;
import ua.tqs.dto.UpdateRewardRequest;
import ua.tqs.exception.PartnerNotFoundException;
import ua.tqs.exception.RewardNotFoundException;
import ua.tqs.exception.RewardValidationException;
import ua.tqs.model.Partner;
import ua.tqs.model.Reward;
import ua.tqs.model.enums.RewardType;
import ua.tqs.repository.PartnerRepository;
import ua.tqs.repository.RedemptionRepository;
import ua.tqs.repository.RewardRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RewardServiceTest {

    @Mock
    private RewardRepository rewardRepository;

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private RedemptionRepository redemptionRepository;

    @InjectMocks
    private RewardService rewardService;

    private Partner partner;
    private CreateRewardRequest validRequest;
    private Reward savedReward;

    @BeforeEach
    void setUp() {
        partner = Partner.builder()
                .id(1L)
                .name("UA Cafeteria")
                .description("University cafeteria partner")
                .website("https://cafeteria.ua.pt")
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        validRequest = CreateRewardRequest.builder()
                .title("Free Coffee")
                .description("Get a free coffee at UA Cafeteria")
                .pointsCost(50)
                .type(RewardType.PARTNER_VOUCHER)
                .partnerId(1L)
                .quantity(100)
                .build();

        savedReward = Reward.builder()
                .id(1L)
                .title("Free Coffee")
                .description("Get a free coffee at UA Cafeteria")
                .pointsCost(50)
                .type(RewardType.PARTNER_VOUCHER)
                .partner(partner)
                .quantity(100)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();
    }

    @Nested
    @DisplayName("createReward()")
    class CreateRewardMethod {

        @Test
        @DisplayName("should create reward with valid data")
        void shouldCreateRewardWithValidData() {
            // Arrange
            when(partnerRepository.findById(1L)).thenReturn(Optional.of(partner));
            when(rewardRepository.save(any(Reward.class))).thenReturn(savedReward);

            // Act
            RewardResponse response = rewardService.createReward(validRequest);

            // Assert
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getTitle()).isEqualTo("Free Coffee");
            assertThat(response.getDescription()).isEqualTo("Get a free coffee at UA Cafeteria");
            assertThat(response.getPointsCost()).isEqualTo(50);
            assertThat(response.getType()).isEqualTo(RewardType.PARTNER_VOUCHER);
            assertThat(response.getQuantity()).isEqualTo(100);
            assertThat(response.getActive()).isTrue();
            assertThat(response.getPartner()).isNotNull();
            assertThat(response.getPartner().getName()).isEqualTo("UA Cafeteria");

            verify(rewardRepository).save(any(Reward.class));
        }

        @Test
        @DisplayName("should create reward without partner")
        void shouldCreateRewardWithoutPartner() {
            // Arrange
            CreateRewardRequest requestWithoutPartner = CreateRewardRequest.builder()
                    .title("Certificate of Appreciation")
                    .description("Official certificate for volunteer work")
                    .pointsCost(100)
                    .type(RewardType.CERTIFICATE)
                    .build();

            Reward rewardWithoutPartner = Reward.builder()
                    .id(2L)
                    .title("Certificate of Appreciation")
                    .description("Official certificate for volunteer work")
                    .pointsCost(100)
                    .type(RewardType.CERTIFICATE)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .build();

            when(rewardRepository.save(any(Reward.class))).thenReturn(rewardWithoutPartner);

            // Act
            RewardResponse response = rewardService.createReward(requestWithoutPartner);

            // Assert
            assertThat(response.getId()).isEqualTo(2L);
            assertThat(response.getPartner()).isNull();
            verify(partnerRepository, never()).findById(any());
        }

        @Test
        @DisplayName("should throw exception when partner not found")
        void shouldThrowExceptionWhenPartnerNotFound() {
            // Arrange
            when(partnerRepository.findById(1L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> rewardService.createReward(validRequest))
                    .isInstanceOf(PartnerNotFoundException.class)
                    .hasMessageContaining("Partner not found with id: 1");
        }

        @Test
        @DisplayName("should throw exception when availableUntil is before availableFrom")
        void shouldThrowExceptionWhenDatesInvalid() {
            // Arrange
            CreateRewardRequest invalidRequest = CreateRewardRequest.builder()
                    .title("Limited Offer")
                    .description("Limited time reward")
                    .pointsCost(75)
                    .type(RewardType.MERCHANDISE)
                    .availableFrom(LocalDateTime.now().plusDays(7))
                    .availableUntil(LocalDateTime.now().plusDays(1))
                    .build();

            // Act & Assert
            assertThatThrownBy(() -> rewardService.createReward(invalidRequest))
                    .isInstanceOf(RewardValidationException.class)
                    .hasMessageContaining("Available until date must be after available from date");
        }
    }

    @Nested
    @DisplayName("getRewardById()")
    class GetRewardByIdMethod {

        @Test
        @DisplayName("should return reward when found")
        void shouldReturnRewardWhenFound() {
            // Arrange
            when(rewardRepository.findById(1L)).thenReturn(Optional.of(savedReward));
            when(redemptionRepository.countByReward(savedReward)).thenReturn(10L);

            // Act
            RewardResponse response = rewardService.getRewardById(1L);

            // Assert
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getTitle()).isEqualTo("Free Coffee");
            assertThat(response.getRemainingQuantity()).isEqualTo(90); // 100 - 10
        }

        @Test
        @DisplayName("should throw exception when reward not found")
        void shouldThrowExceptionWhenRewardNotFound() {
            // Arrange
            when(rewardRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> rewardService.getRewardById(999L))
                    .isInstanceOf(RewardNotFoundException.class)
                    .hasMessageContaining("Reward not found with id: 999");
        }
    }

    @Nested
    @DisplayName("getAllRewards()")
    class GetAllRewardsMethod {

        @Test
        @DisplayName("should return paginated rewards")
        void shouldReturnPaginatedRewards() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Reward> rewardPage = new PageImpl<>(List.of(savedReward), pageable, 1);

            when(rewardRepository.findAll(pageable)).thenReturn(rewardPage);
            when(redemptionRepository.countByReward(savedReward)).thenReturn(5L);

            // Act
            Page<RewardResponse> response = rewardService.getAllRewards(pageable);

            // Assert
            assertThat(response.getContent()).hasSize(1);
            assertThat(response.getContent().get(0).getTitle()).isEqualTo("Free Coffee");
            assertThat(response.getContent().get(0).getRemainingQuantity()).isEqualTo(95);
        }
    }

    @Nested
    @DisplayName("getAvailableRewards()")
    class GetAvailableRewardsMethod {

        @Test
        @DisplayName("should return only available rewards with remaining quantity")
        void shouldReturnAvailableRewards() {
            // Arrange
            Reward fullyRedeemedReward = Reward.builder()
                    .id(2L)
                    .title("Sold Out Reward")
                    .pointsCost(25)
                    .type(RewardType.MERCHANDISE)
                    .quantity(10)
                    .active(true)
                    .build();

            when(rewardRepository.findAvailableRewards(any(LocalDateTime.class)))
                    .thenReturn(List.of(savedReward, fullyRedeemedReward));
            when(redemptionRepository.countByReward(savedReward)).thenReturn(5L);
            when(redemptionRepository.countByReward(fullyRedeemedReward)).thenReturn(10L);

            // Act
            List<RewardResponse> response = rewardService.getAvailableRewards();

            // Assert
            assertThat(response).hasSize(1);
            assertThat(response.get(0).getTitle()).isEqualTo("Free Coffee");
        }

        @Test
        @DisplayName("should include rewards with unlimited quantity")
        void shouldIncludeUnlimitedRewards() {
            // Arrange
            Reward unlimitedReward = Reward.builder()
                    .id(3L)
                    .title("Unlimited Reward")
                    .pointsCost(10)
                    .type(RewardType.CERTIFICATE)
                    .quantity(null) // unlimited
                    .active(true)
                    .build();

            when(rewardRepository.findAvailableRewards(any(LocalDateTime.class)))
                    .thenReturn(List.of(unlimitedReward));
            when(redemptionRepository.countByReward(unlimitedReward)).thenReturn(1000L);

            // Act
            List<RewardResponse> response = rewardService.getAvailableRewards();

            // Assert
            assertThat(response).hasSize(1);
            assertThat(response.get(0).getRemainingQuantity()).isNull();
        }
    }

    @Nested
    @DisplayName("updateReward()")
    class UpdateRewardMethod {

        @Test
        @DisplayName("should update reward with valid data")
        void shouldUpdateRewardWithValidData() {
            // Arrange
            UpdateRewardRequest updateRequest = UpdateRewardRequest.builder()
                    .title("Updated Coffee Reward")
                    .pointsCost(75)
                    .build();

            Reward updatedReward = Reward.builder()
                    .id(1L)
                    .title("Updated Coffee Reward")
                    .description("Get a free coffee at UA Cafeteria")
                    .pointsCost(75)
                    .type(RewardType.PARTNER_VOUCHER)
                    .partner(partner)
                    .quantity(100)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .build();

            when(rewardRepository.findById(1L)).thenReturn(Optional.of(savedReward));
            when(rewardRepository.save(any(Reward.class))).thenReturn(updatedReward);
            when(redemptionRepository.countByReward(any(Reward.class))).thenReturn(0L);

            // Act
            RewardResponse response = rewardService.updateReward(1L, updateRequest);

            // Assert
            assertThat(response.getTitle()).isEqualTo("Updated Coffee Reward");
            assertThat(response.getPointsCost()).isEqualTo(75);
        }

        @Test
        @DisplayName("should throw exception when reward not found")
        void shouldThrowExceptionWhenRewardNotFound() {
            // Arrange
            UpdateRewardRequest updateRequest = UpdateRewardRequest.builder()
                    .title("Updated Title")
                    .build();

            when(rewardRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> rewardService.updateReward(999L, updateRequest))
                    .isInstanceOf(RewardNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("deactivateReward()")
    class DeactivateRewardMethod {

        @Test
        @DisplayName("should deactivate reward")
        void shouldDeactivateReward() {
            // Arrange
            when(rewardRepository.findById(1L)).thenReturn(Optional.of(savedReward));
            when(rewardRepository.save(any(Reward.class))).thenReturn(savedReward);

            // Act
            rewardService.deactivateReward(1L);

            // Assert
            verify(rewardRepository).save(argThat(reward -> !reward.getActive()));
        }

        @Test
        @DisplayName("should throw exception when reward not found")
        void shouldThrowExceptionWhenRewardNotFound() {
            // Arrange
            when(rewardRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> rewardService.deactivateReward(999L))
                    .isInstanceOf(RewardNotFoundException.class);
        }
    }
}
