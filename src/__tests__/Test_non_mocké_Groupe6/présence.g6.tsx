describe("Création d'une présence (non mocké)", () => {
  const webhookUrl: string | undefined = Cypress.env(
    "INSTATUS_PRESENCE_WEBHOOK"
  );

  function updateInstatus(trigger: "up" | "down") {
    if (!webhookUrl) {
      throw new Error(
        "INSTATUS_PRESENCE_WEBHOOK is not defined in Cypress env"
      );
    }
    return cy.request({
      method: "POST",
      url: webhookUrl,
      headers: {"Content-Type": "application/json"},
      body: {trigger},
      failOnStatusCode: false,
    });
  }

  const user = {
    role: "ADMIN",
    email: Cypress.env("ADMIN1_EMAIL") as string,
    password: Cypress.env("ADMIN1_PASSWORD") as string,
  };

  it("devrait permettre à l'admin de créer et supprimer une présence", () => {
    cy.loginReal({email: user.email, password: user.password});

    cy.url({timeout: 20000}).should("include", "/");

    cy.getByTestid("main-content", {timeout: 10000})
      .should("contain", user.email)
      .and("contain", "@");

    cy.getByTestid("event-point").click();
    cy.getByTestid("event-menu").click();

    cy.get('.fc-timegrid-slot.fc-timegrid-slot-lane[data-time="07:00:00"]')
      .click()
      .click();

    cy.get("#course_id").click();
    cy.get("#course_id-option-0").should("be.visible").click();

    cy.get("#groups").click();
    cy.get("#groups-option-0").should("be.visible").click();

    cy.contains("button", "Enregistrer").click();

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

    cy.get('[aria-label="Sauvegarder"]').click();

    cy.getByTestid("event-menu").click();
    cy.contains("div", "[G1] F PROG").click();
    cy.getByTestid("delete-button-confirm").click();
    cy.get(".RaConfirm-confirmWarning").click();

    cy.contains("h6", "Se déconnecter").click();

    updateInstatus("up");
  });

  afterEach(function () {
    if (this.currentTest?.state === "failed") {
      updateInstatus("down");
    }
  });
});
