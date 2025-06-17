from fastapi import FastAPI
from utils.logger import setup_logger
from views.classify_csv import csv_router

logger = setup_logger()

# Define FastAPI app
app = FastAPI()

# Include the OCR router
app.include_router(csv_router)


@app.get('/ping')
async def ping():
    return "backend server is up"

