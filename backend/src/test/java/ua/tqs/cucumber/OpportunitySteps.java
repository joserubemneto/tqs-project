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

    @Before
    public void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

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

    @Given("I am not authenticated")
    public void iAmNotAuthenticated() {
        context.clearAuthToken();
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
