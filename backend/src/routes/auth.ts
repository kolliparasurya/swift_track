import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jwt-simple';
import User from '../models/User';
import Agent from '../models/Agent';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

router.post('/register', async (req, res) => {
    const { role, name, email, password } = req.body;
    if (!role || !name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        if (role === 'user') {
            const user = new User({ name, email, passwordHash });
            await user.save();
            return res.status(201).json({ message: 'User created' });
        } else if (role === 'agent') {
            const agent = new Agent({ name, email, passwordHash });
            await agent.save();
            return res.status(201).json({ message: 'Agent created' });
        }
        return res.status(400).json({ error: 'Invalid role' });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    const { role, email, password } = req.body;
    try {
        let account;
        if (role === 'user') account = await User.findOne({ email });
        else if (role === 'agent') account = await Agent.findOne({ email });

        if (!account) return res.status(404).json({ error: 'Account not found' });

        const isValid = await bcrypt.compare(password, account.passwordHash);
        if (!isValid) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.encode({ id: account._id, role }, JWT_SECRET);
        return res.json({ token, id: account._id, name: account.name, role });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
});

export default router;
