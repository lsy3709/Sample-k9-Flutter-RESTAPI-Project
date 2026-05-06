/**
 * Unit tests for auth storage helpers.
 * Verifies localStorage behavior and token expiration parsing logic.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  saveToken,
  loadToken,
  loadRefreshToken,
  clearToken,
  saveMember,
  loadMember,
  getTokenRemainingMs,
  MemberInfo,
} from "./auth";

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

describe("auth storage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads access + refresh tokens", () => {
    saveToken("ACCESS", "REFRESH");
    expect(loadToken()).toBe("ACCESS");
    expect(loadRefreshToken()).toBe("REFRESH");
  });

  it("saves access token without refresh", () => {
    saveToken("ACCESS");
    expect(loadToken()).toBe("ACCESS");
    expect(loadRefreshToken()).toBeNull();
  });

  it("clears all stored data", () => {
    saveToken("A", "R");
    saveMember({ id: 1, mid: "u", mname: "n" } as MemberInfo);
    clearToken();
    expect(loadToken()).toBeNull();
    expect(loadRefreshToken()).toBeNull();
    expect(loadMember()).toBeNull();
  });

  it("round-trips member info", () => {
    const m: MemberInfo = {
      id: 7,
      mid: "tester",
      mname: "테스터",
      email: "t@e.com",
      role: "USER",
    };
    saveMember(m);
    expect(loadMember()).toEqual(m);
  });

  it("returns null for invalid member JSON", () => {
    localStorage.setItem("memberInfo", "{not-json");
    expect(loadMember()).toBeNull();
  });
});

describe("getTokenRemainingMs", () => {
  it("returns a positive number for a future exp", () => {
    const future = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJwt({ exp: future });
    const remaining = getTokenRemainingMs(token);
    expect(remaining).not.toBeNull();
    expect(remaining!).toBeGreaterThan(3_500_000);
    expect(remaining!).toBeLessThanOrEqual(3_600_000);
  });

  it("returns a negative number for a past exp", () => {
    const past = Math.floor(Date.now() / 1000) - 3600;
    const token = makeJwt({ exp: past });
    const remaining = getTokenRemainingMs(token);
    expect(remaining).not.toBeNull();
    expect(remaining!).toBeLessThan(0);
  });

  it("returns null when exp field is missing", () => {
    const token = makeJwt({ mid: "user" });
    expect(getTokenRemainingMs(token)).toBeNull();
  });

  it("returns null for malformed token", () => {
    // suppress expected parse warnings
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(getTokenRemainingMs("not.a.jwt")).toBeNull();
    expect(getTokenRemainingMs("")).toBeNull();
  });
});
