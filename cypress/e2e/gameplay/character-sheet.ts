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

  // Mock placeholder images for characters without custom images
  cy.intercept('GET', '/characters/investigator.jpg', {
    statusCode: 200,
    headers: { 'content-type': 'image/jpeg' },
    fixture: 'test-image.png',
  }).as('getInvestigatorPlaceholder');

  // Intercept all suspect placeholder images (suspect_01.jpg through suspect_06.jpg)
  cy.intercept('GET', '/characters/suspect_0*.jpg', {
    statusCode: 200,
    headers: { 'content-type': 'image/jpeg' },
    fixture: 'test-image.png',
  }).as('getSuspectPlaceholder');
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
        occupation: 'Private Investigator',
        image_path: null, // No custom image - will use investigator.jpg placeholder
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
  // Mock the character image to prevent 404 errors
  cy.intercept('GET', '/characters/guilty.png', {
    statusCode: 200,
    headers: { 'content-type': 'image/png' },
    fixture: 'test-image.png',
  }).as('getCharacterImage');
  
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
        occupation: 'Butler',
        image_path: '/characters/guilty.png', // Custom image - name will not be overlayed
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
        occupation: 'Heir',
        image_path: null, // No custom image - will use suspect_0X.jpg placeholder based on sheet ID
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
  // Mock the character image to prevent 404 errors
  cy.intercept('GET', '/characters/innocent.png', {
    statusCode: 200,
    headers: { 'content-type': 'image/png' },
    fixture: 'test-image.png',
  }).as('getInnocentImage');

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
        occupation: 'Aristocrat',
        image_path: '/characters/innocent.png', // Custom image - name will not be overlayed
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
  // Character name can be in h1/h3 (no image) or in body text below image
  cy.contains(characterName).should('be.visible');
});

Then('the character image should be displayed', () => {
  // Wait for the image intercept and verify the image element is visible
  cy.get('img[alt*="Jean"]').should('be.visible');
});

// ==================== Role Reveal Card (Flip Animation) ====================

Then('I should see the role reveal card', () => {
  cy.getByTestId('role-reveal-card').should('be.visible');
});

Then('the card should show the front side', () => {
  cy.getByTestId('role-reveal-card').should('have.attr', 'data-flipped', 'false');
});

When('I tap the role reveal card', () => {
  cy.getByTestId('role-reveal-card').click();
  // Wait for animation to complete
  cy.wait(700);
});

Then('the card should flip to show the back', () => {
  cy.getByTestId('role-reveal-card').should('have.attr', 'data-flipped', 'true');
});

Then('I should see the role {string} on the card back', (role: string) => {
  // The role label should be visible on the back of the card
  cy.getByTestId('role-reveal-card-back').should('contain', role);
});

Then('the card should flip back to show the front', () => {
  cy.getByTestId('role-reveal-card').should('have.attr', 'data-flipped', 'false');
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
