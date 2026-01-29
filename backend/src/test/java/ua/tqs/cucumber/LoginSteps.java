package ua.tqs.cucumber;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.Then;
import io.cucumber.java.en.When;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import ua.tqs.dto.LoginRequest;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.UserRepository;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

public class LoginSteps {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

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

    @Given("the login endpoint is available")
    public void theLoginEndpointIsAvailable() {
        // Endpoint is available by default when Spring Boot starts
    }

    @Given("I am a registered user with email {string} and password {string}")
    public void iAmARegisteredUserWithEmailAndPassword(String email, String password) {
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .name("Test User")
                .role(UserRole.VOLUNTEER)
                .points(0)
                .build();
        userRepository.save(user);
    }

    @When("I submit login with email {string} and password {string}")
    public void iSubmitLoginWithEmailAndPassword(String email, String password) throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email(email)
                .password(password)
                .build();

        performLogin(request);
    }

    @When("I submit login without password for email {string}")
    public void iSubmitLoginWithoutPassword(String email) throws Exception {
        LoginRequest request = LoginRequest.builder()
                .email(email)
                .build();

        performLogin(request);
    }

    @Then("the response status should be {int}")
    public void theResponseStatusShouldBe(int expectedStatus) {
        assertThat(lastStatusCode).isEqualTo(expectedStatus);
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

    private void performLogin(LoginRequest request) throws Exception {
        lastResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        lastStatusCode = lastResult.getResponse().getStatus();
        lastResponseBody = lastResult.getResponse().getContentAsString();
    }
}
