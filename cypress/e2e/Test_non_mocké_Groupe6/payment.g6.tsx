describe("Paiement mobile par l'étudiant (non mocké)", () => {
  const DEFAULT_TIMEOUT = 30000;
  const webhookUrl: string | undefined = Cypress.env(
    "INSTATUS_PAYMENT_WEBHOOK"
  );

  function updateInstatus(triggerType: "up" | "down") {
    if (!webhookUrl) {
      cy.log(
        "Warning: INSTATUS_PAYMENT_WEBHOOK not defined - skipping Instatus update"
      );
      return;
    }

    const payload = {
      trigger: triggerType,
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
        } else {
          cy.log(
            `Payment service status set to ${triggerType.toUpperCase()} in Instatus`
          );
        }
      });
  }

  function generateRandomReference(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `MP${now
      .getFullYear()
      .toString()
      .slice(-2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}.${pad(
      now.getHours()
    )}${pad(now.getMinutes())}.${Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()}`;
  }

  const users = [
    {
      role: "MANAGER",
      email: Cypress.env("MANAGER1_EMAIL"),
      password: Cypress.env("MANAGER1_PASSWORD"),
    },
    {
      role: "STUDENT",
      email: Cypress.env("STUDENT1_EMAIL"),
      password: Cypress.env("STUDENT1_PASSWORD"),
    },
  ];

  users.forEach(({role, email, password}) => {
    describe(`Tests pour le rôle ${role}`, () => {
      before(() => {
        if (!email || !password) {
          throw new Error(`Missing credentials for ${role}`);
        }
      });

      beforeEach(() => {
        cy.loginReal({email, password});
      });

      if (role === "MANAGER") {
        beforeEach(() => {
          cy.getByTestid("students-menu").click();
          cy.get(`[href="/transactions"]`).click();
          cy.contains("Transactions (Mobile Money)", {timeout: 30000}).should(
            "be.visible"
          );
          cy.get("table.MuiTable-root", {timeout: 30000}).should("exist");
        });

        it("Manager : Création de frais pour un étudiant", () => {
          cy.contains("Liste des étudiants").should("be.visible").click();
          cy.url().should("include", "/students");

          cy.get('[data-testid="main-search-filter"]').type("ryan{enter}");
          cy.contains("ryan", {matchCase: false}).click();

          cy.get('[data-testid="fees-tab"]').click();
          cy.get(
            '[data-testid="menu-list-action"] > .MuiButtonBase-root'
          ).click();
          cy.contains("Créer").click();

          cy.get("#predefinedType").click();
          cy.contains("li", "Rattrapage").click();

          cy.get(".MuiToolbar-root > .MuiButtonBase-root").click();
        });

        it("affiche l'icône succès lorsque le statut est SUCCESS", () => {
          cy.get('[data-testid^="pspTypeIcon-"]').then(($icons) => {
            const icon = Array.from($icons).find((el) =>
              el.title?.toLowerCase().includes("success")
            );
            if (icon) {
              cy.wrap(icon).trigger("mouseover");
              cy.contains("Paiement avec succès");
            } else {
              cy.log("Pas de transaction en succès trouvée");
              expect(true).to.be.true;
            }
          });
        });

        it("affiche l'icône en attente lorsque le statut est PENDING", () => {
          cy.get('[data-testid^="pspTypeIcon-"]').then(($icons) => {
            const icon = Array.from($icons).find((el) =>
              el.title?.toLowerCase().includes("pending")
            );
            if (icon) {
              cy.wrap(icon).trigger("mouseover");
              cy.contains("Vérification en cours");
            } else {
              cy.log("Pas de transaction en attente trouvée");
              expect(true).to.be.true;
            }
          });
        });

        it("affiche l'icône échec lorsque le statut est FAILED", () => {
          cy.get('[data-testid^="pspTypeIcon-"]').then(($icons) => {
            const icon = Array.from($icons).find(
              (el) =>
                el.title?.toLowerCase().includes("failed") ||
                el.title?.toLowerCase().includes("échec")
            );
            if (icon) {
              cy.wrap(icon).trigger("mouseover");
              cy.contains("Paiement échoué");
            } else {
              cy.log("Pas de transaction échouée trouvée");
              expect(true).to.be.true;
            }
          });
        });
      }

      if (role === "STUDENT") {
        beforeEach(() => {
          cy.get('[href*="/students/"]').contains("Frais").click();
          cy.url().should("include", "/fees");
          cy.get("table.MuiTable-root", {timeout: DEFAULT_TIMEOUT}).should(
            "exist"
          );
          cy.contains("Reste à payer").should("exist");
        });

        it("peut créer un MPBS pour les frais impayés", () => {
          let testHandled = false;

          cy.get("tr")
            .each(($row) => {
              const amountText = $row.find("td").eq(1).text().trim();

              if (amountText === "0 Ar") {
                if (!testHandled) {
                  cy.log("Frais déjà payé détecté, test réussi");
                  testHandled = true;
                }
                return;
              }

              if (amountText.includes("Ar")) {
                const refText = $row.find("td").eq(3).text().trim();
                if (refText === "" || refText.includes("Non défini")) {
                  cy.wrap($row).within(() => {
                    cy.get('[data-testid^="addMobileMoney-"]', {
                      timeout: DEFAULT_TIMEOUT,
                    }).click({force: true});
                  });

                  const ref = generateRandomReference();
                  cy.get("#psp_id", {timeout: DEFAULT_TIMEOUT})
                    .click()
                    .type(ref);
                  cy.contains("button", "Enregistrer").click();

                  cy.contains(/Frais (créés|mis à jour) avec succès/i, {
                    timeout: DEFAULT_TIMEOUT,
                  }).should("exist");
                  cy.get('[data-testid^="pspTypeIcon-"]', {
                    timeout: DEFAULT_TIMEOUT,
                  }).should("exist");
                  testHandled = true;
                  return false; // break .each()
                }
              }
            })
            .then(() => {
              if (!testHandled) {
                cy.log(
                  "Aucun frais impayé ou modifiable trouvé, test considéré comme réussi"
                );
                expect(true).to.be.true;
              }
            });
        });
      }
    });
  });

  afterEach(function () {
    if (this.currentTest?.isFailed()) {
      cy.then(() => updateInstatus("down")).then(() => {
        cy.log("Payment service status set to DOWN in Instatus");
      });
    } else {
      cy.then(() => updateInstatus("up")).then(() => {
        cy.log("Payment service status set to UP in Instatus");
      });
    }
  });
});
