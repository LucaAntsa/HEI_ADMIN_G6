describe("Student (non mocké)", () => {
  const webhookUrl: string | undefined = Cypress.env(
    "INSTATUS_ETUDIANT_WEBHOOK"
  );
  const DEFAULT_TIMEOUT = 30000;

  function updateInstatus(triggerType: "up" | "down") {
    if (!webhookUrl) {
      cy.log(
        "Warning: INSTATUS_ETUDIANT_WEBHOOK not defined - skipping Instatus update"
      );
      return;
    }

    const payload = {
      name: "Student Service",
      status: triggerType === "up" ? "RESOLVED" : "INVESTIGATING",
      message:
        triggerType === "up"
          ? "Student service operational from E2E test"
          : "Student service failure during E2E test",
    };

    return cy
      .request({
        method: "POST",
        url: webhookUrl,
        headers: {"Content-Type": "application/json"},
        body: payload,
        failOnStatusCode: false,
      })
      .then((response) => {
        if (response.status !== 200) {
          cy.log(`Instatus update failed: ${JSON.stringify(response.body)}`);
        }
      });
  }

  const email = Cypress.env("STUDENT1_EMAIL");
  const password = Cypress.env("STUDENT1_PASSWORD");

  before(() => {
    if (!email || !password) {
      throw new Error("Student credentials not defined in Cypress env");
    }
  });

  beforeEach(() => {
    cy.loginReal({email, password});
    cy.url({timeout: DEFAULT_TIMEOUT}).should("include", "/");
  });

  it("lands on profile page with real data", () => {
    cy.get('[href="/profile"] > .MuiBox-root').click();
    cy.get("#main-content", {timeout: DEFAULT_TIMEOUT})
      .should("contain", email)
      .then(() => updateInstatus("up"));

    cy.get("#ha-menu")
      .should("not.contain", "Enseignants")
      .and("not.contain", "Étudiants")
      .and("contain", "Frais");
  });

  it("can list fees", () => {
    cy.get(`[href*="/students/"][href*="/fees"]`).click();
    cy.get("#main-content")
      .should("contain", "Frais")
      .then(() => updateInstatus("up"));

    cy.get('td input[type="checkbox"]').should("not.exist");
    cy.get("td a").should("not.contain", "ÉDITER");

    cy.get("body").click(200, 0);

    cy.get('[data-testid^="showButton-student"]').first().click({force: true});

    cy.get("#main-content")
      .should("contain", "Paiements")
      .then(() => updateInstatus("up"));

    cy.get("td").should("not.contain", "ÉDITER");
    cy.get(".RaList-main").should("not.contain", "CRÉER");
  });

  it("can detail fee (click on fee button)", () => {
    cy.get(`[href*="/students/"][href*="/fees"]`).click();
    cy.get('[data-testid^="showButton-student"]').first().click({force: true});

    cy.get("#main-content")
      .should("contain", "Paiements")
      .then(() => updateInstatus("up"));
  });

  afterEach(function () {
    if (this.currentTest?.isFailed()) {
      cy.then(() => updateInstatus("down")).then(() => {
        cy.log("Student service status set to DOWN in Instatus");
      });
    }
  });
});
