import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

When('I click the settings icon', () => {
  cy.get('[aria-label="Admin console"]').click();
});

Then('I should be on the admin mysteries page', () => {
  cy.url().should('include', '/admin/mysteries');
});

Then('I should see the page title {string}', (title: string) => {
  cy.contains('h1, h3', title).should('be.visible');
});
