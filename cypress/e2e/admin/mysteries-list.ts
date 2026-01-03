import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// ==================== API Mocks ====================

Given('I mock the mysteries API with sample data', () => {
  cy.intercept('GET', '/api/mysteries*', {
    statusCode: 200,
    body: {
      mysteries: [
        {
          id: 'test-mystery-001',
          title: 'Murder at the Manor',
          description: 'Lord Blackwood was found dead in his study...',
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'test-mystery-002',
          title: 'The Missing Heirloom',
          description: 'Grandmothers diamond necklace has vanished...',
          created_at: '2025-01-02T00:00:00Z',
        },
      ],
    },
  }).as('getMysteries');
});

Given('I mock the mysteries API with empty data', () => {
  cy.intercept('GET', '/api/mysteries*', {
    statusCode: 200,
    body: { mysteries: [] },
  }).as('getMysteries');
});

Given('I mock the delete mystery API', () => {
  cy.intercept('DELETE', '/api/mysteries/*', {
    statusCode: 200,
    body: { success: true },
  }).as('deleteMystery');
});

// ==================== Navigation ====================

Given('I visit the admin mysteries page', () => {
  cy.visit('/admin/mysteries');
  cy.wait('@getMysteries');
});

When('I click the new mystery button', () => {
  cy.getByTestId('admin-new-mystery-button').click();
});

When('I click the upload button', () => {
  cy.getByTestId('admin-upload-button').click();
});

Then('I should be on the new mystery edit page', () => {
  cy.url().should('include', '/admin/mysteries/new/edit');
});

Then('I should be on the upload mysteries page', () => {
  cy.url().should('include', '/admin/mysteries/upload');
});

// ==================== List Assertions ====================

Then('I should see the mysteries table', () => {
  cy.getByTestId('admin-mysteries-table').should('be.visible');
});

Then('I should see at least 1 mystery in the list', () => {
  cy.getByTestId('admin-mysteries-table')
    .find('[data-testid^="admin-mystery-row-"]')
    .should('have.length.at.least', 1);
});

Then('I should see the empty state message', () => {
  cy.getByTestId('empty-state-message').should('be.visible').and('contain', 'No mysteries found');
});

Then('I should see a create mystery button', () => {
  cy.getByTestId('create-mystery-button').should('be.visible').and('contain', 'Créer un Mystère');
});

// ==================== Delete Operations ====================

When('I click the delete button for the first mystery', () => {
  cy.getByTestId('admin-delete-mystery-test-mystery-001').click();
});

Then('I should see the delete confirmation dialog', () => {
  cy.getByTestId('admin-delete-dialog').should('be.visible');
});

When('I confirm the deletion', () => {
  cy.getByTestId('admin-delete-confirm').click();
  cy.wait('@deleteMystery');
});

When('I click cancel on the delete dialog', () => {
  cy.getByTestId('admin-delete-cancel').click();
});

Then('the delete dialog should close', () => {
  cy.getByTestId('admin-delete-dialog').should('not.exist');
});

Then('the mystery should be removed from the list', () => {
  cy.getByTestId('admin-mystery-row-test-mystery-001').should('not.exist');
});

Then('the mystery should still be in the list', () => {
  cy.getByTestId('admin-mystery-row-test-mystery-001').should('exist');
});
