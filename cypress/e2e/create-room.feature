Feature: Create Game Room
  As a game host
  I want to create a new game room
  So that I can invite players to join

  Background:
    Given I am on the homepage

  Scenario: Successfully create a game room and go to join page
    When I click the create room button
    Then I should be redirected to the join page
    And the game code field should be pre-filled with a 6-character code

  Scenario: Create room shows loading state
    When I click the create room button
    Then I should briefly see the loading screen
    And I should be redirected to the join page

  Scenario: Join page has QR code for sharing after room creation
    When I click the create room button
    And I wait to be on the join page
    Then I should be able to access the QR code from the lobby
