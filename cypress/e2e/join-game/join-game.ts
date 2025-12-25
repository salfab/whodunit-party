import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Mock API for testing
Given('a game room exists with code {string}', (code: string) => {
  cy.intercept('POST', '/api/join', (req) => {
    if (req.body.joinCode === code) {
      req.reply({
        statusCode: 200,
        body: {
          sessionId: 'test-session-123',
          playerId: 'test-player-456',
        },
      });
    } else {
      req.reply({
        statusCode: 404,
        body: { error: 'Game not found' },
      });
    }
  }).as('joinGame');
});

// Join page steps
Then('I should be on the join page', () => {
  cy.url().should('include', '/join');
  cy.get('[data-testid="join-page-title"]').should('be.visible');
});

When('I enter {string} in the game code field', (code: string) => {
  // For OTP input, we need to type into the first box and it will auto-distribute
  cy.get('[data-testid="game-code-input"]').clear().type(code);
});

When('I enter {string} in the player name field', (name: string) => {
  cy.get('[data-testid="player-name-input"]').clear().type(name);
});

When('I type {string} in the game code field', (code: string) => {
  // For OTP input, focus first box and type
  cy.get('[data-testid="game-code-input"]').type(code);
});

Then('the game code field should contain {string}', (expectedCode: string) => {
  // For OTP input, we need to check the parent container's combined value
  cy.get('[data-testid="game-code-input-container"]', { timeout: 10000 }).should('be.visible');
  
  // Check each character individually with retries
  cy.get('[data-testid="game-code-input-container"]').within(() => {
    expectedCode.split('').forEach((char, index) => {
      cy.get('input').eq(index).should('have.value', char);
    });
  });
});

Then('the game code field should be pre-filled', () => {
  // For OTP input, check if the first box has a value (not empty)
  cy.get('[data-testid="game-code-input-container"]', { timeout: 10000 }).within(() => {
    cy.get('input').first().invoke('val').should('not.be.empty');
  });
});

Then('I should be redirected to the lobby', () => {
  cy.url().should('include', '/lobby/');
});

Then('I should see an error message', () => {
  cy.get('[data-testid="join-error-message"]').should('be.visible');
});

Then('I should still be on the join page', () => {
  cy.url().should('include', '/join');
});

Then('the submit button should be disabled', () => {
  cy.get('[data-testid="submit-join-button"]').should('be.disabled');
});

Then('the submit button should be enabled', () => {
  cy.get('[data-testid="submit-join-button"]').should('not.be.disabled');
});

When('I visit the join page with code {string}', (code: string) => {
  cy.visit(`/join?code=${code}`);
  // Wait for the page to load and populate the OTP inputs
  cy.getByTestId('game-code-input-container').should('be.visible');
});
