import { Schema, model, Document, Types } from 'mongoose';

export interface IJournalEntry extends Document {
  reference: string;
  date: Date;
  description: string;
  lines: { account: Types.ObjectId; debit: number; credit: number; description: string }[];
  status: 'draft' | 'posted';
  createdBy: Types.ObjectId;
}

const journalEntrySchema = new Schema<IJournalEntry>(
  {
    reference: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    description: { type: String, required: true },
    lines: [
      {
        account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
        debit: { type: Number, default: 0 },
        credit: { type: Number, default: 0 },
        description: { type: String, default: '' },
      },
    ],
    status: { type: String, enum: ['draft', 'posted'], default: 'draft' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

journalEntrySchema.index({ date: -1 });
journalEntrySchema.index({ status: 1 });

export const JournalEntry = model<IJournalEntry>('JournalEntry', journalEntrySchema);
