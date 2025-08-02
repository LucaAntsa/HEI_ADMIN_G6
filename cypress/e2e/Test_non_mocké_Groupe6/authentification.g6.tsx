describe("Authentification (non mocké)", () => {
  const webhookUrl: string | undefined = Cypress.env("INSTATUS_AUTH_WEBHOOK");
  const DEFAULT_TIMEOUT = 30000;

  function updateInstatus(triggerType: "up" | "down") {
    if (!webhookUrl) {
      cy.log(
        "Warning: INSTATUS_AUTH_WEBHOOK not defined - skipping Instatus update"
      );
      return;
    }

    const payload = {
      name: "Auth Service",
      status: triggerType === "up" ? "OPERATIONAL" : "INVESTIGATING",
      message:
        triggerType === "up"
          ? "Authentification operational from E2E test"
          : "Authentification failure during E2E test",
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

  function expectGreeting(text: string) {
    const greetings = ["Bonjour", "Bon après-midi", "Bonsoir"];
    const greetingFound = greetings.some((g) => text.includes(g));
    expect(greetingFound, `Expected greeting not found in: ${text}`).to.be.true;
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
    {role: "ADMIN", emailKey: "ADMIN1_EMAIL", passwordKey: "ADMIN1_PASSWORD"},
    {
      role: "MONITOR",
      emailKey: "MONITOR1_EMAIL",
      passwordKey: "MONITOR1_PASSWORD",
    },
  ];

  users.forEach(({role, emailKey, passwordKey}) => {
    it(`should land on profile page with real data for ${role}`, () => {
      const email = Cypress.env(emailKey);
      const password = Cypress.env(passwordKey);

      if (!email || !password) {
        throw new Error(`Missing credentials for ${role}`);
      }

      cy.loginReal({email, password});

      cy.url({timeout: DEFAULT_TIMEOUT}).should("include", "/");

      cy.get('[data-testid="main-content"]', {timeout: DEFAULT_TIMEOUT})
        .should("exist")
        .should("not.contain.text", "Chargement en cours")
        .invoke("text")
        .then((text) => {
          cy.log(`Main content for ${role}:`, text);

          if (["MANAGER", "ADMIN"].includes(role)) {
            expectGreeting(text);
            expect(text).to.include("Penser. Travailler. Impacter.");
          } else {
            expect(text).to.include(email);
            expect(text).to.include("@hei.school");
          }
        });
    });
  });

  afterEach(function () {
    if (this.currentTest?.isFailed()) {
      cy.then(() => updateInstatus("down")).then(() => {
        cy.log("Auth status set to DOWN in Instatus");
      });
    } else {
      cy.then(() => updateInstatus("up")).then(() => {
        cy.log("Auth status set to UP in Instatus");
      });
    }
  });
});
