@REQ_SCRUM-165
Feature: Manage Rewards Catalog
  As an administrator
  I want to create and manage rewards in the platform
  So that volunteers can redeem their earned points for valuable benefits

  Background:
    Given an admin user exists with email "admin@ua.pt" and password "password"
    And I am logged in as admin with email "admin@ua.pt" and password "password"

  # ==================== CREATE REWARD SCENARIOS ====================

  Scenario: Create a new reward with valid data
    When I create a reward with:
      | title       | Free Coffee Voucher                |
      | description | Redeem for a free coffee at cafeteria |
      | pointsCost  | 50                                 |
      | type        | UA_SERVICE                         |
      | quantity    | 100                                |
    Then the response status should be 201
    And the reward should be created with title "Free Coffee Voucher"
    And the reward should have pointsCost 50
    And the reward should have type "UA_SERVICE"
    And the reward should be active

  Scenario: Create reward without quantity (unlimited)
    When I create a reward with:
      | title       | Digital Certificate         |
      | description | Certificate of appreciation |
      | pointsCost  | 100                         |
      | type        | CERTIFICATE                 |
    Then the response status should be 201
    And the reward should be created with title "Digital Certificate"
    And the reward should have unlimited quantity

  Scenario: Create reward with availability dates
    When I create a reward with availability period
    Then the response status should be 201
    And the reward should have availability dates

  Scenario: Create reward with invalid points cost
    When I create a reward with pointsCost 0
    Then the response status should be 400

  Scenario: Create reward with blank title
    When I create a reward with blank title
    Then the response status should be 400

  Scenario: Create reward with invalid date range
    When I create a reward with end date before start date
    Then the response status should be 400
    And I should see error "Available until date must be after available from date"

  # ==================== VIEW REWARDS SCENARIOS ====================

  Scenario: View all rewards as admin
    Given the following rewards exist:
      | title     | pointsCost | type       | active |
      | Reward A  | 50         | UA_SERVICE | true   |
      | Reward B  | 100        | MERCHANDISE| true   |
      | Reward C  | 75         | CERTIFICATE| false  |
    When I request all rewards as admin
    Then the response status should be 200
    And the response should include 3 rewards

  Scenario: View available rewards as public user
    Given the following rewards exist:
      | title     | pointsCost | type       | active |
      | Reward A  | 50         | UA_SERVICE | true   |
      | Reward B  | 100        | MERCHANDISE| true   |
      | Reward C  | 75         | CERTIFICATE| false  |
    When I request available rewards as public user
    Then the response status should be 200
    And the response should include 2 rewards
    And all rewards should be active

  Scenario: View single reward by ID
    Given a reward exists with title "Special Reward"
    When I request the reward by ID
    Then the response status should be 200
    And the reward title should be "Special Reward"

  Scenario: View non-existent reward
    When I request reward with ID 99999
    Then the response status should be 404

  # ==================== UPDATE REWARD SCENARIOS ====================

  Scenario: Update reward with valid data
    Given a reward exists with title "Original Title"
    When I update the reward title to "Updated Title"
    Then the response status should be 200
    And the reward title should be "Updated Title"

  Scenario: Update reward points cost
    Given a reward exists with title "Point Update Test" and pointsCost 50
    When I update the reward pointsCost to 75
    Then the response status should be 200
    And the reward should have pointsCost 75

  Scenario: Deactivate a reward
    Given a reward exists with title "To Deactivate"
    When I deactivate the reward
    Then the response status should be 204
    And the reward should be inactive in the database

  Scenario: Update non-existent reward
    When I try to update reward with ID 99999
    Then the response status should be 404

  # ==================== AUTHORIZATION SCENARIOS ====================

  Scenario: Volunteer cannot create reward
    Given a volunteer user exists with email "volunteer@ua.pt" and password "password"
    And I am logged in as volunteer with email "volunteer@ua.pt" and password "password"
    When I try to create a reward
    Then the response status should be 403

  Scenario: Unauthenticated user cannot create reward
    Given I am not authenticated
    When I try to create a reward without authentication
    Then the response status should be 403

  Scenario: Volunteer cannot update reward
    Given a reward exists with title "Admin Only"
    And a volunteer user exists with email "volunteer@ua.pt" and password "password"
    And I am logged in as volunteer with email "volunteer@ua.pt" and password "password"
    When I try to update the reward
    Then the response status should be 403

  Scenario: Volunteer cannot delete reward
    Given a reward exists with title "Admin Only"
    And a volunteer user exists with email "volunteer@ua.pt" and password "password"
    And I am logged in as volunteer with email "volunteer@ua.pt" and password "password"
    When I try to delete the reward
    Then the response status should be 403
