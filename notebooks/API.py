from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(title="RideWise Segmentation API")

kmeans = joblib.load("kmeans_model.pkl")
scaler = joblib.load("scaler.pkl")

class CustomerFeatures(BaseModel):
    features: list[float]

@app.get("/")
def health_check():
    return {"status": "Segmentation API running"}

@app.post("/customer/segment")
def assign_segment(customer: CustomerFeatures):
    data = np.array(customer.features).reshape(1, -1)
    data_scaled = scaler.transform(data)
    cluster = int(kmeans.predict(data_scaled)[0])
    return {"cluster": cluster}
