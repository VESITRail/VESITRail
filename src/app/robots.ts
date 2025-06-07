import type { MetadataRoute } from "next";

const robots = (): MetadataRoute.Robots => {
  return {
    rules: {
      allow: "/",
      userAgent: "*",
      disallow: [
        "/api/",
        "/_next/",
        "/dashboard/",
        "/onboarding/",
        "/dashboard/admin",
        "/dashboard/student",
      ],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
};

export default robots;
