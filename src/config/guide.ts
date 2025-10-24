import { Send, Mail, UserPlus, RefreshCw, CheckCircle, ClipboardList } from "lucide-react";

interface Guide {
	title: string;
	description: string;
	icon: React.ElementType;
}

export const guide: Guide[] = [
	{
		icon: UserPlus,
		title: "Login or Register",
		description: "Start by logging into your account or registering with your student details and travel preferences."
	},
	{
		icon: ClipboardList,
		title: "Apply for Concession",
		description:
			"Go to the concession form. Your class (First/Second) and period (Monthly/Quarterly) will be auto-filled from your registration."
	},
	{
		icon: RefreshCw,
		title: "Select Fresh or Renewal",
		description: "Choose whether you're applying for a fresh concession or renewing an existing one."
	},
	{
		icon: Send,
		title: "Submit Application",
		description: "Submit your filled concession form and wait for approval."
	},
	{
		icon: Mail,
		title: "Wait for Approval Notification",
		description: "You will receive a notification once your concession request is approved."
	},
	{
		icon: CheckCircle,
		title: "Collect from Office",
		description:
			"After approval, visit the railway concession office in your college to collect the printed concession."
	}
];
