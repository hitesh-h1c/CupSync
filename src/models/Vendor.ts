import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IVendor {
  _id: Types.ObjectId;
  businessName: string;
  /** The vendor's owner login (User with role `vendor`). */
  owner: Types.ObjectId;
  contact?: string | null;
  logoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const VendorSchema = new Schema<IVendor>(
  {
    businessName: { type: String, required: true, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contact: { type: String, default: null, trim: true },
    logoUrl: { type: String, default: null },
  },
  { timestamps: true }
);

export const Vendor: Model<IVendor> =
  (models.Vendor as Model<IVendor>) || model<IVendor>("Vendor", VendorSchema);
