export * from "./handler";
export * from "./scenarios";
export * from "./email-templates";

export type { NotificationScenario } from "./scenarios";
export { generateEmailTemplate } from "./email-templates";
export type { NotificationResult, NotificationPayload } from "./handler";
export type { EmailTemplate, EmailTemplateParams } from "./email-templates";

export {
  getScenariosByType,
  notificationScenarios,
  getScenariosByCategory,
  getNotificationScenario,
} from "./scenarios";

export {
  sendNotification,
  sendConcessionNotification,
  sendAddressChangeNotification,
  sendStudentAccountNotification,
} from "./handler";
