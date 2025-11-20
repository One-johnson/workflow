import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import bcrypt from "bcryptjs";


// Helper to generate Staff ID: 2 letters (initials) + 6 random digits
function generateStaffId(firstName: string, lastName: string): string {
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
  return initials + randomDigits;
}

// Helper to generate 8-digit password
function generatePassword(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

export const create = mutation({
  args: {
    companyId: v.id("companies"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    password: v.string(),
    idCardNumber: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    position: v.optional(v.string()),
    department: v.optional(v.string()),
    nextOfKin: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    region: v.optional(v.string()),
    branch: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    

    // Check if email already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Hash password
    const passwordHash =  bcrypt.hashSync(args.password, 10);

    // Generate staff ID
    const staffId = generateStaffId(args.firstName, args.lastName);

    // Create user account
    const userId = await ctx.db.insert("users", {
      email: args.email,
      passwordHash,
      role: "member",
      companyId: args.companyId,
      firstName: args.firstName,
      lastName: args.lastName,
      createdAt: Date.now(),
    });

    // Create member profile
    const memberId = await ctx.db.insert("members", {
      userId,
      companyId: args.companyId,
      staffId,
      idCardNumber: args.idCardNumber,
      firstName: args.firstName,
      lastName: args.lastName,
      email: args.email,
      phone: args.phone,
      address: args.address,
      dateOfBirth: args.dateOfBirth,
      position: args.position,
      department: args.department,
      nextOfKin: args.nextOfKin,
      emergencyContact: args.emergencyContact,
      region: args.region,
      branch: args.branch,
      dateJoined: Date.now(),
      status: args.status,
      dormantReason: args.dormantReason,
      dormantNote: args.dormantNote,
    });

    // Create notification for admin
    const admins = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .collect();

    for (const admin of admins) {
      await ctx.db.insert("notifications", {
        userId: admin._id,
        title: "New Member Added",
        message: `${args.firstName} ${args.lastName} has been added as a new member.`,
        type: "success",
        read: false,
        createdAt: Date.now(),
        relatedId: memberId,
      });
    }

    return { memberId, staffId };
  },
});

export const createBulk = mutation({
  args: {
    members: v.array(
      v.object({
        companyId: v.id("companies"),
        firstName: v.string(),
        lastName: v.string(),
        email: v.string(),
        idCardNumber: v.optional(v.string()),
        phone: v.optional(v.string()),
        address: v.optional(v.string()),
        dateOfBirth: v.optional(v.string()),
        position: v.optional(v.string()),
        department: v.optional(v.string()),
        nextOfKin: v.optional(v.string()),
        emergencyContact: v.optional(v.string()),
        region: v.optional(v.string()),
        branch: v.optional(v.string()),
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
    ),
  },
  handler: async (ctx, args) => {

    const results = [];
    const errors = [];

    for (const member of args.members) {
      try {
        // Check if email already exists
        const existingUser = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", member.email))
          .first();

        if (existingUser) {
          errors.push(`${member.email}: Email already exists`);
          continue;
        }

        // Generate password and hash it
        const password = generatePassword();
        const passwordHash = bcrypt.hashSync(password, 10);

        // Generate staff ID
        const staffId = generateStaffId(member.firstName, member.lastName);

        // Create user account
        const userId = await ctx.db.insert("users", {
          email: member.email,
          passwordHash,
          role: "member",
          companyId: member.companyId,
          firstName: member.firstName,
          lastName: member.lastName,
          createdAt: Date.now(),
        });

        // Create member profile
        const memberId = await ctx.db.insert("members", {
          userId,
          companyId: member.companyId,
          staffId,
          idCardNumber: member.idCardNumber,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email,
          phone: member.phone,
          address: member.address,
          dateOfBirth: member.dateOfBirth,
          position: member.position,
          department: member.department,
          nextOfKin: member.nextOfKin,
          emergencyContact: member.emergencyContact,
          region: member.region,
          branch: member.branch,
          dateJoined: Date.now(),
          status: member.status,
          dormantReason: member.dormantReason,
          dormantNote: member.dormantNote,
        });

        results.push({
          memberId,
          staffId,
          email: member.email,
          name: `${member.firstName} ${member.lastName}`,
        });
      } catch (error) {
        errors.push(`${member.email}: ${error}`);
      }
    }

    return { results, errors };
  },
});

export const list = query({
  handler: async (ctx) => {
    const members = await ctx.db.query("members").order("desc").collect();

    // Get company names
    const membersWithCompany = await Promise.all(
      members.map(async (member) => {
        const company = await ctx.db.get(member.companyId);
        return {
          ...member,
          companyName: company?.name || "Unknown",
        };
      })
    );

    return membersWithCompany;
  },
});

export const getById = query({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.id);
    if (!member) return null;

    const company = await ctx.db.get(member.companyId);
    return {
      ...member,
      companyName: company?.name || "Unknown",
    };
  },
});

export const getByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("members")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!member) return null;

    const company = await ctx.db.get(member.companyId);
    return {
      ...member,
      companyName: company?.name || "Unknown",
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("members"),
    firstName: v.string(),
    lastName: v.string(),
    email: v.string(),
    idCardNumber: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    position: v.optional(v.string()),
    department: v.optional(v.string()),
    nextOfKin: v.optional(v.string()),
    emergencyContact: v.optional(v.string()),
    region: v.optional(v.string()),
    branch: v.optional(v.string()),
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
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const member = await ctx.db.get(id);

    if (!member) {
      throw new Error("Member not found");
    }

    // Update member
    await ctx.db.patch(id, updates);

    // Update user email if changed
    if (updates.email !== member.email) {
      await ctx.db.patch(member.userId, {
        email: updates.email,
        firstName: updates.firstName,
        lastName: updates.lastName,
      });
    }
  },
});

export const updateBulk = mutation({
  args: {
    ids: v.array(v.id("members")),
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
  },
  handler: async (ctx, args) => {
    const updated = [];
    const errors = [];

    for (const id of args.ids) {
      try {
        await ctx.db.patch(id, {
          status: args.status,
          dormantReason: args.dormantReason,
          dormantNote: args.dormantNote,
        });
        updated.push(id);
      } catch (error) {
        errors.push(`${id}: ${error}`);
      }
    }

    return { updated, errors };
  },
});

export const toggleStatus = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.id);
    if (!member) {
      throw new Error("Member not found");
    }

    const newStatus = member.status === "active" ? "dormant" : "active";
    await ctx.db.patch(args.id, {
      status: newStatus,
      // Clear dormant info when activating
      dormantReason: newStatus === "active" ? undefined : member.dormantReason,
      dormantNote: newStatus === "active" ? undefined : member.dormantNote,
    });

    return newStatus;
  },
});

export const remove = mutation({
  args: { id: v.id("members") },
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.id);
    if (!member) {
      throw new Error("Member not found");
    }

    // Delete all documents for this member
    const documents = await ctx.db
      .query("documents")
      .withIndex("by_member", (q) => q.eq("memberId", args.id))
      .collect();

    for (const doc of documents) {
      await ctx.storage.delete(doc.storageId);
      await ctx.db.delete(doc._id);
    }

    // Delete member
    await ctx.db.delete(args.id);

    // Delete user account
    await ctx.db.delete(member.userId);
  },
});

export const removeBulk = mutation({
  args: { ids: v.array(v.id("members")) },
  handler: async (ctx, args) => {
    const deleted = [];
    const errors = [];

    for (const id of args.ids) {
      try {
        const member = await ctx.db.get(id);
        if (!member) {
          errors.push(`${id}: Member not found`);
          continue;
        }

        // Delete all documents
        const documents = await ctx.db
          .query("documents")
          .withIndex("by_member", (q) => q.eq("memberId", id))
          .collect();

        for (const doc of documents) {
          await ctx.storage.delete(doc.storageId);
          await ctx.db.delete(doc._id);
        }

        // Delete member and user
        await ctx.db.delete(id);
        await ctx.db.delete(member.userId);
        deleted.push(id);
      } catch (error) {
        errors.push(`${id}: ${error}`);
      }
    }

    return { deleted, errors };
  },
});

export const search = query({
  args: {
    searchTerm: v.optional(v.string()),
    companyId: v.optional(v.id("companies")),
    status: v.optional(v.union(v.literal("active"), v.literal("dormant"))),
  },
  handler: async (ctx, args) => {
    let members = await ctx.db.query("members").collect();

    // Filter by company
    if (args.companyId) {
      members = members.filter((m) => m.companyId === args.companyId);
    }

    // Filter by status
    if (args.status) {
      members = members.filter((m) => m.status === args.status);
    }

    // Search by term
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      members = members.filter(
        (m) =>
          m.firstName.toLowerCase().includes(searchLower) ||
          m.lastName.toLowerCase().includes(searchLower) ||
          m.email.toLowerCase().includes(searchLower) ||
          m.staffId.includes(searchLower) ||
          m.position?.toLowerCase().includes(searchLower) ||
          m.department?.toLowerCase().includes(searchLower)
      );
    }

    // Get company names
    const membersWithCompany = await Promise.all(
      members.map(async (member) => {
        const company = await ctx.db.get(member.companyId);
        return {
          ...member,
          companyName: company?.name || "Unknown",
        };
      })
    );

    return membersWithCompany;
  },
});

export const getByStatus = query({
  args: { status: v.union(v.literal("active"), v.literal("dormant")) },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("members")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    return members;
  },
});
