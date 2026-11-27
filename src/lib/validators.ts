import { z } from "zod";
import { isSafeImageUrl, sanitizeText } from "./security/sanitize";

export const DESIGNATIONS = [
  "member",
  "Moderator",
  "Advisor",
  "President",
  "Vice President",
  "Secretary",
  "Assistant Secretary",
  "Joint Secretary",
  "IT Head",
  "Head of Content",
  "Treasurer",
  "Organizing Secretary",
  "Assistant Organizing Secretary",
  "Logistician",
  "Field Manager",
  "Content Manager",
  "Public Relations Officer",
  "Human Resources Manager",
  "Information Technology Officer",
  "Designer",
  "Executive",
  "IT Officer",
  "Former President",
  "Former Vice President",
  "Former Secretary",
  "Former Assistant Secretary",
  "Former Joint Secretary",
  "Former IT Head",
  "Former Treasurer",
  "Former Organizing Secretary",
  "Former Assistant Organizing Secretary",
  "Former Field Manager",
  "Former Content Manager",
  "Former Public Relations Officer",
  "Former Information Technology Officer",
  "Former Designer",
  "Former Executive",
  "Former IT Officer",
] as const;

export const uuidSchema = z.string().uuid("Invalid identifier format");

const safeText = (min: number, max: number) =>
  z
    .string()
    .transform((v) => sanitizeText(v, max))
    .refine((v) => v.length >= min, `Must be at least ${min} characters`)
    .refine((v) => v.length <= max, `Must be at most ${max} characters`);

export const safeImageUrlSchema = z
  .string()
  .trim()
  .max(500)
  .refine((url) => isSafeImageUrl(url), "Image URL must be a verified local upload or HTTPS ImgBB URL");

export const strongPasswordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password is too long")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const registerSchema = z.object({
  fullName: safeText(2, 100),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(254),
  password: strongPasswordSchema,
  imageUrl: safeImageUrlSchema.optional().default("/images/blank.webp"),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address").max(254),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().trim().min(32).max(128),
  newPassword: strongPasswordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required").max(128),
  newPassword: strongPasswordSchema,
});

export const mfaVerifySchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit authenticator code"),
});

export const mfaDisableSchema = z.object({
  password: z.string().min(1, "Password is required").max(128),
  code: z.string().trim().min(6).max(20),
});

export const updateProfileSchema = z.object({
  name: safeText(2, 100).optional(),
  imageUrl: safeImageUrlSchema.optional(),
});

export const createEventSchema = z
  .object({
    name: safeText(2, 120),
    description: safeText(10, 4000),
    imageUrl: safeImageUrlSchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const createSegmentSchema = z
  .object({
    eventId: uuidSchema,
    name: safeText(2, 120),
    description: safeText(10, 6000),
    imageUrl: safeImageUrlSchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    registrationOpen: z.boolean().optional().default(true),
    registrationDeadline: z.union([z.coerce.date(), z.literal(""), z.null()]).optional(),
    maxParticipants: z.union([z.coerce.number().int().min(1).max(10000), z.literal(""), z.null()]).optional(),
    isTeamBased: z.boolean().optional().default(false),
    maxTeamSize: z.coerce.number().int().min(1).max(20).optional().default(1),
  })
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const updateSegmentSchema = createSegmentSchema;

export const createBlogSchema = z.object({
  title: safeText(3, 180),
  description: safeText(10, 15000),
  imageUrl: safeImageUrlSchema,
});

export const updateBlogSchema = createBlogSchema;

export const executiveApplicationSchema = z.object({
  whyExecutive: safeText(5, 2000),
  hoursPerWeek: safeText(1, 100),
  techSkills: safeText(2, 1000),
  experience: safeText(2, 2000),
  leadershipRating: safeText(1, 50),
  githubProfile: safeText(2, 1000),
  awards: safeText(2, 1000),
});

export const adminUpdateUserSchema = z
  .object({
    role: z.enum(["member", "admin"]).optional(),
    designation: z.enum(DESIGNATIONS).optional(),
  })
  .refine((d) => d.role !== undefined || d.designation !== undefined, {
    message: "Provide role or designation to update",
  });

export const recruitApplicantSchema = z.object({
  designation: z.enum(DESIGNATIONS),
});

export const recruitmentToggleSchema = z.object({
  enabled: z.boolean(),
});

export const contactSchema = z.object({
  name: safeText(2, 100),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(254),
  message: safeText(10, 4000),
});

export const contactStatusSchema = z.object({
  status: z.enum(["unread", "read", "resolved"]),
});

export const segmentRegistrationSchema = z.object({
  participantName: safeText(2, 100),
  email: z.string().trim().toLowerCase().email("Invalid email address").max(254),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9\-\s()]{7,20}$/, "Enter a valid phone number"),
  institution: safeText(2, 150),
  classGrade: safeText(1, 50),
  teamName: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizeText(v, 100) : "")),
  teamMembers: z
    .string()
    .optional()
    .transform((v) => (v ? sanitizeText(v, 500) : "")),
});

export const executiveMemberSchema = z.object({
  panelYear: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{4}$/, "Panel year must look like 2025-2026"),
  name: safeText(2, 100),
  post: safeText(2, 100),
  imageUrl: safeImageUrlSchema.optional().default("/images/blank.webp"),
  displayOrder: z.coerce.number().int().min(0).max(500).optional().default(0),
});

export const achievementSchema = z.object({
  title: safeText(3, 140),
  tag: safeText(2, 60),
  imageUrl: safeImageUrlSchema,
  year: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? sanitizeText(v, 20) : "")),
  displayOrder: z.coerce.number().int().min(0).max(500).optional().default(0),
});
