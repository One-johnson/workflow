import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import bcrypt from "bcryptjs";
import { Id } from "./_generated/dataModel";

// Generate random 8-digit password
function generatePassword(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export const create = mutation({
  args: {
    companyId: v.id("companies"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    position: v.optional(v.string()),
    department: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Generate 8-digit password
    const plainPassword = generatePassword();
    const passwordHash =  bcrypt.hashSync(plainPassword, 10);

    // Create user account
    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash,
      role: "member",
      firstName: args.firstName,
      lastName: args.lastName,
      companyId: args.companyId,
      createdAt: 0
    });

    // Create member profile
    const memberId = await ctx.db.insert("members", {
      userId,
      companyId: args.companyId,
      memberIdNumber: plainPassword,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      address: args.address,
      dateOfBirth: args.dateOfBirth,
      position: args.position,
      department: args.department,
      dateJoined: Date.now(),
      status: "active",
      createdBy: args.createdBy,
    });

    // Send notification to admin
    await ctx.db.insert("notifications", {
      userId: args.createdBy,
      title: "New Member Added",
      message: `${args.firstName} ${args.lastName} has been added to the system`,
      type: "success",
      read: false,
      createdAt: Date.now(),
      relatedId: memberId,
    });

    // Return member ID and generated password
    return { memberId, generatedPassword: plainPassword };
  },
});

export const list = query({
  args: { companyId: v.optional(v.id("companies")) },
  handler: async (ctx, args) => {
    if (args.companyId) {
      return await ctx.db
        .query("members")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId! as Id<"companies">))
        .collect();
    }
    return await ctx.db.query("members").collect();
  },
});

export const get = query({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("members"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    position: v.optional(v.string()),
    department: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("dormant")),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.id);
    if (member) {
      const documents = await ctx.db
        .query("documents")
        .withIndex("by_member", (q) => q.eq("memberId", args.id))
        .collect();

      for (const doc of documents) {
        await ctx.db.delete(doc._id);
      }
    }

    await ctx.db.delete(args.id);
  },
});

export const search = query({
  args: {
    companyId: v.optional(v.id("companies")),
    searchTerm: v.string(),
    status: v.optional(v.union(v.literal("active"), v.literal("dormant"), v.literal("all"))),
  },
  handler: async (ctx, args) => {
    let members = await ctx.db.query("members").collect();

    if (args.companyId) {
      members = members.filter((m) => m.companyId === args.companyId);
    }

    if (args.status && args.status !== "all") {
      members = members.filter((m) => m.status === args.status);
    }

    if (args.searchTerm) {
      const term = args.searchTerm.toLowerCase();
      members = members.filter(
        (m) =>
          m.firstName.toLowerCase().includes(term) ||
          m.lastName.toLowerCase().includes(term) ||
          m.email.toLowerCase().includes(term) ||
          (m.position && m.position.toLowerCase().includes(term))
      );
    }

    return members;
  },
});

export const toggleStatus = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.id);
    if (!member) throw new Error("Member not found");

    const newStatus = member.status === "active" ? "dormant" : "active";
    await ctx.db.patch(args.id, { status: newStatus });
    return newStatus;
  },
});

export const getByStatus = query({
  args: { status: v.union(v.literal("active"), v.literal("dormant")) },
  handler: async (ctx, args) => {
    const members = await ctx.db.query("members").collect();
    return members.filter((m) => m.status === args.status);
  },
});
