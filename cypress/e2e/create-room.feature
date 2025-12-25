Feature: Create Game Room
  As a game host
  I want to create a new game room
  So that I can invite players to join

  Background:
    Given I am on the homepage

  Scenario: Successfully create a game room
    When I click the "Créer une salle" button
    Then I should be on the create room page
    And I should see a 6-character game code
    And I should see a QR code
    And I should see a "Rejoindre cette salle" button

  Scenario: Join my own created room
    When I click the "Créer une salle" button
    And I wait for the game code to be displayed
    When I click the "Rejoindre cette salle" button
    Then I should be on the join page
    And the game code field should be pre-filled

  Scenario: Navigate back from room creation
    When I click the "Créer une salle" button
    And I wait for the game code to be displayed
    When I click the "Retour à l'accueil" button
    Then I should be on the homepage
