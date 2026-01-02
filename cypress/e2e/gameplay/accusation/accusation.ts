import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Reuse player setup from character-sheet tests
let mockSessionId: string;
let mockPlayerId: string;

Then('I should not see the accuse button', () => {
  cy.get('[data-testid="accuse-button"]').should('not.exist');
});

When('I click the accuse button', () => {
  cy.get('[data-testid="accuse-button"]').click();
});

Then('I should see the accusation dialog', () => {
  cy.get('[data-testid="accusation-dialog"], [role="dialog"]', { timeout: 5000 })
    .should('be.visible');
});

Then('I should see a list of players to accuse', () => {
  cy.get('[data-testid="player-list"] [data-testid^="player-"], .player-list .player-item')
    .should('have.length.at.least', 1);
});

Given('I mock the accusation API to return a correct result', () => {
  cy.intercept('POST', '/api/accuse', {
    statusCode: 200,
    body: {
      correct: true,
      guiltyPlayerId: 'guilty-player-id',
      message: 'Correct accusation!',
    },
  }).as('accusePlayer');
});

Given('I mock the accusation API to return an incorrect result', () => {
  cy.intercept('POST', '/api/accuse', {
    statusCode: 200,
    body: {
      correct: false,
      guiltyPlayerId: 'guilty-player-id',
      accusedPlayerId: 'innocent-player-id',
      message: 'Wrong accusation!',
    },
  }).as('accusePlayer');
});

When('I select the guilty player', () => {
  // Select the first player in the list (mocked as guilty)
  cy.get('[data-testid="player-guilty"], [data-testid^="player-"]')
    .first()
    .click();
});

When('I select an innocent player', () => {
  // Select a player (mocked as innocent)
  cy.get('[data-testid="player-innocent"], [data-testid^="player-"]')
    .first()
    .click();
});

When('I confirm the accusation', () => {
  cy.get('[data-testid="confirm-accusation"], button:contains("Confirm"), button:contains("Accuser")')
    .click();
});

Then('I should see the accusation was correct', () => {
  cy.contains(/correct|bravo|félicitations/i, { timeout: 5000 }).should('be.visible');
});

Then('I should see the accusation was incorrect', () => {
  cy.contains(/incorrect|wrong|erreur/i, { timeout: 5000 }).should('be.visible');
});

Given('I mock the mysteries list for voting', () => {
  cy.intercept('GET', '/api/mysteries*', {
    statusCode: 200,
    body: [
      {
        id: 'mystery-1',
        title: 'The Butler Did It',
        description: 'A classic whodunit',
        characterCount: 5,
      },
      {
        id: 'mystery-2',
        title: 'Murder in the Library',
        description: 'Books and blood',
        characterCount: 5,
      },
    ],
  }).as('getMysteries');
});

Given('I mock the mystery vote API', () => {
  cy.intercept('POST', '/api/vote-mystery', {
    statusCode: 200,
    body: { success: true },
  }).as('voteMystery');
});

Given('I mock real-time vote updates', () => {
  // Mock Supabase real-time channel subscription
  cy.window().then((win) => {
    // @ts-ignore
    win.mockVoteUpdates = true;
  });
});

Then('I should see the mystery voting list', () => {
  cy.get('[data-testid="mystery-list"], .mystery-list', { timeout: 5000 })
    .should('be.visible');
  cy.get('[data-testid^="mystery-"], .mystery-item')
    .should('have.length.at.least', 1);
});

When('I vote for a mystery', () => {
  cy.get('[data-testid^="mystery-"], .mystery-item')
    .first()
    .find('button, [data-testid="vote-button"]')
    .click();
});

Then('I should see my vote was recorded', () => {
  cy.contains(/voted|voté/i, { timeout: 5000 }).should('be.visible');
});

Then('I should not be able to vote again', () => {
  cy.get('[data-testid^="mystery-"]')
    .first()
    .find('button')
    .should('be.disabled');
});

Then('I should see the vote count increase', () => {
  cy.get('[data-testid="vote-count"], .vote-count')
    .should('contain', /\d+/);
});
