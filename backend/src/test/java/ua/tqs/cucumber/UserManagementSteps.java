package ua.tqs.cucumber;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import ua.tqs.dto.LoginRequest;
import ua.tqs.dto.UpdateRoleRequest;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.UserRepository;
import ua.tqs.service.JwtService;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

public class UserManagementSteps {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private SharedTestContext context;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String authToken;
    private Long targetUserId;
    private Long currentUserId;

    @Before
    public void setUp() {
        userRepository.deleteAll();
        context.reset();
        authToken = null;
        targetUserId = null;
        currentUserId = null;
    }

    @Given("the admin endpoints are available")
    public void theAdminEndpointsAreAvailable() {
        // Endpoints are available by default when Spring Boot starts
    }

    @Given("an admin user exists with email {string} and password {string}")
    public void anAdminUserExistsWithEmailAndPassword(String email, String password) {
        createUserWithRole(email, password, "Admin User", UserRole.ADMIN);
    }

    @Given("a volunteer user exists with email {string} and password {string}")
    public void aVolunteerUserExistsWithEmailAndPassword(String email, String password) {
        createUserWithRole(email, password, "Volunteer User", UserRole.VOLUNTEER);
    }

    @Given("a promoter user exists with email {string} and password {string}")
    public void aPromoterUserExistsWithEmailAndPassword(String email, String password) {
        createUserWithRole(email, password, "Promoter User", UserRole.PROMOTER);
    }

    @Given("another admin exists with email {string} and password {string}")
    public void anotherAdminExistsWithEmailAndPassword(String email, String password) {
        createUserWithRole(email, password, "Another Admin", UserRole.ADMIN);
    }

    @Given("I am logged in as admin with email {string} and password {string}")
    public void iAmLoggedInAsAdminWithEmailAndPassword(String email, String password) throws Exception {
        loginAndStoreToken(email, password);
    }

    @Given("I am logged in as volunteer with email {string} and password {string}")
    public void iAmLoggedInAsVolunteerWithEmailAndPassword(String email, String password) throws Exception {
        loginAndStoreToken(email, password);
    }

    @Given("I know the user ID for {string}")
    public void iKnowTheUserIdFor(String email) {
        User user = userRepository.findByEmail(email).orElseThrow();
        targetUserId = user.getId();
    }

    @Given("I know my own user ID")
    public void iKnowMyOwnUserId() {
        targetUserId = currentUserId;
    }

    @When("I request the user list with page {int} and size {int}")
    public void iRequestTheUserListWithPageAndSize(int page, int size) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + authToken)
                        .param("page", String.valueOf(page))
                        .param("size", String.valueOf(size)))
                .andReturn();

        context.setResponse(result);
    }

    @When("I request the user list without authentication")
    public void iRequestTheUserListWithoutAuthentication() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/admin/users")
                        .param("page", "0")
                        .param("size", "10"))
                .andReturn();

        context.setResponse(result);
    }

    @When("I request the user list with search term {string}")
    public void iRequestTheUserListWithSearchTerm(String search) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + authToken)
                        .param("search", search))
                .andReturn();

        context.setResponse(result);
    }

    @When("I request the user list with role filter {string}")
    public void iRequestTheUserListWithRoleFilter(String role) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + authToken)
                        .param("role", role))
                .andReturn();

        context.setResponse(result);
    }

    @When("I update the user role to {string}")
    public void iUpdateTheUserRoleTo(String role) throws Exception {
        UpdateRoleRequest request = new UpdateRoleRequest(UserRole.valueOf(role));

        MvcResult result = mockMvc.perform(put("/api/admin/users/{id}/role", targetUserId)
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        context.setResponse(result);
    }

    @When("I try to update my own role to {string}")
    public void iTryToUpdateMyOwnRoleTo(String role) throws Exception {
        iUpdateTheUserRoleTo(role);
    }

    @When("I try to update role for user ID {long} to {string}")
    public void iTryToUpdateRoleForUserIdTo(Long userId, String role) throws Exception {
        targetUserId = userId;
        iUpdateTheUserRoleTo(role);
    }

    @Then("the response should include a list of users")
    public void theResponseShouldIncludeAListOfUsers() throws Exception {
        String responseBody = context.getLastResponseBody();
        JsonNode json = objectMapper.readTree(responseBody);

        assertThat(json.has("users")).isTrue();
        assertThat(json.get("users").isArray()).isTrue();
    }

    @Then("the response should include pagination information")
    public void theResponseShouldIncludePaginationInformation() throws Exception {
        String responseBody = context.getLastResponseBody();
        JsonNode json = objectMapper.readTree(responseBody);

        assertThat(json.has("currentPage")).isTrue();
        assertThat(json.has("totalPages")).isTrue();
        assertThat(json.has("totalElements")).isTrue();
        assertThat(json.has("pageSize")).isTrue();
        assertThat(json.has("hasNext")).isTrue();
        assertThat(json.has("hasPrevious")).isTrue();
    }

    @Then("the response should include only users matching {string}")
    public void theResponseShouldIncludeOnlyUsersMatching(String searchTerm) throws Exception {
        String responseBody = context.getLastResponseBody();
        JsonNode json = objectMapper.readTree(responseBody);
        JsonNode users = json.get("users");

        for (JsonNode user : users) {
            String name = user.get("name").asText().toLowerCase();
            String email = user.get("email").asText().toLowerCase();
            assertThat(name.contains(searchTerm.toLowerCase()) || email.contains(searchTerm.toLowerCase()))
                    .isTrue();
        }
    }

    @Then("the response should include only users with role {string}")
    public void theResponseShouldIncludeOnlyUsersWithRole(String role) throws Exception {
        String responseBody = context.getLastResponseBody();
        JsonNode json = objectMapper.readTree(responseBody);
        JsonNode users = json.get("users");

        for (JsonNode user : users) {
            assertThat(user.get("role").asText()).isEqualTo(role);
        }
    }

    @Then("the user role should be {string}")
    public void theUserRoleShouldBe(String role) throws Exception {
        String responseBody = context.getLastResponseBody();
        JsonNode json = objectMapper.readTree(responseBody);

        assertThat(json.get("role").asText()).isEqualTo(role);

        // Also verify in database
        User user = userRepository.findById(targetUserId).orElseThrow();
        assertThat(user.getRole().name()).isEqualTo(role);
    }

    private void createUserWithRole(String email, String password, String name, UserRole role) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .name(name)
                .role(role)
                .points(0)
                .build();
        userRepository.save(user);
    }

    private void loginAndStoreToken(String email, String password) throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email(email)
                .password(password)
                .build();

        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(responseBody);
        authToken = json.get("token").asText();
        currentUserId = json.get("id").asLong();
    }
}
