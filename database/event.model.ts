import mongoose, { Schema, type Document, type Model } from "mongoose";

/** TypeScript interface representing an Event document */
export interface IEvent extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    overview: {
      type: String,
      required: [true, "Overview is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Image is required"],
      trim: true,
    },
    venue: {
      type: String,
      required: [true, "Venue is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    time: {
      type: String,
      required: [true, "Time is required"],
    },
    mode: {
      type: String,
      required: [true, "Mode is required"],
      enum: {
        values: ["online", "offline", "hybrid"],
        message: "Mode must be one of: online, offline, hybrid",
      },
    },
    audience: {
      type: String,
      required: [true, "Audience is required"],
      trim: true,
    },
    agenda: {
      type: [String],
      required: [true, "Agenda is required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "Agenda must contain at least one item",
      },
    },
    organizer: {
      type: String,
      required: [true, "Organizer is required"],
      trim: true,
    },
    tags: {
      type: [String],
      required: [true, "Tags are required"],
      validate: {
        validator: (v: string[]) => v.length > 0,
        message: "Tags must contain at least one item",
      },
    },
  },
  {
    timestamps: true, // Auto-generates createdAt and updatedAt
  }
);

/**
 * Pre-save hook:
 * 1. Generates a URL-friendly slug from the title (only when title changes).
 * 2. Normalizes `date` to ISO 8601 format (YYYY-MM-DD).
 * 3. Normalizes `time` to 24-hour HH:mm format.
 */
EventSchema.pre("save", function () {
  // --- Slug generation ---
  // Only regenerate if the title was modified (or is new)
  if (this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-"); // Collapse consecutive hyphens
  }

  // --- Date normalization ---
  // Parse the date and store as ISO string (YYYY-MM-DD)
  if (this.isModified("date")) {
    const parsed = new Date(this.date);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid date format: "${this.date}"`);
    }
    this.date = parsed.toISOString().split("T")[0]; // e.g. "2026-03-18"
  }

  // --- Time normalization ---
  // Convert common time formats (e.g. "9:00 AM", "14:30") to 24-hour HH:mm
  if (this.isModified("time")) {
    const normalized = normalizeTo24Hour(this.time);
    if (!normalized) {
      throw new Error(`Invalid time format: "${this.time}"`);
    }
    this.time = normalized;
  }
});

/**
 * Converts a time string to 24-hour HH:mm format.
 * Accepts "HH:mm", "H:mm AM/PM", "HH:mm AM/PM" patterns.
 */
function normalizeTo24Hour(time: string): string | null {
  const trimmed = time.trim().toUpperCase();

  // Match 12-hour format: "9:00 AM", "12:30 PM"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2];
    const period = match12[3];

    if (hours < 1 || hours > 12) return null;

    if (period === "AM" && hours === 12) hours = 0;
    if (period === "PM" && hours !== 12) hours += 12;

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  }

  // Match 24-hour format: "09:00", "14:30"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);

    if (hours > 23 || minutes > 59) return null;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  return null;
}

/** Use existing model if already compiled (prevents OverwriteModelError in dev) */
const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);

export default Event;
