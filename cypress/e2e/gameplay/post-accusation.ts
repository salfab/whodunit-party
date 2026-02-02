import { Given, When, Then, Before } from '@badeball/cypress-cucumber-preprocessor';

// ==================== Mobile Viewport Configuration ====================

Before({ tags: '@mobile' }, () => {
  // iPhone 12 Pro dimensions
  cy.viewport(390, 844);
});

// ==================== Post-Accusation State Setup ====================

// This step overrides the rounds mock to include an accusation
// IMPORTANT: Must be called AFTER role assignment steps and BEFORE page visit
Given('an accusation has been made', () => {
  // First, remove any existing rounds intercept by adding a passthrough
  // Then register our new intercept with the accusation data
  
  // Mock the rounds endpoint to return an existing accusation
  // The supabase client uses .maybeSingle() which expects a single object or null
  cy.intercept('GET', '**/rest/v1/rounds*', (req) => {
    const acceptHeader = req.headers['accept'] || '';
    const roundData = {
      id: 'test-round-1',
      session_id: 'test-session-playing',
      mystery_id: 'test-mystery-001',
      accused_player_id: 'test-player-001', // Accused the current player (guilty)
      was_correct: true,
      round_number: 1,
      created_at: new Date().toISOString(),
    };
    
    // If using .maybeSingle(), return single object; otherwise return array
    if (acceptHeader.includes('vnd.pgrst.object')) {
      req.reply({
        statusCode: 200,
        body: roundData,
      });
    } else {
      req.reply({
        statusCode: 200,
        headers: { 'content-range': '0-0/1' },
        body: [roundData],
      });
    }
  }).as('getRounds'); // Use same alias to override the previous one
  
  // Mock the guilty player endpoint for reveal
  // The actual API returns { guiltyPlayer: {...} }
  cy.intercept('GET', '**/api/rounds/*/guilty-player*', {
    statusCode: 200,
    body: {
      guiltyPlayer: {
        id: 'test-player-001',
        name: 'Alice',
        characterName: 'Jean Dupont',
        occupation: 'Butler',
        imagePath: null,
        playerIndex: 0,
      },
    },
  }).as('getGuiltyPlayer');

  // Mock scoreboard players
  cy.intercept('GET', '**/rest/v1/players*select=id%2Cname%2Cscore*', {
    statusCode: 200,
    headers: { 'content-range': '0-2/3' },
    body: [
      { id: 'test-player-001', name: 'Alice', score: 0 },
      { id: 'test-player-002', name: 'Bob', score: 2 },
      { id: 'test-player-003', name: 'Charlie', score: 1 },
    ],
  }).as('getScoreboard');

  // Mock available mysteries for voting
  cy.intercept('GET', '**/rest/v1/mysteries*', {
    statusCode: 200,
    headers: { 'content-range': '0-1/2' },
    body: [
      {
        id: 'mystery-2',
        title: 'The Poisoned Chalice',
        synopsis: 'A deadly toast at the royal banquet...',
        image_path: null,
        language: 'fr',
      },
    ],
  }).as('getMysteries');
});

// ==================== Card Flip Actions ====================

When('the card flips to show results', () => {
  // Wait for the accusation result element to appear on the flipped card
  // The card auto-flips when accusation is detected
  cy.getByTestId('accusation-result', { timeout: 15000 }).should('exist');
});

// ==================== Confession CTA Assertions ====================

Then('I should see the confession button', () => {
  cy.getByTestId('confession-cta').should('exist');
});

Then('I should not see the confession button', () => {
  cy.getByTestId('confession-cta').should('not.exist');
});

// ==================== Confession Dialog Actions ====================

When('I click the confession button', () => {
  // Use force:true because the button is on a CSS-rotated card face
  cy.getByTestId('confession-cta').click({ force: true });
});

When('I click the close confession button', () => {
  cy.getByTestId('confession-close-button').click();
});

// ==================== Confession Dialog Assertions ====================

Then('I should see the confession dialog', () => {
  cy.getByTestId('confession-dialog').should('be.visible');
});

Then('I should see my dark secret in the dialog', () => {
  cy.getByTestId('confession-secret').should('be.visible');
});

Then('the confession dialog should be closed', () => {
  cy.getByTestId('confession-dialog').should('not.exist');
});
