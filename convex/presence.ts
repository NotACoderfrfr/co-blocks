import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const updatePresence = mutation({
  args: {
    documentId: v.id("documents"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Delete old presence for this user on this document
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const pres of existing) {
      if (pres.userId === args.userId) {
        await ctx.db.patch(pres._id, { lastSeen: Date.now() });
        return pres._id;
      }
    }

    return await ctx.db.insert("presence", {
      documentId: args.documentId,
      userId: args.userId,
      lastSeen: Date.now(),
    });
  },
});

export const getActiveUsers = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const activePresence = presence.filter((p) => p.lastSeen > fiveMinutesAgo);

    // Remove duplicates
    const uniquePresence = Array.from(
      new Map(activePresence.map((p) => [p.userId, p])).values()
    );

    const users = await Promise.all(
      uniquePresence.map(async (pres) => {
        const user = await ctx.db.get(pres.userId);
        return {
          userId: pres.userId,
          email: user?.email,
          name: user?.name,
          avatarUrl: user?.avatarUrl,
        };
      })
    );

    return users;
  },
});

export const removePresence = mutation({
  args: { documentId: v.id("documents"), userId: v.id("users") },
  handler: async (ctx, args) => {
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    for (const pres of presence) {
      if (pres.userId === args.userId) {
        await ctx.db.delete(pres._id);
        return;
      }
    }
  },
});
