import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      description: args.description,
      logo: args.logo,
      address: args.address,
      phone: args.phone,
      email: args.email,
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });

    return companyId;
  },
});

export const list = query({
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    return companies;
  },
});

export const get = query({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("companies"),
    name: v.string(),
    description: v.optional(v.string()),
    logo: v.optional(v.string()),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
      logo: args.logo,
      address: args.address,
      phone: args.phone,
      email: args.email,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getStats = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId! as Id<"companies">))
      .collect();

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId! as Id<"companies">))
      .collect();

    return {
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.status === "active").length,
      totalDocuments: documents.length,
    };
  },
});

export const getMembersWithDetails = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId! as Id<"companies">))
      .collect();

    return members;
  },
});
