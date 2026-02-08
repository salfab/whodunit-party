import { Given, When, Then, Before } from '@badeball/cypress-cucumber-preprocessor';

// Shared state between steps
let sessionData: { sessionId: string; joinCode: string };
let players: Array<{ name: string; id: string }> = [];
let scenarioId: string;
let scenarioCounter = 0;

interface MysteryCandidate {
  id: string;
  character_count?: number;
  characterCount?: number;
}

function getMysteriesFromBody(body: any): MysteryCandidate[] {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.mysteries)) return body.mysteries;
  return [];
}

function getCharacterCount(mystery: MysteryCandidate): number {
  if (typeof mystery.character_count === 'number') return mystery.character_count;
  if (typeof mystery.characterCount === 'number') return mystery.characterCount;
  return 0;
}

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

    cy.wrap(playerNames)
      .each((name: string) => {
        return cy.request({
          method: 'POST',
          url: '/api/join',
          body: { joinCode: sessionData.joinCode, playerName: name },
        }).then((response) => {
          expect(response.status).to.eq(200);
          const playerId = String(response.body.playerId);
          players.push({ name, id: playerId });

          return cy.loginAsPlayer(name, sessionData.joinCode, {
            playerId,
            sessionId: sessionData.sessionId,
          });
        });
      })
      .then(() => {
        // Round 1: all players vote to start the game.
        cy.request({
          method: 'GET',
          url: '/api/mysteries?language=fr&includeCharacterCount=true',
        }).then((mysteriesResponse) => {
          const mysteries = getMysteriesFromBody(mysteriesResponse.body);
          const suitableMysteries = mysteries.filter((m) => getCharacterCount(m) >= 5);
          expect(suitableMysteries, 'suitable mysteries for 5 players').to.have.length.greaterThan(0);
          const mysteryId = suitableMysteries[0].id;

          cy.wrap(players)
            .each((player) => {
              return cy.switchToPlayer(player.name, sessionData.sessionId).then(() => {
                return cy.request({
                  method: 'POST',
                  url: `/api/sessions/${sessionData.sessionId}/vote-mystery`,
                  body: { mysteryId },
                }).then((voteResponse) => {
                  expect(voteResponse.status).to.eq(200);
                });
              });
            })
            .then(() => {
              // Identify investigator, then submit an accusation.
              let investigatorPlayer: { name: string; id: string } | null = null;
              let accusedPlayerId: string | null = null;

              cy.wrap(players)
                .each((player) => {
                  return cy.switchToPlayer(player.name, sessionData.sessionId).then(() => {
                    return cy.request({
                      method: 'GET',
                      url: `/api/sessions/${sessionData.sessionId}/suspects`,
                      failOnStatusCode: false,
                    }).then((suspectsResponse) => {
                      if (suspectsResponse.status === 200 && !investigatorPlayer) {
                        investigatorPlayer = player;
                        const suspects = suspectsResponse.body?.suspects || [];
                        accusedPlayerId = suspects[0]?.id ?? null;
                      } else {
                        expect(suspectsResponse.status).to.eq(403);
                      }
                    });
                  });
                })
                .then(() => {
                  expect(investigatorPlayer, 'investigator should be identified').to.not.be.null;
                  expect(accusedPlayerId, 'accused player id from suspect list')
                    .to.be.a('string')
                    .and.not.be.empty;

                  return cy.switchToPlayer(investigatorPlayer!.name, sessionData.sessionId).then(() => {
                    return cy.request({
                      method: 'POST',
                      url: '/api/rounds/submit-accusation',
                      body: { accusedPlayerId },
                    }).then((accusationResponse) => {
                      expect(accusationResponse.status).to.eq(200);
                      expect(accusationResponse.body).to.have.property('wasCorrect');
                    });
                  });
                });
            });
        });
      });
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
      return cy.loginAsPlayer(name, sessionData.joinCode, {
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

    return cy
      .loginAsPlayer(playerName, sessionData.joinCode, {
        playerId,
        sessionId: sessionData.sessionId,
      })
      .then(() => {
        // Get a suitable mystery and vote via API (faster)
        cy.request({
          method: 'GET',
          url: '/api/mysteries?language=fr&includeCharacterCount=true',
        }).then((mysteriesResponse) => {
          const mysteries = getMysteriesFromBody(mysteriesResponse.body);
          const suitableMysteries = mysteries.filter((m) => getCharacterCount(m) >= 1);
          expect(suitableMysteries).to.have.length.greaterThan(0);
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

    return cy
      .loginAsPlayer(playerName, sessionData.joinCode, {
        playerId,
        sessionId: sessionData.sessionId,
      })
      .then(() => {
        // Get a mystery and vote twice via API
        cy.request({
          method: 'GET',
          url: '/api/mysteries?language=fr&includeCharacterCount=true',
        }).then((mysteriesResponse) => {
          const mysteries = getMysteriesFromBody(mysteriesResponse.body);
          const suitableMysteries = mysteries.filter((m) => getCharacterCount(m) >= 1);
          expect(suitableMysteries).to.have.length.greaterThan(0);
          const mysteryId = suitableMysteries[0].id;

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
});

When('all players vote for a mystery', () => {
  // Get available mysteries (must have enough character sheets for 5 players)
  cy.request({
    method: 'GET',
    url: '/api/mysteries?language=fr&includeCharacterCount=true',
  }).then((response) => {
    // Filter for mysteries with at least 5 character sheets
    const mysteries = getMysteriesFromBody(response.body);
    const suitableMysteries = mysteries.filter((m) => getCharacterCount(m) >= 5);
    expect(suitableMysteries).to.have.length.greaterThan(0);
    
    const mysteryId = suitableMysteries[0].id;
    
    // Each player votes
    cy.wrap(players).each((player: any) => {
      // Switch to this player's session (pass sessionId for uniqueness)
      return cy.switchToPlayer(player.name, sessionData.sessionId).then(() => {
        // Vote via API (faster than UI)
        return cy.request({
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
});

When('all 5 players vote for the next mystery', () => {
  // Get mysteries suitable for 5 players, excluding already played
  cy.request({
    method: 'GET',
    url: '/api/mysteries?language=fr&includeCharacterCount=true',
  }).then((response) => {
    const mysteries = getMysteriesFromBody(response.body);
    const suitableMysteries = mysteries.filter((m) => getCharacterCount(m) >= 5);
    expect(suitableMysteries).to.have.length.greaterThan(0);
    // Use a different mystery for round 2
    const mysteryId = suitableMysteries[1]?.id || suitableMysteries[0].id;
    
    cy.wrap(players).each((player: any) => {
      return cy.switchToPlayer(player.name, sessionData.sessionId).then(() => {
        return cy.request({
          method: 'POST',
          url: `/api/sessions/${sessionData.sessionId}/vote-mystery`,
          body: { mysteryId },
        }).then((voteResponse) => {
          expect(voteResponse.status).to.eq(200);
        });
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
    return cy.switchToPlayer(player.name, sessionData.sessionId).then(() => {
      cy.visit(`/play/${sessionData.sessionId}`);

      // Verify character sheet elements are present
      cy.get('[data-testid="character-name"]', { timeout: 10000 }).should('exist');
      cy.get('[data-testid="role-reveal-card"]').should('exist');
    });
  });
});

Then('the game should not start', () => {
  // Verify game doesn't start by checking there is still no completed round.
  cy.wait(1000);
  cy.switchToPlayer(players[0].name, sessionData.sessionId);
  cy.request({
    method: 'GET',
    url: `/api/sessions/${sessionData.sessionId}/tally-votes`,
  }).then((response) => {
    expect(response.status).to.eq(200);
    // If no round has started, next round number is still 1.
    expect(response.body.roundNumber).to.eq(1);
  });
});

Then('the player should still be in the lobby', () => {
  cy.visit(`/lobby/${sessionData.sessionId}`);
  cy.url().should('include', '/lobby/');
  cy.get('[data-testid="lobby-player-list"]').should('exist');
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
    return cy.switchToPlayer(player.name, sessionData.sessionId).then(() => {
      cy.visit(`/play/${sessionData.sessionId}`);
      cy.get('[data-testid="character-name"]', { timeout: 10000 }).should('exist');
    });
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
