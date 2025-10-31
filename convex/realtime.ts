import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const saveContent = mutation({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Update document content
    await ctx.db.patch(args.documentId, {
      content: args.content,
      updatedAt: Date.now(),
    });

    // Update user presence
    const presence = await ctx.db
      .query("presence")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .first();

    if (!presence || presence.userId !== args.userId) {
      await ctx.db.insert("presence", {
        documentId: args.documentId,
        userId: args.userId,
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.patch(presence._id, { lastSeen: Date.now() });
    }
  },
});
