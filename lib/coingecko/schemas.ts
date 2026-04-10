import { z } from "zod";

export const SimplePriceSchema = z.record(
  z.string(),
  z.record(z.string(), z.number()),
);
export type SimplePrice = z.infer<typeof SimplePriceSchema>;

export const MarketDataSchema = z.object({
  id: z.string(),
  current_price: z.number(),
  price_change_percentage_24h: z.number().nullable().optional(),
});

export const MarketChartSchema = z.object({
  prices: z.array(z.tuple([z.number(), z.number()])),
});
export type MarketChart = z.infer<typeof MarketChartSchema>;
