/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    loginReal(credentials: {email: string; password: string}): Chainable<void>;
    getByTestid(
      testid: string,
      options?: Partial<
        Cypress.Timeoutable & Cypress.Loggable & Cypress.Withinable
      >
    ): Chainable<JQuery<HTMLElement>>;
  }
}
