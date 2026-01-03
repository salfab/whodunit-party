import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

When('I click the settings icon', () => {
  // The aria-label can be "Admin", "Administration", or localized
  cy.get('[aria-label="Administration"], [aria-label="Admin"], [data-testid="admin-link"]').first().click();
});

Then('I should be on the admin mysteries page', () => {
  cy.url().should('include', '/admin/mysteries');
});

Then('I should see the page title {string}', (title: string) => {
  cy.getByTestId('admin-mysteries-title').should('be.visible').and('contain', title);
});
