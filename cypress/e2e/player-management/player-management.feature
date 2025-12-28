Feature: Player Management
  As a player in the lobby
  I want to be able to kick other players
  And take over an existing session if my name is already in use
  So that I can manage synchronization issues

  # ==================== Kick Player Tests ====================

  @mocked
  Scenario: Player sees kick button for other players
    Given I mock a lobby session as "Alice" with 3 players
    When I visit the lobby page
    Then I should see kick buttons for other players
    And I should not see a kick button for myself

  @mocked
  Scenario: Player can open kick confirmation dialog
    Given I mock a lobby session as "Alice" with 3 players
    When I visit the lobby page
    And I click the kick button for "Player2"
    Then I should see the kick confirmation dialog
    And the dialog should mention "Player2"

  @mocked
  Scenario: Player can cancel kick action
    Given I mock a lobby session as "Alice" with 3 players
    When I visit the lobby page
    And I click the kick button for "Player2"
    And I click the cancel button in the dialog
    Then the kick confirmation dialog should be closed

  @mocked
  Scenario: Player can confirm kick action
    Given I mock a lobby session as "Alice" with 3 players
    And I mock the kick player API
    When I visit the lobby page
    And I click the kick button for "Player2"
    And I click the confirm button in the dialog
    Then the kick API should be called for "Player2"

  # ==================== Session Takeover Tests ====================

  @mocked
  Scenario: Player sees takeover dialog when name is already taken
    Given I mock the join API with name already taken
    When I visit the join page
    And I enter "TEST01" in the game code field
    And I enter "Alice" in the player name field
    And I click the join button
    Then I should see the takeover dialog
    And the dialog should explain the takeover option

  @mocked
  Scenario: Player can cancel takeover and choose another name
    Given I mock the join API with name already taken
    When I visit the join page
    And I enter "TEST01" in the game code field
    And I enter "Alice" in the player name field
    And I click the join button
    And I click the cancel takeover button
    Then the takeover dialog should be closed
    And I should still be on the join page

  @mocked
  Scenario: Player can confirm takeover and join with existing session
    Given I mock the join API with name already taken
    And I mock the takeover API
    When I visit the join page
    And I enter "TEST01" in the game code field
    And I enter "Alice" in the player name field
    And I click the join button
    And I click the confirm takeover button
    Then the takeover API should be called
    And I should be redirected to the lobby

  # ==================== Kicked Player Experience ====================

  @mocked
  Scenario: Kicked player sees warning message on join page
    When I visit the join page with kicked parameter
    Then I should see the kicked warning message
    And I should be able to dismiss the warning

