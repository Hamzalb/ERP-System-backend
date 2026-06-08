import { Schema, model, Document, Types } from 'mongoose';

export interface ITask extends Document {
  project: Types.ObjectId;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: Types.ObjectId;
  dueDate?: Date;
  order: number;
}

export interface IProject extends Document {
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  progress: number;
  members: Types.ObjectId[];
  manager: Types.ObjectId;
  milestones: { title: string; dueDate: Date; completed: boolean }[];
  createdBy: Types.ObjectId;
}

const taskSchema = new Schema<ITask>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['todo', 'in_progress', 'review', 'done'], default: 'todo' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    order: { type: Number, default: 0 },
  },
  { timestamps: true },
);

taskSchema.index({ project: 1, status: 1 });

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
      default: 'planning',
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    milestones: [
      {
        title: { type: String, required: true },
        dueDate: { type: Date, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

projectSchema.index({ status: 1 });
projectSchema.index({ manager: 1 });

export const Task = model<ITask>('Task', taskSchema);
export const Project = model<IProject>('Project', projectSchema);
