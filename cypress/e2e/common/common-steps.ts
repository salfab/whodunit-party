import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// Common navigation steps
Given('I am on the homepage', () => {
  cy.visit('/');
});

When('I click the {string} button', (buttonText: string) => {
  cy.contains('button, a', buttonText).click();
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
