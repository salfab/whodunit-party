Feature: Accusation System
  As an investigator
  I want to accuse a player of being guilty
  So that I can score points for correct accusations

  # Note: These tests require Supabase database access
  # They are marked @integration to indicate they need real backend
  # Run with: npx cypress run --env tags="@integration"

  Background:
    Given I am logged in as a player in a playing session

  @integration @skip
  Scenario: Investigator sees the accuse button
    Given I am assigned the investigator role
    When I visit the play page
    Then I should see the accuse button

  @integration @skip
  Scenario: Non-investigator does not see accuse button
    Given I am assigned the guilty role
    When I visit the play page
    Then I should not see the accuse button

  @integration @skip
  Scenario: Investigator can open accusation dialog
    Given I am assigned the investigator role
    And I visit the play page
    When I click the accuse button
    Then I should see the accusation dialog
    And I should see a list of players to accuse

  @integration @skip
  Scenario: Correct accusation shows success result
    Given I am assigned the investigator role
    And I visit the play page
    And I mock the accusation API to return a correct result
    When I click the accuse button
    And I select the guilty player
    And I confirm the accusation
    Then I should see the accusation was correct

  @integration @skip
  Scenario: Wrong accusation shows failure result
    Given I am assigned the investigator role
    And I visit the play page
    And I mock the accusation API to return an incorrect result
    When I click the accuse button
    And I select an innocent player
    And I confirm the accusation
    Then I should see the accusation was incorrect
