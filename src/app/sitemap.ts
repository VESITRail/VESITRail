import type { MetadataRoute } from "next";

const sitemap = (): MetadataRoute.Sitemap => {
  const lastModified = new Date();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  return [
    {
      priority: 1,
      lastModified,
      url: `${siteUrl}`,
      changeFrequency: "yearly",
    },
  ];
};

export default sitemap;
