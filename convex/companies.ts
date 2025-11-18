import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to generate Company ID: 2 letters (from name) + 6 random digits
function generateCompanyId(companyName: string): string {
  // Get first two letters from company name, or use XX if less than 2 chars
  const prefix = companyName
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 2)
    .toUpperCase()
    .padEnd(2, "X");
  const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
  return prefix + randomDigits;
}

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const companyIdNumber = generateCompanyId(args.name);

    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      companyIdNumber,
      description: args.description,
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });

    return { companyId, companyIdNumber };
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
    const results = await Promise.all(
      args.companies.map(async (company) => {
        const companyIdNumber = generateCompanyId(company.name);
        const companyId = await ctx.db.insert("companies", {
          name: company.name,
          companyIdNumber,
          description: company.description,
          createdAt: Date.now(),
          createdBy: args.createdBy,
        });
        return { companyId, companyIdNumber, name: company.name };
      })
    );
    return results;
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("companies").order("desc").collect();
  },
});

export const getById = query({
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
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("companies") },
  handler: async (ctx, args) => {
    // Check if there are any members in this company
    const members = await ctx.db
      .query("members")
      .withIndex("by_company", (q) => q.eq("companyId", args.id))
      .collect();

    if (members.length > 0) {
      throw new Error("Cannot delete company with existing members");
    }

    await ctx.db.delete(args.id);
  },
});

export const removeBulk = mutation({
  args: { ids: v.array(v.id("companies")) },
  handler: async (ctx, args) => {
    const errors: string[] = [];
    const deleted: string[] = [];

    for (const id of args.ids) {
      try {
        const members = await ctx.db
          .query("members")
          .withIndex("by_company", (q) => q.eq("companyId", id))
          .collect();

        if (members.length > 0) {
          const company = await ctx.db.get(id);
          errors.push(`${company?.name || id}: has existing members`);
        } else {
          await ctx.db.delete(id);
          deleted.push(id);
        }
      } catch (error) {
        errors.push(`${id}: ${error}`);
      }
    }

    return { deleted, errors };
  },
});

// Get members with details for a company
export const getMembersWithDetails = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    return members;
  },
});

// Get company statistics for hover card
export const getStatistics = query({
  args: { companyId: v.id("companies") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_company", (q) => q.eq("companyId", args.companyId))
      .collect();

    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === "active").length;
    const dormantMembers = members.filter((m) => m.status === "dormant").length;

    return {
      totalMembers,
      activeMembers,
      dormantMembers,
      activePercentage:
        totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
      dormantPercentage:
        totalMembers > 0
          ? Math.round((dormantMembers / totalMembers) * 100)
          : 0,
    };
  },
});

// Global search for companies and members
export const globalSearch = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const searchLower = args.searchTerm.toLowerCase();

    // Search companies by name or ID
    const allCompanies = await ctx.db.query("companies").collect();
    const companies = allCompanies.filter(
      (c) =>
        c.name.toLowerCase().includes(searchLower) ||
        c.companyIdNumber.includes(searchLower)
    );

    // Search members by name, email, or ID
    const allMembers = await ctx.db.query("members").collect();
    const members = allMembers.filter(
      (m) =>
        m.firstName.toLowerCase().includes(searchLower) ||
        m.lastName.toLowerCase().includes(searchLower) ||
        m.email.toLowerCase().includes(searchLower) ||
        m.staffId.includes(searchLower)
    );

    return {
      companies: companies.slice(0, 5),
      members: members.slice(0, 5),
    };
  },
});
