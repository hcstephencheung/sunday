import json
import base64
from fastapi import APIRouter, Form, HTTPException, File, UploadFile
from gpt.completions import Completions
from gpt.prompts import build_ocr_pdf_prompt
from utils.logger import setup_logger
from csv_processor.pipeline import CsvProcessorPipeline

from serializers.api_serializers import ClassifyCsvResponse, ClassifyRequest

logger = setup_logger()
api_router = APIRouter(prefix="/api")

CsvProcessorClient = CsvProcessorPipeline()


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
    try:
        gpt_client = Completions(model="gpt-4.1")
        prompt, text_format = build_ocr_pdf_prompt()
        ocr_result = gpt_client.ask(
            input=[
                {"role": "system", "content": [{"type": "input_text", "text": prompt}]},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_file",
                            "filename": "cc.pdf",
                            "file_data": pdf_base64,
                        }
                    ],
                },
            ],
            text=text_format,
            reasoning={},
            tools=[],
            temperature=0,
            max_output_tokens=8192,
            top_p=1,
            store=True,
        )
        ocr_json = json.loads(ocr_result)
        return ocr_json
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
