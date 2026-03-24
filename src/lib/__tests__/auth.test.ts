// @vitest-environment node
import { webcrypto } from "node:crypto";
Object.defineProperty(globalThis, "crypto", { value: webcrypto });

import { test, expect, vi, beforeEach } from "vitest";
import { SignJWT, jwtVerify } from "jose";

const mockCookieSet = vi.fn();
const mockCookieGet = vi.fn();
const mockCookieStore = { set: mockCookieSet, get: mockCookieGet };

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue(mockCookieStore),
}));

const { createSession, getSession } = await import("@/lib/auth");

const JWT_SECRET = new TextEncoder().encode("development-secret-key");

async function makeToken(payload: object, expiresIn = "7d") {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

beforeEach(() => {
  mockCookieSet.mockClear();
  mockCookieGet.mockClear();
});

test("sets an httpOnly cookie", async () => {
  await createSession("user-1", "test@example.com");

  expect(mockCookieSet).toHaveBeenCalledOnce();
  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.httpOnly).toBe(true);
});

test("cookie contains a valid JWT with userId and email", async () => {
  await createSession("user-1", "test@example.com");

  const [, token] = mockCookieSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  expect(payload.userId).toBe("user-1");
  expect(payload.email).toBe("test@example.com");
});

test("JWT expires in approximately 7 days", async () => {
  const before = Date.now();
  await createSession("user-1", "test@example.com");
  const after = Date.now();

  const [, token] = mockCookieSet.mock.calls[0];
  const { payload } = await jwtVerify(token, JWT_SECRET);

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  expect(payload.exp! * 1000).toBeGreaterThanOrEqual(before + sevenDaysMs - 5000);
  expect(payload.exp! * 1000).toBeLessThanOrEqual(after + sevenDaysMs + 5000);
});

test("cookie path is /", async () => {
  await createSession("user-1", "test@example.com");

  const [, , options] = mockCookieSet.mock.calls[0];
  expect(options.path).toBe("/");
});

test("cookie name is auth-token", async () => {
  await createSession("user-1", "test@example.com");

  const [name] = mockCookieSet.mock.calls[0];
  expect(name).toBe("auth-token");
});

// getSession

test("getSession returns null when no cookie is present", async () => {
  mockCookieGet.mockReturnValue(undefined);

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns the session payload for a valid token", async () => {
  const token = await makeToken({ userId: "user-1", email: "test@example.com" });
  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session?.userId).toBe("user-1");
  expect(session?.email).toBe("test@example.com");
});

test("getSession returns null for an expired token", async () => {
  const token = await makeToken({ userId: "user-1", email: "test@example.com" }, "1s");
  await new Promise((resolve) => setTimeout(resolve, 1500));
  mockCookieGet.mockReturnValue({ value: token });

  const session = await getSession();

  expect(session).toBeNull();
});

test("getSession returns null for a tampered token", async () => {
  const token = await makeToken({ userId: "user-1", email: "test@example.com" });
  const tampered = token.slice(0, -5) + "XXXXX";
  mockCookieGet.mockReturnValue({ value: tampered });

  const session = await getSession();

  expect(session).toBeNull();
});
