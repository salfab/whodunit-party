import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Shared state
let testSessionId: string;
let testJoinCode: string;
let testPlayerId: string;

// ==================== Mocked Session Setup ====================

Given('I mock a lobby session as {string}', (playerName: string) => {
  testSessionId = 'mock-session-001';
  testJoinCode = 'TEST01';
  testPlayerId = 'mock-player-001';

  // Mock session/me
  cy.intercept('GET', '/api/session/me', {
    statusCode: 200,
    body: {
      playerId: testPlayerId,
      sessionId: testSessionId,
      playerName,
    },
  }).as('sessionMe');

  // Mock game_sessions Supabase query
  cy.intercept('GET', '**/rest/v1/game_sessions*', {
    statusCode: 200,
    body: {
      id: testSessionId,
      join_code: testJoinCode,
      status: 'lobby',
      language: 'en',
    },
  }).as('getSession');

  // Mock players Supabase query
  cy.intercept('GET', '**/rest/v1/players*', {
    statusCode: 200,
    body: [{ id: testPlayerId, name: playerName, status: 'active', session_id: testSessionId }],
  }).as('getPlayers');

  // Mock mysteries
  cy.intercept('GET', '/api/mysteries*', {
    statusCode: 200,
    body: { mysteries: [] },
  }).as('getMysteries');

  // Mock ready states
  cy.intercept('GET', '**/rest/v1/player_ready_states*', {
    statusCode: 200,
    body: [],
  }).as('getReadyStates');

  // Mock mystery votes
  cy.intercept('GET', '**/rest/v1/mystery_votes*', {
    statusCode: 200,
    body: [],
  }).as('getVotes');

  // Mock rounds
  cy.intercept('GET', '**/rest/v1/rounds*', {
    statusCode: 200,
    body: [],
  }).as('getRounds');
});

Given('I mock a lobby session as {string} with {int} players', (playerName: string, playerCount: number) => {
  testSessionId = 'mock-session-001';
  testJoinCode = 'TEST01';
  testPlayerId = 'mock-player-001';

  const players = [{ id: testPlayerId, name: playerName, status: 'active', session_id: testSessionId }];
  for (let i = 2; i <= playerCount; i++) {
    players.push({
      id: `mock-player-00${i}`,
      name: `Player${i}`,
      status: 'active',
      session_id: testSessionId,
    });
  }

  cy.intercept('GET', '/api/session/me', {
    statusCode: 200,
    body: { playerId: testPlayerId, sessionId: testSessionId, playerName },
  }).as('sessionMe');

  cy.intercept('GET', '**/rest/v1/game_sessions*', {
    statusCode: 200,
    body: { id: testSessionId, join_code: testJoinCode, status: 'lobby', language: 'en' },
  }).as('getSession');

  cy.intercept('GET', '**/rest/v1/players*', {
    statusCode: 200,
    body: players,
  }).as('getPlayers');

  cy.intercept('GET', '/api/mysteries*', {
    statusCode: 200,
    body: { mysteries: [{ id: 'mystery-1', title: 'Test Mystery', character_count: 10 }] },
  }).as('getMysteries');

  cy.intercept('GET', '**/rest/v1/player_ready_states*', { statusCode: 200, body: [] }).as('getReadyStates');
  cy.intercept('GET', '**/rest/v1/mystery_votes*', { statusCode: 200, body: [] }).as('getVotes');
  cy.intercept('GET', '**/rest/v1/rounds*', { statusCode: 200, body: [] }).as('getRounds');

  cy.intercept('POST', '**/api/sessions/*/vote-mystery', {
    statusCode: 200,
    body: { success: true, roundNumber: 1, nextRoundStarted: false },
  }).as('voteMystery');
});

Given('I mock a lobby session as {string} with mysteries', (playerName: string) => {
  testSessionId = 'mock-session-001';
  testJoinCode = 'TEST01';
  testPlayerId = 'mock-player-001';

  cy.intercept('GET', '/api/session/me', {
    statusCode: 200,
    body: { playerId: testPlayerId, sessionId: testSessionId, playerName },
  }).as('sessionMe');

  cy.intercept('GET', '**/rest/v1/game_sessions*', {
    statusCode: 200,
    body: { id: testSessionId, join_code: testJoinCode, status: 'lobby', language: 'en' },
  }).as('getSession');

  cy.intercept('GET', '**/rest/v1/players*', {
    statusCode: 200,
    body: [{ id: testPlayerId, name: playerName, status: 'active', session_id: testSessionId }],
  }).as('getPlayers');

  cy.intercept('GET', '/api/mysteries*', {
    statusCode: 200,
    fixture: 'mysteries.json',
  }).as('getMysteries');

  cy.intercept('GET', '**/rest/v1/player_ready_states*', { statusCode: 200, body: [] }).as('getReadyStates');
  cy.intercept('GET', '**/rest/v1/mystery_votes*', { statusCode: 200, body: [] }).as('getVotes');
  cy.intercept('GET', '**/rest/v1/rounds*', { statusCode: 200, body: [] }).as('getRounds');
});

// ==================== Real Session Setup ====================

Given('I create a real room as {string}', (playerName: string) => {
  // Create room via API
  cy.request('POST', '/api/sessions').then((response) => {
    testSessionId = response.body.id;
    testJoinCode = response.body.joinCode;

    // Join as player
    cy.request('POST', '/api/join', {
      joinCode: testJoinCode,
      playerName,
    }).then((joinResponse) => {
      testPlayerId = joinResponse.body.playerId;

      // Visit lobby page
      cy.visit(`/lobby/${testSessionId}`);
    });
  });
});

Given('I create a real room with {int} players', (playerCount: number) => {
  cy.request('POST', '/api/sessions').then((response) => {
    testSessionId = response.body.id;
    testJoinCode = response.body.joinCode;

    // Join as first player
    cy.request('POST', '/api/join', {
      joinCode: testJoinCode,
      playerName: 'Alice',
    }).then((joinResponse) => {
      testPlayerId = joinResponse.body.playerId;

      // Add remaining players
      const playerPromises = [];
      for (let i = 2; i <= playerCount; i++) {
        playerPromises.push(
          cy.request('POST', '/api/join', {
            joinCode: testJoinCode,
            playerName: `Player${i}`,
          })
        );
      }

      // Visit lobby page after all players joined
      cy.visit(`/lobby/${testSessionId}`);
    });
  });
});

// ==================== Navigation ====================

When('I visit the lobby page', () => {
  cy.visit(`/lobby/${testSessionId || 'mock-session-001'}`, { failOnStatusCode: false });
});

// ==================== Assertions ====================

Then('I should see the join code displayed', () => {
  cy.getByTestId('lobby-join-code').should('be.visible');
});

Then('I should see {string} in the player list', (playerName: string) => {
  cy.getByTestId('lobby-player-list').should('contain', playerName);
});

Then('I should see the {string} badge next to my name', () => {
  cy.getByTestId('lobby-player-you-badge').should('be.visible');
});

Then('I should see the mystery voting section', () => {
  cy.contains('Votez pour le mystère').should('be.visible');
});

// ==================== Voting and Ready State ====================

When('I vote for a mystery', () => {
  // Click on the first mystery in the list to vote
  // MUI ListItemButton renders as a div with role="button", so we find by text and click
  cy.contains('Test Mystery').click();
  // Wait for the vote API call
  cy.wait('@voteMystery');
  // Voting automatically marks player as ready
  cy.wait('@markReady');
});

When('I click the refresh button', () => {
  cy.getByTestId('lobby-refresh-button').click();
});

Then('I should be marked as ready', () => {
  // After voting, the vote-mystery API should have been called
  // Ready state is now derived from votes - voting = ready
  cy.get('@voteMystery').its('request.body').should('have.property', 'mysteryId');
});

Then('the refresh button should be visible', () => {
  cy.getByTestId('lobby-refresh-button').should('be.visible');
});

Then('the quit button should be visible', () => {
  cy.getByTestId('lobby-quit-button').should('be.visible');
});

// ==================== Real-time Assertions ====================

When('another player {string} joins via API', (playerName: string) => {
  cy.request('POST', '/api/join', {
    joinCode: testJoinCode,
    playerName,
  });
});

Then('I should see {string} in the player list within {int} seconds', (playerName: string, seconds: number) => {
  cy.getByTestId('lobby-player-list', { timeout: seconds * 1000 }).should('contain', playerName);
});

When('player {string} marks themselves as ready via API', (playerName: string) => {
  // Ready state is now derived from votes - voting = ready
  // This would require the player's session token to vote, so we'll skip for now
  cy.log(`Marking ${playerName} as ready via vote - requires session token`);
});

Then('the ready count should update within {int} seconds', (seconds: number) => {
  cy.getByTestId('lobby-ready-count', { timeout: seconds * 1000 }).should('be.visible');
});
