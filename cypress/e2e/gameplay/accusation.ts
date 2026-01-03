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
      guiltyPlayer: {
        id: 'test-player-002',
        name: 'Player2',
        characterName: 'M. Rouge',
        occupation: 'Détective',
        imagePath: null,
        playerIndex: 1,
      },
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
      guiltyPlayer: {
        id: 'test-player-002',
        name: 'Player2',
        characterName: 'M. Rouge',
        occupation: 'Détective',
        imagePath: null,
        playerIndex: 1,
      },
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
  // Wait for the card to flip (dialog closes and flip animation happens)
  // The accusation-result element will exist after the flip completes
  cy.wait(1500); // Wait for flip animation to complete
  cy.getByTestId('accusation-result', { timeout: 15000 }).should('exist');
});

// ==================== Result Assertions ====================

Then('I should see the accusation was correct', () => {
  // Element is on the flipped card, check existence and text content
  cy.getByTestId('accusation-result').should('exist');
  cy.getByTestId('accusation-result').invoke('text').should('match', /correct|Bravo/);
});

Then('I should see the accusation was incorrect', () => {
  // Element is on the flipped card, check existence and text content
  cy.getByTestId('accusation-result').should('exist');
  cy.getByTestId('accusation-result').invoke('text').should('match', /incorrect|Raté/);
});

// ==================== Mystery Voting After Accusation ====================

Given('I mock the mysteries list for voting', () => {
  // Mock the scoreboard players query (returns player with scores)
  cy.intercept('GET', '**/rest/v1/players*select=id%2Cname%2Cscore*', {
    statusCode: 200,
    headers: { 'content-range': '0-2/3' },
    body: [
      { id: 'test-player-001', name: 'Alice', score: 0 },
      { id: 'test-player-002', name: 'Bob', score: 2 },
      { id: 'test-player-003', name: 'Charlie', score: 1 },
    ],
  }).as('getScoreboard');

  // Mock the active players count query
  cy.intercept('GET', '**/rest/v1/players*status=eq.active*select=id*', {
    statusCode: 200,
    headers: { 'content-range': '0-2/3' },
    body: [
      { id: 'test-player-001' },
      { id: 'test-player-002' },
      { id: 'test-player-003' },
    ],
  }).as('getActivePlayers');

  // Mock the mysteries API
  cy.intercept('GET', '/api/mysteries?*', {
    statusCode: 200,
    body: {
      mysteries: [
        {
          id: 'mystery-1',
          title: 'Test Mystery', // Use 'Test Mystery' so the lobby voting step works
          description: 'Un mystère de test',
          language: 'fr',
          author: 'Test Author',
          character_count: 3,
        },
        {
          id: 'mystery-2',
          title: 'Crime à Paris',
          description: 'Un crime dans la capitale',
          language: 'fr',
          author: 'Test Author',
          character_count: 4,
        },
        {
          id: 'mystery-3',
          title: 'L\'Énigme du Château',
          description: 'Un mystère dans un vieux château',
          language: 'fr',
          author: 'Test Author',
          character_count: 5,
        },
      ],
    },
  }).as('getMysteries');

  // Mock the vote tally API
  cy.intercept('GET', '/api/sessions/*/tally-votes', {
    statusCode: 200,
    body: {
      voteCounts: {
        'mystery-1': 0,
        'mystery-2': 0,
        'mystery-3': 0,
      },
      roundNumber: 1,
    },
  }).as('getTallyVotes');

  // Mock existing vote check (no vote yet)
  cy.intercept('GET', '**/rest/v1/mystery_votes*', {
    statusCode: 200,
    headers: { 'content-range': '*/0' },
    body: null,
  }).as('checkExistingVote');
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
  // Wait for mysteries API to be called after accusation result
  cy.wait('@getMysteries');
  // Wait for the loading to complete and list to render
  // Use 'exist' since the element is on a flipped card that might have backface-visibility
  cy.getByTestId('mystery-voting-list', { timeout: 15000 }).should('exist');
  cy.getByTestId('mystery-voting-list').find('[data-testid^="mystery-card-"]').should('have.length', 3);
});

// Note: "When I vote for a mystery" step is defined in lobby.ts and reused here

Then('I should see my vote was recorded', () => {
  cy.getByTestId('mystery-card-mystery-1').should('have.attr', 'data-voted', 'true');
});

Then('I should not be able to vote again', () => {
  cy.getByTestId('mystery-card-mystery-2').should('have.attr', 'aria-disabled', 'true');
});

Then('I should see the vote count increase', () => {
  cy.getByTestId('mystery-card-mystery-1').find('[data-testid="vote-count"]').should('contain', '1');
});
