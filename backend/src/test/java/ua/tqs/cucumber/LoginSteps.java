package ua.tqs.cucumber;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.cucumber.java.Before;
import io.cucumber.java.en.Given;
import io.cucumber.java.en.When;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import ua.tqs.dto.LoginRequest;
import ua.tqs.model.User;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.OpportunityRepository;
import ua.tqs.repository.UserRepository;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

public class LoginSteps {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OpportunityRepository opportunityRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SharedTestContext context;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Before
    public void setUp() {
        opportunityRepository.deleteAll();
        userRepository.deleteAll();
        context.reset();
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

    // Note: Shared step definitions (theResponseStatusShouldBe, theResponseShouldIncludeMyUserDetails,
    // theResponseShouldIncludeAValidJwtToken, iShouldSeeError) are defined in SharedSteps.java
    // and are reused by Cucumber for both registration and login scenarios.

    private void performLogin(LoginRequest request) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        context.setResponse(result);
    }
}
