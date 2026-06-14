import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IOffice {
  _id: Types.ObjectId;
  vendor: Types.ObjectId;
  name: string;
  address?: string | null;
  contactPerson?: string | null;
  /** Where the 22:00 IST daily summary is sent. */
  contactEmail?: string | null;
  /** The office's login (User with role `office`). */
  user: Types.ObjectId;
  dailyEmailEnabled: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OfficeSchema = new Schema<IOffice>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, default: null, trim: true },
    contactPerson: { type: String, default: null, trim: true },
    contactEmail: { type: String, default: null, lowercase: true, trim: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    dailyEmailEnabled: { type: Boolean, default: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Office: Model<IOffice> =
  (models.Office as Model<IOffice>) || model<IOffice>("Office", OfficeSchema);
