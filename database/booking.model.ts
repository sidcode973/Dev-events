import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

/** TypeScript interface representing a Booking document */
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Simple RFC 5322-compatible email regex */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: [true, "Event ID is required"],
      index: true, // Index for faster lookups by event
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => EMAIL_REGEX.test(v),
        message: "Email must be a valid email address",
      },
    },
  },
  {
    timestamps: true, // Auto-generates createdAt and updatedAt
  }
);

/**
 * Pre-save hook:
 * Verifies that the referenced eventId points to an existing Event document.
 * Throws an error if the event does not exist, preventing orphaned bookings.
 */
BookingSchema.pre("save", async function () {
  if (this.isModified("eventId")) {
    // Dynamically reference the Event model to avoid circular dependency issues
    const EventModel = mongoose.model("Event");
    const eventExists = await EventModel.exists({ _id: this.eventId });

    if (!eventExists) {
      throw new Error(`Event with ID "${this.eventId}" does not exist`);
    }
  }
});

/** Use existing model if already compiled (prevents OverwriteModelError in dev) */
const Booking: Model<IBooking> =
  mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
