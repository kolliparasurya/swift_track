import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
import pickle

def generate_synthetic_data(num_samples=1000):
    np.random.seed(42)
    # distance between 1 and 20 km
    distances = np.random.uniform(1, 20, num_samples)
    # speed between 10 and 60 km/h
    speeds = np.random.uniform(10, 60, num_samples)
    # time of day between 0 and 24
    time_of_day = np.random.uniform(0, 24, num_samples)
    
    # baseline time = distance / speed * 60 (in minutes)
    base_times = (distances / speeds) * 60
    
    # traffic factor: peak hours (8-10, 17-19) add more time
    traffic_multiplier = np.ones(num_samples)
    for i, t in enumerate(time_of_day):
        if (8 <= t <= 10) or (17 <= t <= 19):
            traffic_multiplier[i] = np.random.uniform(1.2, 1.8)
        else:
            traffic_multiplier[i] = np.random.uniform(0.9, 1.1)
            
    actual_times = base_times * traffic_multiplier + np.random.normal(0, 2, num_samples)
    actual_times = np.maximum(actual_times, 1.0) # at least 1 minute
    
    df = pd.DataFrame({
        'distance_km': distances,
        'agent_speed_kmh': speeds,
        'time_of_day_hours': time_of_day,
        'actual_time_minutes': actual_times
    })
    return df

print("Generating synthetic data...")
df = generate_synthetic_data()

X = df[['distance_km', 'agent_speed_kmh', 'time_of_day_hours']]
y = df['actual_time_minutes']

print("Training Machine Learning Model (RandomForest)...")
model = RandomForestRegressor(n_estimators=50, random_state=42)
model.fit(X, y)

print("Saving model to model.pkl...")
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)
    
print("Training complete.")
