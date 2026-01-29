@REQ_SCRUM-152
Feature: Edit Profile and Skills
  As a volunteer
  I want to edit my profile and skills
  So that I can be matched with relevant opportunities

  Background:
    Given a volunteer with profile exists with email "profiletest@ua.pt" and password "password"
    And the user is authenticated
    And skills exist in the system

  Scenario: View current profile
    When I request my profile
    Then the response status should be 200
    And the response should include my profile details
    And the response should include my skills

  Scenario: Successfully update profile name
    When I update my profile with name "Updated Name"
    Then the response status should be 200
    And the response should show name "Updated Name"

  Scenario: Successfully update bio
    When I update my profile with bio "I love volunteering"
    Then the response status should be 200
    And the response should show bio "I love volunteering"

  Scenario: Successfully add skills
    When I update my profile with skill "Communication"
    Then the response status should be 200
    And the response skills should include "Communication"

  Scenario: Successfully remove skills
    Given my profile has the skill "Communication"
    When I update my profile without skills
    Then the response status should be 200
    And the response should have no skills

  Scenario: Bio exceeds maximum length
    When I update my profile with a bio of 501 characters
    Then the response status should be 400

  Scenario: Name is required
    When I update my profile with empty name
    Then the response status should be 400

  Scenario: Unauthenticated user cannot access profile
    Given I am not authenticated
    When I request my profile
    Then the response status should be 403

  Scenario: Get all available skills
    When I request all skills
    Then the response status should be 200
    And the response should include a list of skills

  Scenario: Filter skills by category
    When I request skills with category "COMMUNICATION"
    Then the response status should be 200
    And all returned skills should have category "COMMUNICATION"
