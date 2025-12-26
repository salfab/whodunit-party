import { Given, When, Then, Before } from '@badeball/cypress-cucumber-preprocessor';

// ==================== Mobile Viewport Configuration ====================

Before({ tags: '@mobile' }, () => {
  // iPhone 12 Pro dimensions
  cy.viewport(390, 844);
});

// Re-export shared steps from character-sheet.ts
// The steps are shared via the Cucumber preprocessor

// ==================== Accusation Dialog ====================

Then('I should see the accusation dialog', () => {
  cy.getByTestId('accusation-dialog').should('be.visible');
});

Then('I should see a list of players to accuse', () => {
  cy.getByTestId('accusation-player-list').should('be.visible');
  cy.getByTestId('accusation-player-list').find('[data-testid^="accusation-player-"]').should('have.length.at.least', 1);
});

// ==================== Accusation API Mocks ====================

Given('I mock the accusation API to return a correct result', () => {
  cy.intercept('POST', '/api/rounds/submit-accusation', {
    statusCode: 200,
    body: {
      correct: true,
      accusedPlayer: {
        id: 'test-player-002',
        name: 'Bob',
        role: 'guilty',
      },
      points: 100,
    },
  }).as('submitAccusation');
});

Given('I mock the accusation API to return an incorrect result', () => {
  cy.intercept('POST', '/api/rounds/submit-accusation', {
    statusCode: 200,
    body: {
      correct: false,
      accusedPlayer: {
        id: 'test-player-003',
        name: 'Charlie',
        role: 'innocent',
      },
      points: -50,
    },
  }).as('submitAccusation');
});

// ==================== Player Selection ====================

When('I select the guilty player', () => {
  cy.getByTestId('accusation-player-test-player-002').click();
});

When('I select an innocent player', () => {
  cy.getByTestId('accusation-player-test-player-003').click();
});

When('I confirm the accusation', () => {
  cy.getByTestId('accusation-confirm-button').click();
  cy.wait('@submitAccusation');
});

// ==================== Result Assertions ====================

Then('I should see the accusation was correct', () => {
  cy.getByTestId('accusation-result').invoke('text').should('match', /correct|Bravo/);
});

Then('I should see the accusation was incorrect', () => {
  cy.getByTestId('accusation-result').invoke('text').should('match', /incorrect|Raté/);
});
