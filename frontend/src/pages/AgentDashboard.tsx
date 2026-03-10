import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
});

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function AgentDashboard() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [order, setOrder] = useState<any>(null);
    const [location, setLocation] = useState<[number, number]>([12.9716, 77.5946]); // default Bangalore

    useEffect(() => {
        const newSocket = io(API_URL);
        setSocket(newSocket);

        // Fetch assigned orders for this agent
        const fetchAssigned = async () => {
            try {
                const agentId = localStorage.getItem('userId');
                const res = await axios.get(`${API_URL}/api/orders/agent/${agentId}`);
                if (res.data.length > 0) {
                    const activeOrder = res.data[0];
                    setOrder(activeOrder);
                    newSocket.emit('join_order_room', activeOrder._id);
                    // Set initial location to pick-up
                    setLocation([activeOrder.pickupLocation.coordinates[1], activeOrder.pickupLocation.coordinates[0]]);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchAssigned();

        return () => { newSocket.close(); };
    }, []);

    // Simulator
    useEffect(() => {
        if (!order || !socket) return;

        const dest = [order.dropoffLocation.coordinates[1], order.dropoffLocation.coordinates[0]];

        const interval = setInterval(() => {
            setLocation(prev => {
                const latDiff = dest[0] - prev[0];
                const lonDiff = dest[1] - prev[1];

                // Move 1% closer every second
                const newLat = prev[0] + latDiff * 0.05;
                const newLon = prev[1] + lonDiff * 0.05;

                socket.emit('location_update', {
                    orderId: order._id,
                    agentId: localStorage.getItem('userId'),
                    lat: newLat,
                    lon: newLon,
                    dropoffLat: dest[0],
                    dropoffLon: dest[1],
                    speedKmh: 40
                });

                if (Math.abs(latDiff) < 0.0001 && Math.abs(lonDiff) < 0.0001) {
                    clearInterval(interval);
                    alert('Delivered!');
                }

                return [newLat, newLon];
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [order, socket]);

    return (
        <div style={{ padding: '1rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <h2>Agent Dashboard</h2>
            {!order ? <p>Waiting for orders...</p> : <p>Currently delivering order {order._id}</p>}

            <div style={{ flex: 1, border: '1px solid #ccc' }}>
                <MapContainer center={location} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={location}></Marker>
                    {order && (
                        <Polyline positions={[
                            [order.pickupLocation.coordinates[1], order.pickupLocation.coordinates[0]],
                            [order.dropoffLocation.coordinates[1], order.dropoffLocation.coordinates[0]]
                        ]} color="blue" />
                    )}
                </MapContainer>
            </div>
        </div>
    );
}
