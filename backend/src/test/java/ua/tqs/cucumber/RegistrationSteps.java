package ua.tqs.cucumber;

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
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SharedTestContext context;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Before
    public void setUp() {
        userRepository.deleteAll();
        context.reset();
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
        assertThat(context.getLastStatusCode()).isEqualTo(201);
    }

    // Note: Shared step definitions (theResponseStatusShouldBe, theResponseShouldIncludeMyUserDetails,
    // theResponseShouldIncludeAValidJwtToken, iShouldSeeError, theResponseShouldShowRole)
    // are defined in SharedSteps.java and are reused across all feature files.

    private void performRegistration(RegisterRequest request) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        context.setResponse(result);
    }
}
