Feature: Create Game Room
  As a game host
  I want to create a new game room
  So that I can invite players to join

  Background:
    Given I am on the homepage

  Scenario: Successfully create a game room
    When I click the "Create Room" button
    Then I should be on the create room page
    When I click the "Generate Room Code" button
    Then I should see a 6-character game code
    And I should see a QR code
    And I should see a "Join This Room" button

  Scenario: Join my own created room
    When I click the "Create Room" button
    And I click the "Generate Room Code" button
    And I wait for the game code to be displayed
    When I click the "Join This Room" button
    Then I should be on the join page
    And the game code field should be pre-filled

  Scenario: Navigate back from room creation
    When I click the "Create Room" button
    And I click the "Generate Room Code" button
    When I click the "Back to Home" button
    Then I should be on the homepage
