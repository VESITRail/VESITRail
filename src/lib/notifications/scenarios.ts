export type NotificationScenario = {
	id: string;
	name: string;
	type: "approval" | "rejection";
	category: "student" | "concession" | "address_change";
	push: {
		body: string;
		title: string;
	};
	inApp: {
		body: string;
		title: string;
	};
	email: {
		cta?: {
			url: string;
			text: string;
		};
		subject: string;
		heading: string;
		description: string;
	};
};

export const notificationScenarios: NotificationScenario[] = [
	{
		type: "approval",
		category: "student",
		id: "student_approval",
		name: "Student Account Approved",
		inApp: {
			title: "Account Approved",
			body: "Your student account has been approved. Welcome to VESITRail!"
		},
		push: {
			title: "Account Approved!",
			body: "Your VESITRail student account is now active. Start applying for concessions!"
		},
		email: {
			heading: "Welcome to VESITRail!",
			subject: "Your VESITRail Account Has Been Approved!",
			description:
				"Great news! Your student account has been successfully approved. You can now access all features including concession applications and address change requests.",
			cta: {
				text: "Access Dashboard",
				url: "/dashboard/student"
			}
		}
	},
	{
		type: "rejection",
		category: "student",
		id: "student_rejection",
		name: "Student Account Rejected",
		push: {
			title: "Action Required",
			body: "Please review and update your account application details."
		},
		inApp: {
			title: "Application Update Required",
			body: "Your account application needs some updates. Please review the details."
		},
		email: {
			subject: "VESITRail Account Application Update",
			heading: "Account Application Requires Attention",
			description:
				"We've reviewed your student account application. Unfortunately, we need some additional information or corrections before we can approve your account.",
			cta: {
				url: "/onboarding",
				text: "Update Application"
			}
		}
	},
	{
		type: "approval",
		category: "concession",
		id: "concession_approval",
		name: "Concession Application Approved",
		push: {
			title: "Concession Approved!",
			body: "Your concession application has been approved."
		},
		inApp: {
			title: "Concession Application Approved",
			body: "Your concession application has been approved."
		},
		email: {
			heading: "Concession Application Approved",
			subject: "Your Concession Application Has Been Approved!",
			description: "Excellent news! Your concession application has been approved.",
			cta: {
				text: "View Details",
				url: "/dashboard/student"
			}
		}
	},
	{
		type: "rejection",
		category: "concession",
		id: "concession_rejection",
		name: "Concession Application Rejected",
		push: {
			title: "Concession Update Needed",
			body: "Please review your concession application and make the necessary changes."
		},
		inApp: {
			title: "Concession Application Review",
			body: "Your concession application requires some updates. Please check the details."
		},
		email: {
			subject: "Concession Application Update",
			heading: "Concession Application Review",
			description:
				"We've reviewed your concession application. Some details require correction or additional documentation before we can process your request.",
			cta: {
				text: "Review Application",
				url: "/dashboard/student/apply-concession"
			}
		}
	},
	{
		type: "approval",
		category: "address_change",
		id: "address_change_approval",
		name: "Address Change Request Approved",
		inApp: {
			title: "Address Change Approved",
			body: "Your new address has been successfully updated in your profile."
		},
		push: {
			title: "Address Updated!",
			body: "Your address change request has been approved and updated in your profile."
		},
		email: {
			heading: "Address Successfully Updated",
			subject: "Address Change Request Approved",
			description:
				"Your address change request has been approved and processed. Your account now reflects the updated address information for future concession applications.",
			cta: {
				text: "View Profile",
				url: "/dashboard/student/profile"
			}
		}
	},
	{
		type: "rejection",
		category: "address_change",
		id: "address_change_rejection",
		name: "Address Change Request Rejected",
		push: {
			title: "Address Change Review",
			body: "Please review your address change request and provide additional details."
		},
		inApp: {
			title: "Address Change Review Required",
			body: "Your address change request needs additional verification. Please review and update."
		},
		email: {
			heading: "Address Change Update Needed",
			subject: "Address Change Request Requires Review",
			description:
				"We've reviewed your address change request. Additional verification or corrections are needed before we can process the change.",
			cta: {
				text: "Update Request",
				url: "/dashboard/student/change-address"
			}
		}
	}
];

export const getNotificationScenario = (scenarioId: string): NotificationScenario | undefined => {
	return notificationScenarios.find((scenario) => scenario.id === scenarioId);
};

export const getScenariosByCategory = (
	category: "student" | "concession" | "address_change"
): NotificationScenario[] => {
	return notificationScenarios.filter((scenario) => scenario.category === category);
};

export const getScenariosByType = (type: "approval" | "rejection"): NotificationScenario[] => {
	return notificationScenarios.filter((scenario) => scenario.type === type);
};
