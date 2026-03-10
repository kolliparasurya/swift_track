import express from 'express';
import Order from '../models/Order';
import Agent from '../models/Agent';

const router = express.Router();

// Helper to authenticate (simplified for MVP)
const authenticate = (req: any, res: any, next: any) => {
    // Assume JWT validation is done here
    next();
};

router.post('/', authenticate, async (req, res) => {
    const { userId, pickupCoordinates, dropoffCoordinates } = req.body;

    try {
        // Basic logic: Find any online agent, or simple random selection
        const availableAgent = await Agent.findOne({ isOnline: true });

        const newOrder = new Order({
            userId,
            agentId: availableAgent ? availableAgent._id : undefined,
            pickupLocation: { type: 'Point', coordinates: pickupCoordinates },
            dropoffLocation: { type: 'Point', coordinates: dropoffCoordinates },
            status: availableAgent ? 'Assigned' : 'Pending'
        });

        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', authenticate, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// For agents: get assigned orders
router.get('/agent/:agentId', authenticate, async (req, res) => {
    try {
        const orders = await Order.find({ agentId: req.params.agentId, status: { $ne: 'Delivered' } });
        res.json(orders);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
