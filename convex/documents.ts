import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Generate upload URL for file storage
export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

// Create document with storage ID
export const create = mutation({
  args: {
    memberId: v.id("members"),
    companyId: v.id("companies"),
    title: v.string(),
    description: v.optional(v.string()),
    storageId: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const documentId = await ctx.db.insert("documents", {
      memberId: args.memberId,
      companyId: args.companyId,
      title: args.title,
      description: args.description,
      storageId: args.storageId,
      fileType: args.fileType,
      fileSize: args.fileSize,
      uploadedBy: args.uploadedBy,
      uploadedAt: Date.now(),
    });

    // Create notification for member
    const member = await ctx.db.get(args.memberId);
    if (member) {
      await ctx.db.insert("notifications", {
        userId: member.userId,
        title: "New Document Uploaded",
        message: `A new document "${args.title}" has been uploaded for you.`,
        type: "info",
        read: false,
        createdAt: Date.now(),
        relatedId: documentId,
      });
    }

    return documentId;
  },
});

// List all documents with file URLs
export const listAllWithDetails = query({
  handler: async (ctx) => {
    const documents = await ctx.db.query("documents").collect();

    // Get file URLs and member/company details
    const documentsWithDetails = await Promise.all(
      documents.map(async (doc) => {
        const fileUrl = await ctx.storage.getUrl(doc.storageId);
        const member = await ctx.db.get(doc.memberId);
        const company = await ctx.db.get(doc.companyId);
        const uploader = await ctx.db.get(doc.uploadedBy);

        return {
          ...doc,
          fileUrl,
          memberName: member
            ? `${member.firstName} ${member.lastName}`
            : "Unknown",
          companyName: company?.name || "Unknown",
          uploaderName: uploader
            ? `${uploader.firstName} ${uploader.lastName}`
            : "Unknown",
        };
      })
    );

    return documentsWithDetails;
  },
});

// Get document URL
export const getUrl = query({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// List documents by member with URLs
export const list = query({
  args: { memberId: v.id("members") },
  handler: async (ctx, args) => {
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_member", (q) => q.eq("memberId", args.memberId))
      .collect();

    const documentsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        const fileUrl = await ctx.storage.getUrl(doc.storageId);
        const uploader = await ctx.db.get(doc.uploadedBy);
        return {
          ...doc,
          fileUrl,
          uploaderName: uploader
            ? `${uploader.firstName} ${uploader.lastName}`
            : "Unknown",
        };
      })
    );

    return documentsWithUrls;
  },
});

// Remove document
export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (document) {
      // Delete file from storage
      await ctx.storage.delete(document.storageId);
      // Delete document record
      await ctx.db.delete(args.id);
    }
  },
});

// Get document by ID with URL
export const getById = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const document = await ctx.db.get(args.id);
    if (!document) return null;

    const fileUrl = await ctx.storage.getUrl(document.storageId);
    return { ...document, fileUrl };
  },
});
