/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to select DOM element by data-testid attribute.
     * @example cy.getByTestId('game-code-input')
     */
    getByTestId(dataTestId: string): Chainable<JQuery<HTMLElement>>;
  }
}

Cypress.Commands.add('getByTestId', (dataTestId: string) => {
  return cy.get(`[data-testid="${dataTestId}"]`);
});

export {};
