package ua.tqs.cucumber;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.cucumber.datatable.DataTable;
import io.cucumber.java.Before;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import ua.tqs.dto.CreateRewardRequest;
import ua.tqs.dto.UpdateRewardRequest;
import ua.tqs.model.Reward;
import ua.tqs.model.enums.RewardType;
import ua.tqs.repository.RewardRepository;
import ua.tqs.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

public class RewardSteps {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RewardRepository rewardRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SharedTestContext context;

    private final ObjectMapper objectMapper;

    private Long lastCreatedRewardId;

    public RewardSteps() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Before
    public void setUp() {
        rewardRepository.deleteAll();
        userRepository.deleteAll();
        context.reset();
        lastCreatedRewardId = null;
    }

    // ==================== GIVEN STEPS ====================
    // Note: Admin/Volunteer user creation and login steps are defined in UserManagementSteps

    @Given("a reward exists with title {string}")
    public void aRewardExistsWithTitle(String title) {
        Reward reward = Reward.builder()
                .title(title)
                .description("Test reward description")
                .pointsCost(50)
                .type(RewardType.UA_SERVICE)
                .active(true)
                .build();
        reward = rewardRepository.save(reward);
        lastCreatedRewardId = reward.getId();
    }

    @Given("a reward exists with title {string} and pointsCost {int}")
    public void aRewardExistsWithTitleAndPointsCost(String title, int pointsCost) {
        Reward reward = Reward.builder()
                .title(title)
                .description("Test reward description")
                .pointsCost(pointsCost)
                .type(RewardType.UA_SERVICE)
                .active(true)
                .build();
        reward = rewardRepository.save(reward);
        lastCreatedRewardId = reward.getId();
    }

    @Given("the following rewards exist:")
    public void theFollowingRewardsExist(DataTable dataTable) {
        List<Map<String, String>> rows = dataTable.asMaps();
        for (Map<String, String> row : rows) {
            Reward reward = Reward.builder()
                    .title(row.get("title"))
                    .description("Test description for " + row.get("title"))
                    .pointsCost(Integer.parseInt(row.get("pointsCost")))
                    .type(RewardType.valueOf(row.get("type")))
                    .active(Boolean.parseBoolean(row.get("active")))
                    .build();
            rewardRepository.save(reward);
        }
    }

    // ==================== WHEN STEPS ====================

    @When("I create a reward with:")
    public void iCreateARewardWith(DataTable dataTable) throws Exception {
        Map<String, String> data = dataTable.asMap();

        CreateRewardRequest request = CreateRewardRequest.builder()
                .title(data.get("title"))
                .description(data.get("description"))
                .pointsCost(Integer.parseInt(data.get("pointsCost")))
                .type(RewardType.valueOf(data.get("type")))
                .quantity(data.containsKey("quantity") ? Integer.parseInt(data.get("quantity")) : null)
                .build();

        performCreateReward(request);
    }

    @When("I create a reward with availability period")
    public void iCreateARewardWithAvailabilityPeriod() throws Exception {
        CreateRewardRequest request = CreateRewardRequest.builder()
                .title("Limited Time Reward")
                .description("Available for a limited time")
                .pointsCost(100)
                .type(RewardType.UA_SERVICE)
                .availableFrom(LocalDateTime.now().plusDays(1))
                .availableUntil(LocalDateTime.now().plusDays(30))
                .build();

        performCreateReward(request);
    }

    @When("I create a reward with pointsCost {int}")
    public void iCreateARewardWithPointsCost(int pointsCost) throws Exception {
        CreateRewardRequest request = CreateRewardRequest.builder()
                .title("Test Reward")
                .description("Test description")
                .pointsCost(pointsCost)
                .type(RewardType.UA_SERVICE)
                .build();

        performCreateReward(request);
    }

    @When("I create a reward with blank title")
    public void iCreateARewardWithBlankTitle() throws Exception {
        CreateRewardRequest request = CreateRewardRequest.builder()
                .title("")
                .description("Test description")
                .pointsCost(50)
                .type(RewardType.UA_SERVICE)
                .build();

        performCreateReward(request);
    }

    @When("I create a reward with end date before start date")
    public void iCreateARewardWithEndDateBeforeStartDate() throws Exception {
        CreateRewardRequest request = CreateRewardRequest.builder()
                .title("Invalid Dates Reward")
                .description("Test description")
                .pointsCost(50)
                .type(RewardType.UA_SERVICE)
                .availableFrom(LocalDateTime.now().plusDays(10))
                .availableUntil(LocalDateTime.now().plusDays(5))
                .build();

        performCreateReward(request);
    }

    @When("I request all rewards as admin")
    public void iRequestAllRewardsAsAdmin() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/admin/rewards")
                        .header("Authorization", "Bearer " + context.getAuthToken()))
                .andReturn();

        context.setResponse(result);
    }

    @When("I request available rewards as public user")
    public void iRequestAvailableRewardsAsPublicUser() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/rewards"))
                .andReturn();

        context.setResponse(result);
    }

    @When("I request the reward by ID")
    public void iRequestTheRewardById() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/rewards/{id}", lastCreatedRewardId))
                .andReturn();

        context.setResponse(result);
    }

    @When("I request reward with ID {long}")
    public void iRequestRewardWithId(Long id) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/rewards/{id}", id))
                .andReturn();

        context.setResponse(result);
    }

    @When("I update the reward title to {string}")
    public void iUpdateTheRewardTitleTo(String newTitle) throws Exception {
        UpdateRewardRequest request = UpdateRewardRequest.builder()
                .title(newTitle)
                .build();

        performUpdateReward(request);
    }

    @When("I update the reward pointsCost to {int}")
    public void iUpdateTheRewardPointsCostTo(int pointsCost) throws Exception {
        UpdateRewardRequest request = UpdateRewardRequest.builder()
                .pointsCost(pointsCost)
                .build();

        performUpdateReward(request);
    }

    @When("I deactivate the reward")
    public void iDeactivateTheReward() throws Exception {
        MvcResult result = mockMvc.perform(delete("/api/admin/rewards/{id}", lastCreatedRewardId)
                        .header("Authorization", "Bearer " + context.getAuthToken()))
                .andReturn();

        context.setResponse(result);
    }

    @When("I try to update reward with ID {long}")
    public void iTryToUpdateRewardWithId(Long id) throws Exception {
        lastCreatedRewardId = id;
        UpdateRewardRequest request = UpdateRewardRequest.builder()
                .title("New Title")
                .build();

        performUpdateReward(request);
    }

    @When("I try to create a reward")
    public void iTryToCreateAReward() throws Exception {
        CreateRewardRequest request = CreateRewardRequest.builder()
                .title("Test Reward")
                .description("Test description")
                .pointsCost(50)
                .type(RewardType.UA_SERVICE)
                .build();

        performCreateReward(request);
    }

    @When("I try to create a reward without authentication")
    public void iTryToCreateARewardWithoutAuthentication() throws Exception {
        CreateRewardRequest request = CreateRewardRequest.builder()
                .title("Test Reward")
                .description("Test description")
                .pointsCost(50)
                .type(RewardType.UA_SERVICE)
                .build();

        MvcResult result = mockMvc.perform(post("/api/admin/rewards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        context.setResponse(result);
    }

    @When("I try to update the reward")
    public void iTryToUpdateTheReward() throws Exception {
        UpdateRewardRequest request = UpdateRewardRequest.builder()
                .title("New Title")
                .build();

        performUpdateReward(request);
    }

    @When("I try to delete the reward")
    public void iTryToDeleteTheReward() throws Exception {
        MvcResult result = mockMvc.perform(delete("/api/admin/rewards/{id}", lastCreatedRewardId)
                        .header("Authorization", "Bearer " + context.getAuthToken()))
                .andReturn();

        context.setResponse(result);
    }

    // ==================== THEN STEPS ====================

    @Then("the reward should be created with title {string}")
    public void theRewardShouldBeCreatedWithTitle(String expectedTitle) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.get("title").asText()).isEqualTo(expectedTitle);
        lastCreatedRewardId = json.get("id").asLong();
    }

    @Then("the reward should have pointsCost {int}")
    public void theRewardShouldHavePointsCost(int expectedPoints) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.get("pointsCost").asInt()).isEqualTo(expectedPoints);
    }

    @Then("the reward should have type {string}")
    public void theRewardShouldHaveType(String expectedType) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.get("type").asText()).isEqualTo(expectedType);
    }

    @Then("the reward should be active")
    public void theRewardShouldBeActive() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.get("active").asBoolean()).isTrue();
    }

    @Then("the reward should have unlimited quantity")
    public void theRewardShouldHaveUnlimitedQuantity() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        // Quantity is unlimited if field is null or missing
        JsonNode quantityNode = json.get("quantity");
        assertThat(quantityNode == null || quantityNode.isNull()).isTrue();
    }

    @Then("the reward should have availability dates")
    public void theRewardShouldHaveAvailabilityDates() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.has("availableFrom")).isTrue();
        assertThat(json.get("availableFrom").isNull()).isFalse();
        assertThat(json.has("availableUntil")).isTrue();
        assertThat(json.get("availableUntil").isNull()).isFalse();
    }

    @Then("the response should include {int} rewards")
    public void theResponseShouldIncludeRewards(int expectedCount) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        
        // Check if it's a paginated response or array
        if (json.has("content")) {
            assertThat(json.get("content").size()).isEqualTo(expectedCount);
        } else if (json.isArray()) {
            assertThat(json.size()).isEqualTo(expectedCount);
        }
    }

    @Then("all rewards should be active")
    public void allRewardsShouldBeActive() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        
        JsonNode rewards = json.isArray() ? json : json.get("content");
        for (JsonNode reward : rewards) {
            assertThat(reward.get("active").asBoolean()).isTrue();
        }
    }

    @Then("the reward title should be {string}")
    public void theRewardTitleShouldBe(String expectedTitle) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.get("title").asText()).isEqualTo(expectedTitle);
    }

    @And("the reward should be inactive in the database")
    public void theRewardShouldBeInactiveInTheDatabase() {
        Reward reward = rewardRepository.findById(lastCreatedRewardId).orElseThrow();
        assertThat(reward.getActive()).isFalse();
    }

    // ==================== HELPER METHODS ====================

    private void performCreateReward(CreateRewardRequest request) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/admin/rewards")
                        .header("Authorization", "Bearer " + context.getAuthToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        context.setResponse(result);
    }

    private void performUpdateReward(UpdateRewardRequest request) throws Exception {
        MvcResult result = mockMvc.perform(put("/api/admin/rewards/{id}", lastCreatedRewardId)
                        .header("Authorization", "Bearer " + context.getAuthToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        context.setResponse(result);
    }
}
