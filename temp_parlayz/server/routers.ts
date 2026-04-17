import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { getMarkets, getMarketById, getUserBets, placeBet, saveWalletConnection } from "./db";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  markets: router({
    list: publicProcedure
      .input(z.object({ sport: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return getMarkets(input?.sport);
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getMarketById(input.id);
      }),
  }),

  bets: router({
    history: protectedProcedure.query(async ({ ctx }) => {
      return getUserBets(ctx.user.id);
    }),

    place: protectedProcedure
      .input(z.object({
        marketId: z.number(),
        betType: z.enum(["moneyline", "spread", "over", "under"]),
        selection: z.string(),
        odds: z.number(),
        stake: z.number().positive(),
        potentialPayout: z.number(),
        isParlay: z.number().optional(),
        parlayId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await placeBet({
          userId: ctx.user.id,
          marketId: input.marketId,
          betType: input.betType,
          selection: input.selection,
          odds: input.odds,
          stake: input.stake.toFixed(2),
          potentialPayout: input.potentialPayout.toFixed(2),
          status: "Pending",
          isParlay: input.isParlay ?? 0,
          parlayId: input.parlayId,
        });
        return { success: true };
      }),
  }),

  parlay: router({
    suggest: publicProcedure
      .input(z.object({
        markets: z.array(z.object({
          id: z.number(),
          sport: z.string(),
          homeTeam: z.string(),
          awayTeam: z.string(),
          betType: z.string(),
          selection: z.string(),
          odds: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        const marketsSummary = input.markets.map(m =>
          `${m.sport}: ${m.homeTeam} vs ${m.awayTeam} — ${m.betType} on ${m.selection} at ${m.odds > 0 ? '+' : ''}${m.odds}`
        ).join('\n');

        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are an expert sports betting analyst for PARLAYZ, a professional prediction market platform. 
Analyze the provided betting markets and suggest optimal parlay combinations. 
Be concise, data-driven, and professional. Always provide a confidence score (0-100) and brief reasoning.
Respond in JSON format only.`,
            },
            {
              role: "user",
              content: `Analyze these selected markets and suggest the best parlay combination(s):

${marketsSummary}

Return JSON with this exact structure:
{
  "suggestions": [
    {
      "legs": [array of market descriptions],
      "confidence": number (0-100),
      "combinedOdds": number (American odds),
      "reasoning": "brief explanation",
      "riskLevel": "Low" | "Medium" | "High"
    }
  ],
  "insight": "overall market insight in 1-2 sentences"
}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "parlay_suggestions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        legs: { type: "array", items: { type: "string" } },
                        confidence: { type: "number" },
                        combinedOdds: { type: "number" },
                        reasoning: { type: "string" },
                        riskLevel: { type: "string" },
                      },
                      required: ["legs", "confidence", "combinedOdds", "reasoning", "riskLevel"],
                      additionalProperties: false,
                    },
                  },
                  insight: { type: "string" },
                },
                required: ["suggestions", "insight"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices?.[0]?.message?.content;
        if (!content) throw new Error("No response from AI");
        const text = typeof content === 'string' ? content : JSON.stringify(content);
        return JSON.parse(text);
      }),
  }),

  wallet: router({
    save: protectedProcedure
      .input(z.object({
        address: z.string(),
        walletType: z.string(),
        balance: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await saveWalletConnection(ctx.user.id, input.address, input.walletType, input.balance);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
