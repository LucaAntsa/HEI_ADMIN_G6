import codeCoverageTask from "@cypress/code-coverage/task.js";
import {defineConfig} from "cypress";
import vitePreprocessor from "cypress-vite";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  viewportHeight: 1080,
  viewportWidth: 1920,
  defaultCommandTimeout: 25_000,
  component: {
    devServer: {
      framework: "react",
      bundler: "vite",
    },
  },
  reporter: "cypress-sonarqube-reporter",
  reporterOptions: {
    overwrite: true,
    outputDir: "dist/test-reports",
    mergeFileName: "test-reports.xml",
  },
  e2e: {
    setupNodeEvents(on, config) {
      on("file:preprocessor", vitePreprocessor());
      codeCoverageTask(on, config);
      return config;
    },
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:5173",
    specPattern: "cypress/e2e/**/*",
  },
  retries: {
    runMode: 4,
    openMode: 0,
  },
  env: {
    GH_TOKEN_FOR_CONVENTIONAL_CHANGELOG:
      process.env.GH_TOKEN_FOR_CONVENTIONAL_CHANGELOG,
    SONAR_TOKEN: process.env.SONAR_TOKEN,

    //INSTATUS
    INSTATUS_PAGE_ID: process.env.INSTATUS_PAGE_ID,
    INSTATUS_API_KEY: process.env.INSTATUS_API_KEY,
    INSTATUS_API_URL: process.env.INSTATUS_API_URL,
    INSTATUS_API_VERSION: process.env.INSTATUS_API_VERSION,

    //COMPONENT ID INSTATUS
    INSTATUS_AUTH_WEBHOOK_COMPONENT_ID:
      process.env.INSTATUS_AUTH_WEBHOOK_COMPONENT_ID,
    INSTATUS_PAYMENT_WEBHOOK_COMPONENT_ID:
      process.env.INSTATUS_PAYMENT_WEBHOOK_COMPONENT_ID,
    INSTATUS_PRESENCE_WEBHOOK_COMPONENT_ID:
      process.env.INSTATUS_PRESENCE_WEBHOOK_COMPONENT_ID,
    INSTATUS_ETUDIANT_WEBHOOK_COMPONENT_ID:
      process.env.INSTATUS_ETUDIANT_WEBHOOK_COMPONENT_ID,

    //INSTATUS UTILISANT WEBHOOK
    INSTATUS_ETUDIANT_WEBHOOK: process.env.INSTATUS_ETUDIANT_WEBHOOK,
    INSTATUS_PAYMENT_WEBHOOK: process.env.INSTATUS_PAYMENT_WEBHOOK,
    INSTATUS_PRESENCE_WEBHOOK: process.env.INSTATUS_PRESENCE_WEBHOOK,
    INSTATUS_AUTH_WEBHOOK: process.env.INSTATUS_AUTH_WEBHOOK,

    //BASE_URL
    CYPRESS_BASE_URL: process.env.BASE_URL,

    //EMAIL
    MANAGER1_EMAIL: process.env.MANAGER1_EMAIL,
    MONITOR1_EMAIL: process.env.MONITOR1_EMAIL,
    TEACHER1_EMAIL: process.env.TEACHER1_EMAIL,
    ADMIN1_EMAIL: process.env.ADMIN1_EMAIL,
    STUDENT1_EMAIL: process.env.STUDENT1_EMAIL,

    //PASSWORD
    STUDENT1_PASSWORD: process.env.STUDENT1_PASSWORD,
    TEACHER1_PASSWORD: process.env.TEACHER1_PASSWORD,
    MANAGER1_PASSWORD: process.env.MANAGER1_PASSWORD,
    MONITOR1_PASSWORD: process.env.MONITOR1_PASSWORD,
    ADMIN1_PASSWORD: process.env.ADMIN1_PASSWORD,
    STAFF1_PASSWORD: process.env.STAFF1_PASSWORD,
    ORGANIZER1_PASSWORD: process.env.ORGANIZER1_PASSWORD,
    REACT_APP_TEST_ORGANIZER1_PASSWORD:
      process.env.REACT_APP_TEST_ORGANIZER1_PASSWORD,
    codeCoverage: {
      exclude: ["cypress/**/*.*", "src/**/*.cy", "src/providers/**/*.*"],
    },
  },
});
