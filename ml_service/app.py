from fastapi import FastAPI
from pydantic import BaseModel
import pickle
import numpy as np

app = FastAPI(title="SwiftTrack ML Service")

try:
    with open("model.pkl", "rb") as f:
        model = pickle.load(f)
except FileNotFoundError:
    model = None

class PredictionRequest(BaseModel):
    distance_km: float
    agent_speed_kmh: float
    time_of_day_hours: float

@app.get("/health")
def health_check():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/predict")
def predict_eta(data: PredictionRequest):
    if not model:
        return {"error": "Model not loaded", "eta_minutes": data.distance_km / max(data.agent_speed_kmh, 1) * 60}
    
    # Simple feature array based on training script
    features = np.array([[data.distance_km, data.agent_speed_kmh, data.time_of_day_hours]])
    eta = model.predict(features)[0]
    return {"eta_minutes": max(1.0, round(eta, 2))}
