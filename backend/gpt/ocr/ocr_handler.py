import asyncio
import json
import uuid
import streamingjson

from gpt.completions import Completions
from gpt.prompts import build_ocr_pdf_prompt

from dotenv import load_dotenv

load_dotenv()
from utils.logger import setup_logger

logger = setup_logger()

COMPLETED_EVENT = "event: completed\n"
DELTA_EVENT = "event: delta\n"
EVENT_DELIMITER = "============\n\n"


class OcrHandler:
    def __init__(self):
        self.gpt_client = Completions(model="gpt-4.1")
        self.stream = {}

    def parse_pdf(self, pdf_base64: str) -> str:
        prompt, text_format = build_ocr_pdf_prompt()
        response = self.gpt_client.ask(
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
            stream=False,
        )

        response_json = json.loads(response)
        return response_json

    def create_stream(self, pdf_base64: str):
        stream_id = str(uuid.uuid4())
        stream = {"id": stream_id, "pdf_base64": pdf_base64}
        self.stream = stream

        logger.info(f"Created stream with id {stream_id}")
        return stream_id

    async def stream_pdf(self, id: str):
        if self.stream["id"] != id:
            err_msg = f"Requested {repr(id)} is not same as {repr(self.stream['id'])}"
            logger.info(err_msg)
            raise ValueError(err_msg)

        pdf_base64 = self.stream["pdf_base64"]
        prompt, text_format = build_ocr_pdf_prompt()

        stream = self.gpt_client.stream_create(
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
            stream=True,
        )

        lexer = streamingjson.Lexer()

        for event in stream:
            if event.type == "response.refusal.delta":
                yield event.delta
            elif event.type == "response.output_text.delta":
                lexer.append_string(event.delta)
                try:
                    parsed = lexer.complete_json()
                except Exception as e:
                    # If the buffer is not a complete JSON, continue accumulating
                    print(f"Buffer not complete: {e}")
                    continue
                # yield DELTA_EVENT
                yield parsed
                # yield EVENT_DELIMITER

            elif event.type == "response.error":
                raise Exception(f"Error in streaming response: {event.error}")
            elif event.type == "response.completed":
                final_result = event.response.to_json()
                # yield COMPLETED_EVENT
                yield f"${EVENT_DELIMITER}{json.dumps(final_result)}"

            # for some reason needed to create this for websocket to push messages to frontend
            await asyncio.sleep(0)
