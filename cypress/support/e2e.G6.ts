import "@cypress/code-coverage/support";
import "./Commands-Groupe6/loginReal";

Cypress.on("uncaught:exception", (err) => {
  const message = err.message || "";

  if (
    message.includes("awswaf-captcha") ||
    message.includes("Failed to execute 'define' on 'CustomElementRegistry'") ||
    message.includes("Cannot call an event handler while rendering.")
  ) {
    return false;
  }

  return true;
});
