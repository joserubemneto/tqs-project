package ua.tqs.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
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
import ua.tqs.config.JwtUserDetails;
import ua.tqs.dto.OpportunityResponse;
import ua.tqs.dto.UpdateRoleRequest;
import ua.tqs.dto.UserPageResponse;
import ua.tqs.dto.UserResponse;
import ua.tqs.model.enums.OpportunityStatus;
import ua.tqs.model.enums.UserRole;
import ua.tqs.service.AdminService;
import ua.tqs.service.OpportunityService;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for AdminController.
 * 
 * Test Strategy:
 * - Uses mocked AdminService to test controller logic in isolation
 * - Verifies correct parameter handling and response mapping
 * - Tests sorting logic (ascending/descending, different fields)
 * - Tests pagination parameter passing
 */
@ExtendWith(MockitoExtension.class)
class AdminControllerTest {

    @Mock
    private AdminService adminService;

    @Mock
    private OpportunityService opportunityService;

    @InjectMocks
    private AdminController adminController;

    private UserPageResponse mockPageResponse;
    private UserResponse mockUserResponse;
    private Page<OpportunityResponse> mockOpportunityPage;

    @BeforeEach
    void setUp() {
        mockUserResponse = UserResponse.builder()
                .id(1L)
                .email("user@ua.pt")
                .name("Test User")
                .role(UserRole.VOLUNTEER)
                .points(100)
                .createdAt(LocalDateTime.now())
                .build();

        mockPageResponse = UserPageResponse.builder()
                .users(List.of(mockUserResponse))
                .currentPage(0)
                .totalPages(1)
                .totalElements(1)
                .pageSize(10)
                .hasNext(false)
                .hasPrevious(false)
                .build();

        OpportunityResponse mockOpportunityResponse = OpportunityResponse.builder()
                .id(1L)
                .title("Test Opportunity")
                .description("Test description")
                .pointsReward(50)
                .status(OpportunityStatus.OPEN)
                .build();

        mockOpportunityPage = new PageImpl<>(List.of(mockOpportunityResponse));
    }

    @Nested
    @DisplayName("getUsers")
    class GetUsersTests {

        @Test
        @DisplayName("should pass correct pagination parameters to service")
        void shouldPassCorrectPaginationParameters() {
            when(adminService.getUsers(any(Pageable.class), isNull(), isNull()))
                    .thenReturn(mockPageResponse);

            ResponseEntity<UserPageResponse> response = adminController.getUsers(
                    2, 20, null, null, "createdAt", "desc");

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(adminService).getUsers(pageableCaptor.capture(), isNull(), isNull());

            Pageable captured = pageableCaptor.getValue();
            assertThat(captured.getPageNumber()).isEqualTo(2);
            assertThat(captured.getPageSize()).isEqualTo(20);
        }

        @Test
        @DisplayName("should create ascending sort when sortDir is 'asc'")
        void shouldCreateAscendingSortWhenAsc() {
            when(adminService.getUsers(any(Pageable.class), isNull(), isNull()))
                    .thenReturn(mockPageResponse);

            adminController.getUsers(0, 10, null, null, "name", "asc");

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(adminService).getUsers(pageableCaptor.capture(), isNull(), isNull());

            Pageable captured = pageableCaptor.getValue();
            Sort sort = captured.getSort();
            assertThat(sort.getOrderFor("name")).isNotNull();
            assertThat(sort.getOrderFor("name").isAscending()).isTrue();
        }

        @Test
        @DisplayName("should create descending sort when sortDir is 'desc'")
        void shouldCreateDescendingSortWhenDesc() {
            when(adminService.getUsers(any(Pageable.class), isNull(), isNull()))
                    .thenReturn(mockPageResponse);

            adminController.getUsers(0, 10, null, null, "email", "desc");

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(adminService).getUsers(pageableCaptor.capture(), isNull(), isNull());

            Pageable captured = pageableCaptor.getValue();
            Sort sort = captured.getSort();
            assertThat(sort.getOrderFor("email")).isNotNull();
            assertThat(sort.getOrderFor("email").isDescending()).isTrue();
        }

        @ParameterizedTest
        @ValueSource(strings = {"ASC", "Asc", "aSc", "asc"})
        @DisplayName("should handle case insensitive ascending sort direction")
        void shouldHandleCaseInsensitiveAscending(String sortDir) {
            when(adminService.getUsers(any(Pageable.class), isNull(), isNull()))
                    .thenReturn(mockPageResponse);

            adminController.getUsers(0, 10, null, null, "name", sortDir);

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(adminService).getUsers(pageableCaptor.capture(), isNull(), isNull());

            Sort sort = pageableCaptor.getValue().getSort();
            assertThat(sort.getOrderFor("name").isAscending()).isTrue();
        }

        @ParameterizedTest
        @ValueSource(strings = {"DESC", "Desc", "dEsC", "desc", "invalid", "xyz", ""})
        @DisplayName("should default to descending for non-ascending sort direction")
        void shouldDefaultToDescendingForNonAscending(String sortDir) {
            when(adminService.getUsers(any(Pageable.class), isNull(), isNull()))
                    .thenReturn(mockPageResponse);

            adminController.getUsers(0, 10, null, null, "name", sortDir);

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(adminService).getUsers(pageableCaptor.capture(), isNull(), isNull());

            Sort sort = pageableCaptor.getValue().getSort();
            assertThat(sort.getOrderFor("name").isDescending()).isTrue();
        }

        @Test
        @DisplayName("should pass sortBy field to sort correctly")
        void shouldPassSortByFieldCorrectly() {
            when(adminService.getUsers(any(Pageable.class), isNull(), isNull()))
                    .thenReturn(mockPageResponse);

            adminController.getUsers(0, 10, null, null, "points", "asc");

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(adminService).getUsers(pageableCaptor.capture(), isNull(), isNull());

            Sort sort = pageableCaptor.getValue().getSort();
            assertThat(sort.getOrderFor("points")).isNotNull();
        }

        @Test
        @DisplayName("should pass search parameter to service")
        void shouldPassSearchParameter() {
            when(adminService.getUsers(any(Pageable.class), eq("volunteer"), isNull()))
                    .thenReturn(mockPageResponse);

            adminController.getUsers(0, 10, "volunteer", null, "createdAt", "desc");

            verify(adminService).getUsers(any(Pageable.class), eq("volunteer"), isNull());
        }

        @Test
        @DisplayName("should pass role filter to service")
        void shouldPassRoleFilter() {
            when(adminService.getUsers(any(Pageable.class), isNull(), eq(UserRole.ADMIN)))
                    .thenReturn(mockPageResponse);

            adminController.getUsers(0, 10, null, UserRole.ADMIN, "createdAt", "desc");

            verify(adminService).getUsers(any(Pageable.class), isNull(), eq(UserRole.ADMIN));
        }

        @Test
        @DisplayName("should pass all parameters together")
        void shouldPassAllParametersTogether() {
            when(adminService.getUsers(any(Pageable.class), eq("test"), eq(UserRole.PROMOTER)))
                    .thenReturn(mockPageResponse);

            adminController.getUsers(1, 5, "test", UserRole.PROMOTER, "email", "asc");

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(adminService).getUsers(pageableCaptor.capture(), eq("test"), eq(UserRole.PROMOTER));

            Pageable captured = pageableCaptor.getValue();
            assertThat(captured.getPageNumber()).isEqualTo(1);
            assertThat(captured.getPageSize()).isEqualTo(5);
            assertThat(captured.getSort().getOrderFor("email").isAscending()).isTrue();
        }

        @Test
        @DisplayName("should return OK response with body from service")
        void shouldReturnOkWithServiceResponse() {
            when(adminService.getUsers(any(Pageable.class), isNull(), isNull()))
                    .thenReturn(mockPageResponse);

            ResponseEntity<UserPageResponse> response = adminController.getUsers(
                    0, 10, null, null, "createdAt", "desc");

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo(mockPageResponse);
        }
    }

    @Nested
    @DisplayName("updateUserRole")
    class UpdateUserRoleTests {

        @Test
        @DisplayName("should pass correct parameters to service")
        void shouldPassCorrectParametersToService() {
            JwtUserDetails currentUser = new JwtUserDetails(1L, "admin@ua.pt", "ADMIN");
            UpdateRoleRequest request = new UpdateRoleRequest(UserRole.PROMOTER);

            when(adminService.updateUserRole(2L, UserRole.PROMOTER, 1L))
                    .thenReturn(mockUserResponse);

            adminController.updateUserRole(2L, request, currentUser);

            verify(adminService).updateUserRole(2L, UserRole.PROMOTER, 1L);
        }

        @Test
        @DisplayName("should return OK response with updated user")
        void shouldReturnOkWithUpdatedUser() {
            JwtUserDetails currentUser = new JwtUserDetails(1L, "admin@ua.pt", "ADMIN");
            UpdateRoleRequest request = new UpdateRoleRequest(UserRole.ADMIN);
            UserResponse updatedUser = UserResponse.builder()
                    .id(2L)
                    .email("user@ua.pt")
                    .name("Test User")
                    .role(UserRole.ADMIN)
                    .points(100)
                    .createdAt(LocalDateTime.now())
                    .build();

            when(adminService.updateUserRole(2L, UserRole.ADMIN, 1L))
                    .thenReturn(updatedUser);

            ResponseEntity<UserResponse> response = adminController.updateUserRole(2L, request, currentUser);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo(updatedUser);
            assertThat(response.getBody().getRole()).isEqualTo(UserRole.ADMIN);
        }

        @Test
        @DisplayName("should extract user ID from JwtUserDetails")
        void shouldExtractUserIdFromJwtUserDetails() {
            JwtUserDetails currentUser = new JwtUserDetails(42L, "admin@ua.pt", "ADMIN");
            UpdateRoleRequest request = new UpdateRoleRequest(UserRole.VOLUNTEER);

            when(adminService.updateUserRole(anyLong(), any(UserRole.class), eq(42L)))
                    .thenReturn(mockUserResponse);

            adminController.updateUserRole(5L, request, currentUser);

            verify(adminService).updateUserRole(5L, UserRole.VOLUNTEER, 42L);
        }
    }

    @Nested
    @DisplayName("getOpportunities")
    class GetOpportunitiesTests {

        @Test
        @DisplayName("should pass correct pagination parameters to service")
        void shouldPassCorrectPaginationParameters() {
            when(opportunityService.getAllOpportunitiesForAdmin(any(Pageable.class), isNull()))
                    .thenReturn(mockOpportunityPage);

            ResponseEntity<Page<OpportunityResponse>> response = adminController.getOpportunities(
                    2, 20, null, "createdAt", "desc");

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(opportunityService).getAllOpportunitiesForAdmin(pageableCaptor.capture(), isNull());

            Pageable captured = pageableCaptor.getValue();
            assertThat(captured.getPageNumber()).isEqualTo(2);
            assertThat(captured.getPageSize()).isEqualTo(20);
        }

        @Test
        @DisplayName("should create ascending sort when sortDir is 'asc'")
        void shouldCreateAscendingSortWhenAsc() {
            when(opportunityService.getAllOpportunitiesForAdmin(any(Pageable.class), isNull()))
                    .thenReturn(mockOpportunityPage);

            adminController.getOpportunities(0, 10, null, "title", "asc");

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(opportunityService).getAllOpportunitiesForAdmin(pageableCaptor.capture(), isNull());

            Pageable captured = pageableCaptor.getValue();
            Sort sort = captured.getSort();
            assertThat(sort.getOrderFor("title")).isNotNull();
            assertThat(sort.getOrderFor("title").isAscending()).isTrue();
        }

        @Test
        @DisplayName("should create descending sort when sortDir is 'desc'")
        void shouldCreateDescendingSortWhenDesc() {
            when(opportunityService.getAllOpportunitiesForAdmin(any(Pageable.class), isNull()))
                    .thenReturn(mockOpportunityPage);

            adminController.getOpportunities(0, 10, null, "startDate", "desc");

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(opportunityService).getAllOpportunitiesForAdmin(pageableCaptor.capture(), isNull());

            Pageable captured = pageableCaptor.getValue();
            Sort sort = captured.getSort();
            assertThat(sort.getOrderFor("startDate")).isNotNull();
            assertThat(sort.getOrderFor("startDate").isDescending()).isTrue();
        }

        @ParameterizedTest
        @ValueSource(strings = {"ASC", "Asc", "aSc", "asc"})
        @DisplayName("should handle case insensitive ascending sort direction")
        void shouldHandleCaseInsensitiveAscending(String sortDir) {
            when(opportunityService.getAllOpportunitiesForAdmin(any(Pageable.class), isNull()))
                    .thenReturn(mockOpportunityPage);

            adminController.getOpportunities(0, 10, null, "title", sortDir);

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(opportunityService).getAllOpportunitiesForAdmin(pageableCaptor.capture(), isNull());

            Sort sort = pageableCaptor.getValue().getSort();
            assertThat(sort.getOrderFor("title").isAscending()).isTrue();
        }

        @ParameterizedTest
        @ValueSource(strings = {"DESC", "Desc", "dEsC", "desc", "invalid", "xyz", ""})
        @DisplayName("should default to descending for non-ascending sort direction")
        void shouldDefaultToDescendingForNonAscending(String sortDir) {
            when(opportunityService.getAllOpportunitiesForAdmin(any(Pageable.class), isNull()))
                    .thenReturn(mockOpportunityPage);

            adminController.getOpportunities(0, 10, null, "title", sortDir);

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(opportunityService).getAllOpportunitiesForAdmin(pageableCaptor.capture(), isNull());

            Sort sort = pageableCaptor.getValue().getSort();
            assertThat(sort.getOrderFor("title").isDescending()).isTrue();
        }

        @Test
        @DisplayName("should pass status filter to service")
        void shouldPassStatusFilter() {
            when(opportunityService.getAllOpportunitiesForAdmin(any(Pageable.class), eq(OpportunityStatus.OPEN)))
                    .thenReturn(mockOpportunityPage);

            adminController.getOpportunities(0, 10, OpportunityStatus.OPEN, "createdAt", "desc");

            verify(opportunityService).getAllOpportunitiesForAdmin(any(Pageable.class), eq(OpportunityStatus.OPEN));
        }

        @Test
        @DisplayName("should pass all parameters together")
        void shouldPassAllParametersTogether() {
            when(opportunityService.getAllOpportunitiesForAdmin(any(Pageable.class), eq(OpportunityStatus.DRAFT)))
                    .thenReturn(mockOpportunityPage);

            adminController.getOpportunities(1, 5, OpportunityStatus.DRAFT, "title", "asc");

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(opportunityService).getAllOpportunitiesForAdmin(pageableCaptor.capture(), eq(OpportunityStatus.DRAFT));

            Pageable captured = pageableCaptor.getValue();
            assertThat(captured.getPageNumber()).isEqualTo(1);
            assertThat(captured.getPageSize()).isEqualTo(5);
            assertThat(captured.getSort().getOrderFor("title").isAscending()).isTrue();
        }

        @Test
        @DisplayName("should return OK response with body from service")
        void shouldReturnOkWithServiceResponse() {
            when(opportunityService.getAllOpportunitiesForAdmin(any(Pageable.class), isNull()))
                    .thenReturn(mockOpportunityPage);

            ResponseEntity<Page<OpportunityResponse>> response = adminController.getOpportunities(
                    0, 10, null, "createdAt", "desc");

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            assertThat(response.getBody()).isEqualTo(mockOpportunityPage);
        }

        @Test
        @DisplayName("should filter by different status types")
        void shouldFilterByDifferentStatusTypes() {
            when(opportunityService.getAllOpportunitiesForAdmin(any(Pageable.class), eq(OpportunityStatus.CANCELLED)))
                    .thenReturn(mockOpportunityPage);

            adminController.getOpportunities(0, 10, OpportunityStatus.CANCELLED, "createdAt", "desc");

            verify(opportunityService).getAllOpportunitiesForAdmin(any(Pageable.class), eq(OpportunityStatus.CANCELLED));
        }

        @Test
        @DisplayName("should pass sortBy field correctly")
        void shouldPassSortByFieldCorrectly() {
            when(opportunityService.getAllOpportunitiesForAdmin(any(Pageable.class), isNull()))
                    .thenReturn(mockOpportunityPage);

            adminController.getOpportunities(0, 10, null, "pointsReward", "asc");

            ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
            verify(opportunityService).getAllOpportunitiesForAdmin(pageableCaptor.capture(), isNull());

            Sort sort = pageableCaptor.getValue().getSort();
            assertThat(sort.getOrderFor("pointsReward")).isNotNull();
        }
    }
}
