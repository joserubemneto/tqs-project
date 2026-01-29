# Xray Test Plan Setup Guide

This guide explains how to set up the Test Plan in Jira/Xray for the User Registration feature.

## Prerequisites

1. Jira Cloud instance with Xray plugin installed
2. API credentials (Client ID and Client Secret) for Xray Cloud
3. GitHub repository secrets configured

## Required GitHub Secrets

Add the following secrets to your GitHub repository:

| Secret Name | Description |
|-------------|-------------|
| `XRAY_CLIENT_ID` | Xray Cloud API Client ID |
| `XRAY_CLIENT_SECRET` | Xray Cloud API Client Secret |

**Note:** The Jira project key (`TQS`) and test plan key are configured in:
- `backend/pom.xml` - Maven properties `xray.projectKey` and `xray.testPlanKey`
- `.github/workflows/backend-ci.yml` - `JIRA_PROJECT_KEY` environment variable

### How to Get Xray API Credentials

1. Go to Jira Settings > Apps > API Keys
2. Click "Create API Key"
3. Select "Xray Cloud" as the application
4. Copy the Client ID and Client Secret

## Test Plan Structure

### 1. Create Test Plan Issue

In Jira, create a new issue of type "Test Plan":

- **Summary**: User Registration - Sprint [X]
- **Description**: Test plan covering all user registration scenarios
- **Labels**: `registration`, `authentication`, `sprint-x`

### 2. Create Test Sets

Create Test Set issues to organize tests:

#### Test Set: Registration Validation Tests
- TEST-REG-001: Successful registration
- TEST-REG-002: Invalid email format
- TEST-REG-003: Duplicate email
- TEST-REG-004: Short password
- TEST-REG-005: Missing email
- TEST-REG-006: Missing name

#### Test Set: Registration E2E Tests
- E2E-REG-001: Form displays correctly
- E2E-REG-002: Client-side validation works
- E2E-REG-003: Role selection works

### 3. Link Tests to Requirements

Use the `@REQ_SCRUM-XXX` tag in Cucumber feature files to link tests to requirements:

```gherkin
@REQ_SCRUM-149
Feature: User Registration

  @TEST_SCRUM-175
  Scenario: Successful registration
    ...
```

**Current Test Mappings:**
| Scenario | Xray Test Key |
|----------|---------------|
| Successful registration | SCRUM-175 |
| Invalid email format | SCRUM-176 |
| Duplicate email | SCRUM-177 |
| Short password | SCRUM-178 |
| Missing email | SCRUM-179 |
| Missing name | SCRUM-180 |

**E2E Tests (Playwright):**
| Test | Xray Test Key |
|------|---------------|
| Form displays correctly | SCRUM-182 |
| Client-side validation works | SCRUM-183 |
| Role selection works | SCRUM-184 |

### 4. Test Execution Workflow

```
Test Plan (TP-1)
    └── Test Execution (TE-1) - CI Run
            ├── TEST-REG-001: Passed
            ├── TEST-REG-002: Passed
            └── TEST-REG-003: Passed
```

## CI/CD Integration

The CI pipeline automatically uploads test results to Xray when:
- Changes are pushed to `master` branch
- GitHub secrets are configured

### Test Result Upload

Two types of results are uploaded:

1. **Cucumber Results** (`target/cucumber-reports/cucumber.json`)
   - Uploaded to: `/api/v2/import/execution/cucumber`
   - Creates Test Executions linked to Test issues

2. **JUnit Results** (`target/surefire-reports/TEST-*.xml`)
   - Uploaded to: `/api/v2/import/execution/junit`
   - Creates generic Test Executions

### Cucumber Report Configuration

The Cucumber tests are configured to generate JSON reports:

```java
@ConfigurationParameter(key = PLUGIN_PROPERTY_NAME, 
    value = "json:target/cucumber-reports/cucumber.json")
```

## Coverage Tracking

### Code Coverage

JaCoCo generates coverage reports that can be:
1. Viewed in GitHub Actions artifacts
2. Uploaded to SonarCloud for analysis
3. Manually linked to Xray Test Plan

### Requirement Coverage

Use Xray's Coverage Reports to track:
- Which requirements have tests
- Which tests are passing/failing
- Overall test progress

## Test Environment Configuration

Define test environments in Xray:

| Environment | Description |
|-------------|-------------|
| `CI` | GitHub Actions runner |
| `Local` | Developer machine |
| `Staging` | Pre-production environment |

## Sample Test Execution Report

After CI runs, you can view:

1. **In Jira**: Test Execution issues with pass/fail status
2. **In Xray**: 
   - Test Plan progress
   - Coverage reports
   - Execution history
3. **In GitHub**: 
   - Workflow run logs
   - Artifact downloads

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify XRAY_CLIENT_ID and XRAY_CLIENT_SECRET are correct
   - Check API key hasn't expired

2. **No Tests Imported**
   - Ensure Cucumber JSON report is generated
   - Check file path in CI script

3. **Tests Not Linked**
   - Add `@TEST-XXX` tags to scenarios
   - Ensure project key matches

### Debug Commands

```bash
# Test Xray authentication locally
curl -X POST "https://xray.cloud.getxray.app/api/v2/authenticate" \
  -H "Content-Type: application/json" \
  -d '{"client_id":"YOUR_ID","client_secret":"YOUR_SECRET"}'

# Upload test results manually
curl -X POST "https://xray.cloud.getxray.app/api/v2/import/execution/cucumber" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @target/cucumber-reports/cucumber.json
```

## References

- [Xray Cloud REST API](https://docs.getxray.app/display/XRAYCLOUD/REST+API)
- [Importing Cucumber Tests](https://docs.getxray.app/display/XRAYCLOUD/Import+Cucumber+Tests)
- [Test Plans and Executions](https://docs.getxray.app/display/XRAYCLOUD/Test+Plans)
