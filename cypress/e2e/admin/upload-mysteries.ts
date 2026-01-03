import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';

// ==================== Navigation ====================

Given('I visit the upload mysteries page', () => {
  cy.visit('/admin/mysteries/upload');
});

// ==================== Section Visibility ====================

Then('I should see the ZIP upload section', () => {
  cy.getByTestId('upload-zip-section').should('be.visible');
});

Then('I should see the JSON input section', () => {
  cy.getByTestId('upload-json-section').should('be.visible');
});

// ==================== API Mocks ====================

Given('I mock the bulk create API for success', () => {
  cy.intercept('POST', '/api/mysteries/bulk-create', {
    statusCode: 200,
    body: { success: true, count: 1 },
  }).as('bulkCreate');
});

// ==================== JSON Upload ====================

When('I paste valid mystery JSON in the input', () => {
  const validMystery = JSON.stringify([
    {
      title: 'Test Mystery',
      description: 'A test mystery description that is long enough.',
      language: 'en',
      author: 'Test Author',
      theme: 'SERIOUS_MURDER',
      innocent_words: ['word1', 'word2', 'word3'],
      guilty_words: ['guilty1', 'guilty2', 'guilty3'],
      character_sheets: [
        {
          role: 'investigator',
          character_name: 'Detective',
          dark_secret: 'A secret that is long enough for validation.',
          alibi: 'An alibi that is long enough for validation.',
        },
        {
          role: 'guilty',
          character_name: 'Culprit',
          dark_secret: 'A secret that is long enough for validation.',
          alibi: 'An alibi that is long enough for validation.',
        },
        {
          role: 'innocent',
          character_name: 'Bystander',
          dark_secret: 'A secret that is long enough for validation.',
          alibi: 'An alibi that is long enough for validation.',
        },
      ],
    },
  ]);

  cy.getByTestId('upload-json-input').find('textarea').first().type(validMystery, { delay: 0, parseSpecialCharSequences: false });
});

When('I paste invalid JSON in the input', () => {
  cy.getByTestId('upload-json-input').find('textarea').first().type('{ invalid json }', { delay: 0, parseSpecialCharSequences: false });
});

When('I click the upload JSON button', () => {
  cy.getByTestId('upload-json-button').click();
});

Then('I should see a success message', () => {
  cy.wait('@bulkCreate');
  cy.getByTestId('upload-success').should('be.visible');
});

Then('I should see an upload error message', () => {
  cy.getByTestId('upload-error').should('be.visible');
});

// ==================== ZIP Upload ====================

When('I select a ZIP file for upload', () => {
  // Create a mock ZIP file
  cy.getByTestId('upload-zip-input').selectFile(
    {
      contents: Cypress.Buffer.from('PK mock zip content'),
      fileName: 'test-mystery.zip',
      mimeType: 'application/zip',
    },
    { force: true }
  );
});

Then('I should see the selected file name', () => {
  // Now shows "1 file(s) selected" and file list in separate elements
  cy.getByTestId('file-selection-count').should('be.visible').and('contain', '1 file(s) selected');
  cy.getByTestId('file-list').should('be.visible').and('contain', 'test-mystery.zip');
});

// ==================== Button States ====================

Then('the JSON upload button should be disabled', () => {
  cy.getByTestId('upload-json-button').should('be.disabled');
});

Then('the ZIP upload button should be disabled', () => {
  cy.getByTestId('upload-zip-button').should('be.disabled');
});
