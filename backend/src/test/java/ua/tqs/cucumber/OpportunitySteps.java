package ua.tqs.cucumber;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.Before;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import ua.tqs.dto.CreateOpportunityRequest;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.OpportunityRepository;
import ua.tqs.repository.SkillRepository;
import ua.tqs.repository.UserRepository;
import ua.tqs.service.JwtService;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

import ua.tqs.dto.UpdateOpportunityRequest;
import ua.tqs.model.Application;
import ua.tqs.model.Opportunity;
import ua.tqs.model.enums.ApplicationStatus;
import ua.tqs.model.enums.OpportunityStatus;
import ua.tqs.repository.ApplicationRepository;

public class OpportunitySteps {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SkillRepository skillRepository;

    @Autowired
    private OpportunityRepository opportunityRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private SharedTestContext context;

    private ObjectMapper objectMapper;

    private User currentUser;

    // Request builder fields
    private String title = "Test Opportunity";
    private String description = "Test description";
    private Integer pointsReward = 50;
    private Integer maxVolunteers = 10;
    private String location = null;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Set<Long> requiredSkillIds;

    // Edit/Cancel context
    private Long currentOpportunityId;
    private Long otherOpportunityId;
    private User otherPromoter;

    @Before
    public void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        applicationRepository.deleteAll();
        opportunityRepository.deleteAll();
        userRepository.deleteAll();
        skillRepository.deleteAll();
        context.reset();
        currentUser = null;

        // Reset request fields
        title = "Test Opportunity";
        description = "Test description";
        pointsReward = 50;
        maxVolunteers = 10;
        location = null;
        startDate = LocalDateTime.now().plusDays(1);
        endDate = LocalDateTime.now().plusDays(7);
        requiredSkillIds = null;

        // Reset edit/cancel context
        currentOpportunityId = null;
        otherOpportunityId = null;
        otherPromoter = null;
    }

    @Given("a promoter exists with email {string} and password {string}")
    public void aPromoterExistsWithEmailAndPassword(String email, String password) {
        currentUser = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .name("Test Promoter")
                .role(UserRole.PROMOTER)
                .points(0)
                .build();
        currentUser = userRepository.save(currentUser);
    }

    @Given("the promoter is authenticated")
    public void thePromoterIsAuthenticated() {
        context.setAuthToken(jwtService.generateToken(currentUser));
    }

    @Given("a volunteer exists with email {string} and password {string}")
    public void aVolunteerExistsWithEmailAndPassword(String email, String password) {
        currentUser = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .name("Test Volunteer")
                .role(UserRole.VOLUNTEER)
                .points(0)
                .build();
        currentUser = userRepository.save(currentUser);
    }

    @Given("the volunteer is authenticated")
    public void theVolunteerIsAuthenticated() {
        context.setAuthToken(jwtService.generateToken(currentUser));
    }

    @Given("I have created an opportunity with title {string}")
    public void iHaveCreatedAnOpportunityWithTitle(String opportunityTitle) throws Exception {
        this.title = opportunityTitle;
        performCreateOpportunity();
    }

    @When("I submit a new opportunity with title {string}")
    public void iSubmitANewOpportunityWithTitle(String opportunityTitle) {
        this.title = opportunityTitle;
    }

    @And("I set points reward to {int}")
    public void iSetPointsRewardTo(int points) {
        this.pointsReward = points;
    }

    @And("I set max volunteers to {int}")
    public void iSetMaxVolunteersTo(int volunteers) throws Exception {
        this.maxVolunteers = volunteers;
        performCreateOpportunity();
    }

    @When("I create an opportunity with:")
    public void iCreateAnOpportunityWith(DataTable dataTable) throws Exception {
        Map<String, String> data = dataTable.asMap(String.class, String.class);

        this.title = data.getOrDefault("title", "Test Opportunity");
        this.description = data.getOrDefault("description", "Test description");
        this.pointsReward = Integer.parseInt(data.getOrDefault("pointsReward", "50"));
        this.maxVolunteers = Integer.parseInt(data.getOrDefault("maxVolunteers", "10"));
        this.location = data.get("location");

        performCreateOpportunity();
    }

    @When("I submit an opportunity with end date before start date")
    public void iSubmitAnOpportunityWithEndDateBeforeStartDate() throws Exception {
        this.startDate = LocalDateTime.now().plusDays(7);
        this.endDate = LocalDateTime.now().plusDays(1);
        performCreateOpportunity();
    }

    @When("I submit an opportunity without selecting required skills")
    public void iSubmitAnOpportunityWithoutSelectingRequiredSkills() throws Exception {
        this.requiredSkillIds = Set.of();
        performCreateOpportunity();
    }

    @When("I submit an opportunity with blank title")
    public void iSubmitAnOpportunityWithBlankTitle() throws Exception {
        this.title = "";
        performCreateOpportunity();
    }

    @When("I submit an opportunity with max volunteers {int}")
    public void iSubmitAnOpportunityWithMaxVolunteers(int volunteers) throws Exception {
        this.maxVolunteers = volunteers;
        performCreateOpportunity();
    }

    @When("I try to create an opportunity")
    public void iTryToCreateAnOpportunity() throws Exception {
        performCreateOpportunity();
    }

    @When("I request my opportunities")
    public void iRequestMyOpportunities() throws Exception {
        var requestBuilder = get("/api/opportunities/my")
                .contentType(MediaType.APPLICATION_JSON);

        if (context.getAuthToken() != null) {
            requestBuilder.header("Authorization", "Bearer " + context.getAuthToken());
        }

        MvcResult result = mockMvc.perform(requestBuilder).andReturn();
        context.setResponse(result);
    }

    @Then("the opportunity should be created")
    public void theOpportunityShouldBeCreated() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.has("id")).isTrue();
        assertThat(json.get("id").asLong()).isGreaterThan(0);
    }

    @Then("the opportunity should have status {string}")
    public void theOpportunityShouldHaveStatus(String expectedStatus) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.get("status").asText()).isEqualTo(expectedStatus);
    }

    @Then("the response should include the opportunity details")
    public void theResponseShouldIncludeTheOpportunityDetails() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.has("id")).isTrue();
        assertThat(json.has("title")).isTrue();
        assertThat(json.has("description")).isTrue();
        assertThat(json.has("pointsReward")).isTrue();
        assertThat(json.has("maxVolunteers")).isTrue();
        assertThat(json.has("status")).isTrue();
        assertThat(json.has("startDate")).isTrue();
        assertThat(json.has("endDate")).isTrue();
    }

    @Then("the response should include the promoter details")
    public void theResponseShouldIncludeThePromoterDetails() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.has("promoter")).isTrue();
        JsonNode promoter = json.get("promoter");
        assertThat(promoter.has("id")).isTrue();
        assertThat(promoter.has("email")).isTrue();
        assertThat(promoter.has("name")).isTrue();
    }

    @Then("the response should include required skills")
    public void theResponseShouldIncludeRequiredSkills() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.has("requiredSkills")).isTrue();
        assertThat(json.get("requiredSkills").isArray()).isTrue();
        assertThat(json.get("requiredSkills").size()).isGreaterThan(0);
    }

    @Then("the response should contain {int} opportunity")
    public void theResponseShouldContainOpportunity(int count) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.isArray()).isTrue();
        assertThat(json.size()).isEqualTo(count);
    }

    @Then("the response should contain {int} opportunities")
    public void theResponseShouldContainOpportunities(int count) throws Exception {
        theResponseShouldContainOpportunity(count);
    }

    @Then("the opportunity should have title {string}")
    public void theOpportunityShouldHaveTitle(String expectedTitle) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.isArray()).isTrue();
        assertThat(json.get(0).get("title").asText()).isEqualTo(expectedTitle);
    }

    // ==================== EDIT OPPORTUNITY STEPS ====================

    @Given("I have created an opportunity with title {string} in status {string}")
    public void iHaveCreatedAnOpportunityWithTitleInStatus(String opportunityTitle, String status) throws Exception {
        // First create the opportunity
        this.title = opportunityTitle;
        performCreateOpportunity();

        // Then update its status directly in the database
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        currentOpportunityId = json.get("id").asLong();
        
        Opportunity opportunity = opportunityRepository.findById(currentOpportunityId).orElseThrow();
        opportunity.setStatus(OpportunityStatus.valueOf(status));
        opportunityRepository.save(opportunity);
    }

    @Given("an opportunity exists with title {string}")
    public void anOpportunityExistsWithTitle(String opportunityTitle) throws Exception {
        // Create a promoter to own this opportunity
        User promoter = User.builder()
                .email("owner@ua.pt")
                .password(passwordEncoder.encode("password"))
                .name("Opportunity Owner")
                .role(UserRole.PROMOTER)
                .points(0)
                .build();
        promoter = userRepository.save(promoter);

        // Create the opportunity
        Opportunity opportunity = Opportunity.builder()
                .title(opportunityTitle)
                .description("Test description")
                .pointsReward(50)
                .maxVolunteers(10)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(7))
                .status(OpportunityStatus.OPEN)
                .promoter(promoter)
                .build();
        opportunity = opportunityRepository.save(opportunity);
        currentOpportunityId = opportunity.getId();
    }

    @Given("another promoter has created an opportunity with title {string}")
    public void anotherPromoterHasCreatedAnOpportunityWithTitle(String opportunityTitle) throws Exception {
        // Create another promoter
        otherPromoter = User.builder()
                .email("other-promoter@ua.pt")
                .password(passwordEncoder.encode("password"))
                .name("Other Promoter")
                .role(UserRole.PROMOTER)
                .points(0)
                .build();
        otherPromoter = userRepository.save(otherPromoter);

        // Create the opportunity
        Opportunity opportunity = Opportunity.builder()
                .title(opportunityTitle)
                .description("Test description")
                .pointsReward(50)
                .maxVolunteers(10)
                .startDate(LocalDateTime.now().plusDays(1))
                .endDate(LocalDateTime.now().plusDays(7))
                .status(OpportunityStatus.OPEN)
                .promoter(otherPromoter)
                .build();
        opportunity = opportunityRepository.save(opportunity);
        otherOpportunityId = opportunity.getId();
    }

    @Given("another promoter has created an opportunity with title {string} in status {string}")
    public void anotherPromoterHasCreatedAnOpportunityWithTitleInStatus(String opportunityTitle, String status) throws Exception {
        anotherPromoterHasCreatedAnOpportunityWithTitle(opportunityTitle);
        
        Opportunity opportunity = opportunityRepository.findById(otherOpportunityId).orElseThrow();
        opportunity.setStatus(OpportunityStatus.valueOf(status));
        opportunityRepository.save(opportunity);
    }

    @Given("I have created an opportunity with {int} enrolled volunteers")
    public void iHaveCreatedAnOpportunityWithEnrolledVolunteers(int enrolledCount) throws Exception {
        this.title = "Event with Volunteers";
        this.maxVolunteers = 10;
        performCreateOpportunity();

        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        currentOpportunityId = json.get("id").asLong();
        
        Opportunity opportunity = opportunityRepository.findById(currentOpportunityId).orElseThrow();
        opportunity.setStatus(OpportunityStatus.OPEN);
        opportunityRepository.save(opportunity);
        
        // Create actual volunteer applications
        for (int i = 0; i < enrolledCount; i++) {
            User volunteer = User.builder()
                    .email("enrolled-volunteer-" + i + "@ua.pt")
                    .password(passwordEncoder.encode("password"))
                    .name("Enrolled Volunteer " + i)
                    .role(UserRole.VOLUNTEER)
                    .points(0)
                    .build();
            volunteer = userRepository.save(volunteer);
            
            Application application = Application.builder()
                    .volunteer(volunteer)
                    .opportunity(opportunity)
                    .status(ApplicationStatus.APPROVED)
                    .message("Test application")
                    .build();
            applicationRepository.save(application);
        }
    }

    @Given("an admin exists with email {string} and password {string}")
    public void anAdminExistsWithEmailAndPassword(String email, String password) {
        currentUser = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .name("Test Admin")
                .role(UserRole.ADMIN)
                .points(0)
                .build();
        currentUser = userRepository.save(currentUser);
    }

    @Given("the admin is authenticated")
    public void theAdminIsAuthenticated() {
        context.setAuthToken(jwtService.generateToken(currentUser));
    }

    @When("I update the opportunity title to {string}")
    public void iUpdateTheOpportunityTitleTo(String newTitle) throws Exception {
        UpdateOpportunityRequest request = UpdateOpportunityRequest.builder()
                .title(newTitle)
                .build();
        performUpdateOpportunity(currentOpportunityId, request);
    }

    @When("I update the opportunity with:")
    public void iUpdateTheOpportunityWith(DataTable dataTable) throws Exception {
        Map<String, String> data = dataTable.asMap(String.class, String.class);

        UpdateOpportunityRequest.UpdateOpportunityRequestBuilder builder = UpdateOpportunityRequest.builder();
        
        if (data.containsKey("title")) {
            builder.title(data.get("title"));
        }
        if (data.containsKey("description")) {
            builder.description(data.get("description"));
        }
        if (data.containsKey("pointsReward")) {
            builder.pointsReward(Integer.parseInt(data.get("pointsReward")));
        }
        if (data.containsKey("maxVolunteers")) {
            builder.maxVolunteers(Integer.parseInt(data.get("maxVolunteers")));
        }
        if (data.containsKey("location")) {
            builder.location(data.get("location"));
        }

        performUpdateOpportunity(currentOpportunityId, builder.build());
    }

    @When("I try to update the opportunity title")
    public void iTryToUpdateTheOpportunityTitle() throws Exception {
        UpdateOpportunityRequest request = UpdateOpportunityRequest.builder()
                .title("Updated Title")
                .build();
        performUpdateOpportunity(currentOpportunityId, request);
    }

    @When("I try to update the opportunity")
    public void iTryToUpdateTheOpportunity() throws Exception {
        UpdateOpportunityRequest request = UpdateOpportunityRequest.builder()
                .title("Updated Title")
                .build();
        performUpdateOpportunity(currentOpportunityId, request);
    }

    @When("I update the opportunity with end date before start date")
    public void iUpdateTheOpportunityWithEndDateBeforeStartDate() throws Exception {
        UpdateOpportunityRequest request = UpdateOpportunityRequest.builder()
                .startDate(LocalDateTime.now().plusDays(7))
                .endDate(LocalDateTime.now().plusDays(1))
                .build();
        performUpdateOpportunity(currentOpportunityId, request);
    }

    @When("I update maxVolunteers to {int}")
    public void iUpdateMaxVolunteersTo(int maxVol) throws Exception {
        UpdateOpportunityRequest request = UpdateOpportunityRequest.builder()
                .maxVolunteers(maxVol)
                .build();
        performUpdateOpportunity(currentOpportunityId, request);
    }

    @When("I try to edit that opportunity")
    public void iTryToEditThatOpportunity() throws Exception {
        UpdateOpportunityRequest request = UpdateOpportunityRequest.builder()
                .title("Updated Title")
                .build();
        performUpdateOpportunity(otherOpportunityId, request);
    }

    @When("I update that opportunity title to {string}")
    public void iUpdateThatOpportunityTitleTo(String newTitle) throws Exception {
        UpdateOpportunityRequest request = UpdateOpportunityRequest.builder()
                .title(newTitle)
                .build();
        performUpdateOpportunity(otherOpportunityId, request);
    }

    @When("I try to edit opportunity with id {int}")
    public void iTryToEditOpportunityWithId(int id) throws Exception {
        UpdateOpportunityRequest request = UpdateOpportunityRequest.builder()
                .title("Updated Title")
                .build();
        performUpdateOpportunity((long) id, request);
    }

    @Then("the opportunity title should be {string}")
    public void theOpportunityTitleShouldBe(String expectedTitle) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.get("title").asText()).isEqualTo(expectedTitle);
    }

    @Then("the response should include all updated fields")
    public void theResponseShouldIncludeAllUpdatedFields() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.has("title")).isTrue();
        assertThat(json.has("description")).isTrue();
        assertThat(json.has("pointsReward")).isTrue();
        assertThat(json.has("maxVolunteers")).isTrue();
        assertThat(json.has("location")).isTrue();
    }

    // ==================== CANCEL OPPORTUNITY STEPS ====================

    @When("I cancel the opportunity")
    public void iCancelTheOpportunity() throws Exception {
        performCancelOpportunity(currentOpportunityId);
    }

    @When("I try to cancel the opportunity")
    public void iTryToCancelTheOpportunity() throws Exception {
        performCancelOpportunity(currentOpportunityId);
    }

    @When("I try to cancel that opportunity")
    public void iTryToCancelThatOpportunity() throws Exception {
        performCancelOpportunity(otherOpportunityId);
    }

    @When("I cancel that opportunity")
    public void iCancelThatOpportunity() throws Exception {
        performCancelOpportunity(otherOpportunityId);
    }

    @When("I try to cancel opportunity with id {int}")
    public void iTryToCancelOpportunityWithId(int id) throws Exception {
        performCancelOpportunity((long) id);
    }

    @Then("the opportunity status should be {string}")
    public void theOpportunityStatusShouldBe(String expectedStatus) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.get("status").asText()).isEqualTo(expectedStatus);
    }

    // ==================== HELPER METHODS ====================

    private void performUpdateOpportunity(Long opportunityId, UpdateOpportunityRequest request) throws Exception {
        var requestBuilder = put("/api/opportunities/" + opportunityId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request));

        if (context.getAuthToken() != null) {
            requestBuilder.header("Authorization", "Bearer " + context.getAuthToken());
        }

        MvcResult result = mockMvc.perform(requestBuilder).andReturn();
        context.setResponse(result);
    }

    private void performCancelOpportunity(Long opportunityId) throws Exception {
        var requestBuilder = post("/api/opportunities/" + opportunityId + "/cancel")
                .contentType(MediaType.APPLICATION_JSON);

        if (context.getAuthToken() != null) {
            requestBuilder.header("Authorization", "Bearer " + context.getAuthToken());
        }

        MvcResult result = mockMvc.perform(requestBuilder).andReturn();
        context.setResponse(result);
    }

    private void performCreateOpportunity() throws Exception {
        // Get skills from shared context if not explicitly set
        Set<Long> skillIds = requiredSkillIds;
        if (skillIds == null && context.getCommunicationSkill() != null) {
            skillIds = Set.of(context.getCommunicationSkill().getId());
        } else if (skillIds == null) {
            skillIds = Set.of();
        }

        CreateOpportunityRequest request = CreateOpportunityRequest.builder()
                .title(title)
                .description(description)
                .pointsReward(pointsReward)
                .startDate(startDate)
                .endDate(endDate)
                .maxVolunteers(maxVolunteers)
                .location(location)
                .requiredSkillIds(skillIds)
                .build();

        var requestBuilder = post("/api/opportunities")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request));

        if (context.getAuthToken() != null) {
            requestBuilder.header("Authorization", "Bearer " + context.getAuthToken());
        }

        MvcResult result = mockMvc.perform(requestBuilder).andReturn();
        context.setResponse(result);
    }
}
