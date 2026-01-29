package ua.tqs.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import ua.tqs.dto.CreateRewardRequest;
import ua.tqs.dto.RewardResponse;
import ua.tqs.dto.UpdateRewardRequest;
import ua.tqs.model.enums.RewardType;
import ua.tqs.service.RewardService;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for RewardController.
 * 
 * Test Strategy:
 * - Uses mocked RewardService to test controller logic in isolation
 * - Verifies correct parameter handling and response mapping
 * - Tests sorting logic (ascending/descending, different fields)
 * - Tests pagination parameter passing
 */
@ExtendWith(MockitoExtension.class)
class RewardControllerTest {

    @Mock
    private RewardService rewardService;

    @InjectMocks
    private RewardController rewardController;

    private RewardResponse mockRewardResponse;
    private List<RewardResponse> mockRewardList;
    private Page<RewardResponse> mockRewardPage;

    @BeforeEach
    void setUp() {
        mockRewardResponse = RewardResponse.builder()
                .id(1L)
                .title("Free Coffee")
                .description("Get a free coffee at UA Cafeteria")
                .pointsCost(50)
                .type(RewardType.PARTNER_VOUCHER)
                .quantity(100)
                .remainingQuantity(95)
                .active(true)
                .createdAt(LocalDateTime.now())
                .build();

        mockRewardList = List.of(mockRewardResponse);
        mockRewardPage = new PageImpl<>(mockRewardList);
    }

    @Nested
    @DisplayName("getAvailableRewards")
    class GetAvailableRewardsTests {

        @Test
        @DisplayName("should return available rewards list")
        void shouldReturnAvailableRewardsList() {
            when(rewardService.getAvailableRewards()).thenReturn(mockRewardList);

            ResponseEntity<List<RewardResponse>> response = rewardController.getAvailableRewards();

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).hasSize(1);
            assertThat(response.getBody().get(0).getTitle()).isEqualTo("Free Coffee");
            verify(rewardService).getAvailableRewards();
        }

        @Test
        @DisplayName("should return empty list when no rewards available")
        void shouldReturnEmptyListWhenNoRewards() {
            when(rewardService.getAvailableRewards()).thenReturn(List.of());

            ResponseEntity<List<RewardResponse>> response = rewardController.getAvailableRewards();

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEmpty();
        }
    }

    @Nested
    @DisplayName("getRewardById")
    class GetRewardByIdTests {

        @Test
        @DisplayName("should return reward when found")
        void shouldReturnRewardWhenFound() {
            when(rewardService.getRewardById(1L)).thenReturn(mockRewardResponse);

            ResponseEntity<RewardResponse> response = rewardController.getRewardById(1L);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getId()).isEqualTo(1L);
            assertThat(response.getBody().getTitle()).isEqualTo("Free Coffee");
            verify(rewardService).getRewardById(1L);
        }
    }

    @Nested
    @DisplayName("getAllRewards")
    class GetAllRewardsTests {

        @Test
        @DisplayName("should pass correct pagination parameters to service")
        void shouldPassCorrectPaginationParameters() {
            when(rewardService.getAllRewards(any(Pageable.class))).thenReturn(mockRewardPage);

            ResponseEntity<Page<RewardResponse>> response = rewardController.getAllRewards(
                    2, 20, "createdAt", "desc");

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(rewardService).getAllRewards(pageableCaptor.capture());

            Pageable captured = pageableCaptor.getValue();
            assertThat(captured.getPageNumber()).isEqualTo(2);
            assertThat(captured.getPageSize()).isEqualTo(20);
        }

        @Test
        @DisplayName("should create ascending sort when sortDir is 'asc'")
        void shouldCreateAscendingSortWhenAsc() {
            when(rewardService.getAllRewards(any(Pageable.class))).thenReturn(mockRewardPage);

            rewardController.getAllRewards(0, 10, "pointsCost", "asc");

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(rewardService).getAllRewards(pageableCaptor.capture());

            Sort sort = pageableCaptor.getValue().getSort();
            assertThat(sort.getOrderFor("pointsCost")).isNotNull();
            assertThat(sort.getOrderFor("pointsCost").isAscending()).isTrue();
        }

        @Test
        @DisplayName("should create descending sort when sortDir is 'desc'")
        void shouldCreateDescendingSortWhenDesc() {
            when(rewardService.getAllRewards(any(Pageable.class))).thenReturn(mockRewardPage);

            rewardController.getAllRewards(0, 10, "title", "desc");

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(rewardService).getAllRewards(pageableCaptor.capture());

            Sort sort = pageableCaptor.getValue().getSort();
            assertThat(sort.getOrderFor("title")).isNotNull();
            assertThat(sort.getOrderFor("title").isDescending()).isTrue();
        }

        @Test
        @DisplayName("should default to descending sort for unknown sortDir")
        void shouldDefaultToDescendingSortForUnknownSortDir() {
            when(rewardService.getAllRewards(any(Pageable.class))).thenReturn(mockRewardPage);

            rewardController.getAllRewards(0, 10, "createdAt", "invalid");

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(rewardService).getAllRewards(pageableCaptor.capture());

            Sort sort = pageableCaptor.getValue().getSort();
            assertThat(sort.getOrderFor("createdAt")).isNotNull();
            assertThat(sort.getOrderFor("createdAt").isDescending()).isTrue();
        }

        @Test
        @DisplayName("should return page response from service")
        void shouldReturnPageResponseFromService() {
            when(rewardService.getAllRewards(any(Pageable.class))).thenReturn(mockRewardPage);

            ResponseEntity<Page<RewardResponse>> response = rewardController.getAllRewards(
                    0, 10, "createdAt", "desc");

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            assertThat(response.getBody().getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("createReward")
    class CreateRewardTests {

        @Test
        @DisplayName("should create reward and return 201 CREATED")
        void shouldCreateRewardAndReturn201() {
            CreateRewardRequest request = CreateRewardRequest.builder()
                    .title("New Reward")
                    .description("A new reward")
                    .pointsCost(75)
                    .type(RewardType.CERTIFICATE)
                    .build();

            when(rewardService.createReward(any(CreateRewardRequest.class)))
                    .thenReturn(mockRewardResponse);

            ResponseEntity<RewardResponse> response = rewardController.createReward(request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
            assertThat(response.getBody()).isNotNull();
            verify(rewardService).createReward(request);
        }

        @Test
        @DisplayName("should pass request to service correctly")
        void shouldPassRequestToServiceCorrectly() {
            CreateRewardRequest request = CreateRewardRequest.builder()
                    .title("Partner Voucher")
                    .description("10% off at partner store")
                    .pointsCost(100)
                    .type(RewardType.PARTNER_VOUCHER)
                    .partnerId(5L)
                    .quantity(50)
                    .build();

            when(rewardService.createReward(any(CreateRewardRequest.class)))
                    .thenReturn(mockRewardResponse);

            rewardController.createReward(request);

            ArgumentCaptor<CreateRewardRequest> requestCaptor = 
                    ArgumentCaptor.forClass(CreateRewardRequest.class);
            verify(rewardService).createReward(requestCaptor.capture());

            CreateRewardRequest captured = requestCaptor.getValue();
            assertThat(captured.getTitle()).isEqualTo("Partner Voucher");
            assertThat(captured.getPointsCost()).isEqualTo(100);
            assertThat(captured.getPartnerId()).isEqualTo(5L);
            assertThat(captured.getQuantity()).isEqualTo(50);
        }
    }

    @Nested
    @DisplayName("updateReward")
    class UpdateRewardTests {

        @Test
        @DisplayName("should update reward and return 200 OK")
        void shouldUpdateRewardAndReturn200() {
            UpdateRewardRequest request = UpdateRewardRequest.builder()
                    .title("Updated Reward")
                    .pointsCost(100)
                    .build();

            when(rewardService.updateReward(eq(1L), any(UpdateRewardRequest.class)))
                    .thenReturn(mockRewardResponse);

            ResponseEntity<RewardResponse> response = rewardController.updateReward(1L, request);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isNotNull();
            verify(rewardService).updateReward(eq(1L), eq(request));
        }

        @Test
        @DisplayName("should pass ID and request to service")
        void shouldPassIdAndRequestToService() {
            UpdateRewardRequest request = UpdateRewardRequest.builder()
                    .active(false)
                    .build();

            when(rewardService.updateReward(anyLong(), any(UpdateRewardRequest.class)))
                    .thenReturn(mockRewardResponse);

            rewardController.updateReward(42L, request);

            verify(rewardService).updateReward(eq(42L), eq(request));
        }
    }

    @Nested
    @DisplayName("deactivateReward")
    class DeactivateRewardTests {

        @Test
        @DisplayName("should deactivate reward and return 204 NO CONTENT")
        void shouldDeactivateRewardAndReturn204() {
            doNothing().when(rewardService).deactivateReward(1L);

            ResponseEntity<Void> response = rewardController.deactivateReward(1L);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
            assertThat(response.getBody()).isNull();
            verify(rewardService).deactivateReward(1L);
        }

        @Test
        @DisplayName("should pass correct ID to service")
        void shouldPassCorrectIdToService() {
            doNothing().when(rewardService).deactivateReward(anyLong());

            rewardController.deactivateReward(99L);

            verify(rewardService).deactivateReward(99L);
        }
    }
}
