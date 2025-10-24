import type { MetadataRoute } from "next";

const sitemap = (): MetadataRoute.Sitemap => {
	const lastModified = new Date();
	const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

	return [
		{
			priority: 1,
			lastModified,
			url: `${siteUrl}`,
			changeFrequency: "yearly"
		},
		{
			lastModified,
			priority: 0.5,
			changeFrequency: "monthly",
			url: `${siteUrl}/privacy-policy`
		},
		{
			lastModified,
			priority: 0.5,
			changeFrequency: "monthly",
			url: `${siteUrl}/terms-of-service`
		}
	];
};

export default sitemap;
