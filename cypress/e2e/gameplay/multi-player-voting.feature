Feature: Multi-Player Voting and Game Start
  As multiple players in a game
  We want to vote for mysteries and start rounds
  So that we can play together without bypassing minimum player requirements

  # Note: These tests require local Supabase database running with real-time enabled
  # They use real API calls and depend on database triggers and real-time events
  
  @realtime @integration @multi-player
  Scenario: 5 players vote in lobby to start game
    Given I create a room as the host
    When 5 players join the room via API
    And all players vote for a mystery
    Then the game should start with roles assigned
    And all players should see their character sheets

  @realtime @integration @multi-player
  Scenario: Single player cannot start game by voting
    Given I create a room as the host
    When 1 player joins and votes for a mystery
    Then the game should not start
    And the player should still be in the lobby

  @realtime @integration @multi-player
  Scenario: 5 players vote after accusation to start round 2
    Given 5 players are in an active game with an accusation made
    When all 5 players vote for the next mystery
    Then round 2 should start
    And all players should see new character sheets

  @realtime @integration @multi-player
  Scenario: Double-clicking vote does not bypass minimum players
    Given I create a room as the host
    When 1 player joins and votes twice quickly
    Then the game should not start
    And only 1 vote should be counted
