import { Schema, model, models, type Model, type Types } from "mongoose";

export const SUBSCRIPTION_STATUS = ["trialing", "active", "expired"] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];

export interface ISubscription {
  _id: Types.ObjectId;
  vendor: Types.ObjectId;
  /**
   * Stored status. The *effective* status (e.g. a `trialing` row whose
   * `trialEndsAt` has passed) is computed at read time — see lib/subscription.ts.
   */
  status: SubscriptionStatus;
  trialStartsAt: Date;
  trialEndsAt: Date;
  /** Plan identifier once on a paid plan (no payment gateway yet). */
  plan?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUS,
      required: true,
      default: "trialing",
    },
    trialStartsAt: { type: Date, required: true },
    trialEndsAt: { type: Date, required: true },
    plan: { type: String, default: null },
  },
  { timestamps: true }
);

export const Subscription: Model<ISubscription> =
  (models.Subscription as Model<ISubscription>) ||
  model<ISubscription>("Subscription", SubscriptionSchema);
