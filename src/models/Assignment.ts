import { Schema, model, models, type Model, type Types } from "mongoose";

/** Links an employee to an office. An employee only sees/logs assigned offices. */
export interface IAssignment {
  _id: Types.ObjectId;
  vendor: Types.ObjectId;
  employee: Types.ObjectId;
  office: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    office: { type: Schema.Types.ObjectId, ref: "Office", required: true, index: true },
  },
  { timestamps: true }
);

AssignmentSchema.index({ employee: 1, office: 1 }, { unique: true });

export const Assignment: Model<IAssignment> =
  (models.Assignment as Model<IAssignment>) ||
  model<IAssignment>("Assignment", AssignmentSchema);
