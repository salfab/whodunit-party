Feature: Game Lobby
  As a player
  I want to see other players join the lobby in real-time
  And see my ready state persist when I refresh
  So that I can coordinate with other players to start the game

  # ==================== Mocked Single-Player Tests ====================

  @mocked
  Scenario: Player sees lobby with join code
    Given I mock a lobby session as "Alice"
    When I visit the lobby page
    Then I should see the join code displayed
    And I should see "Alice" in the player list
    And I should see the "Vous" badge next to my name

  @mocked
  Scenario: Player can toggle ready state
    Given I mock a lobby session as "Alice" with 5 players
    When I visit the lobby page
    And I click the ready button
    Then the ready button should show "Pas prêt"

  @mocked
  Scenario: Player sees mystery voting list
    Given I mock a lobby session as "Alice" with mysteries
    When I visit the lobby page
    Then I should see the mystery voting section

  # ==================== Real Multi-Player Tests ====================

  @realtime
  Scenario: New players appear in real-time
    Given I create a real room as "Alice"
    When another player "Bob" joins via API
    Then I should see "Bob" in the player list within 10 seconds

  @realtime
  Scenario: Ready count updates in real-time
    Given I create a real room with 5 players
    When player "Bob" marks themselves as ready via API
    Then the ready count should update within 10 seconds
