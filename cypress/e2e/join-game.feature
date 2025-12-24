Feature: Join Game Room
  As a player
  I want to join an existing game room
  So that I can participate in the murder mystery game

  Background:
    Given I am on the homepage

  Scenario: Join a game with valid code
    Given a game room exists with code "TEST12"
    When I click the "Join Game" button
    Then I should be on the join page
    When I enter "TEST12" in the game code field
    And I enter "John Doe" in the player name field
    And I click the submit button
    Then I should be redirected to the lobby

  Scenario: Cannot join with invalid code
    When I click the "Join Game" button
    And I enter "WRONG1" in the game code field
    And I enter "Jane Doe" in the player name field
    And I click the submit button
    Then I should see an error message
    And I should still be on the join page

  Scenario: Join button disabled without required fields
    When I click the "Join Game" button
    Then the submit button should be disabled
    When I enter "ABC123" in the game code field
    Then the submit button should be disabled
    When I enter "Test User" in the player name field
    Then the submit button should be enabled

  Scenario: Join game via direct URL with code
    Given a game room exists with code "DIRECT"
    When I visit the join page with code "DIRECT"
    Then the game code field should contain "DIRECT"
    When I enter "Bob Smith" in the player name field
    And I click the submit button
    Then I should be redirected to the lobby

  Scenario: Game code is automatically uppercased
    When I click the "Join Game" button
    When I type "abc123" in the game code field
    Then the game code field should contain "ABC123"
