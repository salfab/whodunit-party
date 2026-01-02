import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Mock session and player data for character sheet tests
let mockSessionId: string;
let mockPlayerId: string;
let mockPlayerRole: 'investigator' | 'guilty' | 'innocent';

Given('I am logged in as a player in a playing session', () => {
  // Create a mock session in "playing" status
  mockSessionId = `test-session-${Date.now()}`;
  mockPlayerId = `test-player-${Date.now()}`;
  
  // Set up cookies to simulate logged-in player
  cy.setCookie('session_id', mockSessionId);
  cy.setCookie('player_id', mockPlayerId);
});

Given('I am assigned the {word} role', (role: string) => {
  mockPlayerRole = role.toLowerCase() as typeof mockPlayerRole;
  
  // Mock the /api/play endpoint to return character sheet data
  cy.intercept('GET', '/api/play*', {
    statusCode: 200,
    body: {
      player: {
        id: mockPlayerId,
        name: role === 'guilty' ? 'Jean Dupont' : 'Alice Martin',
        role: role.toUpperCase(),
      },
      character: {
        name: role === 'guilty' ? 'Jean Dupont' : 'Alice Martin',
        occupation: 'Butler',
        imagePath: '/characters/test.jpg',
        darkSecret: 'A dark secret goes here',
        alibi: 'I was in the library',
      },
      mystery: {
        title: 'Test Mystery',
        words: ['word1', 'word2', 'word3'],
      },
      session: {
        id: mockSessionId,
        status: 'playing',
      },
    },
  }).as('getCharacterSheet');
});

Given('I am assigned the guilty role with words', () => {
  mockPlayerRole = 'guilty';
  
  cy.intercept('GET', '/api/play*', {
    statusCode: 200,
    body: {
      player: {
        id: mockPlayerId,
        name: 'Jean Dupont',
        role: 'GUILTY',
      },
      character: {
        name: 'Jean Dupont',
        occupation: 'Butler',
        imagePath: '/characters/test.jpg',
        darkSecret: 'I committed the crime',
        alibi: 'I was elsewhere',
      },
      mystery: {
        title: 'Test Mystery',
        guiltyWords: ['suspicious', 'alibi', 'evidence'],
      },
      session: {
        id: mockSessionId,
        status: 'playing',
      },
    },
  }).as('getCharacterSheet');
});

When('I visit the play page', () => {
  cy.visit('/play');
});

Then('I should see the accuse button', () => {
  cy.get('[data-testid="accuse-button"]', { timeout: 10000 }).should('be.visible');
});

Then('I should see the character name {string}', (name: string) => {
  cy.contains(name, { timeout: 10000 }).should('be.visible');
});

Then('the character image should be displayed', () => {
  cy.get('img[alt*="character"], [data-testid="character-image"]', { timeout: 10000 })
    .should('be.visible')
    .and(($img) => {
      // Verify image has loaded (natural width > 0)
      expect($img[0].naturalWidth).to.be.greaterThan(0);
    });
});

Then('I should see the role reveal card', () => {
  cy.get('[data-testid="role-card"], .role-card', { timeout: 10000 }).should('be.visible');
});

Then('the card should show the front side', () => {
  cy.get('[data-testid="role-card"] .front, .role-card .front').should('be.visible');
});

When('I tap the role reveal card', () => {
  cy.get('[data-testid="role-card"], .role-card').click();
});

Then('the card should flip to show the back', () => {
  cy.get('[data-testid="role-card"] .back, .role-card .back', { timeout: 2000 })
    .should('be.visible');
});

Then('I should see the role {string} on the card back', (role: string) => {
  cy.get('[data-testid="role-card"] .back, .role-card .back')
    .should('contain', role);
});

Then('the card should flip back to show the front', () => {
  cy.get('[data-testid="role-card"] .front, .role-card .front', { timeout: 2000 })
    .should('be.visible');
});

Then('I should see {int} words to place in conversation', (count: number) => {
  cy.get('[data-testid="words-list"] li, .words-list li', { timeout: 10000 })
    .should('have.length', count);
});

When('I click the secret toggle button', () => {
  cy.get('[data-testid="toggle-secret"], button:contains("Show"), button:contains("Hide")')
    .first()
    .click();
});

Then('the secret content should be visible', () => {
  cy.get('[data-testid="secret-content"], .secret-content', { timeout: 2000 })
    .should('be.visible');
});
