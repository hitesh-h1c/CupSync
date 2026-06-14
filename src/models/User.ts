import { Schema, model, models, type Model, type Types } from "mongoose";
import { ALL_ROLES, ROLES, type Role } from "@/lib/roles";

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  /** Set for vendor/employee/office users; null for the super admin. */
  vendor?: Types.ObjectId | null;
  /** Set for office login users — references the Office they belong to. */
  office?: Types.ObjectId | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ALL_ROLES, required: true, default: ROLES.VENDOR },
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", default: null, index: true },
    office: { type: Schema.Types.ObjectId, ref: "Office", default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>("User", UserSchema);
