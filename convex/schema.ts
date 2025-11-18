import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    companyId: v.optional(v.id("companies")),
    firstName: v.string(),
    lastName: v.string(),
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .index("by_company", ["companyId"]),

  companies: defineTable({
    name: v.string(),
    companyIdNumber: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_name", ["name"])
    .index("by_companyId", ["companyIdNumber"]),

  members: defineTable({
    userId: v.id("users"),
    companyId: v.id("companies"),
    staffId: v.string(), // Format: 2 letters + 6 digits (e.g., JD123456)
    idCardNumber: v.optional(v.string()),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    position: v.optional(v.string()),
    department: v.optional(v.string()),
    nextOfKin: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    region: v.optional(v.string()),
    branch: v.optional(v.string()),
    dateJoined: v.number(),
    status: v.union(v.literal("active"), v.literal("dormant")),
    dormantReason: v.optional(
      v.union(
        v.literal("resignation"),
        v.literal("retirement"),
        v.literal("dismissal"),
        v.literal("deferred"),
        v.literal("other")
      )
    ),
    dormantNote: v.optional(v.string()),
  })
    .index("by_company", ["companyId"])
    .index("by_user", ["userId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_staffId", ["staffId"]),

  documents: defineTable({
    memberId: v.id("members"),
    companyId: v.id("companies"),
    title: v.string(),
    description: v.optional(v.string()),
    storageId: v.string(), // Convex storage ID
    fileType: v.string(),
    fileSize: v.number(),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
  })
    .index("by_member", ["memberId"])
    .index("by_company", ["companyId"]),

  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
    read: v.boolean(),
    createdAt: v.number(),
    relatedId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_read", ["userId", "read"]),
});
