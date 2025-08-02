describe("Authentification (non mocké)", () => {
  const webhookUrl: string | undefined = Cypress.env("INSTATUS_AUTH_WEBHOOK");

  function updateInstatus(triggerType: "up" | "down") {
    if (!webhookUrl) {
      throw new Error("INSTATUS_AUTH_WEBHOOK is not defined in Cypress env");
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

  function expectGreeting(text: string) {
    const greetings = ["Bonjour", "Bon après-midi", "Bonsoir"];
    const greetingFound = greetings.some((g) => text.includes(g));
    expect(greetingFound, `Aucune salutation attendue trouvée dans : ${text}`)
      .to.be.true;
  }

  const users = [
    {
      role: "MANAGER",
      emailKey: "MANAGER1_EMAIL",
      passwordKey: "MANAGER1_PASSWORD",
    },
    {
      role: "STUDENT",
      emailKey: "STUDENT1_EMAIL",
      passwordKey: "STUDENT1_PASSWORD",
    },
    {
      role: "TEACHER",
      emailKey: "TEACHER1_EMAIL",
      passwordKey: "TEACHER1_PASSWORD",
    },
    {
      role: "ADMIN",
      emailKey: "ADMIN1_EMAIL",
      passwordKey: "ADMIN1_PASSWORD",
    },
    {
      role: "MONITOR",
      emailKey: "MONITOR1_EMAIL",
      passwordKey: "MONITOR1_PASSWORD",
    },
  ];

  users.forEach(({role, emailKey, passwordKey}) => {
    it(`should land on profile page with real data for ${role}`, () => {
      const email = Cypress.env(emailKey) as string;
      const password = Cypress.env(passwordKey) as string;

      cy.loginReal({email, password});

      cy.url({timeout: 20000}).should("include", "/");

      cy.get('[data-testid="main-content"]', {timeout: 20000})
        .should("exist")
        .should("not.contain.text", "Chargement en cours")
        .invoke("text")
        .then((text) => {
          cy.log("Contenu de main-content :", text);

          if (["MANAGER", "ADMIN"].includes(role)) {
            expectGreeting(text);
            expect(text).to.include("Penser. Travailler. Impacter.");
          } else {
            expect(text).to.include(email);
            expect(text).to.include("@hei.school");
          }

          updateInstatus("up");
        });
    });
  });

  afterEach(function () {
    if (this.currentTest?.state === "failed") {
      updateInstatus("down");
    }
  });
});
