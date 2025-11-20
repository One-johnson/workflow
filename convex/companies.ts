import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    region: v.optional(v.string()),
    branch: v.optional(v.string()),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const companyId = await ctx.db.insert("companies", {
      name: args.name,
      description: args.description,
      region: args.region,
      branch: args.branch,
      createdAt: Date.now(),
      createdBy: args.createdBy,
    });

    return { companyId };
  },
});

export const createBulk = mutation({
  args: {
    companies: v.array(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
        region: v.optional(v.string()),
        branch: v.optional(v.string()),
      })
    ),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const results = await Promise.all(
      args.companies.map(async (company) => {
        const companyId = await ctx.db.insert("companies", {
          name: company.name,
          description: company.description,
          region: company.region,
          branch: company.branch,
          createdAt: Date.now(),
          createdBy: args.createdBy,
        });
        return { companyId, name: company.name };
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
    region: v.optional(v.string()),
    branch: v.optional(v.string()),
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
    const maleMembers = members.filter((m) => m.gender === "male").length;
    const femaleMembers = members.filter((m) => m.gender === "female").length;

    return {
      totalMembers,
      activeMembers,
      dormantMembers,
      maleMembers,
      femaleMembers,
      activePercentage: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
      dormantPercentage: totalMembers > 0 ? Math.round((dormantMembers / totalMembers) * 100) : 0,
      malePercentage: totalMembers > 0 ? Math.round((maleMembers / totalMembers) * 100) : 0,
      femalePercentage: totalMembers > 0 ? Math.round((femaleMembers / totalMembers) * 100) : 0,
    };
  },
});

// Get statistics by region
export const getStatisticsByRegion = query({
  args: { region: v.string() },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_region", (q) => q.eq("region", args.region))
      .collect();

    const totalMembers = members.length;
    const activeMembers = members.filter((m) => m.status === "active").length;
    const dormantMembers = members.filter((m) => m.status === "dormant").length;
    const maleMembers = members.filter((m) => m.gender === "male").length;
    const femaleMembers = members.filter((m) => m.gender === "female").length;

    return {
      totalMembers,
      activeMembers,
      dormantMembers,
      maleMembers,
      femaleMembers,
      activePercentage: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
      dormantPercentage: totalMembers > 0 ? Math.round((dormantMembers / totalMembers) * 100) : 0,
      malePercentage: totalMembers > 0 ? Math.round((maleMembers / totalMembers) * 100) : 0,
      femalePercentage: totalMembers > 0 ? Math.round((femaleMembers / totalMembers) * 100) : 0,
    };
  },
});

// Get all unique regions
export const getRegions = query({
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    const regions = [...new Set(companies.map((c) => c.region).filter(Boolean))] as string[];
    return regions.sort();
  },
});

// Get all unique branches
export const getBranches = query({
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    const branches = [...new Set(companies.map((c) => c.branch).filter(Boolean))] as string[];
    return branches.sort();
  },
});

// Global search for companies and members
export const globalSearch = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const searchLower = args.searchTerm.toLowerCase();

    // Search companies by name
    const allCompanies = await ctx.db.query("companies").collect();
    const companies = allCompanies.filter(
      (c) => c.name.toLowerCase().includes(searchLower)
    );

    // Search members by name, email, or staff ID
    const allMembers = await ctx.db.query("members").collect();
    const members = allMembers.filter(
      (m) =>
        m.firstName.toLowerCase().includes(searchLower) ||
        m.lastName.toLowerCase().includes(searchLower) ||
        m.email.toLowerCase().includes(searchLower) ||
        m.staffId.toLowerCase().includes(searchLower)
    );

    return {
      companies: companies.slice(0, 5),
      members: members.slice(0, 5),
    };
  },
});
