"use client";

import {
  getStudentPreferences,
  updateStudentPreferences,
} from "@/actions/settings";
import {
  getConcessionClasses,
  getConcessionPeriods,
} from "@/actions/onboarding";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ConcessionClass, ConcessionPeriod } from "@/generated/zod";
import { Save, Loader2, AlertTriangle, RefreshCcw } from "lucide-react";

interface StudentPreferences {
  preferredConcessionClassId: string;
  preferredConcessionPeriodId: string;
  preferredConcessionClass: Partial<ConcessionClass>;
  preferredConcessionPeriod: Partial<ConcessionPeriod>;
}

const Preferences = () => {
  const { data, isPending } = authClient.useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<StudentPreferences | null>(
    null
  );
  const [concessionClasses, setConcessionClasses] = useState<ConcessionClass[]>(
    []
  );
  const [concessionPeriods, setConcessionPeriods] = useState<
    ConcessionPeriod[]
  >([]);

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>("");

  const hasChanges =
    preferences &&
    (selectedClassId !== preferences.preferredConcessionClassId ||
      selectedPeriodId !== preferences.preferredConcessionPeriodId);

  const isFormValid = selectedClassId && selectedPeriodId;

  useEffect(() => {
    const fetchData = async () => {
      if (isPending || !data?.user?.id) return;

      setLoading(true);

      try {
        const [preferencesResult, classesResult, periodsResult] =
          await Promise.all([
            getStudentPreferences(data.user.id),
            getConcessionClasses(),
            getConcessionPeriods(),
          ]);

        if (preferencesResult.success && preferencesResult.data) {
          setPreferences(preferencesResult.data);
          setSelectedClassId(preferencesResult.data.preferredConcessionClassId);
          setSelectedPeriodId(
            preferencesResult.data.preferredConcessionPeriodId
          );
        } else {
          toast.error("Failed to load your preferences");
        }

        if (classesResult.data) {
          setConcessionClasses(classesResult.data);
        } else {
          toast.error("Failed to load concession classes");
        }

        if (periodsResult.data) {
          setConcessionPeriods(periodsResult.data);
        } else {
          toast.error("Failed to load concession periods");
        }
      } catch (error) {
        toast.error("Failed to load settings data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [data?.user?.id, isPending]);

  const handleSave = async () => {
    if (!data?.user?.id || !isFormValid || !hasChanges) return;

    setIsSubmitting(true);

    const updateData = {
      preferredConcessionClassId: selectedClassId,
      preferredConcessionPeriodId: selectedPeriodId,
    };

    const submissionPromise = updateStudentPreferences(
      data.user.id,
      updateData
    );

    toast.promise(submissionPromise, {
      loading: "Updating your preferences...",
      success: "Preferences updated successfully!",
      error: (error) => error.error || "Failed to update preferences",
    });

    try {
      const result = await submissionPromise;

      if (result.success && result.data) {
        setPreferences((prev) =>
          prev
            ? {
                ...prev,
                preferredConcessionClassId: selectedClassId,
                preferredConcessionPeriodId: selectedPeriodId,
                preferredConcessionClass: result.data.preferredConcessionClass,
                preferredConcessionPeriod:
                  result.data.preferredConcessionPeriod,
              }
            : null
        );
      }
    } catch (error) {
      toast.error(
        "Update error: " +
          (error instanceof Error ? error.message : String(error))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedClassExists = concessionClasses.some(
    (c) => c.id === selectedClassId
  );

  const selectedPeriodExists = concessionPeriods.some(
    (p) => p.id === selectedPeriodId
  );

  if (isPending || loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Concession Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Update your preferred concession class and period. These will be
            used as defaults when applying for concessions.
          </p>
        </div>

        <Card>
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            <div className="flex justify-end mt-8">
              <Skeleton className="h-10 w-36" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Concession Preferences</h2>
          <p className="text-sm text-muted-foreground">
            Update your preferred concession class and period. These will be
            used as defaults when applying for concessions.
          </p>
        </div>

        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
              <div className="size-16 rounded-full bg-destructive flex items-center justify-center">
                <AlertTriangle className="text-white size-7" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-foreground">
                  Unable to Load Preferences
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  We couldn't load your preferences at the moment. This might be
                  due to a temporary network issue.
                </p>
              </div>
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => window.location.reload()}
              >
                <RefreshCcw className="mr-1" />
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Concession Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Update your preferred concession class and period. These will be used
          as defaults when applying for concessions.
        </p>
      </div>

      <Card>
        <CardContent className="py-4.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="concession-class" className="text-sm font-medium">
                Preferred Concession Class
              </Label>
              <Select
                disabled={isSubmitting}
                onValueChange={setSelectedClassId}
                value={selectedClassExists ? selectedClassId : undefined}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select concession class" />
                </SelectTrigger>
                <SelectContent>
                  {concessionClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="concession-period"
                className="text-sm font-medium"
              >
                Preferred Concession Period
              </Label>
              <Select
                disabled={isSubmitting}
                onValueChange={setSelectedPeriodId}
                value={selectedPeriodExists ? selectedPeriodId : undefined}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select concession period" />
                </SelectTrigger>
                <SelectContent>
                  {concessionPeriods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end mt-8">
            <Button
              onClick={handleSave}
              className="min-w-[140px]"
              disabled={!hasChanges || !isFormValid || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-1 size-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Preferences;
