Feature: Post-Accusation Confession
  As a guilty player
  I want to confess my dark secret after being revealed
  So that other players learn the truth dramatically

  # These tests verify the confession flow for guilty players
  # and that other roles do NOT see the confession button

  Background:
    Given I am logged in as a player in a playing session

  @mobile @mocked
  Scenario: Mobile - Guilty player sees confession button after accusation
    Given I am assigned the guilty role
    And an accusation has been made
    And I visit the play page
    When the card flips to show results
    Then I should see the confession button

  @mobile @mocked
  Scenario: Mobile - Guilty player can open confession dialog
    Given I am assigned the guilty role
    And an accusation has been made
    And I visit the play page
    When the card flips to show results
    And I click the confession button
    Then I should see the confession dialog
    And I should see my dark secret in the dialog

  @mobile @mocked
  Scenario: Mobile - Guilty player can close confession dialog
    Given I am assigned the guilty role
    And an accusation has been made
    And I visit the play page
    When the card flips to show results
    And I click the confession button
    And I click the close confession button
    Then the confession dialog should be closed

  @mobile @mocked
  Scenario: Mobile - Investigator does not see confession button
    Given I am assigned the investigator role
    And I visit the play page
    And I mock the accusation API to return a correct result
    When I click the accuse button
    And I select the guilty player
    And I confirm the accusation
    Then I should not see the confession button

  @mobile @mocked
  Scenario: Mobile - Innocent player does not see confession button
    Given I am assigned the innocent role
    And an accusation has been made
    And I visit the play page
    When the card flips to show results
    Then I should not see the confession button
