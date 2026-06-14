import { Schema, model, models, type Model, type Types } from "mongoose";

/**
 * Effective-dated price for a product at an office. Prices are NEVER
 * overwritten — a change inserts a new row with a later `effectiveFrom`. The
 * active rate for any date is the row with the latest `effectiveFrom` that is
 * on or before that date. See lib/pricing.ts.
 */
export interface IOfficeRate {
  _id: Types.ObjectId;
  vendor: Types.ObjectId;
  office: Types.ObjectId;
  product: Types.ObjectId;
  /** Price in rupees. */
  price: number;
  /** UTC-midnight Date of the calendar day this rate takes effect. */
  effectiveFrom: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OfficeRateSchema = new Schema<IOfficeRate>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    office: { type: Schema.Types.ObjectId, ref: "Office", required: true },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    price: { type: Number, required: true, min: 0 },
    effectiveFrom: { type: Date, required: true },
  },
  { timestamps: true }
);

// Fast "latest rate on or before date" lookups per office+product.
OfficeRateSchema.index({ office: 1, product: 1, effectiveFrom: -1 });
// One rate row per office+product+day (re-setting a day's price updates it).
OfficeRateSchema.index({ office: 1, product: 1, effectiveFrom: 1 }, { unique: true });

export const OfficeRate: Model<IOfficeRate> =
  (models.OfficeRate as Model<IOfficeRate>) ||
  model<IOfficeRate>("OfficeRate", OfficeRateSchema);
