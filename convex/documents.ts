import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    memberId: v.id("members"),
    companyId: v.id("companies"),
    title: v.string(),
    description: v.optional(v.string()),
    fileUrl: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const documentId = await ctx.db.insert("documents", {
      ...args,
      uploadedAt: Date.now(),
    });

    const member = await ctx.db.get(args.memberId);
    if (member) {
      await ctx.db.insert("notifications", {
        userId: member.userId,
        title: "New Document Uploaded",
        message: `A new document "${args.title}" has been uploaded`,
        type: "info",
        read: false,
        createdAt: Date.now(),
        relatedId: documentId,
      });
    }

    return documentId;
  },
});

export const list = query({
  args: {
    memberId: v.optional(v.id("members")),
    companyId: v.optional(v.id("companies")),
  },
  handler: async (ctx, args) => {
    if (args.memberId) {
      return await ctx.db
        .query("documents")
        .withIndex("by_member", (q) => q.eq("memberId", args.memberId! as Id<"members">))
        .collect();
    }

    if (args.companyId) {
      return await ctx.db
        .query("documents")
        .withIndex("by_company", (q) => q.eq("companyId", args.companyId! as Id<"companies">))
        .collect();
    }

    return await ctx.db.query("documents").collect();
  },
});

export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const getByMemberWithDetails = query({
  args: { memberId: v.id("members") },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
      .collect();

    const documentsWithUploader = await Promise.all(
      documents.map(async (doc) => {
        const uploader = await ctx.db.get(doc.uploadedBy);
        return {
          ...doc,
          uploaderName: uploader
            ? `${uploader.firstName} ${uploader.lastName}`
            : "Unknown",
        };
      })
    );

    return documentsWithUploader;
  },
});

export const listAll = query({
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").collect();
    return documents;
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
