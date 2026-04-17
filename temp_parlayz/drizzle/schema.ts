import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Markets table — stores betting markets
export const markets = mysqlTable("markets", {
  id: int("id").autoincrement().primaryKey(),
  sport: varchar("sport", { length: 32 }).notNull(), // NFL, NBA, MLB, Soccer
  homeTeam: varchar("homeTeam", { length: 128 }).notNull(),
  awayTeam: varchar("awayTeam", { length: 128 }).notNull(),
  commenceTime: timestamp("commenceTime").notNull(),
  homeOddsML: int("homeOddsML"), // American odds moneyline
  awayOddsML: int("awayOddsML"),
  homeOddsSpread: int("homeOddsSpread"),
  awayOddsSpread: int("awayOddsSpread"),
  spreadLine: decimal("spreadLine", { precision: 4, scale: 1 }),
  overOdds: int("overOdds"),
  underOdds: int("underOdds"),
  totalLine: decimal("totalLine", { precision: 5, scale: 1 }),
  homePublicPct: int("homePublicPct").default(50), // 0-100
  status: mysqlEnum("status", ["open", "live", "closed", "resolved"]).default("open").notNull(),
  externalId: varchar("externalId", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Market = typeof markets.$inferSelect;
export type InsertMarket = typeof markets.$inferInsert;

// Bets table — user placed bets
export const bets = mysqlTable("bets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  marketId: int("marketId").notNull(),
  betType: mysqlEnum("betType", ["moneyline", "spread", "over", "under"]).notNull(),
  selection: varchar("selection", { length: 128 }).notNull(), // "home" | "away" | "over" | "under"
  odds: int("odds").notNull(), // American odds at time of bet
  stake: decimal("stake", { precision: 10, scale: 2 }).notNull(),
  potentialPayout: decimal("potentialPayout", { precision: 10, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["Pending", "Won", "Lost"]).default("Pending").notNull(),
  isParlay: int("isParlay").default(0), // 0 = single, 1 = parlay leg
  parlayId: varchar("parlayId", { length: 64 }),
  txHash: varchar("txHash", { length: 128 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bet = typeof bets.$inferSelect;
export type InsertBet = typeof bets.$inferInsert;

// Wallet connections
export const walletConnections = mysqlTable("wallet_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  address: varchar("address", { length: 64 }).notNull(),
  walletType: varchar("walletType", { length: 32 }).notNull(), // metamask | walletconnect
  balance: decimal("balance", { precision: 18, scale: 6 }),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
});

export type WalletConnection = typeof walletConnections.$inferSelect;
