import { NotificationScenario } from "./scenarios";

export type EmailTemplateParams = {
  userName: string;
  shortId?: number;
  studentId?: string;
  toStation?: string;
  newStation?: string;
  fromStation?: string;
  applicationId?: string;
  concessionType?: string;
  additionalInfo?: string;
  rejectionReason?: string;
  submissionCount?: number;
};

export type EmailTemplate = {
  html: string;
  subject: string;
};

export const generateEmailTemplate = (
  scenario: NotificationScenario,
  params: EmailTemplateParams
): EmailTemplate => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const logoUrl = `${baseUrl}/icons/ios/256.png`;

  const subject = scenario.email.subject;
  const heading = scenario.email.heading;
  let description = scenario.email.description;

  if (
    scenario.category === "address_change" &&
    params.fromStation &&
    params.toStation
  ) {
    description += ` Your journey details have been updated from ${params.fromStation} to ${params.toStation}.`;
  }

  if (scenario.type === "rejection" && params.rejectionReason) {
    description += ` Reason: ${params.rejectionReason}`;
  }

  if (params.submissionCount && params.submissionCount > 1) {
    description += ` This is your ${getOrdinalNumber(
      params.submissionCount
    )} submission.`;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        :root {
            --primary: oklch(0.606 0.25 292.717);
            --primary-foreground: oklch(0.969 0.016 293.756);
            --secondary: oklch(0.967 0.001 286.375);
            --secondary-foreground: oklch(0.21 0.006 285.885);
            --muted: oklch(0.967 0.001 286.375);
            --muted-foreground: oklch(0.552 0.016 285.938);
            --destructive: oklch(0.577 0.245 27.325);
            --border: oklch(0.92 0.004 286.32);
            --background: oklch(1 0 0);
            --foreground: oklch(0.141 0.005 285.823);
            --card: oklch(1 0 0);
            --card-foreground: oklch(0.141 0.005 285.823);
            --success: oklch(0.646 0.222 41.116);
            --success-foreground: oklch(1 0 0);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: var(--foreground);
            background-color: var(--muted);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        .email-container {
            max-width: 640px;
            margin: 20px auto;
            background-color: var(--background);
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid var(--border);
        }
        
        .header {
            background: var(--primary);
            padding: 40px 32px;
            text-align: center;
            color: var(--primary-foreground);
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 100%);
            pointer-events: none;
        }
        
        .logo {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background-color: rgba(255, 255, 255, 0.15);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 1;
        }
        
        .logo img {
            width: 48px;
            height: 48px;
            border-radius: 12px;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 8px;
            letter-spacing: -0.025em;
            position: relative;
            z-index: 1;
        }
        
        .brand-name {
            font-weight: 800;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.95;
            font-weight: 500;
            position: relative;
            z-index: 1;
        }
        
        .content {
            padding: 48px 32px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: var(--foreground);
            margin-bottom: 8px;
        }
        
        .main-heading {
            font-size: 24px;
            font-weight: 700;
            color: var(--foreground);
            margin-bottom: 24px;
            letter-spacing: -0.025em;
            line-height: 1.3;
        }
        
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 20px;
            border-radius: 30px;
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 32px;
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }
        
        .status-approved {
            background-color: var(--success);
            color: var(--success-foreground);
            box-shadow: 0 4px 6px -1px rgba(100, 200, 100, 0.2);
        }
        
        .status-rejected {
            background-color: var(--destructive);
            color: var(--primary-foreground);
            box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2);
        }
        
        .description {
            font-size: 16px;
            color: var(--muted-foreground);
            margin-bottom: 32px;
            line-height: 1.7;
        }
        
        .info-box {
            background-color: var(--muted);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 24px;
            margin: 32px 0;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding: 8px 0;
            border-bottom: 1px solid var(--border);
        }
        
        .info-row:last-child {
            margin-bottom: 0;
            border-bottom: none;
        }
        
        .info-label {
            font-weight: 600;
            color: var(--muted-foreground);
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }
        
        .info-value {
            font-weight: 700;
            color: var(--foreground);
            font-size: 15px;
        }
        
        .cta-section {
            text-align: center;
            margin: 40px 0;
            padding: 32px;
            background: linear-gradient(135deg, var(--muted) 0%, rgba(255, 255, 255, 0.5) 100%);
            border-radius: 12px;
            border: 1px solid var(--border);
        }
        
        .cta-button {
            display: inline-block;
            background: var(--primary);
            color: var(--primary-foreground) !important;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 16px;
            text-align: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.15);
        }
        
        .divider {
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, transparent 0%, var(--border) 50%, transparent 100%);
            margin: 32px 0;
        }
        
        .support-note {
            font-size: 14px;
            color: var(--muted-foreground);
            background-color: var(--muted);
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid var(--primary);
            margin: 24px 0;
        }
        
        .footer {
            background: linear-gradient(135deg, var(--muted) 0%, rgba(255, 255, 255, 0.8) 100%);
            padding: 40px 32px;
            text-align: center;
            border-top: 1px solid var(--border);
        }
        
        .footer .brand-name {
            font-size: 18px;
            font-weight: 800;
            color: var(--foreground);
            margin-bottom: 8px;
        }
        
        .footer p {
            font-size: 14px;
            color: var(--muted-foreground);
            margin-bottom: 8px;
            line-height: 1.5;
        }
        
        .footer a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
            transition: color 0.2s ease;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        .footer-links {
            margin: 20px 0;
        }
        
        .footer-disclaimer {
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid var(--border);
            font-size: 12px;
            color: var(--muted-foreground);
            opacity: 0.8;
        }
        
        /* Accessibility improvements */
        @media (prefers-reduced-motion: reduce) {
            .cta-button,
            .footer a {
                transition: none;
            }
        }
        
        @media only screen and (max-width: 640px) {
            .email-container {
                margin: 10px;
                border-radius: 8px;
            }
            
            .header {
                padding: 32px 20px;
            }
            
            .content {
                padding: 32px 20px;
            }
            
            .footer {
                padding: 32px 20px;
            }
            
            .header h1 {
                font-size: 24px;
            }
            
            .main-heading {
                font-size: 20px;
            }
            
            .info-row {
                flex-direction: column;
                align-items: flex-start;
                gap: 6px;
                padding: 12px 0;
            }
            
            .cta-section {
                padding: 24px 16px;
            }
            
            .logo {
                width: 64px;
                height: 64px;
            }
            
            .logo img {
                width: 36px;
                height: 36px;
            }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .email-container {
                border: 2px solid var(--foreground);
            }
            
            .status-badge,
            .cta-button {
                border: 2px solid currentColor;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">
                <img src="${logoUrl}" alt="VESITRail Logo">
            </div>
            <h1 class="brand-name">VESITRail</h1>
            <p>Railway Concession Portal</p>
        </div>
        
        <div class="content">
            <div class="status-badge ${
              scenario.type === "approval"
                ? "status-approved"
                : "status-rejected"
            }">
                ${
                  scenario.type === "approval"
                    ? "✅ Approved"
                    : "⚠️ Action Required"
                }
            </div>
            
            <div class="greeting">Hello ${params.userName}!</div>
            <div class="main-heading">${heading}</div>
            
            <div class="description">${description}</div>
            
            ${generateInfoBox(scenario, params)}
            
            ${
              scenario.email.cta
                ? `
                <div class="cta-section">
                    <a href="${baseUrl}${scenario.email.cta.url}" class="cta-button">
                        ${scenario.email.cta.text}
                    </a>
                </div>
            `
                : ""
            }
            
            <div class="divider"></div>
            
            <div class="support-note">
                <strong>Need Help?</strong> If you have any questions or need assistance, please don't hesitate to contact our support team.
            </div>
        </div>
        
        <div class="footer">
            <div class="brand-name">VESITRail</div>
            <p>Vivekanand Education Society's Institute of Technology</p>
            <div class="footer-links">
                <a href="${baseUrl}">Visit Portal</a> | 
                <a href="${baseUrl}/#contact">Contact Support</a>
            </div>
            <div class="footer-disclaimer">
                This is an automated email from <strong>VESITRail</strong>. Please do not reply to this message.
            </div>
        </div>
    </div>
</body>
</html>`;

  return {
    html,
    subject,
  };
};

const generateInfoBox = (
  scenario: NotificationScenario,
  params: EmailTemplateParams
): string => {
  const infoItems: { label: string; value: string }[] = [];

  if (params.shortId) {
    infoItems.push({ label: "Application ID", value: `#${params.shortId}` });
  } else if (params.applicationId) {
    infoItems.push({ label: "Application ID", value: params.applicationId });
  }

  if (scenario.category === "concession" && params.concessionType) {
    infoItems.push({ label: "Concession Type", value: params.concessionType });
  }

  if (scenario.category === "address_change") {
    if (params.fromStation) {
      infoItems.push({ label: "From Station", value: params.fromStation });
    }
    if (params.toStation) {
      infoItems.push({ label: "To Station", value: params.toStation });
    }
  }

  if (params.submissionCount && params.submissionCount > 1) {
    infoItems.push({
      label: "Submission Count",
      value: getOrdinalNumber(params.submissionCount),
    });
  }

  if (scenario.type === "rejection" && params.rejectionReason) {
    infoItems.push({ label: "Reason", value: params.rejectionReason });
  }

  if (infoItems.length === 0) return "";

  return `
    <div class="info-box">
      ${infoItems
        .map(
          (item) => `
        <div class="info-row">
          <span class="info-label">${item.label}: </span>
          <span class="info-value">${item.value}</span>
        </div>
      `
        )
        .join("")}
    </div>
  `;
};

const getOrdinalNumber = (num: number): string => {
  const suffixes = ["th", "st", "nd", "rd"];
  const v = num % 100;
  return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};
