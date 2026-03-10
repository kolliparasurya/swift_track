import mongoose, { Schema, Document } from 'mongoose';

export interface IAgent extends Document {
    name: string;
    email: string;
    passwordHash: string;
    isOnline: boolean;
    location: {
        type: string;
        coordinates: number[];
    };
}

const AgentSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    isOnline: { type: Boolean, default: false },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
    }
});

AgentSchema.index({ location: '2dsphere' });

export default mongoose.model<IAgent>('Agent', AgentSchema);
