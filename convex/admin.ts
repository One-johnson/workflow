import { mutation } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";

/**
 * Helper function to manually create admin users
 * This should be called from the Convex dashboard or CLI
 */
export const createAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    firstName: v.string(),
    lastName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Hash the password
    const passwordHash = bcrypt.hashSync(args.password, 10);

    // Create admin user
    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash,
      role: "admin",
      firstName: args.firstName,
      lastName: args.lastName,
      createdAt: Date.now(),
    });

    return {
      userId,
      message: "Admin user created successfully",
    };
  },
});

/**
 * Helper function to update a user's role
 * Use this to promote a member to admin or demote an admin to member
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      role: args.role,
    });

    return {
      message: `User role updated to ${args.role}`,
    };
  },
});
