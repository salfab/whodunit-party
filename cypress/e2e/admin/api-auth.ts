import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

// These scenarios hit the real dev server (no cy.intercept): they verify the
// server-side admin protection end to end. The dev server reads
// ADMIN_API_SECRET from .env.local; the requests below must never match it.

const UNKNOWN_MYSTERY_ID = '00000000-0000-0000-0000-000000000000';

When('I send a mystery update request without the admin secret', () => {
  cy.request({
    method: 'PUT',
    url: `/api/mysteries/${UNKNOWN_MYSTERY_ID}`,
    body: { title: 'Anonymous overwrite attempt' },
    failOnStatusCode: false,
  }).as('apiResponse');
});

When('I send a mystery delete request without the admin secret', () => {
  cy.request({
    method: 'DELETE',
    url: `/api/mysteries/${UNKNOWN_MYSTERY_ID}`,
    failOnStatusCode: false,
  }).as('apiResponse');
});

When('I send a single mystery read request without the admin secret', () => {
  cy.request({
    method: 'GET',
    url: `/api/mysteries/${UNKNOWN_MYSTERY_ID}`,
    failOnStatusCode: false,
  }).as('apiResponse');
});

When('I send a mystery pack upload with a wrong admin secret', () => {
  cy.request({
    method: 'POST',
    url: '/api/mysteries/upload-pack',
    headers: { 'x-admin-secret': 'definitely-not-the-real-secret' },
    body: {},
    failOnStatusCode: false,
  }).as('apiResponse');
});

When('I request the public mystery list without the admin secret', () => {
  cy.request({
    method: 'GET',
    url: '/api/mysteries',
    failOnStatusCode: false,
  }).as('apiResponse');
});

Then('the API rejects the request as unauthorized', () => {
  cy.get('@apiResponse').its('status').should('eq', 401);
});

Then('the API accepts the request', () => {
  cy.get('@apiResponse').its('status').should('eq', 200);
});
