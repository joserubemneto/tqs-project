@REQ_SCRUM-150
Feature: User Login
  As a registered user
  I want to login with my credentials
  So that I can access the platform features

  Background:
    Given the login endpoint is available

  @TEST_SCRUM-181
  Scenario: Successful login
    Given I am a registered user with email "user@ua.pt" and password "SecurePass123"
    When I submit login with email "user@ua.pt" and password "SecurePass123"
    Then the response status should be 200
    And the response should include my user details
    And the response should include a valid JWT token

  @TEST_SCRUM-182
  Scenario: Login with wrong password
    Given I am a registered user with email "user@ua.pt" and password "SecurePass123"
    When I submit login with email "user@ua.pt" and password "WrongPassword"
    Then I should see error "Invalid credentials"
    And the response status should be 401

  @TEST_SCRUM-183
  Scenario: Login with non-existent email
    When I submit login with email "nonexistent@ua.pt" and password "AnyPassword"
    Then I should see error "Invalid credentials"
    And the response status should be 401

  @TEST_SCRUM-184
  Scenario: Login with invalid email format
    When I submit login with email "invalid-email" and password "SecurePass123"
    Then I should see error "Invalid email format"
    And the response status should be 400

  @TEST_SCRUM-185
  Scenario: Login with missing password
    When I submit login without password for email "user@ua.pt"
    Then the response status should be 400
