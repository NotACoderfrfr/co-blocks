import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),

  documents: defineTable({
    title: v.string(),
    content: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_owner", ["ownerId"]),

  permissions: defineTable({
    documentId: v.id("documents"),
    userId: v.id("users"),
    role: v.union(v.literal("read"), v.literal("edit"), v.literal("admin")),
    sharedAt: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_user", ["userId"])
    .index("by_document_and_user", ["documentId", "userId"]),

  shareLinks: defineTable({
    documentId: v.id("documents"),
    linkToken: v.string(),
    createdBy: v.id("users"),
    expiresAt: v.optional(v.number()),
  }).index("by_token", ["linkToken"]),

  presence: defineTable({
    documentId: v.id("documents"),
    userId: v.id("users"),
    cursorPosition: v.optional(v.number()),
    lastSeen: v.number(),
  })
    .index("by_document", ["documentId"])
    .index("by_user", ["userId"]),
});
