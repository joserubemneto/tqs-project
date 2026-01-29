@REQ_SCRUM-152
Feature: Manage User Roles
  As an admin
  I want to manage user roles
  So that I can grant appropriate permissions

  Background:
    Given the admin endpoints are available
    And an admin user exists with email "admin@ua.pt" and password "Admin@2024!"
    And a volunteer user exists with email "volunteer@ua.pt" and password "Volunteer@2024!"
    And a promoter user exists with email "promoter@ua.pt" and password "Promoter@2024!"

  @TEST_SCRUM-200
  Scenario: Admin views paginated user list
    Given I am logged in as admin with email "admin@ua.pt" and password "Admin@2024!"
    When I request the user list with page 0 and size 10
    Then the response status should be 200
    And the response should include a list of users
    And the response should include pagination information

  @TEST_SCRUM-201
  Scenario: Admin filters users by search term
    Given I am logged in as admin with email "admin@ua.pt" and password "Admin@2024!"
    When I request the user list with search term "volunteer"
    Then the response status should be 200
    And the response should include only users matching "volunteer"

  @TEST_SCRUM-202
  Scenario: Admin filters users by role
    Given I am logged in as admin with email "admin@ua.pt" and password "Admin@2024!"
    When I request the user list with role filter "PROMOTER"
    Then the response status should be 200
    And the response should include only users with role "PROMOTER"

  @TEST_SCRUM-203
  Scenario: Admin changes user role successfully
    Given I am logged in as admin with email "admin@ua.pt" and password "Admin@2024!"
    And I know the user ID for "volunteer@ua.pt"
    When I update the user role to "PROMOTER"
    Then the response status should be 200
    And the user role should be "PROMOTER"

  @TEST_SCRUM-204
  Scenario: Admin cannot change their own role
    Given I am logged in as admin with email "admin@ua.pt" and password "Admin@2024!"
    And I know my own user ID
    When I try to update my own role to "VOLUNTEER"
    Then the response status should be 400
    And I should see error "You cannot change your own role to prevent lockout"

  @TEST_SCRUM-205
  Scenario: Admin promotes user to ADMIN role
    Given I am logged in as admin with email "admin@ua.pt" and password "Admin@2024!"
    And I know the user ID for "volunteer@ua.pt"
    When I update the user role to "ADMIN"
    Then the response status should be 200
    And the user role should be "ADMIN"

  @TEST_SCRUM-206
  Scenario: Admin demotes another admin
    Given I am logged in as admin with email "admin@ua.pt" and password "Admin@2024!"
    And another admin exists with email "admin2@ua.pt" and password "Admin2@2024!"
    And I know the user ID for "admin2@ua.pt"
    When I update the user role to "VOLUNTEER"
    Then the response status should be 200
    And the user role should be "VOLUNTEER"

  @TEST_SCRUM-207
  Scenario: Non-admin user cannot access user list
    Given I am logged in as volunteer with email "volunteer@ua.pt" and password "Volunteer@2024!"
    When I request the user list with page 0 and size 10
    Then the response status should be 403

  @TEST_SCRUM-208
  Scenario: Non-admin user cannot change roles
    Given I am logged in as volunteer with email "volunteer@ua.pt" and password "Volunteer@2024!"
    And I know the user ID for "promoter@ua.pt"
    When I update the user role to "ADMIN"
    Then the response status should be 403

  @TEST_SCRUM-209
  Scenario: Unauthenticated user cannot access admin endpoints
    When I request the user list without authentication
    Then the response status should be 403

  @TEST_SCRUM-210
  Scenario: Admin tries to update non-existent user
    Given I am logged in as admin with email "admin@ua.pt" and password "Admin@2024!"
    When I try to update role for user ID 9999 to "VOLUNTEER"
    Then the response status should be 404
    And I should see error "User not found with id: 9999"
