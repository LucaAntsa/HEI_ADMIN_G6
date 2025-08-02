describe("Création d'une présence (non mocké)", () => {
  const webhookUrl: string | undefined = Cypress.env(
    "INSTATUS_PRESENCE_WEBHOOK"
  );
  const DEFAULT_TIMEOUT = 30000;

  function updateInstatus(triggerType: "up" | "down") {
    if (!webhookUrl) {
      cy.log(
        "Warning: INSTATUS_PRESENCE_WEBHOOK not defined - skipping Instatus update"
      );
      return;
    }

    const payload = {
      name: "Presence Service",
      status: triggerType === "up" ? "OPERATIONAL" : "INVESTIGATING",
      message:
        triggerType === "up"
          ? "Presence service operational from E2E test"
          : "Presence service failure during E2E test",
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
