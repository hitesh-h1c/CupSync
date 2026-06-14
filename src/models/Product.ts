import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IProduct {
  _id: Types.ObjectId;
  vendor: Types.ObjectId;
  name: string;
  /** Unit of sale, e.g. "cup", "glass". */
  unit: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    name: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true, default: "cup" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Product: Model<IProduct> =
  (models.Product as Model<IProduct>) || model<IProduct>("Product", ProductSchema);
