@REQ_SCRUM-149
Feature: User Registration
  As a new user
  I want to register on the platform
  So that I can participate in volunteering opportunities

  Background:
    Given the registration endpoint is available

  @TEST_SCRUM-175
  Scenario: Successful registration
    Given I am on the registration page
    When I submit valid registration data with email "newvolunteer@ua.pt", password "SecurePass123", and name "New Volunteer"
    Then my account should be created
    And the response should include my user details
    And the response should include a valid JWT token

  @TEST_SCRUM-176
  Scenario: Registration with invalid email format
    When I submit email "invalid-email" with password "SecurePass123" and name "Test User"
    Then I should see error "Invalid email format"
    And the response status should be 400

  @TEST_SCRUM-177
  Scenario: Registration with existing email
    Given a user exists with email "existing@ua.pt"
    When I try to register with email "existing@ua.pt" password "SecurePass123" and name "Another User"
    Then I should see error "Email already registered"
    And the response status should be 409

  @TEST_SCRUM-178
  Scenario: Registration with short password
    When I submit email "test@ua.pt" with password "short" and name "Test User"
    Then I should see error "Password must be at least 8 characters"
    And the response status should be 400

  @TEST_SCRUM-179
  Scenario: Registration with missing email
    When I submit registration without email
    Then the response status should be 400

  @TEST_SCRUM-180
  Scenario: Registration with missing name
    When I submit registration without name
    Then the response status should be 400

  Scenario: Registration with PROMOTER role
    When I submit valid registration data with email "promoter@ua.pt", password "SecurePass123", name "Promoter User", and role "PROMOTER"
    Then my account should be created
    And the response should show role "PROMOTER"

  Scenario: Default role is VOLUNTEER
    When I submit valid registration data with email "defaultrole@ua.pt", password "SecurePass123", and name "Default Role User"
    Then my account should be created
    And the response should show role "VOLUNTEER"
