package ua.tqs.cucumber;

import org.springframework.stereotype.Component;
import org.springframework.test.web.servlet.MvcResult;
import ua.tqs.model.Skill;

/**
 * Shared test context for Cucumber step definitions.
 * This class holds state that needs to be shared between different step definition classes.
 */
@Component
public class SharedTestContext {

    private MvcResult lastResult;
    private int lastStatusCode;
    private String lastResponseBody;
    private Skill communicationSkill;
    private Skill leadershipSkill;
    private String authToken;

    public void reset() {
        lastResult = null;
        lastStatusCode = 0;
        lastResponseBody = null;
        communicationSkill = null;
        leadershipSkill = null;
        authToken = null;
    }

    public String getAuthToken() {
        return authToken;
    }

    public void setAuthToken(String authToken) {
        this.authToken = authToken;
    }

    public void clearAuthToken() {
        this.authToken = null;
    }

    public Skill getCommunicationSkill() {
        return communicationSkill;
    }

    public void setCommunicationSkill(Skill communicationSkill) {
        this.communicationSkill = communicationSkill;
    }

    public Skill getLeadershipSkill() {
        return leadershipSkill;
    }

    public void setLeadershipSkill(Skill leadershipSkill) {
        this.leadershipSkill = leadershipSkill;
    }

    public MvcResult getLastResult() {
        return lastResult;
    }

    public void setLastResult(MvcResult lastResult) {
        this.lastResult = lastResult;
    }

    public int getLastStatusCode() {
        return lastStatusCode;
    }

    public void setLastStatusCode(int lastStatusCode) {
        this.lastStatusCode = lastStatusCode;
    }

    public String getLastResponseBody() {
        return lastResponseBody;
    }

    public void setLastResponseBody(String lastResponseBody) {
        this.lastResponseBody = lastResponseBody;
    }

    /**
     * Convenience method to set all response values at once.
     */
    public void setResponse(MvcResult result) throws Exception {
        this.lastResult = result;
        this.lastStatusCode = result.getResponse().getStatus();
        this.lastResponseBody = result.getResponse().getContentAsString();
    }
}
