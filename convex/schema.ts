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
    description: v.optional(v.string()),
    region: v.optional(v.string()),
    branch: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_name", ["name"])
    .index("by_region", ["region"])
    .index("by_branch", ["branch"]),

  members: defineTable({
    userId: v.id("users"),
    companyId: v.id("companies"),
    staffId: v.string(), // Manually entered by admin
    ghCard: v.optional(v.string()), // Ghana Card
    gender: v.union(v.literal("male"), v.literal("female")),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    position: v.optional(v.string()),
    department: v.optional(v.string()),
    region: v.optional(v.string()), // Region of organization
    locationDistrict: v.optional(v.string()), // Location/District
    // Family Information
    fatherName: v.optional(v.string()),
    fatherDOB: v.optional(v.string()),
    motherName: v.optional(v.string()),
    motherDOB: v.optional(v.string()),
    spouseName: v.optional(v.string()),
    spouseDOB: v.optional(v.string()),
    // Children Information (up to 4 biological children under 18)
    child1Name: v.optional(v.string()),
    child1DOB: v.optional(v.string()),
    child2Name: v.optional(v.string()),
    child2DOB: v.optional(v.string()),
    child3Name: v.optional(v.string()),
    child3DOB: v.optional(v.string()),
    child4Name: v.optional(v.string()),
    child4DOB: v.optional(v.string()),
    // Emergency Contact
    emergencyContactName: v.optional(v.string()),
    emergencyContactPhone: v.optional(v.string()),
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
    .index("by_staffId", ["staffId"])
    .index("by_gender", ["gender"])
    .index("by_region", ["region"]),

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

  savedSearches: defineTable({
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
    createdAt: v.number(),
    lastUsed: v.number(),
    useCount: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_lastUsed", ["userId", "lastUsed"]),
});
