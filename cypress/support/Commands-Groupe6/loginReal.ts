//Ajout LoginReal
/// <reference types="cypress" />

Cypress.Commands.add(
  "loginReal",
  ({email, password}: {email: string; password: string}) => {
    cy.visit("/login");

    // Redirection vers Casdoor
    cy.contains("CONNEXION AVEC CASDOOR").click();

    //Cy.origin
    cy.origin(
      "https://numer.casdoor.com",
      {args: {email, password}},
      ({email, password}) => {
        cy.get("#input").clear().type(email);
        cy.get("#normal_login_password").clear().type(password);
        cy.get('button[type="submit"]').click();
      }
    );

    // redirection vers le frontend
    cy.url({timeout: 15000}).should("include", "/auth/callback");
    cy.url({timeout: 15000}).should("include", "/");
  }
);
