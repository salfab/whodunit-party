Feature: Game Lobby
  As a player
  I want to see other players join the lobby in real-time
  And vote for a mystery to automatically mark myself as ready
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
  Scenario: Player voting automatically marks as ready
    Given I mock a lobby session as "Alice" with 5 players
    When I visit the lobby page
    And I vote for a mystery
    Then I should be marked as ready

  @mocked
  Scenario: Lobby has refresh and quit buttons
    Given I mock a lobby session as "Alice" with 5 players
    When I visit the lobby page
    Then the refresh button should be visible
    And the quit button should be visible

  @mocked
  Scenario: Player sees mystery voting list
    Given I mock a lobby session as "Alice" with mysteries
    When I visit the lobby page
    Then I should see the mystery voting section

  @mocked
  Scenario: Host can toggle adult content (excluded by default)
    Given I mock a lobby session as "Alice" with mysteries
    And I mock the adult content update API
    When I visit the lobby page
    Then the adult content toggle should be off
    When I enable the adult content toggle
    Then the adult content update should be requested with inclusion enabled

  @mocked
  Scenario: Non-host sees room settings as read-only
    Given I mock a lobby session as "Bob" who is not the host
    When I visit the lobby page
    Then the adult content toggle should be disabled
    And I should see the host-only settings hint

  # ==================== Real Multi-Player Tests ====================
  # Note: These tests require Supabase database access and real-time subscriptions
  # They are marked @realtime and @skip because they need actual backend
  # Run with: npx cypress run --env tags="@realtime"

  @realtime @skip
  Scenario: New players appear in real-time
    Given I create a real room as "Alice"
    When another player "Bob" joins via API
    Then I should see "Bob" in the player list within 10 seconds

  @realtime @skip
  Scenario: Ready count updates in real-time
    Given I create a real room with 5 players
    When player "Bob" marks themselves as ready via API
    Then the ready count should update within 10 seconds
