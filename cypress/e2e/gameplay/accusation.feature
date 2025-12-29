Feature: Accusation System
  As an investigator
  I want to accuse a player of being guilty
  So that I can score points for correct accusations

  # Note: These tests require Supabase database access
  # They are marked @integration to indicate they need real backend
  # Run with: npx cypress run --env tags="@integration"
  # Run mobile tests with: npx cypress run --env tags="@mobile"

  Background:
    Given I am logged in as a player in a playing session

  @mobile @mocked
  Scenario: Mobile - Investigator sees the accuse button
    Given I am assigned the investigator role
    When I visit the play page
    Then I should see the accuse button

  @mobile @mocked
  Scenario: Mobile - Non-investigator does not see accuse button
    Given I am assigned the guilty role
    When I visit the play page
    Then I should not see the accuse button

  @mobile @mocked
  Scenario: Mobile - Investigator can open accusation dialog
    Given I am assigned the investigator role
    And I visit the play page
    When I click the accuse button
    Then I should see the accusation dialog
    And I should see a list of players to accuse

  @mobile @mocked
  Scenario: Mobile - Correct accusation shows success result
    Given I am assigned the investigator role
    And I visit the play page
    And I mock the accusation API to return a correct result
    When I click the accuse button
    And I select the guilty player
    And I confirm the accusation
    Then I should see the accusation was correct

  @mobile @mocked
  Scenario: Mobile - Wrong accusation shows failure result
    Given I am assigned the investigator role
    And I visit the play page
    And I mock the accusation API to return an incorrect result
    When I click the accuse button
    And I select an innocent player
    And I confirm the accusation
    Then I should see the accusation was incorrect

  @mobile @mocked
  Scenario: Mobile - Mystery voting appears after incorrect accusation
    Given I am assigned the investigator role
    And I visit the play page
    And I mock the mysteries list for voting
    And I mock the mystery vote API
    And I mock the accusation API to return an incorrect result
    When I click the accuse button
    And I select an innocent player
    And I confirm the accusation
    Then I should see the mystery voting list

  @mobile @mocked
  Scenario: Mobile - Player can vote for next mystery after accusation
    Given I am assigned the investigator role
    And I visit the play page
    And I mock the mysteries list for voting
    And I mock the mystery vote API
    And I mock real-time vote updates
    And I mock the accusation API to return an incorrect result
    When I click the accuse button
    And I select an innocent player
    And I confirm the accusation
    And I vote for a mystery
    Then I should see my vote was recorded
    And I should not be able to vote again

  @mobile @mocked
  Scenario: Mobile - Vote counts update in real-time
    Given I am assigned the investigator role
    And I visit the play page
    And I mock the mysteries list for voting
    And I mock the mystery vote API
    And I mock real-time vote updates
    And I mock the accusation API to return an incorrect result
    When I click the accuse button
    And I select an innocent player
    And I confirm the accusation
    And I vote for a mystery
    Then I should see the vote count increase
