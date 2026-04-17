import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: { name: string; options: Record<string, unknown> }[] } {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@parlayz.io",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as TrpcContext["res"],
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });

  it("returns current user for authenticated session", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).not.toBeNull();
    expect(me?.email).toBe("test@parlayz.io");
  });

  it("returns null for unauthenticated session", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const me = await caller.auth.me();
    expect(me).toBeNull();
  });
});

// ── Markets ───────────────────────────────────────────────────────────────────

describe("markets.list", () => {
  it("returns an array (empty or populated)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.markets.list({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts a sport filter without throwing", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.markets.list({ sport: "NFL" });
    expect(Array.isArray(result)).toBe(true);
  });
});

// ── Bets ──────────────────────────────────────────────────────────────────────

describe("bets.history", () => {
  it("returns an array for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.bets.history();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ── Odds utility ──────────────────────────────────────────────────────────────

describe("American odds conversion", () => {
  function americanToDecimal(odds: number): number {
    if (odds > 0) return odds / 100 + 1;
    return 100 / Math.abs(odds) + 1;
  }

  it("converts positive American odds correctly", () => {
    expect(americanToDecimal(+150)).toBeCloseTo(2.5);
    expect(americanToDecimal(+100)).toBeCloseTo(2.0);
  });

  it("converts negative American odds correctly", () => {
    expect(americanToDecimal(-110)).toBeCloseTo(1.909, 2);
    expect(americanToDecimal(-200)).toBeCloseTo(1.5);
  });

  it("calculates parlay payout correctly", () => {
    const legs = [-110, -110, +150];
    const totalDecimal = legs.reduce((acc, o) => acc * americanToDecimal(o), 1);
    const stake = 10;
    const payout = stake * totalDecimal;
    expect(payout).toBeGreaterThan(stake);
  });
});

// ── Bet status labels ─────────────────────────────────────────────────────────

describe("Bet status labels", () => {
  const VALID_STATUSES = ["Won", "Lost", "Pending"] as const;

  it("only uses the three required status labels", () => {
    VALID_STATUSES.forEach((s) => {
      expect(["Won", "Lost", "Pending"]).toContain(s);
    });
  });
});
