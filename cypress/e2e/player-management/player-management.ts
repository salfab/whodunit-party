import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// ==================== Player Management Specific Mocks ====================

Given('I mock the kick player API', () => {
  cy.intercept('DELETE', '**/api/sessions/*/players/*', {
    statusCode: 200,
    body: { success: true, message: 'Player removed from session' },
  }).as('kickPlayer');
});

Given('I mock the join API with name already taken', () => {
  cy.intercept('POST', '/api/join', {
    statusCode: 409,
    body: {
      error: 'NAME_TAKEN',
      message: 'Ce nom est déjà utilisé dans cette partie',
      existingPlayerId: 'existing-player-123',
      canTakeover: true,
    },
  }).as('joinNameTaken');
});

Given('I mock the takeover API', () => {
  cy.intercept('POST', '/api/join/takeover', {
    statusCode: 200,
    body: {
      playerId: 'existing-player-123',
      sessionId: 'test-session-123',
      playerName: 'Alice',
      takenOver: true,
    },
  }).as('takeover');
});

// ==================== Kick Player Actions ====================

Then('I should see kick buttons for other players', () => {
  // Player2 and Player3 should have kick buttons
  cy.get('[data-testid="lobby-kick-player2"]').should('be.visible');
  cy.get('[data-testid="lobby-kick-player3"]').should('be.visible');
});

Then('I should not see a kick button for myself', () => {
  // Alice (current player) should not have a kick button
  cy.get('[data-testid="lobby-kick-alice"]').should('not.exist');
});

When('I click the kick button for {string}', (playerName: string) => {
  const testId = `lobby-kick-${playerName.toLowerCase()}`;
  cy.get(`[data-testid="${testId}"]`).click();
});

Then('I should see the kick confirmation dialog', () => {
  cy.getByTestId('remove-player-dialog').should('be.visible');
});

Then('the dialog should mention {string}', (playerName: string) => {
  cy.getByTestId('remove-player-dialog-content').should('contain', playerName);
});

When('I click the cancel button in the dialog', () => {
  cy.getByTestId('remove-player-cancel-button').click();
});

Then('the kick confirmation dialog should be closed', () => {
  cy.getByTestId('remove-player-dialog').should('not.exist');
});

When('I click the confirm button in the dialog', () => {
  cy.getByTestId('remove-player-confirm-button').click();
});

Then('the kick API should be called for {string}', (_playerName: string) => {
  cy.wait('@kickPlayer').its('request.method').should('eq', 'DELETE');
});

// ==================== Takeover Dialog Actions ====================

Then('I should see the takeover dialog', () => {
  cy.getByTestId('takeover-dialog').should('be.visible');
});

Then('the dialog should explain the takeover option', () => {
  cy.getByTestId('takeover-dialog-content').should('contain', 'reprendre votre session précédente');
});

When('I click the cancel takeover button', () => {
  cy.getByTestId('takeover-cancel-button').click();
});

Then('the takeover dialog should be closed', () => {
  cy.getByTestId('takeover-dialog').should('not.exist');
});

When('I click the confirm takeover button', () => {
  cy.getByTestId('takeover-confirm-button').click();
});

Then('the takeover API should be called', () => {
  cy.wait('@takeover').its('request.method').should('eq', 'POST');
});

// ==================== Kicked Player Experience ====================

Then('I should see the kicked warning message', () => {
  cy.getByTestId('kicked-player-alert').should('be.visible');
});

Then('I should be able to dismiss the warning', () => {
  // Click the close button on the Alert
  cy.get('[data-testid="CloseIcon"]').first().click();
  cy.getByTestId('kicked-player-alert').should('not.exist');
});
