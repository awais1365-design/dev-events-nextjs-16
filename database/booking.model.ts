import { Schema, model, models, Document, Types } from 'mongoose';
import Event from './event.model';

/**
 * TypeScript interface for Booking document
 */
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Booking Schema
 */
const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator(email: string) {
          // RFC 5322 compliant email regex
          const emailRegex =
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

          return emailRegex.test(email);
        },
        message: 'Please provide a valid email address',
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save hook
 * Validates that the referenced Event exists
 * (Mongoose 7 compatible – uses throw instead of next)
 */
BookingSchema.pre('save', async function () {
  const booking = this as IBooking;

  if (booking.isNew || booking.isModified('eventId')) {
    const eventExists = await Event.findById(booking.eventId)
      .select('_id')
      .lean();

    if (!eventExists) {
      const error = new Error(
        `Event with ID ${booking.eventId.toString()} does not exist`
      );
      error.name = 'ValidationError';
      throw error;
    }
  }
});

/**
 * Indexes
 */

// Faster lookups by event
BookingSchema.index({ eventId: 1 });

// Sort bookings by newest first per event
BookingSchema.index({ eventId: 1, createdAt: -1 });

// User booking lookups
BookingSchema.index({ email: 1 });

// Enforce one booking per event per email
BookingSchema.index(
  { eventId: 1, email: 1 },
  { unique: true, name: 'uniq_event_email' }
);

/**
 * Booking Model
 */
const Booking =
  models.Booking || model<IBooking>('Booking', BookingSchema);

export default Booking;
