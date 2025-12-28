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
      roundId: 'test-round-1',
      wasCorrect: true,
      accusedRole: 'guilty',
      gameComplete: false,
      messages: {
        investigator: 'Bravo ! Vous avez trouvé le coupable ! +2 points',
        guilty: 'Vous avez été découvert par l\'enquêteur.',
        innocent: 'L\'enquêteur a trouvé le coupable.',
      },
    },
  }).as('submitAccusation');
});

Given('I mock the accusation API to return an incorrect result', () => {
  cy.intercept('POST', '/api/rounds/submit-accusation', {
    statusCode: 200,
    body: {
      roundId: 'test-round-1',
      wasCorrect: false,
      accusedRole: 'innocent',
      gameComplete: false,
      messages: {
        investigator: 'Raté ! Vous avez accusé une personne innocente.',
        guilty: 'Le coupable n\'a pas été attrapé ! +2 points',
        innocent: 'Vous êtes innocent et avez été accusé à tort ! +1 point',
      },
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
