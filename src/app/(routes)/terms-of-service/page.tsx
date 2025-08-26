import {
  Bell,
  Mail,
  Users,
  Shield,
  Calendar,
  Database,
  FileText,
} from "lucide-react";
import {
  List,
  Heading1,
  Heading2,
  Heading3,
  Paragraph,
} from "@/components/ui/typography";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import ScrollToTop from "@/components/utils/scroll-to-top";

export const metadata: Metadata = {
  title: "Terms of Service | VESITRail",
};

const TermsOfService = () => {
  const lastUpdated = "August 26, 2025";
  const siteDomain =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ||
    "vesitrail.ves.ac.in";

  return (
    <main>
      <Header />

      <section className="relative min-h-screen bg-background py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-background pointer-events-none -z-10" />

        <div className="container mx-auto max-w-4xl px-6 md:px-16 xl:px-8">
          <div className="text-center space-y-6 mb-12">
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm font-medium rounded-full"
            >
              <Calendar className="size-3 mr-2" />
              Last updated: {lastUpdated}
            </Badge>

            <Heading1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground dark:from-white dark:to-muted-foreground bg-clip-text text-transparent lg:pb-2">
              Terms of Service
            </Heading1>

            <Paragraph className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Please read these Terms of Service carefully before using our
              platform.
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
                Welcome to VESITRail. These Terms of Service (&quot;Terms&quot;)
                govern your use of our web application designed exclusively for
                VESIT students to apply for and manage railway concessions. By
                accessing or using our service at {siteDomain}, you agree to be
                bound by these Terms.
              </Paragraph>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Users className="size-5" />
                </div>
                <Heading2>Eligibility and Account Registration</Heading2>
              </div>

              <div className="space-y-6">
                <div>
                  <Heading3 className="mb-3">Eligibility Requirements</Heading3>
                  <Paragraph className="text-muted-foreground mb-4">
                    To use VESITRail, you must meet the following requirements:
                  </Paragraph>
                  <List className="space-y-2 text-muted-foreground">
                    <li>
                      Be a currently enrolled student at VESIT (Vivekanand
                      Education Society&apos;s Institute of Technology)
                    </li>
                    <li>Have a valid VESIT email address (@ves.ac.in)</li>
                    <li>Be at least 18 years old</li>
                    <li>
                      Provide accurate and complete information during
                      registration
                    </li>
                  </List>
                </div>

                <div>
                  <Heading3 className="mb-3">Account Responsibilities</Heading3>
                  <List className="space-y-2 text-muted-foreground">
                    <li>
                      You are responsible for maintaining the confidentiality of
                      your account
                    </li>
                    <li>
                      You must notify us immediately of any unauthorized use of
                      your account
                    </li>
                    <li>
                      You are liable for all activities that occur under your
                      account
                    </li>
                    <li>
                      One account per student - duplicate accounts are
                      prohibited
                    </li>
                  </List>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <FileText className="size-5" />
                </div>
                <Heading2>Acceptable Use</Heading2>
              </div>

              <Paragraph className="text-muted-foreground mb-4">
                When using VESITRail, you agree to:
              </Paragraph>

              <List className="space-y-3 text-muted-foreground mb-6">
                <li>
                  <strong>Provide Accurate Information:</strong> Submit truthful
                  and accurate information in all applications
                </li>
                <li>
                  <strong>Use for Intended Purpose:</strong> Use the service
                  only for legitimate railway concession applications
                </li>
                <li>
                  <strong>Respect Others:</strong> Not interfere with other
                  users&apos; ability to use the service
                </li>
                <li>
                  <strong>Follow Guidelines:</strong> Comply with all VESIT and
                  railway authority guidelines
                </li>
                <li>
                  <strong>Report Issues:</strong> Notify us of any bugs,
                  security vulnerabilities, or misuse
                </li>
              </List>

              <Paragraph className="text-muted-foreground mb-4">
                You agree NOT to:
              </Paragraph>

              <List className="space-y-2 text-muted-foreground">
                <li>Submit false or fraudulent information</li>
                <li>
                  Create multiple accounts or share your account with others
                </li>
                <li>
                  Attempt to circumvent security measures or access restrictions
                </li>
                <li>
                  Use automated scripts or bots to interact with the service
                </li>
                <li>
                  Upload malicious files or attempt to compromise system
                  security
                </li>
                <li>Violate any applicable laws or regulations</li>
              </List>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Database className="size-5" />
                </div>
                <Heading2>Service Description</Heading2>
              </div>

              <div className="space-y-6">
                <div>
                  <Heading3 className="mb-3">Core Features</Heading3>
                  <List className="space-y-2 text-muted-foreground">
                    <li>Online railway concession application submission</li>
                    <li>Real-time application status tracking</li>
                    <li>Digital booklet generation and management</li>
                    <li>Address change request processing</li>
                    <li>Push notification updates</li>
                    <li>Document upload and verification</li>
                  </List>
                </div>

                <div>
                  <Heading3 className="mb-3">Service Limitations</Heading3>
                  <Paragraph className="text-muted-foreground mb-4">
                    Please note the following limitations:
                  </Paragraph>
                  <List className="space-y-2 text-muted-foreground">
                    <li>
                      Service availability depends on VESIT administration
                      approval processes
                    </li>
                    <li>
                      Railway concession eligibility is subject to railway
                      authority rules
                    </li>
                    <li>
                      Application processing times may vary based on
                      verification requirements
                    </li>
                    <li>
                      Technical maintenance may temporarily interrupt service
                      availability
                    </li>
                  </List>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Shield className="size-5" />
                </div>
                <Heading2>Intellectual Property</Heading2>
              </div>

              <div className="space-y-6">
                <div>
                  <Heading3 className="mb-3">Our Rights</Heading3>
                  <Paragraph className="text-muted-foreground">
                    VESITRail and all related content, features, and
                    functionality are owned by VESIT and are protected by
                    copyright, trademark, and other intellectual property laws.
                    You may not reproduce, distribute, or create derivative
                    works without explicit permission.
                  </Paragraph>
                </div>

                <div>
                  <Heading3 className="mb-3">Your Content</Heading3>
                  <Paragraph className="text-muted-foreground">
                    By uploading documents or providing information, you grant
                    us a limited license to process, store, and use your content
                    solely for providing our services. You retain ownership of
                    your personal information and documents.
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
                <Heading2>Disclaimers and Limitations</Heading2>
              </div>

              <div className="space-y-6">
                <div>
                  <Heading3 className="mb-3">Service Availability</Heading3>
                  <Paragraph className="text-muted-foreground">
                    We strive to maintain continuous service availability but
                    cannot guarantee uninterrupted access. The service is
                    provided "as is" without warranties of any kind, either
                    express or implied.
                  </Paragraph>
                </div>

                <div>
                  <Heading3 className="mb-3">Limitation of Liability</Heading3>
                  <Paragraph className="text-muted-foreground">
                    VESITRail shall not be liable for any indirect, incidental,
                    special, or consequential damages arising from your use of
                    the service. Our total liability shall not exceed the value
                    of services provided to you.
                  </Paragraph>
                </div>

                <div>
                  <Heading3 className="mb-3">Third-Party Services</Heading3>
                  <Paragraph className="text-muted-foreground">
                    Our service integrates with third-party providers (Google,
                    Firebase, Cloudinary). We are not responsible for the
                    availability, content, or practices of these external
                    services.
                  </Paragraph>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Users className="size-5" />
                </div>
                <Heading2>Account Termination</Heading2>
              </div>

              <div className="space-y-6">
                <div>
                  <Heading3 className="mb-3">Termination by You</Heading3>
                  <Paragraph className="text-muted-foreground">
                    You may terminate your account at any time by contacting us.
                    Upon termination, your access to the service will be
                    immediately revoked, and your data will be handled according
                    to our Privacy Policy.
                  </Paragraph>
                </div>

                <div>
                  <Heading3 className="mb-3">Termination by Us</Heading3>
                  <Paragraph className="text-muted-foreground mb-4">
                    We may terminate or suspend your account immediately if you:
                  </Paragraph>
                  <List className="space-y-2 text-muted-foreground">
                    <li>Violate these Terms of Service</li>
                    <li>Provide false or fraudulent information</li>
                    <li>Are no longer a VESIT student</li>
                    <li>
                      Engage in activities that harm the service or other users
                    </li>
                  </List>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <FileText className="size-5" />
                </div>
                <Heading2>Governing Law</Heading2>
              </div>

              <Paragraph className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance
                with the laws of India. Any disputes arising from these Terms or
                your use of the service shall be subject to the jurisdiction of
                the courts in Mumbai, Maharashtra.
              </Paragraph>
            </div>

            <Separator />

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <FileText className="size-5" />
                </div>
                <Heading2>Changes to Terms</Heading2>
              </div>

              <Paragraph className="text-muted-foreground">
                We reserve the right to modify these Terms at any time. We will
                notify users of any material changes by posting the updated
                Terms on this page and updating the "Last updated" date. Your
                continued use of the service after changes become effective
                constitutes acceptance of the new Terms.
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
                If you have any questions about these Terms of Service, please
                contact us:
              </Paragraph>

              <Link href="/#contact">
                <Button variant="default" className="w-fit">
                  <Mail className="size-4 mr-1" />
                  Contact Support
                </Button>
              </Link>

              <Separator className="my-6" />

              <Paragraph className="text-sm text-muted-foreground">
                These terms of service are effective as of {lastUpdated} and
                apply to VESITRail ({siteDomain}), a service exclusively for
                VESIT students.
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

export default TermsOfService;
