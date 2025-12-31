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
        innocent: 'L\'enquêteur s\'est trompé ! +1 point pour tous les innocents',
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

// ==================== Mystery Voting After Accusation ====================

Given('I mock the mysteries list for voting', () => {
  cy.intercept('GET', '/api/mysteries?*', {
    statusCode: 200,
    body: {
      mysteries: [
        {
          id: 'mystery-1',
          title: 'Le Manoir Hanté',
          description: 'Un mystère au manoir',
          language: 'fr',
          author: 'Test Author',
        },
        {
          id: 'mystery-2',
          title: 'Crime à Paris',
          description: 'Un crime dans la capitale',
          language: 'fr',
          author: 'Test Author',
        },
        {
          id: 'mystery-3',
          title: 'L\'Énigme du Château',
          description: 'Un mystère dans un vieux château',
          language: 'fr',
          author: 'Test Author',
        },
      ],
    },
  }).as('getMysteries');
});

Given('I mock the mystery vote API', () => {
  cy.intercept('POST', '/api/sessions/*/vote-mystery', {
    statusCode: 200,
    body: { success: true },
  }).as('voteMystery');
});

Given('I mock real-time vote updates', () => {
  // Mock the Supabase realtime channel subscription for mystery_votes
  cy.window().then((win) => {
    // Store initial vote counts
    win.localStorage.setItem('mock_vote_counts', JSON.stringify({
      'mystery-1': 0,
      'mystery-2': 0,
      'mystery-3': 0,
    }));
  });
});

Then('I should see the mystery voting list', () => {
  cy.getByTestId('mystery-voting-list').should('be.visible');
  cy.getByTestId('mystery-voting-list').find('[data-testid^="mystery-card-"]').should('have.length', 3);
});

When('I vote for a mystery', () => {
  cy.getByTestId('mystery-card-mystery-1').click();
  cy.wait('@voteMystery');
});

Then('I should see my vote was recorded', () => {
  cy.getByTestId('mystery-card-mystery-1').should('have.attr', 'data-voted', 'true');
});

Then('I should not be able to vote again', () => {
  cy.getByTestId('mystery-card-mystery-2').should('have.attr', 'aria-disabled', 'true');
});

Then('I should see the vote count increase', () => {
  cy.getByTestId('mystery-card-mystery-1').find('[data-testid="vote-count"]').should('contain', '1');
});
