"use node";
import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import crypto from "crypto";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const hashToVerify = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === hashToVerify;
}

export const register = action({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.runQuery(internal.authHelpers.getUserByEmail, {
      email: args.email,
    });

    if (existing) {
      throw new Error("Email already registered");
    }

    // Hash password
    const passwordHash = hashPassword(args.password);

    // Create user
    const userId = await ctx.runMutation(internal.authHelpers.createUser, {
      email: args.email,
      passwordHash,
      name: args.name,
    });

    return { userId, email: args.email };
  },
});

export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Get user
    const user = await ctx.runQuery(internal.authHelpers.getUserByEmail, {
      email: args.email,
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isValid = verifyPassword(args.password, user.passwordHash);

    if (!isValid) {
      throw new Error("Invalid email or password");
    }

    return {
      userId: user._id,
      email: user.email,
      name: user.name,
    };
  },
});
