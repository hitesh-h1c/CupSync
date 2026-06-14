import { Schema, model, models, type Model, type Types } from "mongoose";

export const EMAIL_STATUS = ["sent", "previewed", "skipped", "failed"] as const;
export type EmailStatus = (typeof EMAIL_STATUS)[number];

/** Record of the daily summary email attempt for an office on a given day. */
export interface IDailyEmailLog {
  _id: Types.ObjectId;
  vendor: Types.ObjectId;
  office: Types.ObjectId;
  /** IST calendar day the summary covers. */
  dateKey: string;
  sentAt: Date;
  status: EmailStatus;
  /** Optional detail (recipient, error message, etc.). */
  detail?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DailyEmailLogSchema = new Schema<IDailyEmailLog>(
  {
    vendor: { type: Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    office: { type: Schema.Types.ObjectId, ref: "Office", required: true, index: true },
    dateKey: { type: String, required: true },
    sentAt: { type: Date, required: true },
    status: { type: String, enum: EMAIL_STATUS, required: true },
    detail: { type: String, default: null },
  },
  { timestamps: true }
);

DailyEmailLogSchema.index({ office: 1, dateKey: 1 });

export const DailyEmailLog: Model<IDailyEmailLog> =
  (models.DailyEmailLog as Model<IDailyEmailLog>) ||
  model<IDailyEmailLog>("DailyEmailLog", DailyEmailLogSchema);
