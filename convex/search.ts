import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Advanced search across all modules with comprehensive filters
export const advancedSearch = query({
  args: {
    searchTerm: v.optional(v.string()),
    modules: v.optional(v.array(v.union(
      v.literal("companies"),
      v.literal("members"),
      v.literal("documents")
    ))),
    filters: v.optional(v.object({
      // Company filters
      companyRegion: v.optional(v.string()),
      companyBranch: v.optional(v.string()),
      
      // Member filters
      memberStatus: v.optional(v.union(v.literal("active"), v.literal("dormant"))),
      memberGender: v.optional(v.union(v.literal("male"), v.literal("female"))),
      memberRegion: v.optional(v.string()),
      memberDepartment: v.optional(v.string()),
      memberPosition: v.optional(v.string()),
      companyId: v.optional(v.id("companies")),
      
      // Document filters
      documentFileType: v.optional(v.string()),
      
      // Date range filters
      dateFrom: v.optional(v.number()),
      dateTo: v.optional(v.number()),
    })),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const searchLower = args.searchTerm?.toLowerCase() || "";
    const modules = args.modules || ["companies", "members", "documents"];
    const limit = args.limit || 50;
    const filters = args.filters || {};

    const results: {
      companies: any[];
      members: any[];
      documents: any[];
      totalCount: number;
    } = {
      companies: [],
      members: [],
      documents: [],
      totalCount: 0,
    };

    // Search Companies
    if (modules.includes("companies")) {
      let companies = await ctx.db.query("companies").collect();

      // Apply text search
      if (searchLower) {
        companies = companies.filter((c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.description?.toLowerCase().includes(searchLower) ||
          c.region?.toLowerCase().includes(searchLower) ||
          c.branch?.toLowerCase().includes(searchLower)
        );
      }

      // Apply filters
      if (filters.companyRegion) {
        companies = companies.filter((c) => c.region === filters.companyRegion);
      }

      if (filters.companyBranch) {
        companies = companies.filter((c) => c.branch === filters.companyBranch);
      }

      if (filters.dateFrom) {
        companies = companies.filter((c) => c.createdAt >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        companies = companies.filter((c) => c.createdAt <= filters.dateTo!);
      }

      results.companies = companies.slice(0, limit);
      results.totalCount += companies.length;
    }

    // Search Members
    if (modules.includes("members")) {
      let members = await ctx.db.query("members").collect();

      // Apply text search
      if (searchLower) {
        members = members.filter((m) =>
          m.firstName.toLowerCase().includes(searchLower) ||
          m.lastName.toLowerCase().includes(searchLower) ||
          m.email.toLowerCase().includes(searchLower) ||
          m.staffId.toLowerCase().includes(searchLower) ||
          m.position?.toLowerCase().includes(searchLower) ||
          m.department?.toLowerCase().includes(searchLower) ||
          m.phone?.toLowerCase().includes(searchLower) ||
          m.address?.toLowerCase().includes(searchLower) ||
          m.ghCard?.toLowerCase().includes(searchLower)
        );
      }

      // Apply filters
      if (filters.memberStatus) {
        members = members.filter((m) => m.status === filters.memberStatus);
      }

      if (filters.memberGender) {
        members = members.filter((m) => m.gender === filters.memberGender);
      }

      if (filters.memberRegion) {
        members = members.filter((m) => m.region === filters.memberRegion);
      }

      if (filters.memberDepartment) {
        members = members.filter((m) => m.department === filters.memberDepartment);
      }

      if (filters.memberPosition) {
        members = members.filter((m) => m.position === filters.memberPosition);
      }

      if (filters.companyId) {
        members = members.filter((m) => m.companyId === filters.companyId);
      }

      if (filters.dateFrom) {
        members = members.filter((m) => m.dateJoined >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        members = members.filter((m) => m.dateJoined <= filters.dateTo!);
      }

      // Add company names
      const membersWithCompany = await Promise.all(
        members.slice(0, limit).map(async (member) => {
          const company = await ctx.db.get(member.companyId);
          return {
            ...member,
            companyName: company?.name || "Unknown",
          };
        })
      );

      results.members = membersWithCompany;
      results.totalCount += members.length;
    }

    // Search Documents
    if (modules.includes("documents")) {
      let documents = await ctx.db.query("documents").collect();

      // Apply text search
      if (searchLower) {
        documents = documents.filter((d) =>
          d.title.toLowerCase().includes(searchLower) ||
          d.description?.toLowerCase().includes(searchLower)
        );
      }

      // Apply filters
      if (filters.documentFileType) {
        documents = documents.filter((d) => d.fileType.includes(filters.documentFileType!));
      }

      if (filters.companyId) {
        documents = documents.filter((d) => d.companyId === filters.companyId);
      }

      if (filters.dateFrom) {
        documents = documents.filter((d) => d.uploadedAt >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        documents = documents.filter((d) => d.uploadedAt <= filters.dateTo!);
      }

      // Add member and company names
      const documentsWithDetails = await Promise.all(
        documents.slice(0, limit).map(async (doc) => {
          const member = await ctx.db.get(doc.memberId);
          const company = await ctx.db.get(doc.companyId);
          const fileUrl = doc.storageId ? await ctx.storage.getUrl(doc.storageId) : null;

          return {
            ...doc,
            memberName: member ? `${member.firstName} ${member.lastName}` : "Unknown",
            companyName: company?.name || "Unknown",
            fileUrl,
          };
        })
      );

      results.documents = documentsWithDetails;
      results.totalCount += documents.length;
    }

    return results;
  },
});

// Get all unique values for filter options
export const getFilterOptions = query({
  handler: async (ctx) => {
    const companies = await ctx.db.query("companies").collect();
    const members = await ctx.db.query("members").collect();

    const regions = [...new Set([
      ...companies.map((c) => c.region).filter(Boolean),
      ...members.map((m) => m.region).filter(Boolean),
    ])] as string[];

    const branches = [...new Set(companies.map((c) => c.branch).filter(Boolean))] as string[];
    const departments = [...new Set(members.map((m) => m.department).filter(Boolean))] as string[];
    const positions = [...new Set(members.map((m) => m.position).filter(Boolean))] as string[];

    return {
      regions: regions.sort(),
      branches: branches.sort(),
      departments: departments.sort(),
      positions: positions.sort(),
      companies: companies.map((c) => ({ _id: c._id, name: c.name })).sort((a, b) => a.name.localeCompare(b.name)),
    };
  },
});

// Save a search query
export const saveSearch = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    searchTerm: v.optional(v.string()),
    modules: v.array(v.union(
      v.literal("companies"),
      v.literal("members"),
      v.literal("documents")
    )),
    filters: v.object({
      companyRegion: v.optional(v.string()),
      companyBranch: v.optional(v.string()),
      memberStatus: v.optional(v.union(v.literal("active"), v.literal("dormant"))),
      memberGender: v.optional(v.union(v.literal("male"), v.literal("female"))),
      memberRegion: v.optional(v.string()),
      memberDepartment: v.optional(v.string()),
      memberPosition: v.optional(v.string()),
      companyId: v.optional(v.id("companies")),
      documentFileType: v.optional(v.string()),
      dateFrom: v.optional(v.number()),
      dateTo: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const searchId = await ctx.db.insert("savedSearches", {
      userId: args.userId,
      name: args.name,
      searchTerm: args.searchTerm,
      modules: args.modules,
      filters: args.filters,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 0,
    });

    return { searchId };
  },
});

// Get saved searches for a user
export const getSavedSearches = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const searches = await ctx.db
      .query("savedSearches")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return searches;
  },
});

// Update last used time for a saved search
export const updateSearchUsage = mutation({
  args: { searchId: v.id("savedSearches") },
  handler: async (ctx, args) => {
    const search = await ctx.db.get(args.searchId);
    if (!search) throw new Error("Search not found");

    await ctx.db.patch(args.searchId, {
      lastUsed: Date.now(),
      useCount: search.useCount + 1,
    });
  },
});

// Delete a saved search
export const deleteSavedSearch = mutation({
  args: { searchId: v.id("savedSearches") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.searchId);
  },
});

// Update a saved search
export const updateSavedSearch = mutation({
  args: {
    searchId: v.id("savedSearches"),
    name: v.optional(v.string()),
    searchTerm: v.optional(v.string()),
    modules: v.optional(v.array(v.union(
      v.literal("companies"),
      v.literal("members"),
      v.literal("documents")
    ))),
    filters: v.optional(v.object({
      companyRegion: v.optional(v.string()),
      companyBranch: v.optional(v.string()),
      memberStatus: v.optional(v.union(v.literal("active"), v.literal("dormant"))),
      memberGender: v.optional(v.union(v.literal("male"), v.literal("female"))),
      memberRegion: v.optional(v.string()),
      memberDepartment: v.optional(v.string()),
      memberPosition: v.optional(v.string()),
      companyId: v.optional(v.id("companies")),
      documentFileType: v.optional(v.string()),
      dateFrom: v.optional(v.number()),
      dateTo: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    const { searchId, ...updates } = args;
    const search = await ctx.db.get(searchId);
    if (!search) throw new Error("Search not found");

    await ctx.db.patch(searchId, updates);
  },
});
