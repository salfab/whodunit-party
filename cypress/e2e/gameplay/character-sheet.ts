import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

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
});

// ==================== Role Assignment Mocks ====================

Given('I am assigned the investigator role', () => {
  cy.intercept('GET', '**/api/sessions/*/assignment', {
    statusCode: 200,
    body: {
      assignment: {
        player_id: 'test-player-001',
        sheet_id: 'test-sheet-001',
        character_sheets: {
          role: 'investigator',
          character_name: 'Detective Holmes',
          dark_secret: 'You secretly gambled away your family fortune.',
          alibi: 'I was in the conservatory reading all evening.',
        },
      },
      mystery: {
        id: 'test-mystery-001',
        title: 'Murder at the Manor',
        description: 'Lord Blackwood was found dead...',
        innocent_words: ['manuscript', 'inheritance', 'betrayal'],
        guilty_words: ['ledger', 'poison', 'desperate'],
      },
    },
  }).as('getAssignment');
  
  // Mock players list
  cy.intercept('GET', '**/players*', {
    statusCode: 200,
    body: [
      { id: 'test-player-001', name: 'Alice', status: 'active' },
      { id: 'test-player-002', name: 'Bob', status: 'active' },
      { id: 'test-player-003', name: 'Charlie', status: 'active' },
    ],
  }).as('getPlayers');
});

Given('I am assigned the guilty role', () => {
  cy.intercept('GET', '**/api/sessions/*/assignment', {
    statusCode: 200,
    body: {
      assignment: {
        player_id: 'test-player-001',
        sheet_id: 'test-sheet-002',
        character_sheets: {
          role: 'guilty',
          character_name: 'Lord Blackwood Jr.',
          dark_secret: 'You poisoned the victim to prevent exposure.',
          alibi: 'I was in my room writing letters.',
        },
      },
      mystery: {
        id: 'test-mystery-001',
        title: 'Murder at the Manor',
        description: 'Lord Blackwood was found dead...',
        innocent_words: ['manuscript', 'inheritance', 'betrayal'],
        guilty_words: ['ledger', 'poison', 'desperate'],
      },
    },
  }).as('getAssignment');
});

Given('I am assigned the guilty role with words', () => {
  cy.intercept('GET', '**/api/sessions/*/assignment', {
    statusCode: 200,
    body: {
      assignment: {
        player_id: 'test-player-001',
        sheet_id: 'test-sheet-002',
        character_sheets: {
          role: 'guilty',
          character_name: 'Lord Blackwood Jr.',
          dark_secret: 'You poisoned the victim.',
          alibi: 'I was writing letters.',
        },
      },
      mystery: {
        id: 'test-mystery-001',
        title: 'Murder at the Manor',
        description: 'Lord Blackwood was found dead...',
        innocent_words: ['manuscript', 'inheritance', 'betrayal'],
        guilty_words: ['ledger', 'poison', 'desperate'],
      },
    },
  }).as('getAssignment');
});

Given('I am assigned the innocent role', () => {
  cy.intercept('GET', '**/api/sessions/*/assignment', {
    statusCode: 200,
    body: {
      assignment: {
        player_id: 'test-player-001',
        sheet_id: 'test-sheet-003',
        character_sheets: {
          role: 'innocent',
          character_name: 'Lady Sinclair',
          dark_secret: 'You are having an affair with the gardener.',
          alibi: 'I was walking in the garden.',
        },
      },
      mystery: {
        id: 'test-mystery-001',
        title: 'Murder at the Manor',
        description: 'Lord Blackwood was found dead...',
        innocent_words: ['manuscript', 'inheritance', 'betrayal'],
        guilty_words: ['ledger', 'poison', 'desperate'],
      },
    },
  }).as('getAssignment');
});

// ==================== Navigation ====================

Given('I visit the play page', () => {
  // Mock session details
  cy.intercept('GET', '**/game_sessions*', {
    statusCode: 200,
    body: {
      id: 'test-session-playing',
      join_code: 'PLAY01',
      status: 'playing',
      current_mystery_id: 'test-mystery-001',
      language: 'en',
    },
  }).as('getSession');

  cy.visit('/play/test-session-playing');
  cy.wait('@sessionMe');
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
