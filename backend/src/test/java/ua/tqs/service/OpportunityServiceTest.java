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
import org.springframework.data.jpa.domain.Specification;
import ua.tqs.dto.CreateOpportunityRequest;
import ua.tqs.dto.OpportunityFilterRequest;
import ua.tqs.dto.OpportunityResponse;
import ua.tqs.exception.OpportunityNotFoundException;
import ua.tqs.exception.OpportunityValidationException;
import ua.tqs.exception.UserNotFoundException;
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
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OpportunityServiceTest {

    @Mock
    private OpportunityRepository opportunityRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private SkillRepository skillRepository;

    @InjectMocks
    private OpportunityService opportunityService;

    private User promoter;
    private Skill communicationSkill;
    private Skill leadershipSkill;
    private CreateOpportunityRequest validRequest;
    private Opportunity savedOpportunity;

    @BeforeEach
    void setUp() {
        promoter = User.builder()
                .id(1L)
                .email("promoter@ua.pt")
                .password("encoded")
                .name("Sample Promoter")
                .role(UserRole.PROMOTER)
                .points(0)
                .build();

        communicationSkill = Skill.builder()
                .id(1L)
                .name("Communication")
                .category(SkillCategory.COMMUNICATION)
                .description("Effective verbal and written communication")
                .build();

        leadershipSkill = Skill.builder()
                .id(2L)
                .name("Leadership")
                .category(SkillCategory.LEADERSHIP)
                .description("Ability to lead and motivate teams")
                .build();

        LocalDateTime startDate = LocalDateTime.now().plusDays(1);
        LocalDateTime endDate = LocalDateTime.now().plusDays(7);

        validRequest = CreateOpportunityRequest.builder()
                .title("UA Open Day Support")
                .description("Help with university open day activities")
                .pointsReward(50)
                .startDate(startDate)
                .endDate(endDate)
                .maxVolunteers(10)
                .location("University Campus")
                .requiredSkillIds(Set.of(1L, 2L))
                .build();

        Set<Skill> requiredSkills = new HashSet<>();
        requiredSkills.add(communicationSkill);
        requiredSkills.add(leadershipSkill);

        savedOpportunity = Opportunity.builder()
                .id(1L)
                .title("UA Open Day Support")
                .description("Help with university open day activities")
                .pointsReward(50)
                .startDate(startDate)
                .endDate(endDate)
                .maxVolunteers(10)
                .status(OpportunityStatus.DRAFT)
                .location("University Campus")
                .promoter(promoter)
                .requiredSkills(requiredSkills)
                .build();
    }

    @Nested
    @DisplayName("createOpportunity()")
    class CreateOpportunityMethod {

        @Test
        @DisplayName("should create opportunity with valid data")
        void shouldCreateOpportunityWithValidData() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(promoter));
            when(skillRepository.findById(1L)).thenReturn(Optional.of(communicationSkill));
            when(skillRepository.findById(2L)).thenReturn(Optional.of(leadershipSkill));
            when(opportunityRepository.save(any(Opportunity.class))).thenReturn(savedOpportunity);

            // Act
            OpportunityResponse response = opportunityService.createOpportunity(1L, validRequest);

            // Assert
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getTitle()).isEqualTo("UA Open Day Support");
            assertThat(response.getDescription()).isEqualTo("Help with university open day activities");
            assertThat(response.getPointsReward()).isEqualTo(50);
            assertThat(response.getMaxVolunteers()).isEqualTo(10);
            assertThat(response.getStatus()).isEqualTo(OpportunityStatus.DRAFT);
            assertThat(response.getLocation()).isEqualTo("University Campus");
            assertThat(response.getPromoter().getId()).isEqualTo(1L);
            assertThat(response.getRequiredSkills()).hasSize(2);
        }

        @Test
        @DisplayName("should set status to DRAFT by default")
        void shouldSetStatusToDraft() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(promoter));
            when(skillRepository.findById(1L)).thenReturn(Optional.of(communicationSkill));
            when(skillRepository.findById(2L)).thenReturn(Optional.of(leadershipSkill));
            when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(inv -> {
                Opportunity opp = inv.getArgument(0);
                opp.setId(1L);
                return opp;
            });

            // Act
            OpportunityResponse response = opportunityService.createOpportunity(1L, validRequest);

            // Assert
            verify(opportunityRepository).save(argThat(opp -> 
                opp.getStatus() == OpportunityStatus.DRAFT
            ));
        }

        @Test
        @DisplayName("should throw exception when end date is before start date")
        void shouldThrowExceptionWhenEndDateBeforeStartDate() {
            // Arrange
            CreateOpportunityRequest invalidRequest = CreateOpportunityRequest.builder()
                    .title("Test")
                    .description("Test description")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(7))
                    .endDate(LocalDateTime.now().plusDays(1))
                    .maxVolunteers(10)
                    .requiredSkillIds(Set.of(1L))
                    .build();

            // Act & Assert
            assertThatThrownBy(() -> opportunityService.createOpportunity(1L, invalidRequest))
                    .isInstanceOf(OpportunityValidationException.class)
                    .hasMessage("End date must be after start date");

            verify(opportunityRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw exception when end date equals start date")
        void shouldThrowExceptionWhenEndDateEqualsStartDate() {
            // Arrange
            LocalDateTime sameDate = LocalDateTime.now().plusDays(1);
            CreateOpportunityRequest invalidRequest = CreateOpportunityRequest.builder()
                    .title("Test")
                    .description("Test description")
                    .pointsReward(50)
                    .startDate(sameDate)
                    .endDate(sameDate)
                    .maxVolunteers(10)
                    .requiredSkillIds(Set.of(1L))
                    .build();

            // Act & Assert
            assertThatThrownBy(() -> opportunityService.createOpportunity(1L, invalidRequest))
                    .isInstanceOf(OpportunityValidationException.class)
                    .hasMessage("End date must be after start date");
        }

        @Test
        @DisplayName("should throw exception when no skills provided")
        void shouldThrowExceptionWhenNoSkillsProvided() {
            // Arrange
            CreateOpportunityRequest invalidRequest = CreateOpportunityRequest.builder()
                    .title("Test")
                    .description("Test description")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .requiredSkillIds(Set.of())
                    .build();

            // Act & Assert
            assertThatThrownBy(() -> opportunityService.createOpportunity(1L, invalidRequest))
                    .isInstanceOf(OpportunityValidationException.class)
                    .hasMessage("At least one skill is required");
        }

        @Test
        @DisplayName("should throw exception when skills are null")
        void shouldThrowExceptionWhenSkillsAreNull() {
            // Arrange
            CreateOpportunityRequest invalidRequest = CreateOpportunityRequest.builder()
                    .title("Test")
                    .description("Test description")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .requiredSkillIds(null)
                    .build();

            // Act & Assert
            assertThatThrownBy(() -> opportunityService.createOpportunity(1L, invalidRequest))
                    .isInstanceOf(OpportunityValidationException.class)
                    .hasMessage("At least one skill is required");
        }

        @Test
        @DisplayName("should throw exception when promoter not found")
        void shouldThrowExceptionWhenPromoterNotFound() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> opportunityService.createOpportunity(999L, validRequest))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessageContaining("999");

            verify(opportunityRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw exception when skill not found")
        void shouldThrowExceptionWhenSkillNotFound() {
            // Arrange - use request with single skill to avoid Set iteration order issues
            CreateOpportunityRequest singleSkillRequest = CreateOpportunityRequest.builder()
                    .title("Test")
                    .description("Test description")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .requiredSkillIds(Set.of(999L))
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(promoter));
            when(skillRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> opportunityService.createOpportunity(1L, singleSkillRequest))
                    .isInstanceOf(OpportunityValidationException.class)
                    .hasMessageContaining("Skill not found with id: 999");

            verify(opportunityRepository, never()).save(any());
        }

        @Test
        @DisplayName("should create opportunity without location")
        void shouldCreateOpportunityWithoutLocation() {
            // Arrange
            CreateOpportunityRequest requestWithoutLocation = CreateOpportunityRequest.builder()
                    .title("UA Open Day Support")
                    .description("Help with university open day activities")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(1))
                    .endDate(LocalDateTime.now().plusDays(7))
                    .maxVolunteers(10)
                    .location(null)
                    .requiredSkillIds(Set.of(1L))
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(promoter));
            when(skillRepository.findById(1L)).thenReturn(Optional.of(communicationSkill));
            when(opportunityRepository.save(any(Opportunity.class))).thenAnswer(inv -> {
                Opportunity opp = inv.getArgument(0);
                opp.setId(1L);
                return opp;
            });

            // Act
            OpportunityResponse response = opportunityService.createOpportunity(1L, requestWithoutLocation);

            // Assert
            assertThat(response.getLocation()).isNull();
        }

        @Test
        @DisplayName("should associate promoter correctly")
        void shouldAssociatePromoterCorrectly() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(promoter));
            when(skillRepository.findById(1L)).thenReturn(Optional.of(communicationSkill));
            when(skillRepository.findById(2L)).thenReturn(Optional.of(leadershipSkill));
            when(opportunityRepository.save(any(Opportunity.class))).thenReturn(savedOpportunity);

            // Act
            OpportunityResponse response = opportunityService.createOpportunity(1L, validRequest);

            // Assert
            assertThat(response.getPromoter()).isNotNull();
            assertThat(response.getPromoter().getEmail()).isEqualTo("promoter@ua.pt");
            assertThat(response.getPromoter().getName()).isEqualTo("Sample Promoter");
        }
    }

    @Nested
    @DisplayName("getOpportunitiesByPromoter()")
    class GetOpportunitiesByPromoterMethod {

        @Test
        @DisplayName("should return all opportunities for promoter")
        void shouldReturnAllOpportunitiesForPromoter() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(promoter));
            when(opportunityRepository.findByPromoter(promoter)).thenReturn(List.of(savedOpportunity));

            // Act
            List<OpportunityResponse> opportunities = opportunityService.getOpportunitiesByPromoter(1L);

            // Assert
            assertThat(opportunities).hasSize(1);
            assertThat(opportunities.get(0).getTitle()).isEqualTo("UA Open Day Support");
        }

        @Test
        @DisplayName("should return empty list when promoter has no opportunities")
        void shouldReturnEmptyListWhenNoOpportunities() {
            // Arrange
            when(userRepository.findById(1L)).thenReturn(Optional.of(promoter));
            when(opportunityRepository.findByPromoter(promoter)).thenReturn(List.of());

            // Act
            List<OpportunityResponse> opportunities = opportunityService.getOpportunitiesByPromoter(1L);

            // Assert
            assertThat(opportunities).isEmpty();
        }

        @Test
        @DisplayName("should throw exception when promoter not found")
        void shouldThrowExceptionWhenPromoterNotFound() {
            // Arrange
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> opportunityService.getOpportunitiesByPromoter(999L))
                    .isInstanceOf(UserNotFoundException.class)
                    .hasMessageContaining("999");
        }

        @Test
        @DisplayName("should return multiple opportunities")
        void shouldReturnMultipleOpportunities() {
            // Arrange
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            Opportunity secondOpportunity = Opportunity.builder()
                    .id(2L)
                    .title("Another Event")
                    .description("Another event description")
                    .pointsReward(30)
                    .startDate(LocalDateTime.now().plusDays(10))
                    .endDate(LocalDateTime.now().plusDays(15))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoter)
                    .requiredSkills(skills)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(promoter));
            when(opportunityRepository.findByPromoter(promoter)).thenReturn(List.of(savedOpportunity, secondOpportunity));

            // Act
            List<OpportunityResponse> opportunities = opportunityService.getOpportunitiesByPromoter(1L);

            // Assert
            assertThat(opportunities).hasSize(2);
        }
    }

    @Nested
    @DisplayName("getOpportunityById()")
    class GetOpportunityByIdMethod {

        @Test
        @DisplayName("should return opportunity when found")
        void shouldReturnOpportunityWhenFound() {
            // Arrange
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(savedOpportunity));

            // Act
            OpportunityResponse response = opportunityService.getOpportunityById(1L);

            // Assert
            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getTitle()).isEqualTo("UA Open Day Support");
            assertThat(response.getDescription()).isEqualTo("Help with university open day activities");
            assertThat(response.getPointsReward()).isEqualTo(50);
            assertThat(response.getMaxVolunteers()).isEqualTo(10);
            assertThat(response.getStatus()).isEqualTo(OpportunityStatus.DRAFT);
            assertThat(response.getLocation()).isEqualTo("University Campus");
        }

        @Test
        @DisplayName("should return opportunity with promoter details")
        void shouldReturnOpportunityWithPromoterDetails() {
            // Arrange
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(savedOpportunity));

            // Act
            OpportunityResponse response = opportunityService.getOpportunityById(1L);

            // Assert
            assertThat(response.getPromoter()).isNotNull();
            assertThat(response.getPromoter().getId()).isEqualTo(1L);
            assertThat(response.getPromoter().getEmail()).isEqualTo("promoter@ua.pt");
            assertThat(response.getPromoter().getName()).isEqualTo("Sample Promoter");
        }

        @Test
        @DisplayName("should return opportunity with required skills")
        void shouldReturnOpportunityWithRequiredSkills() {
            // Arrange
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(savedOpportunity));

            // Act
            OpportunityResponse response = opportunityService.getOpportunityById(1L);

            // Assert
            assertThat(response.getRequiredSkills()).isNotNull();
            assertThat(response.getRequiredSkills()).hasSize(2);
        }

        @Test
        @DisplayName("should throw OpportunityNotFoundException when not found")
        void shouldThrowExceptionWhenNotFound() {
            // Arrange
            when(opportunityRepository.findById(999L)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> opportunityService.getOpportunityById(999L))
                    .isInstanceOf(OpportunityNotFoundException.class)
                    .hasMessageContaining("999");
        }

        @Test
        @DisplayName("should call repository findById")
        void shouldCallRepositoryFindById() {
            // Arrange
            when(opportunityRepository.findById(1L)).thenReturn(Optional.of(savedOpportunity));

            // Act
            opportunityService.getOpportunityById(1L);

            // Assert
            verify(opportunityRepository).findById(1L);
        }
    }

    @Nested
    @DisplayName("getAllOpenOpportunities()")
    class GetAllOpenOpportunitiesMethod {

        private Opportunity openOpportunity;

        @BeforeEach
        void setUpOpenOpportunity() {
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            openOpportunity = Opportunity.builder()
                    .id(2L)
                    .title("Open Opportunity")
                    .description("An open opportunity for volunteers")
                    .pointsReward(30)
                    .startDate(LocalDateTime.now().plusDays(5))
                    .endDate(LocalDateTime.now().plusDays(10))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoter)
                    .requiredSkills(skills)
                    .build();
        }

        @Test
        @DisplayName("should return page of open opportunities")
        void shouldReturnPageOfOpenOpportunities() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Opportunity> opportunityPage = new PageImpl<>(List.of(openOpportunity), pageable, 1);
            when(opportunityRepository.findByStatus(OpportunityStatus.OPEN, pageable))
                    .thenReturn(opportunityPage);

            // Act
            Page<OpportunityResponse> result = opportunityService.getAllOpenOpportunities(pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("Open Opportunity");
            assertThat(result.getContent().get(0).getStatus()).isEqualTo(OpportunityStatus.OPEN);
        }

        @Test
        @DisplayName("should return empty page when no open opportunities")
        void shouldReturnEmptyPageWhenNoOpenOpportunities() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Opportunity> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            when(opportunityRepository.findByStatus(OpportunityStatus.OPEN, pageable))
                    .thenReturn(emptyPage);

            // Act
            Page<OpportunityResponse> result = opportunityService.getAllOpenOpportunities(pageable);

            // Assert
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
        }

        @Test
        @DisplayName("should respect pagination parameters")
        void shouldRespectPaginationParameters() {
            // Arrange
            Pageable pageable = PageRequest.of(2, 5);
            Page<Opportunity> opportunityPage = new PageImpl<>(List.of(openOpportunity), pageable, 11);
            when(opportunityRepository.findByStatus(OpportunityStatus.OPEN, pageable))
                    .thenReturn(opportunityPage);

            // Act
            Page<OpportunityResponse> result = opportunityService.getAllOpenOpportunities(pageable);

            // Assert
            assertThat(result.getNumber()).isEqualTo(2);
            assertThat(result.getSize()).isEqualTo(5);
            assertThat(result.getTotalElements()).isEqualTo(11);
        }

        @Test
        @DisplayName("should query repository with OPEN status")
        void shouldQueryRepositoryWithOpenStatus() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Opportunity> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            when(opportunityRepository.findByStatus(OpportunityStatus.OPEN, pageable))
                    .thenReturn(emptyPage);

            // Act
            opportunityService.getAllOpenOpportunities(pageable);

            // Assert
            verify(opportunityRepository).findByStatus(OpportunityStatus.OPEN, pageable);
        }

        @Test
        @DisplayName("should map Opportunity to OpportunityResponse correctly")
        void shouldMapOpportunityToResponseCorrectly() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Opportunity> opportunityPage = new PageImpl<>(List.of(openOpportunity), pageable, 1);
            when(opportunityRepository.findByStatus(OpportunityStatus.OPEN, pageable))
                    .thenReturn(opportunityPage);

            // Act
            Page<OpportunityResponse> result = opportunityService.getAllOpenOpportunities(pageable);

            // Assert
            OpportunityResponse response = result.getContent().get(0);
            assertThat(response.getId()).isEqualTo(2L);
            assertThat(response.getTitle()).isEqualTo("Open Opportunity");
            assertThat(response.getDescription()).isEqualTo("An open opportunity for volunteers");
            assertThat(response.getPointsReward()).isEqualTo(30);
            assertThat(response.getMaxVolunteers()).isEqualTo(5);
            assertThat(response.getStatus()).isEqualTo(OpportunityStatus.OPEN);
            assertThat(response.getPromoter()).isNotNull();
            assertThat(response.getRequiredSkills()).hasSize(1);
        }

        @Test
        @DisplayName("should return multiple pages of opportunities")
        void shouldReturnMultiplePagesOfOpportunities() {
            // Arrange
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            Opportunity secondOpportunity = Opportunity.builder()
                    .id(3L)
                    .title("Second Open Opportunity")
                    .description("Another open opportunity")
                    .pointsReward(40)
                    .startDate(LocalDateTime.now().plusDays(7))
                    .endDate(LocalDateTime.now().plusDays(14))
                    .maxVolunteers(8)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoter)
                    .requiredSkills(skills)
                    .build();

            Pageable pageable = PageRequest.of(0, 10);
            Page<Opportunity> opportunityPage = new PageImpl<>(List.of(openOpportunity, secondOpportunity), pageable, 2);
            when(opportunityRepository.findByStatus(OpportunityStatus.OPEN, pageable))
                    .thenReturn(opportunityPage);

            // Act
            Page<OpportunityResponse> result = opportunityService.getAllOpenOpportunities(pageable);

            // Assert
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2);
        }
    }

    @Nested
    @DisplayName("getFilteredOpportunities()")
    class GetFilteredOpportunitiesMethod {

        private Opportunity openOpportunity;

        @BeforeEach
        void setUpOpenOpportunity() {
            Set<Skill> skills = new HashSet<>();
            skills.add(communicationSkill);

            openOpportunity = Opportunity.builder()
                    .id(2L)
                    .title("Open Opportunity")
                    .description("An open opportunity for volunteers")
                    .pointsReward(50)
                    .startDate(LocalDateTime.now().plusDays(5))
                    .endDate(LocalDateTime.now().plusDays(10))
                    .maxVolunteers(5)
                    .status(OpportunityStatus.OPEN)
                    .promoter(promoter)
                    .requiredSkills(skills)
                    .build();
        }

        @Test
        @DisplayName("should return opportunities without filters")
        @SuppressWarnings("unchecked")
        void shouldReturnOpportunitiesWithoutFilters() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Opportunity> opportunityPage = new PageImpl<>(List.of(openOpportunity), pageable, 1);
            when(opportunityRepository.findAll(any(Specification.class), eq(pageable)))
                    .thenReturn(opportunityPage);

            // Act
            Page<OpportunityResponse> result = opportunityService.getFilteredOpportunities(null, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("Open Opportunity");
        }

        @Test
        @DisplayName("should return opportunities with empty filter")
        @SuppressWarnings("unchecked")
        void shouldReturnOpportunitiesWithEmptyFilter() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Opportunity> opportunityPage = new PageImpl<>(List.of(openOpportunity), pageable, 1);
            OpportunityFilterRequest emptyFilter = new OpportunityFilterRequest();
            when(opportunityRepository.findAll(any(Specification.class), eq(pageable)))
                    .thenReturn(opportunityPage);

            // Act
            Page<OpportunityResponse> result = opportunityService.getFilteredOpportunities(emptyFilter, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("should filter by skill IDs")
        @SuppressWarnings("unchecked")
        void shouldFilterBySkillIds() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Opportunity> opportunityPage = new PageImpl<>(List.of(openOpportunity), pageable, 1);
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .skillIds(List.of(1L))
                    .build();
            when(opportunityRepository.findAll(any(Specification.class), eq(pageable)))
                    .thenReturn(opportunityPage);

            // Act
            Page<OpportunityResponse> result = opportunityService.getFilteredOpportunities(filter, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            verify(opportunityRepository).findAll(any(Specification.class), eq(pageable));
        }

        @Test
        @DisplayName("should filter by date range")
        @SuppressWarnings("unchecked")
        void shouldFilterByDateRange() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Opportunity> opportunityPage = new PageImpl<>(List.of(openOpportunity), pageable, 1);
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .startDateFrom(LocalDateTime.now())
                    .startDateTo(LocalDateTime.now().plusDays(30))
                    .build();
            when(opportunityRepository.findAll(any(Specification.class), eq(pageable)))
                    .thenReturn(opportunityPage);

            // Act
            Page<OpportunityResponse> result = opportunityService.getFilteredOpportunities(filter, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            verify(opportunityRepository).findAll(any(Specification.class), eq(pageable));
        }

        @Test
        @DisplayName("should filter by points range")
        @SuppressWarnings("unchecked")
        void shouldFilterByPointsRange() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Opportunity> opportunityPage = new PageImpl<>(List.of(openOpportunity), pageable, 1);
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .minPoints(30)
                    .maxPoints(100)
                    .build();
            when(opportunityRepository.findAll(any(Specification.class), eq(pageable)))
                    .thenReturn(opportunityPage);

            // Act
            Page<OpportunityResponse> result = opportunityService.getFilteredOpportunities(filter, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            verify(opportunityRepository).findAll(any(Specification.class), eq(pageable));
        }

        @Test
        @DisplayName("should apply all filters together")
        @SuppressWarnings("unchecked")
        void shouldApplyAllFiltersTogether() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Opportunity> opportunityPage = new PageImpl<>(List.of(openOpportunity), pageable, 1);
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .skillIds(List.of(1L, 2L))
                    .startDateFrom(LocalDateTime.now())
                    .startDateTo(LocalDateTime.now().plusDays(30))
                    .minPoints(20)
                    .maxPoints(100)
                    .build();
            when(opportunityRepository.findAll(any(Specification.class), eq(pageable)))
                    .thenReturn(opportunityPage);

            // Act
            Page<OpportunityResponse> result = opportunityService.getFilteredOpportunities(filter, pageable);

            // Assert
            assertThat(result.getContent()).hasSize(1);
            assertThat(filter.hasFilters()).isTrue();
        }

        @Test
        @DisplayName("should return empty page when no matches")
        @SuppressWarnings("unchecked")
        void shouldReturnEmptyPageWhenNoMatches() {
            // Arrange
            Pageable pageable = PageRequest.of(0, 10);
            Page<Opportunity> emptyPage = new PageImpl<>(List.of(), pageable, 0);
            OpportunityFilterRequest filter = OpportunityFilterRequest.builder()
                    .minPoints(1000)
                    .build();
            when(opportunityRepository.findAll(any(Specification.class), eq(pageable)))
                    .thenReturn(emptyPage);

            // Act
            Page<OpportunityResponse> result = opportunityService.getFilteredOpportunities(filter, pageable);

            // Assert
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isZero();
        }
    }
}
