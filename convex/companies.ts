import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

function generateCompanyId(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}


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
 const companyIdNumber = generateCompanyId();

    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      description: args.description,
      logo: args.logo,
      address: args.address,
      phone: args.phone,
      email: args.email,
      createdAt: Date.now(),
      createdBy: args.createdBy,
      companyIdNumber: ""
    });

  return { companyId, companyIdNumber };
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

export const createBulk = mutation({
  args: {
    companies: v.array(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
      })
    ),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const results: any[] | PromiseLike<any[]> = [];
    for (const company of args.companies) {
      const companyIdNumber = generateCompanyId();
      const id = await ctx.db.insert("companies", {
        name: company.name,
        companyIdNumber,
        description: company.description,
        createdAt: Date.now(),
        createdBy: args.createdBy,
      });
      results.push({ id, companyIdNumber });
    }
    return results;
  },
});

export const removeBulk = mutation({
  args: { ids: v.array(v.id("companies")) },
  handler: async (ctx, args) => {
    for (const id of args.ids) {
      await ctx.db.delete(id);
    }
  },
});

export const globalSearch = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const term = args.searchTerm.toLowerCase();
    
    const companies = await ctx.db.query("companies").collect();
    const members = await ctx.db.query("members").collect();

    const matchedCompanies = companies.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.companyIdNumber.includes(term)
    );

    const matchedMembers = members.filter(
      (m) =>
        m.firstName.toLowerCase().includes(term) ||
        m.lastName.toLowerCase().includes(term) ||
        m.email.toLowerCase().includes(term) ||
        m.memberIdNumber.includes(term)
    );

    return {
      companies: matchedCompanies,
      members: matchedMembers,
    };
  },
});

