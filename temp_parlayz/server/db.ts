import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, markets, bets, walletConnections, InsertBet, InsertMarket } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Markets
export async function getMarkets(sport?: string) {
  const db = await getDb();
  if (!db) return [];
  if (sport && sport !== "ALL") {
    return db.select().from(markets).where(eq(markets.sport, sport)).orderBy(desc(markets.commenceTime));
  }
  return db.select().from(markets).orderBy(desc(markets.commenceTime));
}

export async function getMarketById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(markets).where(eq(markets.id, id)).limit(1);
  return result[0];
}

export async function upsertMarket(data: InsertMarket) {
  const db = await getDb();
  if (!db) return;
  if (data.externalId) {
    const existing = await db.select().from(markets).where(eq(markets.externalId, data.externalId)).limit(1);
    if (existing.length > 0) {
      await db.update(markets).set(data).where(eq(markets.externalId, data.externalId));
      return;
    }
  }
  await db.insert(markets).values(data);
}

// Bets
export async function getUserBets(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bets).where(eq(bets.userId, userId)).orderBy(desc(bets.createdAt));
}

export async function placeBet(data: InsertBet) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bets).values(data);
  return result;
}

// Wallet
export async function saveWalletConnection(userId: number, address: string, walletType: string, balance: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(walletConnections).values({ userId, address, walletType, balance });
}
