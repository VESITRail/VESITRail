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

export const generateEmailTemplate = (scenario: NotificationScenario, params: EmailTemplateParams): EmailTemplate => {
	const baseUrl = process.env.NEXT_PUBLIC_SITE_URL;
	const logoUrl = `${baseUrl}/icons/ios/256.png`;

	const subject = scenario.email.subject;
	const heading = scenario.email.heading;
	let description = scenario.email.description;

	if (scenario.category === "address_change" && params.fromStation && params.toStation) {
		description += ` Your journey details have been updated from ${params.fromStation} to ${params.toStation}.`;
	}

	if (scenario.type === "rejection" && params.rejectionReason) {
		description += ` Reason: ${params.rejectionReason}`;
	}

	if (params.submissionCount && params.submissionCount > 1) {
		description += ` This is your ${getOrdinalNumber(params.submissionCount)} submission.`;
	}

	const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        @media only screen and (max-width: 600px) {
            .mobile-text { font-size: 15px !important; }
            .mobile-title { font-size: 18px !important; }
            .mobile-greeting { font-size: 16px !important; }
            .mobile-padding { padding: 20px 16px !important; }
            .mobile-header-padding { padding: 24px 16px !important; }
            .mobile-logo { width: 52px !important; height: 52px !important; }
            .mobile-logo img { width: 52px !important; height: 52px !important; border-radius: 8px !important; }
            .mobile-brand { font-size: 19px !important; }
            .mobile-subtitle { font-size: 14px !important; }
            .mobile-badge { font-size: 12px !important; padding: 8px 16px !important; gap: 8px !important; }
            .mobile-info-box { padding: 16px !important; margin: 18px 0 !important; }
            .mobile-info-row { }
            .mobile-info-label { font-size: 13px !important; }
            .mobile-info-value { font-size: 14px !important; }
            .mobile-cta-padding { padding: 18px 12px !important; }
            .mobile-button { padding: 12px 24px !important; font-size: 14px !important; }
            .mobile-footer { padding: 20px 16px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.4; color: #1f2937; background-color: #ffffff;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb;">
        <div style="background: #7c3aed; padding: 24px 20px; text-align: center; color: #ffffff;" class="mobile-header-padding">
            <div style="width: 56px; height: 56px; margin: 0 auto 12px; background-color: rgba(255, 255, 255, 0.1); border-radius: 10px; display: flex; align-items: center; justify-content: center;" class="mobile-logo">
                  <img src="${logoUrl}" alt="VESITRail Logo" style="width: 56px; height: 56px; border-radius: 10px;" />
            </div>
            <h1 style="font-size: 20px; font-weight: 600; margin: 0 0 4px 0;" class="mobile-brand">VESITRail</h1>
            <p style="font-size: 14px; opacity: 0.9; font-weight: 400; margin: 0;" class="mobile-subtitle">Railway Concession Portal</p>
        </div>
        
        <div style="padding: 24px 20px;" class="mobile-padding">
            <div style="display: inline-flex; align-items: center; vertical-align: middle; padding: 7px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; margin-bottom: 22px; ${
							scenario.type === "approval"
								? "background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0;"
								: "background-color: #fef2f2; color: #dc2626; border: 1px solid #fecaca;"
						}" class="mobile-badge">
                <span style="display: inline-flex; align-items: center; height: 16px; line-height: 16px; margin-right: 8px;">${
									scenario.type === "approval" ? "✅" : "⚠️"
								}</span>
                <span style="display: inline-flex; align-items: center; height: 16px; line-height: 16px;">${
									scenario.type === "approval" ? "Approved" : "Action Required"
								}</span>
            </div>
            
            <div style="font-size: 17px; font-weight: 500; color: #374151; margin-bottom: 6px;" class="mobile-greeting">Hello ${
							params.userName
						}!</div>
            <div style="font-size: 20px; font-weight: 600; color: #111827; margin-bottom: 18px; line-height: 1.3;" class="mobile-title">${heading}</div>
            
            <div style="font-size: 16px; color: #4b5563; margin-bottom: 22px; line-height: 1.5;" class="mobile-text">${
							scenario.type === "rejection" && params.rejectionReason
								? description.replace(` Reason: ${params.rejectionReason}`, "")
								: description
						}</div>
            
            ${generateInfoBox(scenario, params)}
            
            ${
							scenario.type === "rejection" && params.rejectionReason
								? `
                <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 14px; margin: 16px 0;" class="mobile-info-box">
                    <div style="font-weight: 600; color: #dc2626; font-size: 13px; margin-bottom: 4px;">Rejection Reason:</div>
                    <div style="color: #374151; font-size: 14px; line-height: 1.4;">${params.rejectionReason}</div>
                </div>
            `
								: ""
						}
            
            ${
							scenario.email.cta
								? `
                <div style="text-align: center; margin: 26px 0;" class="mobile-cta-padding">
                    <a href="${baseUrl}${scenario.email.cta.url}" style="display: inline-block; background: #7c3aed; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; text-align: center;" class="mobile-button">
                        ${scenario.email.cta.text}
                    </a>
                </div>
            `
								: ""
						}
            
            <div style="width: 100%; height: 1px; background-color: #e5e7eb; margin: 20px 0;"></div>
            
            <div style="font-size: 13px; color: #6b7280; background-color: #f3f4f6; padding: 12px; border-radius: 5px; border-left: 3px solid #7c3aed; margin: 16px 0;">
                <strong>Need Help?</strong> If you have any questions or need assistance, please contact our support team.
            </div>
        </div>
        
        <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; min-height: 120px;" class="mobile-footer">
            <div style="font-size: 15px; font-weight: 600; color: #111827; margin-bottom: 4px;">VESITRail</div>
            <p style="font-size: 12px; color: #6b7280; margin: 0 0 4px 0; line-height: 1.3;">Vivekanand Education Society's Institute of Technology</p>
            <div style="margin: 12px 0;">
                <a href="${baseUrl}" style="color: #7c3aed; text-decoration: none; font-weight: 500; font-size: 12px;">Visit Portal</a>
                <span style="color: #d1d5db; margin: 0 6px;">|</span>
                <a href="${baseUrl}/#contact" style="color: #7c3aed; text-decoration: none; font-weight: 500; font-size: 12px;">Contact Support</a>
            </div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; line-height: 1.3;">
                This is an automated email from <strong>VESITRail</strong>. Please do not reply to this message.
            </div>
        </div>
    </div>
</body>
</html>`;

	return {
		html,
		subject
	};
};

const generateInfoBox = (scenario: NotificationScenario, params: EmailTemplateParams): string => {
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
			value: getOrdinalNumber(params.submissionCount)
		});
	}

	if (infoItems.length === 0) return "";

	return `
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 18px; margin: 18px 0;" class="mobile-info-box">
      ${infoItems
				.map(
					(item, index) => `
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: ${
					index === infoItems.length - 1 ? "0" : "12px"
				}; padding: 6px 0; ${
					index === infoItems.length - 1 ? "" : "border-bottom: 1px solid #e5e7eb;"
				}" class="mobile-info-row">
          <span style="font-weight: 500; color: #6b7280; font-size: 14px; flex-shrink: 0;" class="mobile-info-label">${
						item.label
					}:</span>
          <span style="font-weight: 600; color: #111827; font-size: 14px; text-align: right; margin-left: 12px; word-break: break-word;" class="mobile-info-value">${
						item.value
					}</span>
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
