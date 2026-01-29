package ua.tqs.cucumber;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.cucumber.java.en.And;
import io.cucumber.java.en.Then;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Shared Cucumber step definitions used by multiple feature files.
 * These steps handle common response validation across registration and login features.
 */
public class SharedSteps {

    @Autowired
    private SharedTestContext context;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Then("the response status should be {int}")
    public void theResponseStatusShouldBe(int expectedStatus) {
        assertThat(context.getLastStatusCode()).isEqualTo(expectedStatus);
    }

    @Then("the response should include my user details")
    public void theResponseShouldIncludeMyUserDetails() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.has("id")).isTrue();
        assertThat(json.has("email")).isTrue();
        assertThat(json.has("name")).isTrue();
        assertThat(json.has("role")).isTrue();
    }

    @Then("the response should include a valid JWT token")
    public void theResponseShouldIncludeAValidJwtToken() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.has("token")).isTrue();
        String token = json.get("token").asText();
        assertThat(token).isNotBlank();
        // JWT tokens have 3 parts separated by dots
        assertThat(token.split("\\.")).hasSize(3);
    }

    @Then("I should see error {string}")
    public void iShouldSeeError(String expectedError) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.has("message")).isTrue();
        assertThat(json.get("message").asText()).isEqualTo(expectedError);
    }

    @And("the response should show role {string}")
    public void theResponseShouldShowRole(String expectedRole) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.get("role").asText()).isEqualTo(expectedRole);
    }
}
