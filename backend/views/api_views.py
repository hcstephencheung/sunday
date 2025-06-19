import json
import base64
from fastapi import APIRouter, Form, HTTPException, File, UploadFile
from fastapi.responses import StreamingResponse
from gpt.completions import Completions
from gpt.ocr.ocr_handler import OcrHandler
from gpt.prompts import build_ocr_pdf_prompt
from utils.logger import setup_logger
from csv_processor.pipeline import CsvProcessorPipeline

from serializers.api_serializers import ClassifyCsvResponse, ClassifyRequest

logger = setup_logger()
api_router = APIRouter(prefix="/api")

CsvProcessorClient = CsvProcessorPipeline()
ocr_parser = OcrHandler()


@api_router.get("/ping")
async def ping():
    return "CSV classification service is up and running"


@api_router.post("/classify", response_model=ClassifyCsvResponse)
async def classify_line_items(request: ClassifyRequest):
    try:
        # Validate and process each line item
        line_items = request.line_items
        categories = request.desired_categories

        descriptions = [item.description for item in line_items]

        classified_items = CsvProcessorClient.classify_csv_items(
            categories, descriptions
        )

        return {"classified_items": classified_items}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.post("/pdf")
async def classify_pdf(pdf_base64: str = Form(...)):
    result = None
    try:
        result = ocr_parser.parse_pdf(pdf_base64)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return result


@api_router.post("/pdf/stream")
async def classify_pdf_stream(pdf_base64: str = Form(...)):
    result = None
    try:
        result = ocr_parser.create_stream(pdf_base64)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.get("/pdf/stream")
async def output_pdf_stream(id: str):
    result = None
    try:
        result = ocr_parser.stream_pdf(id)
        return StreamingResponse(result, media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
