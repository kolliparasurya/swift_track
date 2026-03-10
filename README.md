# SwiftTrack

SwiftTrack is a real-time delivery tracking and order management system built to simulate the logistics infrastructure of large-scale platforms. It provides live location updates via WebSockets and features a Machine Learning model to calculate dynamic, data-driven Delivery ETAs based on historical data, distance, and agent availability.

## Architecture & Technology Stack

The project is built using a microservices-oriented architecture and is fully containerized using Docker.

- **Backend Context:** Node.js, Express.js, TypeScript, and Socket.io
- **Frontend Context:** React.js, Vite, React Router, React Leaflet
- **Database Context:** MongoDB and Mongoose
- **Machine Learning Context:** Python, Scikit-learn, FastAPI

## System Components

1. **MongoDB Database:** Stores user records, agent statuses, and order tracking metadata.
2. **Node.js API & WebSocket Server:** Handles standard REST operations (authentication, order creation) and manages bidirectional Socket.io rooms to securely relay live GPS coordinates from delivery agents to customers.
3. **Python ML Microservice:** A separate FastAPI service hosting a pre-trained Scikit-learn Random Forest model. It receives distance and speed metrics from the Node backend and returns estimated delivery times factoring in traffic density and historical constraints.
4. **React Client Dashboard:** Contains dual interfaces handling simulated agent location broadcasting and real-time customer tracking maps.

## Prerequisites

- Docker and Docker Compose

## Installation & Setup

You can spin up the entire application stack using Docker Compose.

1. Clone the repository:
   ```bash
   git clone https://github.com/kolliparasurya/swift_track.git
   cd swift_track
   ```

2. Build and start the containers:
   ```bash
   docker-compose up -d --build
   ```

3. Access the services:
   - Frontend Dashboard: `http://localhost:5173`
   - Backend API: `http://localhost:5000`
   - ML Predictor Service: `http://localhost:8000`

## Development Configuration

If developing locally without Docker, each service requires its own dependencies to be installed via `npm install` (for Node / React environments) or `pip install -r requirements.txt` (for the Python environment). 

The backend expects a running MongoDB instance. Default environment variables can be configured in `.env` files within the respective service directories.
