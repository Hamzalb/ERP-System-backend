import { Schema, model, Document, Types } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  sku: string;
  barcode?: string;
  description: string;
  category: Types.ObjectId;
  brand?: Types.ObjectId;
  unit: string;
  costPrice: number;
  salePrice: number;
  currency: string;
  stock: number;
  minStock: number;
  warehouse?: Types.ObjectId;
  images: string[];
  status: 'active' | 'inactive';
}

const productSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    barcode: { type: String },
    description: { type: String, default: '' },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    brand: { type: Schema.Types.ObjectId, ref: 'Brand' },
    unit: { type: String, default: 'pcs' },
    costPrice: { type: Number, default: 0 },
    salePrice: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    stock: { type: Number, default: 0 },
    minStock: { type: Number, default: 0 },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    images: [{ type: String }],
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true },
);

productSchema.index({ sku: 1 });
productSchema.index({ category: 1 });
productSchema.index({ stock: 1, minStock: 1 });
productSchema.index({ name: 'text', sku: 'text', barcode: 'text' });

export const Product = model<IProduct>('Product', productSchema);
