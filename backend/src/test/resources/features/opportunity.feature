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

  # ==================== EDIT OPPORTUNITY SCENARIOS ====================

  Scenario: Edit opportunity with valid data
    Given I have created an opportunity with title "Original Title" in status "DRAFT"
    When I update the opportunity title to "Updated Title"
    Then the response status should be 200
    And the opportunity title should be "Updated Title"

  Scenario: Edit all editable fields
    Given I have created an opportunity with title "Original Event" in status "DRAFT"
    When I update the opportunity with:
      | title          | Updated Event Title        |
      | description    | Updated description text   |
      | pointsReward   | 100                        |
      | maxVolunteers  | 20                         |
      | location       | New Location               |
    Then the response status should be 200
    And the response should include all updated fields

  Scenario: Edit opportunity in OPEN status
    Given I have created an opportunity with title "Open Event" in status "OPEN"
    When I update the opportunity title to "Updated Open Event"
    Then the response status should be 200
    And the opportunity title should be "Updated Open Event"

  Scenario: Cannot edit opportunity in IN_PROGRESS status
    Given I have created an opportunity with title "In Progress Event" in status "IN_PROGRESS"
    When I try to update the opportunity title
    Then the response status should be 400
    And I should see error "Cannot edit opportunity in current status"

  Scenario: Cannot edit opportunity in COMPLETED status
    Given I have created an opportunity with title "Completed Event" in status "COMPLETED"
    When I try to update the opportunity title
    Then the response status should be 400
    And I should see error "Cannot edit opportunity in current status"

  Scenario: Cannot edit opportunity in CANCELLED status
    Given I have created an opportunity with title "Cancelled Event" in status "CANCELLED"
    When I try to update the opportunity title
    Then the response status should be 400
    And I should see error "Cannot edit opportunity in current status"

  Scenario: Edit with invalid dates
    Given I have created an opportunity with title "Date Test Event" in status "DRAFT"
    When I update the opportunity with end date before start date
    Then the response status should be 400
    And I should see error "End date must be after start date"

  Scenario: Cannot reduce maxVolunteers below enrolled count
    Given I have created an opportunity with 5 enrolled volunteers
    When I update maxVolunteers to 3
    Then the response status should be 400
    And I should see error "Cannot reduce max volunteers below current enrollment"

  Scenario: Cannot edit another promoter's opportunity
    Given another promoter has created an opportunity with title "Other Event"
    When I try to edit that opportunity
    Then the response status should be 403
    And I should see error "Access denied"

  Scenario: Admin can edit any opportunity
    Given an admin exists with email "admin@ua.pt" and password "password"
    And the admin is authenticated
    And another promoter has created an opportunity with title "Other Event"
    When I update that opportunity title to "Admin Updated"
    Then the response status should be 200
    And the opportunity title should be "Admin Updated"

  Scenario: Volunteer cannot edit opportunity
    Given a volunteer exists with email "volunteer@ua.pt" and password "password"
    And the volunteer is authenticated
    And an opportunity exists with title "Some Event"
    When I try to update the opportunity
    Then the response status should be 403

  Scenario: Unauthenticated user cannot edit opportunity
    Given I am not authenticated
    And an opportunity exists with title "Some Event"
    When I try to update the opportunity
    Then the response status should be 403

  Scenario: Edit non-existent opportunity
    When I try to edit opportunity with id 99999
    Then the response status should be 404
    And I should see error "Opportunity not found"

  # ==================== CANCEL OPPORTUNITY SCENARIOS ====================

  Scenario: Cancel opportunity in DRAFT status
    Given I have created an opportunity with title "Draft Event" in status "DRAFT"
    When I cancel the opportunity
    Then the response status should be 200
    And the opportunity status should be "CANCELLED"

  Scenario: Cancel opportunity in OPEN status
    Given I have created an opportunity with title "Open Event" in status "OPEN"
    When I cancel the opportunity
    Then the response status should be 200
    And the opportunity status should be "CANCELLED"

  Scenario: Cancel opportunity in FULL status
    Given I have created an opportunity with title "Full Event" in status "FULL"
    When I cancel the opportunity
    Then the response status should be 200
    And the opportunity status should be "CANCELLED"

  Scenario: Cannot cancel opportunity in IN_PROGRESS status
    Given I have created an opportunity with title "In Progress Event" in status "IN_PROGRESS"
    When I try to cancel the opportunity
    Then the response status should be 400
    And I should see error "Cannot cancel opportunity in progress"

  Scenario: Cannot cancel opportunity in COMPLETED status
    Given I have created an opportunity with title "Completed Event" in status "COMPLETED"
    When I try to cancel the opportunity
    Then the response status should be 400
    And I should see error "Cannot cancel completed opportunity"

  Scenario: Cannot cancel already cancelled opportunity
    Given I have created an opportunity with title "Cancelled Event" in status "CANCELLED"
    When I try to cancel the opportunity
    Then the response status should be 400
    And I should see error "Opportunity is already cancelled"

  Scenario: Cannot cancel another promoter's opportunity
    Given another promoter has created an opportunity with title "Other Event"
    When I try to cancel that opportunity
    Then the response status should be 403
    And I should see error "Access denied"

  Scenario: Admin can cancel any opportunity
    Given an admin exists with email "admin@ua.pt" and password "password"
    And the admin is authenticated
    And another promoter has created an opportunity with title "Other Event" in status "OPEN"
    When I cancel that opportunity
    Then the response status should be 200
    And the opportunity status should be "CANCELLED"

  Scenario: Volunteer cannot cancel opportunity
    Given a volunteer exists with email "volunteer@ua.pt" and password "password"
    And the volunteer is authenticated
    And an opportunity exists with title "Some Event"
    When I try to cancel the opportunity
    Then the response status should be 403

  Scenario: Unauthenticated user cannot cancel opportunity
    Given I am not authenticated
    And an opportunity exists with title "Some Event"
    When I try to cancel the opportunity
    Then the response status should be 403

  Scenario: Cancel non-existent opportunity
    When I try to cancel opportunity with id 99999
    Then the response status should be 404
    And I should see error "Opportunity not found"
