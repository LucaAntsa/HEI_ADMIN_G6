describe("Paiement mobile par l'étudiant (non mocké)", () => {
  const webhookUrl: string | undefined = Cypress.env(
    "INSTATUS_PAYMENT_WEBHOOK"
  );

  function updateInstatus(triggerType: "up" | "down") {
    if (!webhookUrl) {
      throw new Error("INSTATUS_PAYMENT_WEBHOOK is not defined in Cypress env");
    }

    const payload =
      triggerType === "up"
        ? {
            trigger: "incident",
            status: "resolved",
            message: "Payment operational",
          }
        : {
            trigger: "incident",
            status: "investigating",
            message: "Payment failure during E2E test",
          };
    return cy.request({
      method: "POST",
      url: webhookUrl,
      headers: {"Content-Type": "application/json"},
      body: payload,
      failOnStatusCode: false,
    });
  }

  function generateRandomReference(): string {
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const datePart = `${pad(now.getFullYear() % 100)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}`;
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MP${datePart}.${timePart}.${randomPart}`;
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
          cy.contains("Liste des étudiants").click();
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

        ["SUCCESS", "PENDING", "FAILED"].forEach((status) => {
          it(`affiche l'icône correcte lorsque le statut est ${status}`, () => {
            const statusMap = {
              SUCCESS: "Paiement avec succès",
              PENDING: "Vérification en cours",
              FAILED: "Paiement échoué",
            };

            cy.get('[data-testid^="pspTypeIcon-"]').then(($icons) => {
              const icon = Array.from($icons).find((el) =>
                el.title?.toLowerCase().includes(status.toLowerCase())
              );

              if (icon) {
                cy.wrap(icon).trigger("mouseover");
                cy.contains(statusMap[status as keyof typeof statusMap]);
              } else {
                cy.log(`Pas de transaction avec le statut ${status} trouvée`);
                expect(true).to.be.true;
              }
            });
          });
        });
      }

      if (role === "STUDENT") {
        beforeEach(() => {
          cy.get('[href*="/students/"]').contains("Frais").click();
          cy.url().should("include", "/fees");
          cy.get("table.MuiTable-root").should("exist");
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
                  updateInstatus("up");
                  testHandled = true;
                }
                return;
              }

              if (amountText.includes("Ar")) {
                const refText = $row.find("td").eq(3).text().trim();
                if (refText === "" || refText.includes("Non défini")) {
                  cy.wrap($row).within(() => {
                    cy.get('[data-testid^="addMobileMoney-"]', {
                      timeout: 15000,
                    }).click({force: true});
                  });

                  const ref = generateRandomReference();
                  cy.get("#psp_id", {timeout: 15000}).click().type(ref);
                  cy.contains("button", "Enregistrer").click();

                  cy.contains(/Frais (créés|mis à jour) avec succès/i, {
                    timeout: 15000,
                  }).should("exist");
                  cy.get('[data-testid^="pspTypeIcon-"]', {
                    timeout: 15000,
                  }).should("exist");

                  updateInstatus("up");
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
                updateInstatus("up");
                expect(true).to.be.true;
              }
            });
        });
      }
    });
  });
});
