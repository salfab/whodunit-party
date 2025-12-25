import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Create Room steps
Then('I should be on the create room page', () => {
  cy.url().should('include', '/create-room');
  cy.get('[data-testid="create-room-title"]').should('be.visible');
});

Then('I should see a {int}-character game code', (codeLength: number) => {
  cy.get('[data-testid="game-code-display"]')
    .should('be.visible')
    .invoke('text')
    .should('have.length', codeLength);
});

Then('I should see a QR code', () => {
  cy.get('[data-testid="qr-code-container"]').should('be.visible');
  cy.get('svg').should('be.visible');
});

Then('I should see a {string} button', (buttonText: string) => {
  cy.contains('button', buttonText).should('be.visible');
});

When('I wait for the game code to be displayed', () => {
  cy.get('[data-testid="game-code-display"]', { timeout: 10000 }).should('be.visible');
});
