import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const shareDocument = mutation({
  args: {
    documentId: v.id("documents"),
    userEmail: v.string(),
    role: v.union(v.literal("read"), v.literal("edit"), v.literal("admin")),
    sharedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is owner or admin
    const document = await ctx.db.get(args.documentId);
    if (document.ownerId !== args.sharedBy) {
      const userPerms = await ctx.db
        .query("permissions")
        .withIndex("by_document_and_user", (q) =>
          q.eq("documentId", args.documentId).eq("userId", args.sharedBy)
        )
        .first();

      if (!userPerms || userPerms.role !== "admin") {
        throw new Error("Only owner or admin can share documents");
      }
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.userEmail))
      .first();

    if (!user) {
      throw new Error("User not found with this email");
    }

    const existing = await ctx.db
      .query("permissions")
      .withIndex("by_document_and_user", (q) =>
        q.eq("documentId", args.documentId).eq("userId", user._id)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        role: args.role,
      });
      return existing._id;
    }

    const permissionId = await ctx.db.insert("permissions", {
      documentId: args.documentId,
      userId: user._id,
      role: args.role,
      sharedAt: Date.now(),
    });

    return permissionId;
  },
});

export const getDocumentPermissions = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, args) => {
    const permissions = await ctx.db
      .query("permissions")
      .withIndex("by_document", (q) => q.eq("documentId", args.documentId))
      .collect();

    const permissionsWithUsers = await Promise.all(
      permissions.map(async (perm) => {
        const user = await ctx.db.get(perm.userId);
        return {
          ...perm,
          user: {
            email: user?.email,
            name: user?.name,
          },
        };
      })
    );

    return permissionsWithUsers;
  },
});

export const removePermission = mutation({
  args: { 
    permissionId: v.id("permissions"),
    userId: v.id("users"),
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    // Check if user is owner or admin
    const document = await ctx.db.get(args.documentId);
    if (document.ownerId !== args.userId) {
      const userPerms = await ctx.db
        .query("permissions")
        .withIndex("by_document_and_user", (q) =>
          q.eq("documentId", args.documentId).eq("userId", args.userId)
        )
        .first();

      if (!userPerms || userPerms.role !== "admin") {
        throw new Error("Only owner or admin can remove collaborators");
      }
    }

    await ctx.db.delete(args.permissionId);
  },
});

export const createShareLink = mutation({
  args: {
    documentId: v.id("documents"),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const linkToken = Math.random().toString(36).substring(2, 15);
    
    const linkId = await ctx.db.insert("shareLinks", {
      documentId: args.documentId,
      linkToken,
      createdBy: args.createdBy,
    });

    return { linkToken, linkId };
  },
});

export const getSharedDocuments = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const permissions = await ctx.db
      .query("permissions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const documents = await Promise.all(
      permissions.map(async (perm) => {
        const doc = await ctx.db.get(perm.documentId);
        return {
          ...doc,
          role: perm.role,
        };
      })
    );

    return documents;
  },
});
