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
import ua.tqs.dto.RegisterRequest;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.UserRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

public class RegistrationSteps {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private MvcResult lastResult;
    private int lastStatusCode;
    private String lastResponseBody;

    @Before
    public void setUp() {
        userRepository.deleteAll();
        lastResult = null;
        lastStatusCode = 0;
        lastResponseBody = null;
    }

    @Given("the registration endpoint is available")
    public void theRegistrationEndpointIsAvailable() {
        // Endpoint is available by default when Spring Boot starts
    }

    @Given("I am on the registration page")
    public void iAmOnTheRegistrationPage() {
        // This step is for BDD readability, no action needed for API tests
    }

    @Given("a user exists with email {string}")
    public void aUserExistsWithEmail(String email) {
        User existingUser = User.builder()
                .email(email)
                .password(passwordEncoder.encode("password123"))
                .name("Existing User")
                .role(UserRole.VOLUNTEER)
                .points(0)
                .build();
        userRepository.save(existingUser);
    }

    @When("I submit valid registration data with email {string}, password {string}, and name {string}")
    public void iSubmitValidRegistrationData(String email, String password, String name) throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email(email)
                .password(password)
                .name(name)
                .build();

        performRegistration(request);
    }

    @When("I submit valid registration data with email {string}, password {string}, name {string}, and role {string}")
    public void iSubmitValidRegistrationDataWithRole(String email, String password, String name, String role) throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email(email)
                .password(password)
                .name(name)
                .role(UserRole.valueOf(role))
                .build();

        performRegistration(request);
    }

    @When("I submit email {string} with password {string} and name {string}")
    public void iSubmitEmailWithPasswordAndName(String email, String password, String name) throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email(email)
                .password(password)
                .name(name)
                .build();

        performRegistration(request);
    }

    @When("I try to register with email {string} password {string} and name {string}")
    public void iTryToRegisterWithEmail(String email, String password, String name) throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email(email)
                .password(password)
                .name(name)
                .build();

        performRegistration(request);
    }

    @When("I submit registration without email")
    public void iSubmitRegistrationWithoutEmail() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .password("SecurePass123")
                .name("Test User")
                .build();

        performRegistration(request);
    }

    @When("I submit registration without name")
    public void iSubmitRegistrationWithoutName() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email("test@ua.pt")
                .password("SecurePass123")
                .build();

        performRegistration(request);
    }

    @Then("my account should be created")
    public void myAccountShouldBeCreated() {
        assertThat(lastStatusCode).isEqualTo(201);
    }

    @Then("the response should include my user details")
    public void theResponseShouldIncludeMyUserDetails() throws Exception {
        JsonNode json = objectMapper.readTree(lastResponseBody);
        assertThat(json.has("id")).isTrue();
        assertThat(json.has("email")).isTrue();
        assertThat(json.has("name")).isTrue();
        assertThat(json.has("role")).isTrue();
    }

    @Then("the response should include a valid JWT token")
    public void theResponseShouldIncludeAValidJwtToken() throws Exception {
        JsonNode json = objectMapper.readTree(lastResponseBody);
        assertThat(json.has("token")).isTrue();
        String token = json.get("token").asText();
        assertThat(token).isNotBlank();
        // JWT tokens have 3 parts separated by dots
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Then("I should see error {string}")
    public void iShouldSeeError(String expectedError) throws Exception {
        JsonNode json = objectMapper.readTree(lastResponseBody);
        assertThat(json.has("message")).isTrue();
        assertThat(json.get("message").asText()).isEqualTo(expectedError);
    }

    @Then("the response status should be {int}")
    public void theResponseStatusShouldBe(int expectedStatus) {
        assertThat(lastStatusCode).isEqualTo(expectedStatus);
    }

    @And("the response should show role {string}")
    public void theResponseShouldShowRole(String expectedRole) throws Exception {
        JsonNode json = objectMapper.readTree(lastResponseBody);
        assertThat(json.get("role").asText()).isEqualTo(expectedRole);
    }

    private void performRegistration(RegisterRequest request) throws Exception {
        lastResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        lastStatusCode = lastResult.getResponse().getStatus();
        lastResponseBody = lastResult.getResponse().getContentAsString();
    }
}
