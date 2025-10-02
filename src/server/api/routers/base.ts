import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { bases } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const baseRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const [base] = await ctx.db.insert(bases).values({
        name: input.name,
        description: input.description,
        userId: ctx.session.user.id,
      }).returning();
      
      return base;
    }),

  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.db
        .select()
        .from(bases)
        .where(eq(bases.userId, ctx.session.user.id))
        .orderBy(bases.createdAt);
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const [base] = await ctx.db
        .select()
        .from(bases)
        .where(eq(bases.id, input.id) && eq(bases.userId, ctx.session.user.id));
      
      return base;
    }),
});
