package ua.tqs.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ua.tqs.model.Opportunity;
import ua.tqs.model.User;
import ua.tqs.model.enums.OpportunityStatus;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.OpportunityRepository;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for OpportunityStatusScheduler.
 * 
 * Test Strategy:
 * - Tests the automatic status transitions based on dates
 * - OPEN/FULL → IN_PROGRESS when startDate passes
 * - IN_PROGRESS → COMPLETED when endDate passes
 */
@ExtendWith(MockitoExtension.class)
class OpportunityStatusSchedulerTest {

    @Mock
    private OpportunityRepository opportunityRepository;

    @InjectMocks
    private OpportunityStatusScheduler scheduler;

    private User promoter;
    private Opportunity openOpportunity;
    private Opportunity fullOpportunity;
    private Opportunity inProgressOpportunity;

    @BeforeEach
    void setUp() {
        promoter = User.builder()
                .id(1L)
                .name("Test Promoter")
                .email("promoter@ua.pt")
                .role(UserRole.PROMOTER)
                .build();

        openOpportunity = Opportunity.builder()
                .id(1L)
                .title("Open Opportunity")
                .description("Test description")
                .pointsReward(50)
                .startDate(LocalDateTime.now().minusHours(1))
                .endDate(LocalDateTime.now().plusDays(1))
                .maxVolunteers(10)
                .status(OpportunityStatus.OPEN)
                .promoter(promoter)
                .build();

        fullOpportunity = Opportunity.builder()
                .id(2L)
                .title("Full Opportunity")
                .description("Test description")
                .pointsReward(75)
                .startDate(LocalDateTime.now().minusHours(2))
                .endDate(LocalDateTime.now().plusDays(2))
                .maxVolunteers(5)
                .status(OpportunityStatus.FULL)
                .promoter(promoter)
                .build();

        inProgressOpportunity = Opportunity.builder()
                .id(3L)
                .title("In Progress Opportunity")
                .description("Test description")
                .pointsReward(100)
                .startDate(LocalDateTime.now().minusDays(2))
                .endDate(LocalDateTime.now().minusHours(1))
                .maxVolunteers(8)
                .status(OpportunityStatus.IN_PROGRESS)
                .promoter(promoter)
                .build();
    }

    @Nested
    @DisplayName("updateOpportunityStatuses()")
    class UpdateOpportunityStatusesMethod {

        @Test
        @DisplayName("should start OPEN opportunities when start date has passed")
        void shouldStartOpenOpportunities() {
            // Arrange
            when(opportunityRepository.findOpportunitiesToStart(any(), any()))
                    .thenReturn(List.of(openOpportunity));
            when(opportunityRepository.findOpportunitiesToComplete(any(), any()))
                    .thenReturn(List.of());
            when(opportunityRepository.save(any(Opportunity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            scheduler.updateOpportunityStatuses();

            // Assert
            verify(opportunityRepository).save(argThat(opp -> 
                    opp.getId().equals(1L) && opp.getStatus() == OpportunityStatus.IN_PROGRESS));
        }

        @Test
        @DisplayName("should start FULL opportunities when start date has passed")
        void shouldStartFullOpportunities() {
            // Arrange
            when(opportunityRepository.findOpportunitiesToStart(any(), any()))
                    .thenReturn(List.of(fullOpportunity));
            when(opportunityRepository.findOpportunitiesToComplete(any(), any()))
                    .thenReturn(List.of());
            when(opportunityRepository.save(any(Opportunity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            scheduler.updateOpportunityStatuses();

            // Assert
            verify(opportunityRepository).save(argThat(opp -> 
                    opp.getId().equals(2L) && opp.getStatus() == OpportunityStatus.IN_PROGRESS));
        }

        @Test
        @DisplayName("should complete IN_PROGRESS opportunities when end date has passed")
        void shouldCompleteInProgressOpportunities() {
            // Arrange
            when(opportunityRepository.findOpportunitiesToStart(any(), any()))
                    .thenReturn(List.of());
            when(opportunityRepository.findOpportunitiesToComplete(any(), any()))
                    .thenReturn(List.of(inProgressOpportunity));
            when(opportunityRepository.save(any(Opportunity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            scheduler.updateOpportunityStatuses();

            // Assert
            verify(opportunityRepository).save(argThat(opp -> 
                    opp.getId().equals(3L) && opp.getStatus() == OpportunityStatus.COMPLETED));
        }

        @Test
        @DisplayName("should handle multiple opportunities in same call")
        void shouldHandleMultipleOpportunities() {
            // Arrange
            when(opportunityRepository.findOpportunitiesToStart(any(), any()))
                    .thenReturn(List.of(openOpportunity, fullOpportunity));
            when(opportunityRepository.findOpportunitiesToComplete(any(), any()))
                    .thenReturn(List.of(inProgressOpportunity));
            when(opportunityRepository.save(any(Opportunity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            scheduler.updateOpportunityStatuses();

            // Assert
            verify(opportunityRepository, times(3)).save(any(Opportunity.class));
        }

        @Test
        @DisplayName("should do nothing when no opportunities need updates")
        void shouldDoNothingWhenNoOpportunitiesNeedUpdates() {
            // Arrange
            when(opportunityRepository.findOpportunitiesToStart(any(), any()))
                    .thenReturn(List.of());
            when(opportunityRepository.findOpportunitiesToComplete(any(), any()))
                    .thenReturn(List.of());

            // Act
            scheduler.updateOpportunityStatuses();

            // Assert
            verify(opportunityRepository, never()).save(any(Opportunity.class));
        }

        @Test
        @DisplayName("should query repository with correct statuses for starting")
        void shouldQueryRepositoryWithCorrectStatusesForStarting() {
            // Arrange
            when(opportunityRepository.findOpportunitiesToStart(any(), any()))
                    .thenReturn(List.of());
            when(opportunityRepository.findOpportunitiesToComplete(any(), any()))
                    .thenReturn(List.of());

            // Act
            scheduler.updateOpportunityStatuses();

            // Assert
            verify(opportunityRepository).findOpportunitiesToStart(
                    argThat(statuses -> statuses.contains(OpportunityStatus.OPEN) 
                            && statuses.contains(OpportunityStatus.FULL)),
                    any(LocalDateTime.class));
        }

        @Test
        @DisplayName("should query repository with IN_PROGRESS status for completing")
        void shouldQueryRepositoryWithInProgressStatusForCompleting() {
            // Arrange
            when(opportunityRepository.findOpportunitiesToStart(any(), any()))
                    .thenReturn(List.of());
            when(opportunityRepository.findOpportunitiesToComplete(any(), any()))
                    .thenReturn(List.of());

            // Act
            scheduler.updateOpportunityStatuses();

            // Assert
            verify(opportunityRepository).findOpportunitiesToComplete(
                    eq(OpportunityStatus.IN_PROGRESS),
                    any(LocalDateTime.class));
        }

        @Test
        @DisplayName("should save each opportunity individually")
        void shouldSaveEachOpportunityIndividually() {
            // Arrange
            Opportunity anotherOpenOpp = Opportunity.builder()
                    .id(4L)
                    .title("Another Open")
                    .description("Test")
                    .pointsReward(25)
                    .startDate(LocalDateTime.now().minusMinutes(30))
                    .endDate(LocalDateTime.now().plusHours(2))
                    .maxVolunteers(3)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoter)
                    .build();

            when(opportunityRepository.findOpportunitiesToStart(any(), any()))
                    .thenReturn(List.of(openOpportunity, anotherOpenOpp));
            when(opportunityRepository.findOpportunitiesToComplete(any(), any()))
                    .thenReturn(List.of());
            when(opportunityRepository.save(any(Opportunity.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // Act
            scheduler.updateOpportunityStatuses();

            // Assert
            verify(opportunityRepository, times(2)).save(any(Opportunity.class));
            verify(opportunityRepository).save(argThat(opp -> opp.getId().equals(1L)));
            verify(opportunityRepository).save(argThat(opp -> opp.getId().equals(4L)));
        }
    }
}
