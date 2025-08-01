describe("Student (non mocké)", () => {
  const webhookUrl: string | undefined = Cypress.env(
    "INSTATUS_ETUDIANT_WEBHOOK"
  );

  function updateInstatus(triggerType: "up" | "down") {
    if (!webhookUrl) {
      throw new Error(
        "INSTATUS_ETUDIANT_WEBHOOK is not defined in Cypress env"
      );
    }

    const payload =
      triggerType === "up"
        ? {
            trigger: "incident",
            status: "resolved",
            message: "Authentification operational",
          }
        : {
            trigger: "incident",
            status: "investigating",
            message: "Authentification failure during E2E test",
          };

    return cy.request({
      method: "POST",
      url: webhookUrl,
      headers: {
        "Content-Type": "application/json",
      },
      body: payload,
      failOnStatusCode: false,
    });
  }

  const email = Cypress.env("STUDENT1_EMAIL");
  const password = Cypress.env("STUDENT1_PASSWORD");

  beforeEach(() => {
    cy.loginReal({email, password});
    cy.url({timeout: 20000}).should("include", "/");
  });

  it("lands on profile page with real data", () => {
    cy.get('[href="/profile"] > .MuiBox-root').click();
    cy.get("#main-content", {timeout: 10000}).should("contain", email);

    cy.get("#ha-menu")
      .should("not.contain", "Enseignants")
      .and("not.contain", "Étudiants")
      .and("contain", "Frais");

    updateInstatus("up");
  });

  it("can list fees", () => {
    cy.get(`[href*="/students/"][href*="/fees"]`).click();
    cy.get("#main-content").should("contain", "Frais");

    cy.get('td input[type="checkbox"]').should("not.exist");
    cy.get("td a").should("not.contain", "ÉDITER");

    cy.get("body").click(200, 0);

    cy.get('[data-testid^="showButton-student"]').first().click({force: true});
    cy.get("#main-content").should("contain", "Paiements");
    cy.get("td").should("not.contain", "ÉDITER");
    cy.get(".RaList-main").should("not.contain", "CRÉER");
  });

  it("can detail fee (click on fee button)", () => {
    cy.get(`[href*="/students/"][href*="/fees"]`).click();
    cy.get('[data-testid^="showButton-student"]').first().click({force: true});
    cy.get("#main-content").should("contain", "Paiements");
  });

  afterEach(function () {
    if (this.currentTest && this.currentTest.state === "failed") {
      updateInstatus("down");
    }
  });
});
