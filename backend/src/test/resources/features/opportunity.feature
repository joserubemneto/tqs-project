@REQ_SCRUM-160
Feature: Create Volunteering Opportunity
  As a promoter
  I want to create volunteering opportunities
  So that volunteers can discover and apply

  Background:
    Given a promoter exists with email "promoter@ua.pt" and password "password"
    And the promoter is authenticated
    And skills exist in the system

  Scenario: Create opportunity with valid data
    When I submit a new opportunity with title "UA Open Day Support"
    And I set points reward to 50
    And I set max volunteers to 10
    Then the response status should be 201
    And the opportunity should be created
    And the opportunity should have status "DRAFT"

  Scenario: Create opportunity with all fields
    When I create an opportunity with:
      | title          | UA Open Day Support           |
      | description    | Help with university events   |
      | pointsReward   | 50                            |
      | maxVolunteers  | 10                            |
      | location       | University Campus             |
    Then the response status should be 201
    And the response should include the opportunity details
    And the response should include the promoter details
    And the response should include required skills

  Scenario: Create opportunity with invalid dates
    When I submit an opportunity with end date before start date
    Then the response status should be 400
    And I should see error "End date must be after start date"

  Scenario: Create opportunity without required skills
    When I submit an opportunity without selecting required skills
    Then the response status should be 400
    And I should see error "At least one skill is required"

  Scenario: Create opportunity with blank title
    When I submit an opportunity with blank title
    Then the response status should be 400
    And I should see error "Title is required"

  Scenario: Create opportunity with invalid max volunteers
    When I submit an opportunity with max volunteers 0
    Then the response status should be 400
    And I should see error "Max volunteers must be at least 1"

  Scenario: Volunteer cannot create opportunity
    Given a volunteer exists with email "volunteer@ua.pt" and password "password"
    And the volunteer is authenticated
    When I try to create an opportunity
    Then the response status should be 403

  Scenario: Unauthenticated user cannot create opportunity
    Given I am not authenticated
    When I try to create an opportunity
    Then the response status should be 403

  Scenario: Get promoter's opportunities
    Given I have created an opportunity with title "My Event"
    When I request my opportunities
    Then the response status should be 200
    And the response should contain 1 opportunity
    And the opportunity should have title "My Event"

  Scenario: Get empty opportunities list
    When I request my opportunities
    Then the response status should be 200
    And the response should contain 0 opportunities
