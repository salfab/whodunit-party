Feature: Character Sheet Display
  As a player in an active game
  I want to see my character information
  So that I can play my role effectively

  # Note: These tests require Supabase database access
  # They are marked @integration to indicate they need real backend
  # Run with: npx cypress run --env tags="@integration"
  # Run mobile tests with: npx cypress run --env tags="@mobile"

  Background:
    Given I am logged in as a player in a playing session

  @mobile
  Scenario: Mobile - Investigator is visible
    Given I am assigned the investigator role
    When I visit the play page
    Then I should see the accuse button

  @mobile
  Scenario: Mobile - Character name and image display properly
    Given I am assigned the guilty role
    When I visit the play page
    Then I should see the character name "Jean Dupont"
    And the character image should be displayed

  @mobile @mocked
  Scenario: Mobile - Card flip reveals role on tap
    Given I am assigned the guilty role
    When I visit the play page
    Then I should see the role reveal card
    And the card should show the front side
    When I tap the role reveal card
    Then the card should flip to show the back
    And I should see the role "COUPABLE" on the card back

  @mobile @mocked
  Scenario: Mobile - Card can be flipped back to front
    Given I am assigned the innocent role
    When I visit the play page
    And I tap the role reveal card
    Then the card should flip to show the back
    When I tap the role reveal card
    Then the card should flip back to show the front

  @mobile
  Scenario: Mobile - Player sees their words to place
    Given I am assigned the guilty role with words
    When I visit the play page
    Then I should see 3 words to place in conversation

  @mobile
  Scenario: Mobile - Player can toggle secret visibility
    Given I am assigned the innocent role
    And I visit the play page
    When I click the secret toggle button
    Then the secret content should be visible
