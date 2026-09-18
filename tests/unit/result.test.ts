import {
	map,
	chain,
	match,
	unwrap,
	combine,
	success,
	failure,
	attempt,
	mapAsync,
	mapError,
	unwrapOr,
	authError,
	isFailure,
	isSuccess,
	chainAsync,
	networkError,
	attemptAsync,
	databaseError,
	validationError
} from "@/lib/result";
import { it, expect, describe } from "vitest";

describe("Result Monad", () => {
	describe("success and failure constructors", () => {
		it("creates a success result with data", () => {
			const res = success(42);
			expect(res.isSuccess).toBe(true);
			expect(res.data).toBe(42);
			expect("error" in res).toBe(false);
		});

		it("creates a failure result with error", () => {
			const res = failure("something went wrong");
			expect(res.isSuccess).toBe(false);
			expect(res.error).toBe("something went wrong");
			expect("data" in res).toBe(false);
		});
	});

	describe("isSuccess and isFailure type guards", () => {
		it("correctly identifies success", () => {
			const s = success("ok");
			const f = failure("err");
			expect(isSuccess(s)).toBe(true);
			expect(isSuccess(f)).toBe(false);
		});

		it("correctly identifies failure", () => {
			const s = success("ok");
			const f = failure("err");
			expect(isFailure(f)).toBe(true);
			expect(isFailure(s)).toBe(false);
		});
	});

	describe("unwrap", () => {
		it("returns data on success", () => {
			expect(unwrap(success(100))).toBe(100);
		});

		it("throws Error on failure", () => {
			expect(() => unwrap(failure("broken"))).toThrow("Failed to unwrap result: broken");
		});
	});

	describe("unwrapOr", () => {
		it("returns data on success", () => {
			expect(unwrapOr(success(50), 0)).toBe(50);
		});

		it("returns default value on failure", () => {
			expect(unwrapOr(failure("bad"), 0)).toBe(0);
		});
	});

	describe("map", () => {
		it("transforms data on success", () => {
			const res = map(success(10), (x) => x * 2);
			expect(res).toEqual(success(20));
		});

		it("leaves error untouched on failure without invoking mapper", () => {
			let called = false;
			const res = map(failure("err"), (x: number) => {
				called = true;
				return x * 2;
			});
			expect(called).toBe(false);
			expect(res).toEqual(failure("err"));
		});
	});

	describe("mapError", () => {
		it("transforms error on failure", () => {
			const res = mapError(failure("err"), (e) => e.toUpperCase());
			expect(res).toEqual(failure("ERR"));
		});

		it("leaves data untouched on success without invoking mapper", () => {
			let called = false;
			const res = mapError(success(10), (e: string) => {
				called = true;
				return e.toUpperCase();
			});
			expect(called).toBe(false);
			expect(res).toEqual(success(10));
		});
	});

	describe("chain", () => {
		it("chains success into another success", () => {
			const res = chain(success(5), (x) => success(x + 10));
			expect(res).toEqual(success(15));
		});

		it("chains success into a failure", () => {
			const res = chain(success(5), (_) => failure("chained failure"));
			expect(res).toEqual(failure("chained failure"));
		});

		it("propagates original failure without calling mapper", () => {
			let called = false;
			const res = chain(failure("orig"), (x: number) => {
				called = true;
				return success(x + 1);
			});
			expect(called).toBe(false);
			expect(res).toEqual(failure("orig"));
		});
	});

	describe("match", () => {
		it("calls onSuccess handler for success result", () => {
			const output = match(success(7), {
				onSuccess: (data) => `data is ${data}`,
				onFailure: (err) => `error is ${err}`
			});
			expect(output).toBe("data is 7");
		});

		it("calls onFailure handler for failure result", () => {
			const output = match(failure("bad"), {
				onSuccess: (data) => `data is ${data}`,
				onFailure: (err) => `error is ${err}`
			});
			expect(output).toBe("error is bad");
		});
	});

	describe("mapAsync", () => {
		it("transforms success data asynchronously", async () => {
			const res = await mapAsync(success(4), async (x) => x * 3);
			expect(res).toEqual(success(12));
		});

		it("preserves failure without calling async mapper", async () => {
			let called = false;
			const res = await mapAsync(failure("err"), async (x: number) => {
				called = true;
				return x * 3;
			});
			expect(called).toBe(false);
			expect(res).toEqual(failure("err"));
		});

		it("converts thrown errors in mapper to failure", async () => {
			const res = await mapAsync(success(1), async () => {
				throw new Error("async explode");
			});
			expect(res).toEqual(failure("async explode"));
		});

		it("converts thrown non-Error string in mapper to failure", async () => {
			const res = await mapAsync(success(1), async () => {
				throw "async raw string error";
			});
			expect(res).toEqual(failure("async raw string error"));
		});
	});

	describe("chainAsync", () => {
		it("chains async operation on success", async () => {
			const res = await chainAsync(success(10), async (x) => success(x + 5));
			expect(res).toEqual(success(15));
		});

		it("returns original failure without calling async mapper", async () => {
			let called = false;
			const res = await chainAsync(failure("err"), async (x: number) => {
				called = true;
				return success(x + 5);
			});
			expect(called).toBe(false);
			expect(res).toEqual(failure("err"));
		});
	});

	describe("combine", () => {
		it("combines array of successes into single success containing data tuple", () => {
			const res = combine([success(1), success("hello"), success(true)] as const);
			expect(res).toEqual(success([1, "hello", true]));
		});

		it("short-circuits and returns the first failure encountered", () => {
			const res = combine([success(1), failure("err1"), failure("err2")] as const);
			expect(res).toEqual(failure("err1"));
		});

		it("returns empty success array for empty input", () => {
			const res = combine([] as const);
			expect(res).toEqual(success([]));
		});
	});

	describe("attempt and attemptAsync", () => {
		it("attempt captures successful return", () => {
			const res = attempt((a: number, b: number) => a + b, 2, 3);
			expect(res).toEqual(success(5));
		});

		it("attempt captures thrown Error message", () => {
			const res = attempt(() => {
				throw new Error("sync crash");
			});
			expect(res).toEqual(failure("sync crash"));
		});

		it("attempt captures thrown non-Error string", () => {
			const res = attempt(() => {
				throw "raw string error";
			});
			expect(res).toEqual(failure("raw string error"));
		});

		it("attemptAsync captures async resolved return", async () => {
			const res = await attemptAsync(async (x: number) => x * 10, 4);
			expect(res).toEqual(success(40));
		});

		it("attemptAsync captures async thrown error", async () => {
			const res = await attemptAsync(async () => {
				throw new Error("async crash");
			});
			expect(res).toEqual(failure("async crash"));
		});

		it("attemptAsync captures async thrown non-Error string", async () => {
			const res = await attemptAsync(async () => {
				throw "async raw string crash";
			});
			expect(res).toEqual(failure("async raw string crash"));
		});
	});

	describe("Error Constructors", () => {
		it("creates DatabaseError", () => {
			expect(databaseError("connection timeout")).toEqual({
				type: "DATABASE_ERROR",
				message: "connection timeout",
				code: undefined
			});
			expect(databaseError("unique constraint", "P2002")).toEqual({
				type: "DATABASE_ERROR",
				message: "unique constraint",
				code: "P2002"
			});
		});

		it("creates ValidationError", () => {
			expect(validationError("invalid format")).toEqual({
				type: "VALIDATION_ERROR",
				message: "invalid format",
				field: undefined
			});
			expect(validationError("invalid email", "email")).toEqual({
				type: "VALIDATION_ERROR",
				message: "invalid email",
				field: "email"
			});
		});

		it("creates AuthError", () => {
			expect(authError("not logged in")).toEqual({
				type: "AUTH_ERROR",
				message: "not logged in",
				code: undefined
			});
			expect(authError("unauthorized access", "UNAUTHORIZED")).toEqual({
				type: "AUTH_ERROR",
				message: "unauthorized access",
				code: "UNAUTHORIZED"
			});
		});

		it("creates NetworkError", () => {
			expect(networkError("gateway timeout")).toEqual({
				type: "NETWORK_ERROR",
				message: "gateway timeout",
				status: undefined
			});
			expect(networkError("not found", 404)).toEqual({
				type: "NETWORK_ERROR",
				message: "not found",
				status: 404
			});
		});
	});
});
