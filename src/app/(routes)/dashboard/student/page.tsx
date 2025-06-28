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
import { Small, Heading3 } from "@/components/ui/typography";
import { getConcessions, type Concession } from "@/actions/concession";
import ApplicationsTable from "@/components/student/applications-table";

const Student = () => {
  const { data, isPending } = authClient.useSession();
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [concessions, setConcessions] = useState<Concession[]>([]);

  useEffect(() => {
    const fetchConcessions = async () => {
      if (!data?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const result = await getConcessions(data.user.id);

        if (result.isSuccess) {
          setConcessions(result.data);
        } else {
          setIsError(true);
        }
      } catch (err) {
        setIsError(true);
        toast.error("Failed to fetch application");
      } finally {
        setIsLoading(false);
      }
    };

    fetchConcessions();
  }, [data?.user?.id]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Heading3 className="text-2xl font-semibold">
            Welcome,{" "}
            {isPending ? (
              <Skeleton className="inline-block align-middle h-[1.75rem] w-[8rem]" />
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
            <PlusCircle className="mr-2 size-4" />
            New Concession
          </Link>
        </Button>
      </div>

      <Separator className="my-4" />

      <div className="my-7">
        <ApplicationsTable
          isError={isError}
          isLoading={isLoading}
          applications={concessions}
        />
      </div>
    </div>
  );
};

export default Student;
