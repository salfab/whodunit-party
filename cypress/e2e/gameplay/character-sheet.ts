import { Given, When, Then, Before } from '@badeball/cypress-cucumber-preprocessor';

// ==================== Mobile Viewport Configuration ====================

Before({ tags: '@mobile' }, () => {
  // iPhone 12 Pro dimensions
  cy.viewport(390, 844);
});

// ==================== Background Setup ====================

Given('I am logged in as a player in a playing session', () => {
  // Mock session/me endpoint to return current player
  cy.intercept('GET', '/api/session/me', {
    statusCode: 200,
    body: {
      playerId: 'test-player-001',
      sessionId: 'test-session-playing',
      playerName: 'Alice',
    },
  }).as('sessionMe');

  // Mock Supabase game_sessions query for current mystery (.single() returns object not array)
  cy.intercept('GET', '**/rest/v1/game_sessions?*', {
    statusCode: 200,
    headers: { 
      'content-range': '0-0/1',
      'content-type': 'application/json',
    },
    body: {
      id: 'test-session-playing',
      join_code: 'PLAY01',
      status: 'playing',
      current_mystery_id: 'test-mystery-001',
      language: 'fr',
    },
  }).as('getSession');
});

// ==================== Role Assignment Mocks ====================

Given('I am assigned the investigator role', () => {
  // Mock Supabase player_assignments query (.maybeSingle() returns object not array)
  cy.intercept('GET', '**/rest/v1/player_assignments?*', {
    statusCode: 200,
    headers: { 'content-range': '0-0/1' },
    body: {
      player_id: 'test-player-001',
      session_id: 'test-session-playing',
      mystery_id: 'test-mystery-001',
      sheet_id: 'test-sheet-001',
      character_sheets: {
        id: 'test-sheet-001',
        role: 'investigator',
        character_name: 'Detective Holmes',
        dark_secret: 'You secretly gambled away your family fortune.',
        alibi: 'I was in the conservatory reading all evening.',
        mystery_id: 'test-mystery-001',
        mysteries: {
          id: 'test-mystery-001',
          title: 'Murder at the Manor',
          description: 'Lord Blackwood was found dead...',
          innocent_words: ['manuscript', 'inheritance', 'betrayal'],
          guilty_words: ['ledger', 'poison', 'desperate'],
        },
      },
    },
  }).as('getAssignment');
  
  // Mock players list with character names
  cy.intercept('GET', '**/rest/v1/players?*', {
    statusCode: 200,
    headers: { 'content-range': '0-2/3' },
    body: [
      { 
        id: 'test-player-002', 
        name: 'Bob', 
        status: 'active',
        player_assignments: [{
          character_sheets: {
            character_name: 'Lord Blackwood Jr.'
          }
        }]
      },
      { 
        id: 'test-player-003', 
        name: 'Charlie', 
        status: 'active',
        player_assignments: [{
          character_sheets: {
            character_name: 'Lady Sinclair'
          }
        }]
      },
    ],
  }).as('getPlayers');

  // Mock rounds query (no existing accusation)
  cy.intercept('GET', '**/rest/v1/rounds?*', {
    statusCode: 200,
    headers: { 'content-range': '*/0' },
    body: [],
  }).as('getRounds');
});

Given('I am assigned the guilty role', () => {
  // Mock Supabase player_assignments query (.maybeSingle() returns object not array)
  cy.intercept('GET', '**/rest/v1/player_assignments?*', {
    statusCode: 200,
    headers: { 'content-range': '0-0/1' },
    body: {
      player_id: 'test-player-001',
      session_id: 'test-session-playing',
      mystery_id: 'test-mystery-001',
      sheet_id: 'test-sheet-002',
      character_sheets: {
        id: 'test-sheet-002',
        role: 'guilty',
        character_name: 'Jean Dupont',
        image_path: '/characters/guilty.png',
        dark_secret: 'You poisoned the victim to prevent exposure.',
        alibi: 'I was in my room writing letters.',
        mystery_id: 'test-mystery-001',
        mysteries: {
          id: 'test-mystery-001',
          title: 'Murder at the Manor',
          description: 'Lord Blackwood was found dead...',
          innocent_words: ['manuscript', 'inheritance', 'betrayal'],
          guilty_words: ['ledger', 'poison', 'desperate'],
        },
      },
    },
  }).as('getAssignment');

  // Mock players list
  cy.intercept('GET', '**/rest/v1/players?*', {
    statusCode: 200,
    headers: { 'content-range': '0-1/2' },
    body: [
      { 
        id: 'test-player-002', 
        name: 'Bob', 
        status: 'active',
        player_assignments: [{
          character_sheets: {
            character_name: 'Detective Holmes'
          }
        }]
      },
      { 
        id: 'test-player-003', 
        name: 'Charlie', 
        status: 'active',
        player_assignments: [{
          character_sheets: {
            character_name: 'Lady Sinclair'
          }
        }]
      },
    ],
  }).as('getPlayers');

  // Mock rounds query
  cy.intercept('GET', '**/rest/v1/rounds?*', {
    statusCode: 200,
    headers: { 'content-range': '*/0' },
    body: [],
  }).as('getRounds');
});

Given('I am assigned the guilty role with words', () => {
  // Mock Supabase player_assignments query (.maybeSingle() returns object not array)
  cy.intercept('GET', '**/rest/v1/player_assignments?*', {
    statusCode: 200,
    headers: { 'content-range': '0-0/1' },
    body: {
      player_id: 'test-player-001',
      session_id: 'test-session-playing',
      mystery_id: 'test-mystery-001',
      sheet_id: 'test-sheet-002',
      character_sheets: {
        id: 'test-sheet-002',
        role: 'guilty',
        character_name: 'Lord Blackwood Jr.',
        dark_secret: 'You poisoned the victim.',
        alibi: 'I was writing letters.',
        mystery_id: 'test-mystery-001',
        mysteries: {
          id: 'test-mystery-001',
          title: 'Murder at the Manor',
          description: 'Lord Blackwood was found dead...',
          innocent_words: ['manuscript', 'inheritance', 'betrayal'],
          guilty_words: ['ledger', 'poison', 'desperate'],
        },
      },
    },
  }).as('getAssignment');

  // Mock players list
  cy.intercept('GET', '**/rest/v1/players?*', {
    statusCode: 200,
    headers: { 'content-range': '0-1/2' },
    body: [
      { 
        id: 'test-player-002', 
        name: 'Bob', 
        status: 'active',
        player_assignments: [{
          character_sheets: {
            character_name: 'Detective Holmes'
          }
        }]
      },
    ],
  }).as('getPlayers');

  // Mock rounds query
  cy.intercept('GET', '**/rest/v1/rounds?*', {
    statusCode: 200,
    headers: { 'content-range': '*/0' },
    body: [],
  }).as('getRounds');
});

Given('I am assigned the innocent role', () => {
  // Mock Supabase player_assignments query (.maybeSingle() returns object not array)
  cy.intercept('GET', '**/rest/v1/player_assignments?*', {
    statusCode: 200,
    headers: { 'content-range': '0-0/1' },
    body: {
      player_id: 'test-player-001',
      session_id: 'test-session-playing',
      mystery_id: 'test-mystery-001',
      sheet_id: 'test-sheet-003',
      character_sheets: {
        id: 'test-sheet-003',
        role: 'innocent',
        character_name: 'Lady Sinclair',
        dark_secret: 'You are having an affair with the gardener.',
        alibi: 'I was walking in the garden.',
        mystery_id: 'test-mystery-001',
        mysteries: {
          id: 'test-mystery-001',
          title: 'Murder at the Manor',
          description: 'Lord Blackwood was found dead...',
          innocent_words: ['manuscript', 'inheritance', 'betrayal'],
          guilty_words: ['ledger', 'poison', 'desperate'],
        },
      },
    },
  }).as('getAssignment');

  // Mock players list
  cy.intercept('GET', '**/rest/v1/players?*', {
    statusCode: 200,
    headers: { 'content-range': '0-1/2' },
    body: [
      { 
        id: 'test-player-002', 
        name: 'Bob', 
        status: 'active',
        player_assignments: [{
          character_sheets: {
            character_name: 'Detective Holmes'
          }
        }]
      },
    ],
  }).as('getPlayers');

  // Mock rounds query
  cy.intercept('GET', '**/rest/v1/rounds?*', {
    statusCode: 200,
    headers: { 'content-range': '*/0' },
    body: [],
  }).as('getRounds');
});

// ==================== Navigation ====================

Given('I visit the play page', () => {
  cy.visit('/play/test-session-playing');
  cy.wait('@sessionMe');
});

// ==================== Character Display ====================

Then('I should see the character name {string}', (characterName: string) => {
  cy.contains('h1, h3', characterName).should('be.visible');
});

Then('the character image should be displayed', () => {
  cy.get('img[alt*="Jean"]').should('be.visible').and(($img) => {
    // Verify image has loaded successfully
    expect(($img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0);
  });
});

// ==================== Role Assertions ====================

Then('I should see the {string} role badge', (roleName: string) => {
  cy.getByTestId('play-role-type').should('contain', roleName);
});

Then('I should see the role reveal button', () => {
  cy.getByTestId('play-role-reveal-button').should('be.visible');
});

When('I click the role reveal button', () => {
  cy.getByTestId('play-role-reveal-button').click();
});

Then('I should see my true role revealed as {string}', (role: string) => {
  cy.getByTestId('play-role-revealed').should('contain', role);
});

// ==================== Words Assertions ====================

Then('I should see 3 words to place in conversation', () => {
  cy.getByTestId('play-words-section').should('be.visible');
  cy.getByTestId('play-words-list').find('[data-testid^="play-word-"]').should('have.length', 3);
});

// ==================== Secret Panel ====================

When('I click the secret toggle button', () => {
  cy.get('[data-testid^="play-secret-toggle-"]').first().click();
});

Then('the secret content should be visible', () => {
  cy.get('[data-testid^="play-secret-content-"]').first()
    .should('not.have.css', 'filter', 'blur(8px)');
});

// ==================== Accuse Button ====================

Then('I should see the accuse button', () => {
  cy.getByTestId('play-accuse-button').should('be.visible');
});

Then('I should not see the accuse button', () => {
  cy.getByTestId('play-accuse-button').should('not.exist');
});

When('I click the accuse button', () => {
  cy.getByTestId('play-accuse-button').click();
});
