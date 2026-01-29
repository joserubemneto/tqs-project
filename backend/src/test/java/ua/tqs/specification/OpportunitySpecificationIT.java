package ua.tqs.specification;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import ua.tqs.dto.OpportunityFilterRequest;
import ua.tqs.model.Opportunity;
import ua.tqs.model.Skill;
import ua.tqs.model.User;
import ua.tqs.model.enums.OpportunityStatus;
import ua.tqs.model.enums.SkillCategory;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.OpportunityRepository;
import ua.tqs.repository.SkillRepository;
import ua.tqs.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OpportunitySpecificationIT {

    @Autowired
    private OpportunityRepository opportunityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    private User promoter;
    private Skill communicationSkill;
    private Skill leadershipSkill;
    private Skill technicalSkill;
    private Pageable pageable;

    private Opportunity lowPointsOpportunity;
    private Opportunity highPointsOpportunity;
    private Opportunity futureOpportunity;
    private Opportunity draftOpportunity;

    @BeforeEach
    void setUp() {
        opportunityRepository.deleteAll();
        skillRepository.deleteAll();
        userRepository.deleteAll();

        pageable = PageRequest.of(0, 10);

        // Create promoter
        promoter = User.builder()
                .email("promoter@ua.pt")
                .password("encoded")
                .name("Test Promoter")
                .role(UserRole.PROMOTER)
                .points(0)
                .build();
        promoter = userRepository.save(promoter);

        // Create skills
        communicationSkill = Skill.builder()
                .name("Communication")
                .category(SkillCategory.COMMUNICATION)
                .description("Communication skills")
                .build();
        communicationSkill = skillRepository.save(communicationSkill);

        leadershipSkill = Skill.builder()
                .name("Leadership")
                .category(SkillCategory.LEADERSHIP)
                .description("Leadership skills")
                .build();
        leadershipSkill = skillRepository.save(leadershipSkill);

        technicalSkill = Skill.builder()
                .name("Technical")
                .category(SkillCategory.TECHNICAL)
                .description("Technical skills")
                .build();
        technicalSkill = skillRepository.save(technicalSkill);

        // Create opportunities with different characteristics
        Set<Skill> commSkills = new HashSet<>();
        commSkills.add(communicationSkill);

        Set<Skill> leaderSkills = new HashSet<>();
        leaderSkills.add(leadershipSkill);

        Set<Skill> techSkills = new HashSet<>();
        techSkills.add(technicalSkill);

        Set<Skill> multipleSkills = new HashSet<>();
        multipleSkills.add(communicationSkill);
        multipleSkills.add(leadershipSkill);

        // Low points opportunity (30 points) - starts in 5 days
        lowPointsOpportunity = Opportunity.builder()
                .title("Low Points Opportunity")
                .description("An opportunity with low points")
                .pointsReward(30)
                .startDate(LocalDateTime.now().plusDays(5))
                .endDate(LocalDateTime.now().plusDays(10))
                .maxVolunteers(5)
                .status(OpportunityStatus.OPEN)
                .promoter(promoter)
                .requiredSkills(commSkills)
                .build();
        lowPointsOpportunity = opportunityRepository.save(lowPointsOpportunity);

        // High points opportunity (100 points) - starts in 10 days
        highPointsOpportunity = Opportunity.builder()
                .title("High Points Opportunity")
                .description("An opportunity with high points")
                .pointsReward(100)
                .startDate(LocalDateTime.now().plusDays(10))
                .endDate(LocalDateTime.now().plusDays(15))
                .maxVolunteers(10)
                .status(OpportunityStatus.OPEN)
                .promoter(promoter)
                .requiredSkills(leaderSkills)
                .build();
        highPointsOpportunity = opportunityRepository.save(highPointsOpportunity);

        // Future opportunity (50 points) - starts in 30 days with multiple skills
        futureOpportunity = Opportunity.builder()
                .title("Future Opportunity")
                .description("An opportunity far in the future")
                .pointsReward(50)
                .startDate(LocalDateTime.now().plusDays(30))
                .endDate(LocalDateTime.now().plusDays(35))
                .maxVolunteers(8)
                .status(OpportunityStatus.OPEN)
                .promoter(promoter)
                .requiredSkills(multipleSkills)
                .build();
        futureOpportunity = opportunityRepository.save(futureOpportunity);

        // Draft opportunity (should not appear in OPEN queries)
        draftOpportunity = Opportunity.builder()
                .title("Draft Opportunity")
                .description("A draft opportunity")
                .pointsReward(40)
                .startDate(LocalDateTime.now().plusDays(7))
                .endDate(LocalDateTime.now().plusDays(12))
                .maxVolunteers(3)
                .status(OpportunityStatus.DRAFT)
                .promoter(promoter)
                .requiredSkills(techSkills)
                .build();
        draftOpportunity = opportunityRepository.save(draftOpportunity);
    }

    @Nested
    @DisplayName("Status Filter")
    class StatusFilter {

        @Test
        @DisplayName("should only return opportunities with OPEN status")
        void shouldOnlyReturnOpenOpportunities() {
            // Arrange
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(null, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(3);
            assertThat(result.getContent())
                    .extracting(Opportunity::getStatus)
                    .containsOnly(OpportunityStatus.OPEN);
            assertThat(result.getContent())
                    .extracting(Opportunity::getTitle)
                    .doesNotContain("Draft Opportunity");
        }

        @Test
        @DisplayName("should return opportunities with DRAFT status when specified")
        void shouldReturnDraftOpportunities() {
            // Arrange
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(null, OpportunityStatus.DRAFT);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("Draft Opportunity");
        }
    }

    @Nested
    @DisplayName("Skill Filter")
    class SkillFilter {

        @Test
        @DisplayName("should filter by single skill ID")
        void shouldFilterBySingleSkillId() {
            // Arrange
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .skillIds(List.of(communicationSkill.getId()))
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent())
                    .extracting(Opportunity::getTitle)
                    .containsExactlyInAnyOrder("Low Points Opportunity", "Future Opportunity");
        }

        @Test
        @DisplayName("should filter by multiple skill IDs with OR logic")
        void shouldFilterByMultipleSkillIdsWithOrLogic() {
            // Arrange
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .skillIds(List.of(communicationSkill.getId(), leadershipSkill.getId()))
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(3);
            assertThat(result.getContent())
                    .extracting(Opportunity::getTitle)
                    .containsExactlyInAnyOrder("Low Points Opportunity", "High Points Opportunity", "Future Opportunity");
        }

        @Test
        @DisplayName("should return no results when filtering by non-existent skill")
        void shouldReturnNoResultsForNonExistentSkill() {
            // Arrange
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .skillIds(List.of(9999L))
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).isEmpty();
        }

        @Test
        @DisplayName("should not filter when skill list is empty")
        void shouldNotFilterWhenSkillListIsEmpty() {
            // Arrange
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .skillIds(List.of())
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(3); // All OPEN opportunities
        }
    }

    @Nested
    @DisplayName("Date Range Filter")
    class DateRangeFilter {

        @Test
        @DisplayName("should filter by start date from")
        void shouldFilterByStartDateFrom() {
            // Arrange
            LocalDateTime fromDate = LocalDateTime.now().plusDays(8);
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .startDateFrom(fromDate)
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent())
                    .extracting(Opportunity::getTitle)
                    .containsExactlyInAnyOrder("High Points Opportunity", "Future Opportunity");
        }

        @Test
        @DisplayName("should filter by start date to")
        void shouldFilterByStartDateTo() {
            // Arrange
            LocalDateTime toDate = LocalDateTime.now().plusDays(8);
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .startDateTo(toDate)
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("Low Points Opportunity");
        }

        @Test
        @DisplayName("should filter by date range")
        void shouldFilterByDateRange() {
            // Arrange
            LocalDateTime fromDate = LocalDateTime.now().plusDays(8);
            LocalDateTime toDate = LocalDateTime.now().plusDays(15);
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .startDateFrom(fromDate)
                    .startDateTo(toDate)
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("High Points Opportunity");
        }

        @Test
        @DisplayName("should return empty when no opportunities in date range")
        void shouldReturnEmptyWhenNoOpportunitiesInDateRange() {
            // Arrange
            LocalDateTime fromDate = LocalDateTime.now().plusDays(100);
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .startDateFrom(fromDate)
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).isEmpty();
        }
    }

    @Nested
    @DisplayName("Points Range Filter")
    class PointsRangeFilter {

        @Test
        @DisplayName("should filter by minimum points")
        void shouldFilterByMinPoints() {
            // Arrange
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .minPoints(50)
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent())
                    .extracting(Opportunity::getTitle)
                    .containsExactlyInAnyOrder("High Points Opportunity", "Future Opportunity");
        }

        @Test
        @DisplayName("should filter by maximum points")
        void shouldFilterByMaxPoints() {
            // Arrange
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .maxPoints(50)
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent())
                    .extracting(Opportunity::getTitle)
                    .containsExactlyInAnyOrder("Low Points Opportunity", "Future Opportunity");
        }

        @Test
        @DisplayName("should filter by points range")
        void shouldFilterByPointsRange() {
            // Arrange
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .minPoints(40)
                    .maxPoints(60)
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("Future Opportunity");
        }

        @Test
        @DisplayName("should include boundaries in points filter")
        void shouldIncludeBoundariesInPointsFilter() {
            // Arrange - filter for exactly 30 points (lowPointsOpportunity)
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .minPoints(30)
                    .maxPoints(30)
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getPointsReward()).isEqualTo(30);
        }
    }

    @Nested
    @DisplayName("Combined Filters")
    class CombinedFilters {

        @Test
        @DisplayName("should apply all filters together")
        void shouldApplyAllFiltersTogether() {
            // Arrange - filter for communication skill, starting within 20 days, 20-60 points
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .skillIds(List.of(communicationSkill.getId()))
                    .startDateFrom(LocalDateTime.now())
                    .startDateTo(LocalDateTime.now().plusDays(20))
                    .minPoints(20)
                    .maxPoints(60)
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("Low Points Opportunity");
        }

        @Test
        @DisplayName("should return empty when combined filters have no matches")
        void shouldReturnEmptyWhenCombinedFiltersHaveNoMatches() {
            // Arrange - impossible combination
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .skillIds(List.of(communicationSkill.getId()))
                    .minPoints(200) // No opportunity has 200+ points
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).isEmpty();
        }

        @Test
        @DisplayName("should combine skill and date filters")
        void shouldCombineSkillAndDateFilters() {
            // Arrange
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .skillIds(List.of(leadershipSkill.getId()))
                    .startDateFrom(LocalDateTime.now().plusDays(25))
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("Future Opportunity");
        }
    }

    @Nested
    @DisplayName("Null and Empty Filters")
    class NullAndEmptyFilters {

        @Test
        @DisplayName("should return all open opportunities when filter is null")
        void shouldReturnAllWhenFilterIsNull() {
            // Arrange
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(null, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(3);
        }

        @Test
        @DisplayName("should return all open opportunities when filter is empty")
        void shouldReturnAllWhenFilterIsEmpty() {
            // Arrange
            OpportunityFilterRequest filter = new OpportunityFilterRequest();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(3);
        }

        @Test
        @DisplayName("should handle filter with only null values")
        void shouldHandleFilterWithOnlyNullValues() {
            // Arrange
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .skillIds(null)
                    .startDateFrom(null)
                    .startDateTo(null)
                    .minPoints(null)
                    .maxPoints(null)
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(3);
        }
    }

    @Nested
    @DisplayName("Distinct Results")
    class DistinctResults {

        @Test
        @DisplayName("should not return duplicates when opportunity matches multiple skills")
        void shouldNotReturnDuplicatesForMultipleSkillMatches() {
            // Arrange - Future opportunity has both communication and leadership skills
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .skillIds(List.of(communicationSkill.getId(), leadershipSkill.getId()))
                    .build();
            Specification<Opportunity> spec = OpportunitySpecification.withFilters(filter, OpportunityStatus.OPEN);

            // Act
            Page<Opportunity> result = opportunityRepository.findAll(spec, pageable);

            // Assert
            // Should be 3 distinct opportunities, not 4 (Future Opportunity should not be duplicated)
            assertThat(result.getContent()).hasSize(3);
            
            // Verify Future Opportunity appears only once
            long futureCount = result.getContent().stream()
                    .filter(o -> o.getTitle().equals("Future Opportunity"))
                    .count();
            assertThat(futureCount).isEqualTo(1);
        }
    }
}
