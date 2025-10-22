import { Bell, Mail, Cookie, Shield, Calendar, Database, FileText } from "lucide-react";
import { List, Heading1, Heading2, Heading3, Paragraph } from "@/components/ui/typography";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ScrollToTop from "@/components/utils/scroll-to-top";

export const metadata: Metadata = {
	title: "Privacy Policy | VESITRail"
};

const PrivacyPolicy = () => {
	const lastUpdated = "August 26, 2025";
	const siteDomain = process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") || "vesitrail.ves.ac.in";

	return (
		<main>
			<Header />

			<section className="relative min-h-screen bg-background py-16">
				<div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-background pointer-events-none -z-10" />

				<div className="container mx-auto max-w-4xl px-6 md:px-16 xl:px-8">
					<div className="text-center space-y-6 mb-12">
						<Badge variant="secondary" className="px-4 py-2 text-sm font-medium rounded-full">
							<Calendar className="size-3 mr-2" />
							Last updated: {lastUpdated}
						</Badge>

						<Heading1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground dark:from-white dark:to-muted-foreground bg-clip-text text-transparent lg:pb-2">
							Privacy Policy
						</Heading1>

						<Paragraph className="text-muted-foreground text-lg max-w-2xl mx-auto">
							We are committed to protecting your privacy and ensuring the security of your personal information.
						</Paragraph>
					</div>

					<div className="space-y-12">
						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
									<FileText className="size-5" />
								</div>
								<Heading2>Introduction</Heading2>
							</div>
							<Paragraph className="text-muted-foreground leading-relaxed">
								VESITRail (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is a web application designed exclusively
								for VESIT students to apply for and manage railway concessions. This Privacy Policy explains how we
								collect, use, disclose, and safeguard your information when you use our service at {siteDomain}.
							</Paragraph>
						</div>

						<Separator />

						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
									<Database className="size-5" />
								</div>
								<Heading2>Information We Collect</Heading2>
							</div>

							<div className="space-y-6">
								<div>
									<Heading3 className="mb-3">Personal Information</Heading3>
									<Paragraph className="text-muted-foreground mb-4">
										When you register and use VESITRail, we collect the following personal information:
									</Paragraph>
									<List className="space-y-2 text-muted-foreground">
										<li>Full name and student ID</li>
										<li>VESIT email address (@ves.ac.in)</li>
										<li>Academic details (class, division, roll number)</li>
										<li>Personal contact information (phone number, address)</li>
										<li>Travel details (home station, travel preferences)</li>
										<li>Supporting documents (ID proof, address proof)</li>
									</List>
								</div>

								<div>
									<Heading3 className="mb-3">Technical Information</Heading3>
									<List className="space-y-2 text-muted-foreground">
										<li>Device information and browser type</li>
										<li>IP address and location data</li>
										<li>Usage patterns and application interactions</li>
										<li>Firebase Cloud Messaging tokens for notifications</li>
									</List>
								</div>

								<div>
									<Heading3 className="mb-3">Authentication Data</Heading3>
									<Paragraph className="text-muted-foreground">
										We use Google OAuth for secure authentication. We only access your VESIT email address and basic
										profile information necessary for account creation and verification.
									</Paragraph>
								</div>
							</div>
						</div>

						<Separator />

						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
									<FileText className="size-5" />
								</div>
								<Heading2>How We Use Your Information</Heading2>
							</div>

							<Paragraph className="text-muted-foreground mb-4">
								We use the collected information for the following purposes:
							</Paragraph>

							<List className="space-y-3 text-muted-foreground">
								<li>
									<strong>Application Processing:</strong> To process your railway concession applications and generate
									digital booklets
								</li>
								<li>
									<strong>Account Management:</strong> To create and maintain your user account and profile
								</li>
								<li>
									<strong>Communication:</strong> To send application status updates and important notifications
								</li>
								<li>
									<strong>Verification:</strong> To verify your eligibility as a VESIT student
								</li>
								<li>
									<strong>Service Improvement:</strong> To analyze usage patterns and improve our services
								</li>
								<li>
									<strong>Security:</strong> To protect against unauthorized access and fraudulent activities
								</li>
								<li>
									<strong>Compliance:</strong> To comply with legal requirements and institutional policies
								</li>
							</List>
						</div>

						<Separator />

						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
									<Shield className="size-5" />
								</div>
								<Heading2>Data Sharing and Disclosure</Heading2>
							</div>

							<div className="space-y-6">
								<div>
									<Heading3 className="mb-3">VESIT Administration</Heading3>
									<Paragraph className="text-muted-foreground">
										We share necessary information with VESIT administration and authorized staff for verification,
										approval, and administrative purposes related to your concession applications.
									</Paragraph>
								</div>

								<div>
									<Heading3 className="mb-3">Railway Authorities</Heading3>
									<Paragraph className="text-muted-foreground">
										Required information may be shared with railway authorities as part of the concession application
										and verification process, in accordance with railway regulations.
									</Paragraph>
								</div>

								<div>
									<Heading3 className="mb-3">Service Providers</Heading3>
									<Paragraph className="text-muted-foreground mb-4">
										We work with trusted third-party service providers who help us operate our service:
									</Paragraph>
									<List className="space-y-2 text-muted-foreground">
										<li>Google (Authentication)</li>
										<li>PostHog (Analytics)</li>
										<li>Cloudinary (Document storage and management)</li>
										<li>Firebase (Push notifications)</li>
									</List>
								</div>

								<div>
									<Heading3 className="mb-3">Legal Requirements</Heading3>
									<Paragraph className="text-muted-foreground">
										We may disclose your information if required by law or in response to valid legal requests from
										authorities.
									</Paragraph>
								</div>
							</div>
						</div>

						<Separator />

						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
									<Bell className="size-5" />
								</div>
								<Heading2>Push Notifications</Heading2>
							</div>

							<Paragraph className="text-muted-foreground mb-4">
								VESITRail uses Firebase Cloud Messaging to send push notifications about:
							</Paragraph>

							<List className="space-y-2 text-muted-foreground mb-4">
								<li>Application status updates</li>
								<li>Approval or rejection notifications</li>
								<li>Important announcements</li>
								<li>Deadline reminders</li>
							</List>

							<Paragraph className="text-muted-foreground">
								You can manage your notification preferences in the app settings or disable them entirely through your
								browser or device settings.
							</Paragraph>
						</div>

						<Separator />

						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
									<Cookie className="size-5" />
								</div>
								<Heading2>Cookies and Tracking</Heading2>
							</div>

							<div className="space-y-6">
								<div>
									<Heading3 className="mb-3">Essential Cookies</Heading3>
									<Paragraph className="text-muted-foreground">
										We use essential cookies for authentication, session management, and basic functionality. These
										cannot be disabled without affecting the service.
									</Paragraph>
								</div>

								<div>
									<Heading3 className="mb-3">Analytics</Heading3>
									<Paragraph className="text-muted-foreground">
										We use PostHog to understand how users interact with our service. This helps us improve the user
										experience and optimize our features.
									</Paragraph>
								</div>
							</div>
						</div>

						<Separator />

						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
									<Shield className="size-5" />
								</div>
								<Heading2>Data Security</Heading2>
							</div>

							<Paragraph className="text-muted-foreground mb-4">
								We implement comprehensive security measures to protect your personal information:
							</Paragraph>

							<List className="space-y-2 text-muted-foreground">
								<li>SSL/TLS encryption for data transmission</li>
								<li>Secure authentication using Google OAuth</li>
								<li>Regular security audits and updates</li>
								<li>Access controls and role-based permissions</li>
								<li>Secure cloud infrastructure (PostgreSQL)</li>
								<li>Document encryption using Cloudinary</li>
							</List>
						</div>

						<Separator />

						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
									<FileText className="size-5" />
								</div>
								<Heading2>Your Rights</Heading2>
							</div>

							<Paragraph className="text-muted-foreground mb-4">
								You have the following rights regarding your personal information:
							</Paragraph>

							<List className="space-y-3 text-muted-foreground">
								<li>
									<strong>Access:</strong> Request a copy of your personal data
								</li>
								<li>
									<strong>Correction:</strong> Update or correct inaccurate information
								</li>
								<li>
									<strong>Deletion:</strong> Request deletion of your account and data
								</li>
								<li>
									<strong>Portability:</strong> Receive your data in a structured format
								</li>
								<li>
									<strong>Objection:</strong> Object to certain processing activities
								</li>
								<li>
									<strong>Restriction:</strong> Request restriction of processing
								</li>
							</List>

							<Paragraph className="text-muted-foreground mt-4">
								To exercise these rights, please contact us using the information provided below.
							</Paragraph>
						</div>

						<Separator />

						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
									<Database className="size-5" />
								</div>
								<Heading2>Data Retention</Heading2>
							</div>

							<Paragraph className="text-muted-foreground mb-4">
								We retain your personal information for the following periods:
							</Paragraph>

							<List className="space-y-2 text-muted-foreground">
								<li>Active account data: While you remain a VESIT student</li>
								<li>Application records: 3 years after graduation</li>
								<li>Document uploads: Until account deletion or graduation + 1 year</li>
							</List>
						</div>

						<Separator />

						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
									<FileText className="size-5" />
								</div>
								<Heading2>Updates to This Privacy Policy</Heading2>
							</div>

							<Paragraph className="text-muted-foreground">
								We may update this Privacy Policy from time to time. We will notify you of any material changes by
								posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. We encourage
								you to review this Privacy Policy periodically for any changes.
							</Paragraph>
						</div>

						<Separator />

						<div>
							<div className="flex items-center gap-3 mb-6">
								<div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
									<Mail className="size-5" />
								</div>
								<Heading2>Contact Us</Heading2>
							</div>

							<Paragraph className="text-muted-foreground mb-6">
								If you have any questions about this Privacy Policy or our data practices, please contact us:
							</Paragraph>

							<Link href="/#contact">
								<Button variant="default" className="w-fit">
									<Mail className="size-4 mr-1" />
									Contact Support
								</Button>
							</Link>

							<Separator className="my-6" />

							<Paragraph className="text-sm text-muted-foreground">
								This privacy policy is effective as of {lastUpdated} and applies to VESITRail ({siteDomain}), a service
								exclusively for VESIT students.
							</Paragraph>
						</div>
					</div>
				</div>
			</section>

			<Footer />
			<ScrollToTop />
		</main>
	);
};

export default PrivacyPolicy;
