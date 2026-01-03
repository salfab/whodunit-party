import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Common navigation steps
Given('I am on the homepage', () => {
  cy.visit('/');
});

// Generic button click by text (deprecated - prefer specific testid-based steps)
// Kept for backward compatibility only
When('I click the {string} button', (buttonText: string) => {
  // Map known button texts to testids
  const testidMap: Record<string, string> = {
    'Rejoindre une partie': 'join-game-button',
    // Add more mappings as needed
  };
  
  const testid = testidMap[buttonText];
  if (testid) {
    cy.getByTestId(testid).click();
  } else {
    // Fallback to text-based search for unmapped buttons
    cy.contains('button, a', buttonText).click();
  }
});

When('I click the submit button', () => {
  cy.get('[data-testid="submit-join-button"]').click();
});

When('I click the join button', () => {
  cy.get('[data-testid="submit-join-button"]').click();
});

When('I visit the join page', () => {
  cy.visit('/join');
});

When('I visit the join page with kicked parameter', () => {
  cy.visit('/join?kicked=true');
});

Then('I should be on the homepage', () => {
  cy.url().should('eq', Cypress.config().baseUrl + '/');
});
