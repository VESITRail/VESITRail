import type { Prisma } from "@/generated/prisma/client";

export const LATEST_APPLICATION_ORDER: Prisma.ConcessionApplicationOrderByWithRelationInput[] = [
	{ shortId: "desc" },
	{ createdAt: "desc" }
];
