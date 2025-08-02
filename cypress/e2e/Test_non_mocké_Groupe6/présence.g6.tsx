describe("Création d'une présence (non mocké)", () => {
  const DEFAULT_TIMEOUT = 30000;
  const componentId = Cypress.env("INSTATUS_PRESENCE_WEBHOOK_COMPONENT_ID");
  const apiKey = Cypress.env("INSTATUS_API_KEY");
  const pageId = Cypress.env("INSTATUS_PAGE_ID");

  function updateInstatus(triggerType: "up" | "down") {
    if (!componentId || !apiKey || !pageId) {
      cy.log(
        "Warning: Instatus credentials not defined - skipping status update"
      );
      return;
    }

    const payload = {
      status: triggerType === "up" ? "operational" : "major_outage",
      name: "Présence Service",
      description:
        triggerType === "up"
          ? "Présence opérationnelle (tests E2E passés)"
          : "Échec de Présence détecté (tests E2E échoués)",
    };

    return cy
      .request({
        method: "POST",
        url: `https://api.instatus.com/v3/${pageId}/components/${componentId}`,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: payload,
        failOnStatusCode: false,
      })
      .then((response) => {
        if (response.status !== 200) {
          cy.log(
            `Échec de la mise à jour Instatus: ${JSON.stringify(response.body)}`
          );
        }
      });
  }

  const user = {
    role: "ADMIN",
    email: Cypress.env("ADMIN1_EMAIL"),
    password: Cypress.env("ADMIN1_PASSWORD"),
  };

  before(() => {
    if (!user.email || !user.password) {
      throw new Error("Admin credentials not defined in Cypress env");
    }
  });

  it("devrait permettre à l'admin de créer et supprimer une présence", () => {
    cy.loginReal({email: user.email, password: user.password});

    cy.url({timeout: DEFAULT_TIMEOUT}).should("include", "/");

    cy.getByTestid("main-content", {timeout: DEFAULT_TIMEOUT})
      .should("contain", user.email)
      .and("contain", "@");

    // Création de l'événement
    cy.getByTestid("event-point").click();
    cy.getByTestid("event-menu").click();

    cy.get('.fc-timegrid-slot.fc-timegrid-slot-lane[data-time="07:00:00"]')
      .click()
      .click();

    cy.get("#course_id").click();
    cy.get("#course_id-option-0").should("be.visible").click();

    cy.get("#groups").click();
    cy.get("#groups-option-0").should("be.visible").click();

    cy.contains("button", "Enregistrer")
      .click()
      .then(() => updateInstatus("up"));

    // Gestion des présences
    cy.contains("div", "[G1] F PROG").click();
    cy.get('[aria-label="Présence"]').click();

    const presenceData = ["Présent", "Absent", "Présent"];
    presenceData.forEach((status, index) => {
      cy.get("tbody tr")
        .eq(index)
        .within(() => {
          cy.contains("span", status).click();
        });
    });

    cy.get('[aria-label="Sauvegarder"]')
      .click()
      .then(() => updateInstatus("up"));

    // Suppression de l'événement
    cy.getByTestid("event-menu").click();
    cy.contains("div", "[G1] F PROG").click();
    cy.getByTestid("delete-button-confirm").click();
    cy.get(".RaConfirm-confirmWarning")
      .click()
      .then(() => updateInstatus("up"));

    // Déconnexion
    cy.contains("h6", "Se déconnecter").click();
  });

  afterEach(function () {
    if (this.currentTest?.isFailed()) {
      cy.then(() => updateInstatus("down")).then(() => {
        cy.log("Presence service status set to DOWN in Instatus");
      });
    }
  });
});
