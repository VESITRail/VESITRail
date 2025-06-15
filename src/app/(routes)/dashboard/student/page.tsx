"use client";

import Link from "next/link";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { toTitleCase } from "@/lib/utils";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { getConcessions } from "@/actions/concession";
import { Small, Heading3 } from "@/components/ui/typography";
import ApplicationsTable from "@/components/student/applications-table";

type Concession = Awaited<ReturnType<typeof getConcessions>>[0];

const Student = () => {
  const { data, isPending } = authClient.useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [concessions, setConcessions] = useState<Concession[]>([]);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const concessions = await getConcessions();
        setConcessions(concessions);
      } catch (err) {
        toast.error("Failed to fetch concessions");
        setError(
          err instanceof Error ? err.message : "Failed to fetch concessions"
        );
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Heading3>
            Welcome,{" "}
            {isPending ? (
              <Skeleton className="inline-block h-8 w-32" />
            ) : (
              toTitleCase(data?.user?.name || "Student")
            )}
          </Heading3>

          <Small className="text-muted-foreground">
            View and manage your concession applications, track their status,
            and submit new requests here.
          </Small>
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/student/apply-concession">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Concession
          </Link>
        </Button>
      </div>

      <Separator className="my-4" />

      <div className="my-7">
        <ApplicationsTable
          error={error}
          isLoading={isLoading}
          applications={concessions}
        />
      </div>
    </div>
  );
};

export default Student;
