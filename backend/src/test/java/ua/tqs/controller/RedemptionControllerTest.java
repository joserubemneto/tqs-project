package ua.tqs.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import ua.tqs.config.JwtUserDetails;
import ua.tqs.dto.RedemptionResponse;
import ua.tqs.service.RedemptionService;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Unit tests for RedemptionController.
 * 
 * Test Strategy:
 * - Uses mocked RedemptionService to test controller logic in isolation
 * - Verifies correct HTTP status codes are returned
 * - Tests proper delegation to service layer
 */
@ExtendWith(MockitoExtension.class)
class RedemptionControllerTest {

    @Mock
    private RedemptionService redemptionService;

    @InjectMocks
    private RedemptionController redemptionController;

    private JwtUserDetails currentUser;
    private RedemptionResponse mockRedemptionResponse;
    private List<RedemptionResponse> mockRedemptionList;

    @BeforeEach
    void setUp() {
        currentUser = new JwtUserDetails(1L, "volunteer@ua.pt", "VOLUNTEER");

        RedemptionResponse.RewardSummary rewardSummary = RedemptionResponse.RewardSummary.builder()
                .id(1L)
                .title("Free Coffee")
                .type("PARTNER_VOUCHER")
                .partnerName("UA Cafeteria")
                .build();

        mockRedemptionResponse = RedemptionResponse.builder()
                .id(1L)
                .code("ABC12345")
                .pointsSpent(50)
                .redeemedAt(LocalDateTime.now())
                .reward(rewardSummary)
                .build();

        mockRedemptionList = List.of(mockRedemptionResponse);
    }

    @Nested
    @DisplayName("redeemReward")
    class RedeemRewardTests {

        @Test
        @DisplayName("should return 201 CREATED when redemption successful")
        void shouldReturn201WhenRedemptionSuccessful() {
            // Arrange
            when(redemptionService.redeemReward(1L, 1L)).thenReturn(mockRedemptionResponse);

            // Act
            ResponseEntity<RedemptionResponse> response = redemptionController.redeemReward(1L, currentUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getCode()).isEqualTo("ABC12345");
            assertThat(response.getBody().getPointsSpent()).isEqualTo(50);
            verify(redemptionService).redeemReward(1L, 1L);
        }

        @Test
        @DisplayName("should pass correct userId and rewardId to service")
        void shouldPassCorrectParametersToService() {
            // Arrange
            JwtUserDetails anotherUser = new JwtUserDetails(42L, "user@ua.pt", "VOLUNTEER");
            when(redemptionService.redeemReward(42L, 99L)).thenReturn(mockRedemptionResponse);

            // Act
            redemptionController.redeemReward(99L, anotherUser);

            // Assert
            verify(redemptionService).redeemReward(42L, 99L);
        }

        @Test
        @DisplayName("should return redemption response with reward details")
        void shouldReturnRedemptionWithRewardDetails() {
            // Arrange
            when(redemptionService.redeemReward(1L, 1L)).thenReturn(mockRedemptionResponse);

            // Act
            ResponseEntity<RedemptionResponse> response = redemptionController.redeemReward(1L, currentUser);

            // Assert
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getReward()).isNotNull();
            assertThat(response.getBody().getReward().getTitle()).isEqualTo("Free Coffee");
            assertThat(response.getBody().getReward().getType()).isEqualTo("PARTNER_VOUCHER");
            assertThat(response.getBody().getReward().getPartnerName()).isEqualTo("UA Cafeteria");
        }
    }

    @Nested
    @DisplayName("getMyRedemptions")
    class GetMyRedemptionsTests {

        @Test
        @DisplayName("should return 200 OK with list of redemptions")
        void shouldReturn200WithRedemptionsList() {
            // Arrange
            when(redemptionService.getUserRedemptions(1L)).thenReturn(mockRedemptionList);

            // Act
            ResponseEntity<List<RedemptionResponse>> response = redemptionController.getMyRedemptions(currentUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody()).hasSize(1);
            assertThat(response.getBody().get(0).getCode()).isEqualTo("ABC12345");
            verify(redemptionService).getUserRedemptions(1L);
        }

        @Test
        @DisplayName("should return empty list when no redemptions")
        void shouldReturnEmptyListWhenNoRedemptions() {
            // Arrange
            when(redemptionService.getUserRedemptions(1L)).thenReturn(List.of());

            // Act
            ResponseEntity<List<RedemptionResponse>> response = redemptionController.getMyRedemptions(currentUser);

            // Assert
            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEmpty();
        }

        @Test
        @DisplayName("should pass correct userId to service")
        void shouldPassCorrectUserIdToService() {
            // Arrange
            JwtUserDetails anotherUser = new JwtUserDetails(42L, "user@ua.pt", "VOLUNTEER");
            when(redemptionService.getUserRedemptions(42L)).thenReturn(mockRedemptionList);

            // Act
            redemptionController.getMyRedemptions(anotherUser);

            // Assert
            verify(redemptionService).getUserRedemptions(42L);
        }

        @Test
        @DisplayName("should return multiple redemptions ordered by date")
        void shouldReturnMultipleRedemptions() {
            // Arrange
            RedemptionResponse.RewardSummary rewardSummary2 = RedemptionResponse.RewardSummary.builder()
                    .id(2L)
                    .title("Certificate")
                    .type("CERTIFICATE")
                    .build();

            RedemptionResponse secondRedemption = RedemptionResponse.builder()
                    .id(2L)
                    .code("DEF67890")
                    .pointsSpent(100)
                    .redeemedAt(LocalDateTime.now().minusDays(1))
                    .reward(rewardSummary2)
                    .build();

            when(redemptionService.getUserRedemptions(1L))
                    .thenReturn(List.of(mockRedemptionResponse, secondRedemption));

            // Act
            ResponseEntity<List<RedemptionResponse>> response = redemptionController.getMyRedemptions(currentUser);

            // Assert
            assertThat(response.getBody()).hasSize(2);
            assertThat(response.getBody().get(0).getCode()).isEqualTo("ABC12345");
            assertThat(response.getBody().get(1).getCode()).isEqualTo("DEF67890");
        }
    }
}
