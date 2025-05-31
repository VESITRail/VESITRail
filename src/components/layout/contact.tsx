import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lead, Heading1, Paragraph } from "@/components/ui/typography";

const Contact = () => {
  return (
    <section
      id="contact"
      className="relative flex-col justify-center px-4 md:px-8 overflow-x-hidden py-16"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-muted/60 to-background pointer-events-none -z-10" />

      <div className="container mx-auto max-w-7xl text-center space-y-8">
        <div className="space-y-4">
          <Heading1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground dark:from-white dark:to-muted-foreground bg-clip-text text-transparent">
            Get in Touch
          </Heading1>

          <Lead className="text-muted-foreground text-lg leading-normal max-w-2xl mx-auto">
            Have questions about the railway concession process? We're here to
            help!
          </Lead>
        </div>

        <div className="flex justify-center">
          <Link href="mailto:vesit.railwayconcession@ves.ac.in">
            <Button className="h-12 px-8 text-base font-medium transition-all duration-300 flex items-center justify-center gap-2">
              <Mail size={20} />
              <span>Contact Us</span>
            </Button>
          </Link>
        </div>

        <Paragraph className="text-muted-foreground text-sm">
          We typically respond within 24 hours
        </Paragraph>
      </div>
    </section>
  );
};

export default Contact;
