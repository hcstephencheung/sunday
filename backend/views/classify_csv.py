import json
import base64
from fastapi import APIRouter, Form, HTTPException, File, UploadFile
from gpt.completions import Completions
from gpt.prompts import build_ocr_pdf_prompt
from utils.logger import setup_logger
from csv_processor.pipeline import CsvProcessorPipeline

from serializers.csv_serializers import ClassifyCsvResponse, ClassifyRequest

logger = setup_logger()
csv_router = APIRouter(prefix="/api/csv")

CsvProcessorClient = CsvProcessorPipeline()

@csv_router.get("/ping")
async def ping():
    return "CSV classification service is up and running"

@csv_router.post("/classify", response_model=ClassifyCsvResponse)
async def classify_line_items(request: ClassifyRequest):
    try:
        # Validate and process each line item
        line_items = request.line_items
        categories = request.desired_categories

        descriptions = [item.description for item in line_items]

        classified_items = CsvProcessorClient.classify_csv_items(categories, descriptions)

        return { "classified_items": classified_items }
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@csv_router.post("/pdf")
async def classify_pdf(pdf_base64: str = Form(...)):
    try:
        gpt_client = Completions(model="gpt-4.1")
        prompt, text_format = build_ocr_pdf_prompt()
        ocr_result = gpt_client.ask(
            input=[
                {
                "role": "system",
                "content": [
                    {
                    "type": "input_text",
                    "text": "Parse the uploaded PDF file as a credit card statement into an array of line items. Parse using the following rules:\n- look for amounts and charges made as a table, then parse each line into the output schema.\n- if there are 2 date columns, check the table header and use the transaction date as the output.\n- ignore any text that doesn't fit into the output schema.\n- if the transaction is a payment, then treat that line item type as credit. Otherwise, and by default, treat it as debit since this is a credit card balance\n- state the confidence of the text extraction in the confidence as a number, and the reason as a string"
                    }
                ]
                },
                {
                "role": "user",
                "content": [
                    {
                    "type": "input_file",
                    "filename": "cibc.pdf",
                    "file_data": pdf_base64
                    }
                ]
                }
            ],
            text={
                "format": {
                "type": "json_schema",
                "name": "transaction_list",
                "strict": False,
                "schema": {
                    "type": "object",
                    "items": {
                    "type": "object",
                    "properties": {
                        "date": {
                        "type": "string",
                        "format": "date"
                        },
                        "description": {
                        "type": "string"
                        },
                        "amount": {
                        "type": "number"
                        },
                        "confidence": {
                        "type": "string"
                        },
                        "reason": {
                        "type": "number"
                        }
                    },
                    "required": [
                        "date",
                        "description",
                        "amount",
                        "confidence",
                        "number"
                    ],
                    "additionalProperties": False
                    },
                    "properties": {},
                    "required": []
                }
                }
            },
            reasoning={},
            tools=[],
            temperature=0,
            max_output_tokens=8192,
            top_p=1,
            store=True
        )
        ocr_json = json.loads(ocr_result)
        return ocr_json
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
