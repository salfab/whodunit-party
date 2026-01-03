import { Given, When, Then, Before } from '@badeball/cypress-cucumber-preprocessor';

// Shared state between steps
let sessionData: { sessionId: string; joinCode: string };
let players: Array<{ name: string; id: string }> = [];
let scenarioId: string;
let scenarioCounter = 0;

// Clear all cached sessions before each scenario to avoid NAME_TAKEN conflicts
Before(() => {
  Cypress.session.clearAllSavedSessions();
  players = [];
  // Generate truly unique ID - use full UUID without truncation
  // Player names will be like: A{8chars}0 = 10 chars (well under 15 limit)
  scenarioCounter++;
  const uuid = crypto.randomUUID().replace(/-/g, ''); // Remove dashes
  scenarioId = uuid.substring(0, 8); // Take first 8 hex chars for uniqueness
});

// ==================== Given Steps ====================

Given('I create a room as the host', () => {
  cy.createRealRoom().then((data) => {
    sessionData = data;
    cy.log(`Room created: ${data.joinCode}`);
  });
});

Given('5 players are in an active game with an accusation made', () => {
  // This is a complex setup - would need:
  // 1. Create room
  // 2. Join 5 players
  // 3. Vote for mystery (start round 1)
  // 4. Make an accusation
  // For now, we'll implement the basic structure
  cy.createRealRoom().then((data) => {
    sessionData = data;
    
    // Join 5 players with unique names using scenarioId
    const playerNames = [
      `A${scenarioId}0`,
      `B${scenarioId}1`,
      `C${scenarioId}2`,
      `D${scenarioId}3`,
      `E${scenarioId}4`
    ];
    players = [];
    
    // Join players sequentially using cy.wrap().each() which properly chains
    cy.wrap(playerNames).each((name: string) => {
      return cy.request({
        method: 'POST',
        url: '/api/join',
        body: { joinCode: sessionData.joinCode, playerName: name },
      }).then((response) => {
        expect(response.status).to.eq(200);
        players.push({ name, id: response.body.playerId });
        
        // Use loginAsPlayer to properly cache the session for later switchToPlayer calls
        cy.loginAsPlayer(name, sessionData.joinCode, {
          playerId: response.body.playerId,
          sessionId: sessionData.sessionId,
        });
      });
    });
    
    // TODO: Vote for mystery (all players)
    // TODO: Make an accusation
    // This is a placeholder - full implementation would require more setup
  });
});

// ==================== When Steps ====================

When('5 players join the room via API', () => {
  // Use unique player names with scenarioId to avoid NAME_TAKEN conflicts
  const playerNames = [
    `A${scenarioId}0`,
    `B${scenarioId}1`,
    `C${scenarioId}2`,
    `D${scenarioId}3`,
    `E${scenarioId}4`
  ];
  players = [];
  
  // Join players sequentially using cy.wrap().each() which properly chains
  cy.wrap(playerNames).each((name: string) => {
    return cy.request({
      method: 'POST',
      url: '/api/join',
      body: { joinCode: sessionData.joinCode, playerName: name },
    }).then((response) => {
      expect(response.status).to.eq(200);
      players.push({ name, id: response.body.playerId });
      
      // Use loginAsPlayer to properly cache the session for later switchToPlayer calls
      cy.loginAsPlayer(name, sessionData.joinCode, {
        playerId: response.body.playerId,
        sessionId: sessionData.sessionId,
      });
    });
  });
});

When('1 player joins and votes for a mystery', () => {
  const playerName = `S${scenarioId}`; // S + scenarioId = ~10 chars total
  
  // Join as single player
  cy.request({
    method: 'POST',
    url: '/api/join',
    body: { joinCode: sessionData.joinCode, playerName },
  }).then((response) => {
    expect(response.status).to.eq(200);
    const playerId = String(response.body.playerId);
    players.push({ name: playerName, id: playerId });
    
    // Set cookies directly with string values
    cy.setCookie('player_id', playerId);
    cy.setCookie('session_id', String(sessionData.sessionId));
    cy.setCookie('player_name', String(playerName));
    
    // Get a suitable mystery and vote via API (faster)
    cy.request({
      method: 'GET',
      url: '/api/mysteries?language=fr&includeCharacterCount=true',
    }).then((mysteriesResponse) => {
      const suitableMysteries = mysteriesResponse.body.filter((m: any) => m.characterCount >= 1);
      const mysteryId = suitableMysteries[0].id;
      
      // Vote via API
      cy.request({
        method: 'POST',
        url: `/api/sessions/${sessionData.sessionId}/vote-mystery`,
        body: { mysteryId },
      }).then((voteResponse) => {
        expect(voteResponse.status).to.eq(200);
      });
    });
  });
});

When('1 player joins and votes twice quickly', () => {
  const playerName = `DC${scenarioId}`; // DC + scenarioId = ~11 chars total
  
  // Join as single player
  cy.request({
    method: 'POST',
    url: '/api/join',
    body: { joinCode: sessionData.joinCode, playerName },
  }).then((response) => {
    expect(response.status).to.eq(200);
    const playerId = String(response.body.playerId);
    players.push({ name: playerName, id: playerId });
    
    // Set cookies directly with string values
    cy.setCookie('player_id', playerId);
    cy.setCookie('session_id', String(sessionData.sessionId));
    cy.setCookie('player_name', String(playerName));
    
    // Get a mystery and vote twice via API
    cy.request({
      method: 'GET',
      url: '/api/mysteries?language=fr&includeCharacterCount=true',
    }).then((mysteriesResponse) => {
      const mysteryId = mysteriesResponse.body[0].id;
      
      // Vote twice quickly (simulating double-click)
      cy.request({
        method: 'POST',
        url: `/api/sessions/${sessionData.sessionId}/vote-mystery`,
        body: { mysteryId },
      });
      
      cy.request({
        method: 'POST',
        url: `/api/sessions/${sessionData.sessionId}/vote-mystery`,
        body: { mysteryId },
      });
    });
  });
});

When('all players vote for a mystery', () => {
  // Get available mysteries (must have enough character sheets for 5 players)
  cy.request({
    method: 'GET',
    url: '/api/mysteries?language=fr&includeCharacterCount=true',
  }).then((response) => {
    // Filter for mysteries with at least 5 character sheets
    const suitableMysteries = response.body.filter((m: any) => m.characterCount >= 5);
    expect(suitableMysteries).to.have.length.greaterThan(0);
    
    const mysteryId = suitableMysteries[0].id;
    
    // Each player votes
    cy.wrap(players).each((player: any) => {
      // Switch to this player's session (pass sessionId for uniqueness)
      cy.switchToPlayer(player.name, sessionData.sessionId);
      
      // Vote via API (faster than UI)
      cy.request({
        method: 'POST',
        url: `/api/sessions/${sessionData.sessionId}/vote-mystery`,
        body: { mysteryId },
      }).then((voteResponse) => {
        cy.log(`${player.name} voted`);
        expect(voteResponse.status).to.eq(200);
      });
    });
  });
});

When('all 5 players vote for the next mystery', () => {
  // Get mysteries suitable for 5 players, excluding already played
  cy.request({
    method: 'GET',
    url: '/api/mysteries?language=fr&includeCharacterCount=true',
  }).then((response) => {
    const suitableMysteries = response.body.filter((m: any) => m.characterCount >= 5);
    // Use a different mystery for round 2
    const mysteryId = suitableMysteries[1]?.id || suitableMysteries[0].id;
    
    cy.wrap(players).each((player: any) => {
      cy.switchToPlayer(player.name, sessionData.sessionId);
      
      cy.request({
        method: 'POST',
        url: `/api/sessions/${sessionData.sessionId}/vote-mystery`,
        body: { mysteryId },
      }).then((voteResponse) => {
        expect(voteResponse.status).to.eq(200);
      });
    });
  });
});

// ==================== Then Steps ====================

Then('the game should start with roles assigned', () => {
  // Verify by checking that players can load their character sheets
  // If roles are assigned, the play page should work
  cy.switchToPlayer(players[0].name, sessionData.sessionId);
  cy.visit(`/play/${sessionData.sessionId}`, { failOnStatusCode: false });
  
  // Wait a bit for the page to load
  cy.wait(2000);
  
  // Check if we're on the play page (not redirected back to lobby)
  cy.url().should('include', '/play/');
});

Then('all players should see their character sheets', () => {
  // Switch to each player and verify they can load character sheet
  cy.wrap(players).each((player: any) => {
    cy.switchToPlayer(player.name, sessionData.sessionId);
    
    cy.visit(`/play/${sessionData.sessionId}`);
    
    // Verify character sheet elements are present
    cy.get('[data-testid="character-name"]', { timeout: 10000 }).should('exist');
    cy.get('[data-testid="role-card"]').should('exist');
  });
});

Then('the game should not start', () => {
  // Verify game doesn't start by trying to access play page
  cy.wait(2000); // Wait to ensure no round starts
  
  cy.switchToPlayer(players[0].name, sessionData.sessionId);
  cy.visit(`/play/${sessionData.sessionId}`, { failOnStatusCode: false });
  
  // Should redirect or show error since game hasn't started
  cy.url().should('not.include', '/play/');
});

Then('the player should still be in the lobby', () => {
  cy.visit(`/lobby/${sessionData.sessionId}`);
  cy.url().should('include', '/lobby/');
  cy.get('[data-testid="player-list"]').should('exist');
});

Then('round 2 should start', () => {
  // Verify round 2 started by checking tally-votes endpoint
  cy.request({
    method: 'GET',
    url: `/api/sessions/${sessionData.sessionId}/tally-votes`,
  }).then((response) => {
    expect(response.status).to.eq(200);
    // Round number should be 2 or higher
    expect(response.body.roundNumber).to.be.greaterThan(1);
  });
});

Then('all players should see new character sheets', () => {
  // Similar to first round verification
  cy.wrap(players).each((player: any) => {
    cy.switchToPlayer(player.name, sessionData.sessionId);
    
    cy.visit(`/play/${sessionData.sessionId}`);
    cy.get('[data-testid="character-name"]', { timeout: 10000 }).should('exist');
  });
});

Then('only 1 vote should be counted', () => {
  // Verify vote count via tally-votes API
  cy.request({
    method: 'GET',
    url: `/api/sessions/${sessionData.sessionId}/tally-votes`,
  }).then((response) => {
    expect(response.status).to.eq(200);
    // Total votes should be 1 (upsert prevents duplicates)
    expect(response.body.totalVotes).to.eq(1);
  });
});
