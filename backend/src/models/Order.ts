import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
    userId: mongoose.Types.ObjectId;
    agentId?: mongoose.Types.ObjectId;
    pickupLocation: {
        type: string;
        coordinates: number[];
    };
    dropoffLocation: {
        type: string;
        coordinates: number[];
    };
    status: 'Pending' | 'Assigned' | 'Picked Up' | 'Delivered';
    predictedEtaMinutes?: number;
}

const OrderSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent' },
    pickupLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    dropoffLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    status: {
        type: String,
        enum: ['Pending', 'Assigned', 'Picked Up', 'Delivered'],
        default: 'Pending'
    },
    predictedEtaMinutes: { type: Number }
});

export default mongoose.model<IOrder>('Order', OrderSchema);
