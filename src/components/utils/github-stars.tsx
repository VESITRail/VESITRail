"use client";

import { Github, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type GitHubStarsProps = {
  className?: string;
};

const GitHubStars = ({ className }: GitHubStarsProps) => {
  const [error, setError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    const fetchStars = async () => {
      try {
        const response = await fetch(
          "https://api.github.com/repos/VESITRail/VESITRail"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch repo data");
        }

        const data = await response.json();
        setStars(data.stargazers_count);
      } catch (error) {
        console.error("Error fetching GitHub stars:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchStars();
  }, []);

  const handleClick = () => {
    window.open("https://github.com/VESITRail/VESITRail", "_blank");
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-[29.6px] w-20 rounded-full" />
      </div>
    );
  }

  if (error || stars === null || stars === 0) {
    return null;
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex cursor-pointer items-center gap-2 px-3 py-[4.81px] rounded-full bg-primary text-white ${className}`}
    >
      <Github className="size-4" />

      <div className="flex items-center gap-1">
        <Star className="size-3 fill-current" />

        <span className="text-sm font-medium">{stars.toLocaleString()}</span>
      </div>
    </button>
  );
};

export default GitHubStars;
