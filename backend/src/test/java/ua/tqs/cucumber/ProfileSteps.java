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
import ua.tqs.dto.UpdateProfileRequest;
import ua.tqs.model.Skill;
import ua.tqs.model.User;
import ua.tqs.model.enums.SkillCategory;
import ua.tqs.model.enums.UserRole;
import ua.tqs.repository.OpportunityRepository;
import ua.tqs.repository.SkillRepository;
import ua.tqs.repository.UserRepository;
import ua.tqs.service.JwtService;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

public class ProfileSteps {

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

    private final ObjectMapper objectMapper = new ObjectMapper();

    private User currentUser;
    private Skill communicationSkill;
    private Skill leadershipSkill;

    @Before
    public void setUp() {
        opportunityRepository.deleteAll();
        userRepository.deleteAll();
        skillRepository.deleteAll();
        context.reset();
        currentUser = null;
    }

    @Given("a volunteer with profile exists with email {string} and password {string}")
    public void aVolunteerWithProfileExistsWithEmailAndPassword(String email, String password) {
        currentUser = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .name("Test Volunteer")
                .role(UserRole.VOLUNTEER)
                .points(50)
                .bio("Default bio")
                .skills(new HashSet<>())
                .build();
        currentUser = userRepository.save(currentUser);
    }

    @Given("the user is authenticated")
    public void theUserIsAuthenticated() {
        context.setAuthToken(jwtService.generateToken(currentUser));
    }

    @Given("skills exist in the system")
    public void skillsExistInTheSystem() {
        communicationSkill = Skill.builder()
                .name("Communication")
                .category(SkillCategory.COMMUNICATION)
                .description("Effective communication skills")
                .build();
        communicationSkill = skillRepository.save(communicationSkill);

        leadershipSkill = Skill.builder()
                .name("Leadership")
                .category(SkillCategory.LEADERSHIP)
                .description("Ability to lead teams")
                .build();
        leadershipSkill = skillRepository.save(leadershipSkill);

        // Store in shared context for other step classes
        context.setCommunicationSkill(communicationSkill);
        context.setLeadershipSkill(leadershipSkill);
    }

    @Given("my profile has the skill {string}")
    public void myProfileHasTheSkill(String skillName) {
        Skill skill = skillRepository.findByName(skillName).orElseThrow();
        currentUser.getSkills().add(skill);
        currentUser = userRepository.save(currentUser);
    }

    @When("I request my profile")
    public void iRequestMyProfile() throws Exception {
        var requestBuilder = get("/api/profile")
                .contentType(MediaType.APPLICATION_JSON);

        if (context.getAuthToken() != null) {
            requestBuilder.header("Authorization", "Bearer " + context.getAuthToken());
        }

        MvcResult result = mockMvc.perform(requestBuilder).andReturn();
        context.setResponse(result);
    }

    @When("I update my profile with name {string}")
    public void iUpdateMyProfileWithName(String name) throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name(name)
                .bio(currentUser.getBio())
                .skillIds(Set.of())
                .build();

        performProfileUpdate(request);
    }

    @When("I update my profile with bio {string}")
    public void iUpdateMyProfileWithBio(String bio) throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name(currentUser.getName())
                .bio(bio)
                .skillIds(Set.of())
                .build();

        performProfileUpdate(request);
    }

    @When("I update my profile with skill {string}")
    public void iUpdateMyProfileWithSkill(String skillName) throws Exception {
        Skill skill = skillRepository.findByName(skillName).orElseThrow();

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name(currentUser.getName())
                .bio(currentUser.getBio())
                .skillIds(Set.of(skill.getId()))
                .build();

        performProfileUpdate(request);
    }

    @When("I update my profile without skills")
    public void iUpdateMyProfileWithoutSkills() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name(currentUser.getName())
                .bio(currentUser.getBio())
                .skillIds(Set.of())
                .build();

        performProfileUpdate(request);
    }

    @When("I update my profile with a bio of {int} characters")
    public void iUpdateMyProfileWithBioOfCharacters(int length) throws Exception {
        String longBio = "a".repeat(length);

        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name(currentUser.getName())
                .bio(longBio)
                .skillIds(Set.of())
                .build();

        performProfileUpdate(request);
    }

    @When("I update my profile with empty name")
    public void iUpdateMyProfileWithEmptyName() throws Exception {
        UpdateProfileRequest request = UpdateProfileRequest.builder()
                .name("")
                .bio(currentUser.getBio())
                .skillIds(Set.of())
                .build();

        performProfileUpdate(request);
    }

    @When("I request all skills")
    public void iRequestAllSkills() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/skills")
                        .header("Authorization", "Bearer " + context.getAuthToken())
                        .contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        context.setResponse(result);
    }

    @When("I request skills with category {string}")
    public void iRequestSkillsWithCategory(String category) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/skills")
                        .header("Authorization", "Bearer " + context.getAuthToken())
                        .param("category", category)
                        .contentType(MediaType.APPLICATION_JSON))
                .andReturn();

        context.setResponse(result);
    }

    @Then("the response should include my profile details")
    public void theResponseShouldIncludeMyProfileDetails() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.has("id")).isTrue();
        assertThat(json.has("email")).isTrue();
        assertThat(json.has("name")).isTrue();
        assertThat(json.has("role")).isTrue();
        assertThat(json.has("bio")).isTrue();
    }

    @Then("the response should include my skills")
    public void theResponseShouldIncludeMySkills() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.has("skills")).isTrue();
        assertThat(json.get("skills").isArray()).isTrue();
    }

    @Then("the response should show name {string}")
    public void theResponseShouldShowName(String expectedName) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.get("name").asText()).isEqualTo(expectedName);
    }

    @Then("the response should show bio {string}")
    public void theResponseShouldShowBio(String expectedBio) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.get("bio").asText()).isEqualTo(expectedBio);
    }

    @Then("the response skills should include {string}")
    public void theResponseSkillsShouldInclude(String skillName) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        JsonNode skills = json.get("skills");
        assertThat(skills.isArray()).isTrue();
        
        boolean found = false;
        for (JsonNode skill : skills) {
            if (skill.get("name").asText().equals(skillName)) {
                found = true;
                break;
            }
        }
        assertThat(found).isTrue();
    }

    @Then("the response should have no skills")
    public void theResponseShouldHaveNoSkills() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        JsonNode skills = json.get("skills");
        assertThat(skills.isArray()).isTrue();
        assertThat(skills.size()).isEqualTo(0);
    }

    @Then("the response should include a list of skills")
    public void theResponseShouldIncludeAListOfSkills() throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.isArray()).isTrue();
    }

    @Then("all returned skills should have category {string}")
    public void allReturnedSkillsShouldHaveCategory(String expectedCategory) throws Exception {
        JsonNode json = objectMapper.readTree(context.getLastResponseBody());
        assertThat(json.isArray()).isTrue();
        
        for (JsonNode skill : json) {
            assertThat(skill.get("category").asText()).isEqualTo(expectedCategory);
        }
    }

    private void performProfileUpdate(UpdateProfileRequest request) throws Exception {
        MvcResult result = mockMvc.perform(put("/api/profile")
                        .header("Authorization", "Bearer " + context.getAuthToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andReturn();

        context.setResponse(result);
    }
}
