import {
  Result,
  success,
  failure,
  type AppError,
  databaseError,
  validationError,
} from "@/lib/result";
import {
  generateEmailTemplate,
  type EmailTemplateParams,
} from "./email-templates";
import {
  getNotificationScenario,
  type NotificationScenario,
} from "./scenarios";
import prisma from "@/lib/prisma";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT || "{}"
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const transporter = nodemailer.createTransport({
  port: 587,
  secure: false,
  host: "smtp.gmail.com",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export type NotificationPayload = {
  url?: string;
  studentId: string;
  scenarioId: string;
  applicationId?: string;
  templateParams: EmailTemplateParams;
};

export type NotificationResult = {
  push?: boolean;
  inApp?: boolean;
  email?: boolean;
  errors?: string[];
};

export const sendNotification = async (
  payload: NotificationPayload
): Promise<Result<NotificationResult, AppError>> => {
  try {
    const scenario = getNotificationScenario(payload.scenarioId);

    if (!scenario) {
      console.error("Invalid scenario ID:", payload.scenarioId);
      return failure(
        validationError(`Invalid scenario ID: ${payload.scenarioId}`)
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: payload.studentId },
      select: {
        status: true,
        pushNotificationsEnabled: true,
        emailNotificationsEnabled: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!student) {
      console.error("Student not found:", payload.studentId);
      return failure(validationError("Student not found"));
    }

    const isStudentNotification = payload.scenarioId.startsWith("student_");

    if (!isStudentNotification && student.status !== "Approved") {
      console.error("Student is not approved:", student.status);
      return failure(validationError("Student is not approved"));
    }

    const errors: string[] = [];
    const result: NotificationResult = {};

    const inAppResult = await sendInAppNotification({
      studentId: payload.studentId,
      scenario,
      url: payload.url,
      applicationId: payload.applicationId,
    });

    if (inAppResult.isSuccess) {
      result.inApp = true;
    } else {
      errors.push(`In-app notification failed: ${inAppResult.error.message}`);
      console.error("In-app notification failed:", inAppResult.error.message);
    }

    if (student.emailNotificationsEnabled) {
      const emailResult = await sendEmailNotification({
        scenario,
        templateParams: {
          ...payload.templateParams,
          userName: student.user.name,
        },
        recipientEmail: student.user.email,
      });

      if (emailResult.isSuccess) {
        result.email = true;
      } else {
        errors.push(`Email notification failed: ${emailResult.error.message}`);
        console.error("Email notification failed:", emailResult.error.message);
      }
    }

    if (student.pushNotificationsEnabled) {
      const pushResult = await sendPushNotification({
        scenario,
        url: payload.url,
        userId: payload.studentId,
      });

      if (pushResult.isSuccess) {
        result.push = true;
      } else {
        errors.push(`Push notification failed: ${pushResult.error.message}`);
        console.error("Push notification failed:", pushResult.error.message);
      }
    }

    if (errors.length > 0) {
      result.errors = errors;
    }

    return success(result);
  } catch (error) {
    console.error("Error sending notification:", error);
    return failure(databaseError("Failed to send notification"));
  }
};

const sendInAppNotification = async (params: {
  url?: string;
  studentId: string;
  applicationId?: string;
  scenario: NotificationScenario;
}): Promise<Result<boolean, AppError>> => {
  try {
    await prisma.notification.create({
      data: {
        studentId: params.studentId,
        messageId: params.applicationId,
        body: params.scenario.inApp.body,
        title: params.scenario.inApp.title,
        url: params.url || `/dashboard/student`,
      },
    });

    return success(true);
  } catch (error) {
    console.error("Error sending in-app notification:", error);
    return failure(databaseError("Failed to send in-app notification"));
  }
};

const sendEmailNotification = async (params: {
  recipientEmail: string;
  scenario: NotificationScenario;
  templateParams: EmailTemplateParams;
}): Promise<Result<boolean, AppError>> => {
  try {
    const emailTemplate = generateEmailTemplate(
      params.scenario,
      params.templateParams
    );

    const mailOptions = {
      from: {
        name: "VESITRail",
        address: process.env.SMTP_EMAIL!,
      },
      html: emailTemplate.html,
      to: params.recipientEmail,
      subject: emailTemplate.subject,
    };

    await transporter.sendMail(mailOptions);
    return success(true);
  } catch (error) {
    console.error("Error sending email notification:", error);
    return failure(databaseError("Failed to send email notification"));
  }
};

const sendPushNotification = async (params: {
  url?: string;
  userId: string;
  scenario: NotificationScenario;
}): Promise<Result<boolean, AppError>> => {
  try {
    const fcmTokens = await prisma.fcmToken.findMany({
      select: { token: true },
      where: { userId: params.userId },
    });

    if (fcmTokens.length === 0) {
      return failure(validationError("No FCM tokens found for user"));
    }

    const tokens = fcmTokens.map((t) => t.token);
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;

    const message = {
      tokens,
      data: {
        body: params.scenario.push.body,
        title: params.scenario.push.title,
        url: `${baseUrl}${params.url || "/dashboard/student"}`,
      },
    };

    await admin.messaging().sendEachForMulticast(message);
    return success(true);
  } catch (error) {
    console.error("Error sending push notification:", error);
    return failure(databaseError("Failed to send push notification"));
  }
};

export const sendStudentAccountNotification = async (
  studentId: string,
  isApproved: boolean,
  rejectionReason?: string,
  submissionCount?: number
) => {
  const student = await prisma.student.findUnique({
    where: { userId: studentId },
    select: {
      user: { select: { name: true } },
    },
  });

  if (!student) return;

  return sendNotification({
    templateParams: {
      rejectionReason,
      submissionCount,
      userName: student.user.name,
    },
    studentId,
    url: isApproved ? "/dashboard/student" : "/onboarding",
    scenarioId: isApproved ? "student_approval" : "student_rejection",
  });
};

export const sendConcessionNotification = async (
  studentId: string,
  applicationId: string,
  isApproved: boolean,
  concessionType: string,
  rejectionReason?: string
) => {
  const student = await prisma.student.findUnique({
    where: { userId: studentId },
    select: {
      user: { select: { name: true } },
    },
  });

  const application = await prisma.concessionApplication.findUnique({
    select: { shortId: true },
    where: { id: applicationId },
  });

  if (!student) {
    console.error("Student not found for concession notification:", studentId);
    return;
  }

  return sendNotification({
    templateParams: {
      applicationId,
      concessionType,
      rejectionReason,
      userName: student.user.name,
      shortId: application?.shortId,
    },
    studentId,
    applicationId,
    url: "/dashboard/student",
    scenarioId: isApproved ? "concession_approval" : "concession_rejection",
  });
};

export const sendAddressChangeNotification = async (
  studentId: string,
  applicationId: string,
  isApproved: boolean,
  fromStation: string,
  toStation: string,
  rejectionReason?: string
) => {
  const student = await prisma.student.findUnique({
    where: { userId: studentId },
    select: {
      user: { select: { name: true } },
    },
  });

  if (!student) return;

  return sendNotification({
    studentId,
    applicationId,
    scenarioId: isApproved
      ? "address_change_approval"
      : "address_change_rejection",
    templateParams: {
      toStation,
      fromStation,
      applicationId,
      rejectionReason,
      userName: student.user.name,
    },
    url: isApproved
      ? "/dashboard/student/profile"
      : "/dashboard/student/change-address",
  });
};
