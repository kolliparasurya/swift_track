import { Server, Socket } from 'socket.io';
import Order from './models/Order';
import Agent from './models/Agent';
import https from 'http'; // Using builtin http to make request to ML service
import dotenv from 'dotenv';
dotenv.config();

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function fetchPredictedEta(distanceKm: number, speedKmh: number): Promise<number> {
    return new Promise((resolve) => {
        const data = JSON.stringify({
            distance_km: distanceKm,
            agent_speed_kmh: speedKmh,
            time_of_day_hours: new Date().getHours() + (new Date().getMinutes() / 60)
        });

        const req = https.request(`${ML_SERVICE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve(result.eta_minutes || 0);
                } catch {
                    resolve(0);
                }
            });
        });

        req.on('error', () => resolve(0));
        req.write(data);
        req.end();
    });
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    // Haversine formula
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export const setupSockets = (io: Server) => {
    io.on('connection', (socket: Socket) => {
        console.log('Client connected:', socket.id);

        // Agent or User joins an order tracking room
        socket.on('join_order_room', (orderId: string) => {
            socket.join(window_room_id(orderId));
            console.log(`Socket ${socket.id} joined room ${orderId}`);
        });

        // Agent emits their location
        socket.on('location_update', async (data: { orderId: string, agentId: string, lat: number, lon: number, dropoffLat: number, dropoffLon: number, speedKmh?: number }) => {
            const distance = calculateDistance(data.lat, data.lon, data.dropoffLat, data.dropoffLon);
            const speed = data.speedKmh || 40; // Default 40 km/h if unknown

            // Broadcast raw location
            io.to(window_room_id(data.orderId)).emit('agent_location', { lat: data.lat, lon: data.lon });

            // Update Agent in DB occasionally (not every second to save DB load in MVP)
            await Agent.findByIdAndUpdate(data.agentId, {
                'location.coordinates': [data.lon, data.lat],
                isOnline: true
            });

            // Fetch ETA
            const eta = await fetchPredictedEta(distance, speed);
            io.to(window_room_id(data.orderId)).emit('eta_update', { eta });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};

function window_room_id(orderId: string) {
    return `order_${orderId}`;
}
