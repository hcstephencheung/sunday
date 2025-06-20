import json
import uuid

from fastapi.responses import JSONResponse
from gpt.completions import Completions
from gpt.prompts import build_ocr_pdf_prompt
from openai.types.responses import ResponseOutputItem, ResponseOutputMessage

from dotenv import load_dotenv

load_dotenv()
from utils.logger import setup_logger

logger = setup_logger()


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

    def stream_pdf(self, id: str):
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

        for event in stream:
            if event.type == "response.refusal.delta":
                print(event.delta, flush=True, end="")
                yield event.delta
            elif event.type == "response.output_text.delta":
                # print(event.delta, flush=True, end="")
                # TODO: NEED TO PARSE THIS PROPERLY before yielding BECAUSE IT'S OUTPUTTING CHARACTERS
                yield f"data: {event.delta}\n"
            elif event.type == "response.error":
                print(event.error, flush=True, end="")
                raise Exception(f"Error in streaming response: {event.error}")
            elif event.type == "response.completed":
                # TODO: this doesn't get flushed for some reason
                print("Completed", flush=True, end="")
                print(event.response.output, flush=True, end="")
                for output_message in event.response.output:
                    if isinstance(output_message, ResponseOutputMessage):
                        full_output = [
                            # we know it's a completed message
                            content.text
                            for content in output_message.content
                        ]
                        yield f"event: completed\n"
                        yield f"data: {''.join(full_output)}\n"

                yield f"event: end\n"
