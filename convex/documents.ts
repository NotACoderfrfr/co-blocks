import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createDocument = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const docId = await ctx.db.insert("documents", {
      title: args.title,
      content: args.content,
      ownerId: args.userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return docId;
  },
});

export const getUserDocuments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const docs = await ctx.db
      .query("documents")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();
    
    return docs.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.documentId);
  },
});

export const updateDocument = mutation({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = {
      content: args.content,
      updatedAt: Date.now(),
    };
    
    if (args.title) {
      updates.title = args.title;
    }
    
    await ctx.db.patch(args.documentId, updates);
  },
});
