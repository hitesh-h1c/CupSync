import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IEmployee {
  _id: Types.ObjectId;
  vendor: Types.ObjectId;
  /** The employee's login (User with role `employee`). */
  user: Types.ObjectId;
  phone?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    phone: { type: String, default: null, trim: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Employee: Model<IEmployee> =
  (models.Employee as Model<IEmployee>) ||
  model<IEmployee>("Employee", EmployeeSchema);
