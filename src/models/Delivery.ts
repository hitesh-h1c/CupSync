import { Schema, model, models, type Model, type Types } from "mongoose";

export interface IDeliveryItem {
  product: Types.ObjectId;
  quantity: number;
  /**
   * Unit price SNAPSHOTTED from the effective OfficeRate on the delivery date,
   * at the moment of logging. Billing sums these — it never re-looks-up prices,
   * so a future price change can never alter a past bill.
   */
  unitPrice: number;
}

export interface IDelivery {
  _id: Types.ObjectId;
  vendor: Types.ObjectId;
  office: Types.ObjectId;
  employee: Types.ObjectId;
  /** Instant the delivery was logged. */
  date: Date;
  /** IST calendar day `YYYY-MM-DD` — the unit of "one delivery per office per day". */
  dateKey: string;
  items: IDeliveryItem[];
  /** Sum of quantity × unitPrice across items, snapshotted. */
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryItemSchema = new Schema<IDeliveryItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const DeliverySchema = new Schema<IDelivery>(
  {
    vendor: {
      type: Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    office: {
      type: Schema.Types.ObjectId,
      ref: "Office",
      required: true,
      index: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    date: { type: Date, required: true },
    dateKey: { type: String, required: true },
    items: { type: [DeliveryItemSchema], default: [] },
    total: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
);

// One delivery record per office per day (logging again updates it).
DeliverySchema.index({ office: 1, dateKey: 1 }, { unique: true });
DeliverySchema.index({ vendor: 1, dateKey: 1 });
DeliverySchema.index({ employee: 1, dateKey: 1 });

export const Delivery: Model<IDelivery> =
  (models.Delivery as Model<IDelivery>) ||
  model<IDelivery>("Delivery", DeliverySchema);
