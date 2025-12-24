import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Create Room steps
Then('I should be on the create room page', () => {
  cy.url().should('include', '/create-room');
  cy.getByTestId('create-room-title').should('be.visible');
});

Then('I should see a {int}-character game code', (codeLength: number) => {
  cy.getByTestId('game-code-display')
    .should('be.visible')
    .invoke('text')
    .should('have.length', codeLength);
});

Then('I should see a QR code', () => {
  cy.getByTestId('qr-code-container').should('be.visible');
  cy.get('svg').should('be.visible');
});

Then('I should see a {string} button', (buttonText: string) => {
  cy.contains('button', buttonText).should('be.visible');
});

When('I wait for the game code to be displayed', () => {
  cy.getByTestId('game-code-display', { timeout: 10000 }).should('be.visible');
});
