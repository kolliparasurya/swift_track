import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function UserDashboard() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [order, setOrder] = useState<any>(null);
    const [agentLocation, setAgentLocation] = useState<[number, number] | null>(null);
    const [eta, setEta] = useState<number | null>(null);

    useEffect(() => {
        const newSocket = io(API_URL);
        setSocket(newSocket);

        newSocket.on('agent_location', (data: { lat: number, lon: number }) => {
            setAgentLocation([data.lat, data.lon]);
        });

        newSocket.on('eta_update', (data: { eta: number }) => {
            setEta(data.eta);
        });

        return () => { newSocket.close(); };
    }, []);

    const createOrder = async () => {
        try {
            const payload = {
                userId: localStorage.getItem('userId'),
                pickupCoordinates: [77.5946, 12.9716], // [lon, lat] for Bangalore Center
                dropoffCoordinates: [77.6411, 12.9783]  // [lon, lat] for Indiranagar
            };
            const res = await axios.post(`${API_URL}/api/orders`, payload);
            setOrder(res.data);
            if (socket) socket.emit('join_order_room', res.data._id);
        } catch (err) {
            console.error(err);
        }
    };

    const center: [number, number] = [12.9716, 77.5946];

    return (
        <div style={{ padding: '1rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <h2>User Dashboard - SwiftTrack</h2>
            <div style={{ marginBottom: '1rem' }}>
                {!order && <button onClick={createOrder}>Place New Order</button>}
                {order && <p>Order Status: {order.status}</p>}
                {eta !== null && <h3 style={{ color: 'green' }}>AI Predicted ETA: {eta} mins</h3>}
            </div>

            <div style={{ flex: 1, border: '1px solid #ccc' }}>
                <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {order && <Marker position={[order.pickupLocation.coordinates[1], order.pickupLocation.coordinates[0]]} />}
                    {order && <Marker position={[order.dropoffLocation.coordinates[1], order.dropoffLocation.coordinates[0]]} />}

                    {agentLocation && <Marker position={agentLocation} />}

                    {order && <Polyline positions={[
                        [order.pickupLocation.coordinates[1], order.pickupLocation.coordinates[0]],
                        [order.dropoffLocation.coordinates[1], order.dropoffLocation.coordinates[0]]
                    ]} color="red" dashArray="5, 10" />}
                </MapContainer>
            </div>
        </div>
    );
}
