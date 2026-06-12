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
  Scenario: Mobile - Guilty player sees their confession text to read aloud
    Given I am assigned the guilty role
    And an accusation has been made
    And I visit the play page
    When the card flips to show results
    Then I should see my confession text to read aloud

  @mobile @mocked
  Scenario: Mobile - Innocent player does not see the confession text
    Given I am assigned the innocent role
    And an accusation has been made
    And I visit the play page
    When the card flips to show results
    Then I should not see the confession text

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

  @mobile @mocked
  Scenario: Mobile - Player sees the feedback form with the 6 round words
    Given I am assigned the innocent role
    And an accusation has been made
    And the round words are available
    And I visit the play page
    When the card flips to show results
    Then I should see the feedback form
    And the feedback form should list the 6 round words

  @mobile @mocked
  Scenario: Mobile - Player can submit a rating with a flagged word
    Given I am assigned the innocent role
    And an accusation has been made
    And the round words are available
    And the feedback API accepts my submission
    And I visit the play page
    When the card flips to show results
    And I rate the mystery 4 stars
    And I flag the word "poison" as too obvious
    And I submit my feedback
    Then I should see the feedback thanks message

  @mobile @mocked
  Scenario: Mobile - Feedback is skippable and voting stays accessible
    Given I am assigned the innocent role
    And an accusation has been made
    And the round words are available
    And I visit the play page
    When the card flips to show results
    And I skip the feedback form
    Then the feedback form should be collapsed
    And the next mystery list should be visible
