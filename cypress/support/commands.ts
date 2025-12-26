/// <reference types="cypress" />

// Type definitions for custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-testid attribute.
       * @example cy.getByTestId('game-code-input')
       */
      getByTestId(dataTestId: string, options?: Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>): Chainable<JQuery<HTMLElement>>;

      /**
       * Mock an API endpoint with a fixture or inline response.
       * @example cy.mockApi('POST', '/api/join', { sessionId: '123' })
       * @example cy.mockApi('GET', '/api/mysteries', 'mysteries.json')
       */
      mockApi(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE',
        url: string,
        response: object | string,
        statusCode?: number
      ): Chainable<null>;

      /**
       * Mock a room creation and return mock session data.
       * @example cy.mockCreateRoom('ABC123')
       */
      mockCreateRoom(joinCode?: string): Chainable<{ sessionId: string; joinCode: string }>;

      /**
       * Mock joining a room and set up session state.
       * @example cy.mockJoinRoom('ABC123', 'Alice')
       */
      mockJoinRoom(
        joinCode: string,
        playerName: string,
        options?: { playerId?: string; sessionId?: string }
      ): Chainable<{ playerId: string; sessionId: string; playerName: string }>;

      /**
       * Mock the /api/session/me endpoint for current player state.
       * @example cy.mockCurrentSession({ playerId: '123', sessionId: '456', playerName: 'Alice' })
       */
      mockCurrentSession(sessionData: {
        playerId: string;
        sessionId: string;
        playerName: string;
      }): Chainable<null>;

      /**
       * Set up a complete mocked session for lobby/play page tests.
       * Mocks session/me, mysteries, and session lookup APIs.
       */
      setupMockedSession(options: {
        sessionId: string;
        joinCode: string;
        playerId: string;
        playerName: string;
        status?: 'lobby' | 'playing';
        mysteryId?: string;
      }): Chainable<null>;

      /**
       * Create a real room via API (for multi-player tests).
       * @example cy.createRealRoom().then(({ sessionId, joinCode }) => ...)
       */
      createRealRoom(): Chainable<{ sessionId: string; joinCode: string }>;

      /**
       * Join a real room via API (for multi-player tests).
       * @example cy.joinRealRoom('ABC123', 'Alice')
       */
      joinRealRoom(
        joinCode: string,
        playerName: string
      ): Chainable<{ playerId: string; sessionId: string }>;
    }
  }
}

// ==================== Basic Commands ====================

Cypress.Commands.add('getByTestId', (dataTestId: string, options?: any) => {
  return cy.get(`[data-testid="${dataTestId}"]`, options);
});

// ==================== Mock API Commands ====================

Cypress.Commands.add(
  'mockApi',
  (
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    response: object | string,
    statusCode = 200
  ) => {
    const body = typeof response === 'string' ? { fixture: response } : response;

    cy.intercept(method, url, {
      statusCode,
      body: typeof response === 'string' ? undefined : response,
      fixture: typeof response === 'string' ? response : undefined,
    }).as(url.replace(/[^a-zA-Z]/g, '_'));
  }
);

Cypress.Commands.add('mockCreateRoom', (joinCode = 'TEST01') => {
  const sessionId = `mock-session-${Date.now()}`;

  cy.intercept('POST', '/api/sessions', {
    statusCode: 200,
    body: { id: sessionId, joinCode },
  }).as('createSession');

  return cy.wrap({ sessionId, joinCode });
});

Cypress.Commands.add(
  'mockJoinRoom',
  (
    joinCode: string,
    playerName: string,
    options?: { playerId?: string; sessionId?: string }
  ) => {
    const playerId = options?.playerId || `mock-player-${Date.now()}`;
    const sessionId = options?.sessionId || `mock-session-${Date.now()}`;

    // Mock the join API
    cy.intercept('POST', '/api/join', (req) => {
      if (req.body.joinCode?.toUpperCase() === joinCode.toUpperCase()) {
        req.reply({
          statusCode: 200,
          body: { playerId, sessionId, playerName },
        });
      } else {
        req.reply({
          statusCode: 404,
          body: { error: 'Invalid join code' },
        });
      }
    }).as('joinRoom');

    // Mock session lookup by code
    cy.intercept('GET', `/api/sessions/by-code/${joinCode.toUpperCase()}`, {
      statusCode: 200,
      body: { sessionId },
    }).as('sessionByCode');

    return cy.wrap({ playerId, sessionId, playerName });
  }
);

Cypress.Commands.add('mockCurrentSession', (sessionData) => {
  cy.intercept('GET', '/api/session/me', {
    statusCode: 200,
    body: sessionData,
  }).as('sessionMe');
});

Cypress.Commands.add('setupMockedSession', (options) => {
  const {
    sessionId,
    joinCode,
    playerId,
    playerName,
    status = 'lobby',
    mysteryId,
  } = options;

  // Mock current session
  cy.mockCurrentSession({ playerId, sessionId, playerName });

  // Mock session by code
  cy.intercept('GET', `/api/sessions/by-code/${joinCode}`, {
    statusCode: 200,
    body: { sessionId },
  }).as('sessionByCode');

  // Mock mysteries list
  cy.intercept('GET', '/api/mysteries*', {
    statusCode: 200,
    fixture: 'mysteries.json',
  }).as('getMysteries');

  // Mock session details (for lobby/play pages)
  cy.intercept('GET', `/api/sessions/${sessionId}`, {
    statusCode: 200,
    body: {
      id: sessionId,
      joinCode,
      status,
      current_mystery_id: mysteryId,
      language: 'en',
    },
  }).as('getSession');

  // Mock players list
  cy.intercept('GET', `/api/sessions/${sessionId}/players`, {
    statusCode: 200,
    body: {
      players: [{ id: playerId, name: playerName, status: 'active' }],
    },
  }).as('getPlayers');

  // Mock ready state toggle
  cy.intercept('POST', `/api/sessions/${sessionId}/mark-ready`, {
    statusCode: 200,
    body: { success: true },
  }).as('markReady');
});

// ==================== Real API Commands (for multi-player tests) ====================

Cypress.Commands.add('createRealRoom', () => {
  return cy
    .request({
      method: 'POST',
      url: '/api/sessions',
      body: {},
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      return {
        sessionId: response.body.id,
        joinCode: response.body.joinCode,
      };
    });
});

Cypress.Commands.add('joinRealRoom', (joinCode: string, playerName: string) => {
  return cy
    .request({
      method: 'POST',
      url: '/api/join',
      body: { joinCode, playerName },
    })
    .then((response) => {
      expect(response.status).to.eq(200);
      return {
        playerId: response.body.playerId,
        sessionId: response.body.sessionId,
      };
    });
});

export {};

