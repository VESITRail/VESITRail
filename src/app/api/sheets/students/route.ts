import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

type StudentStatusResponse = {
	email: string;
	approved: boolean;
	registered: boolean;
};

export async function GET(request: NextRequest) {
	try {
		const apiKey = request.headers.get("x-api-key");

		if (!apiKey || apiKey !== API_KEY) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const students = await prisma.student.findMany({
			select: {
				status: true,
				user: {
					select: {
						email: true
					}
				}
			}
		});

		const response: StudentStatusResponse[] = students.map((s) => ({
			registered: true,
			email: s.user.email,
			approved: s.status === "Approved"
		}));

		return NextResponse.json({ students: response });
	} catch (error) {
		console.error("API Error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
