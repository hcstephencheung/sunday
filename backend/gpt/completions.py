import os
from openai import OpenAI
from pydantic import BaseModel

from dotenv import load_dotenv

load_dotenv()

from gpt.mock_response import mock_response
from utils.logger import setup_logger
logger = setup_logger()

class Completions:
    def __init__(self, model="gpt-4.1"):
        self.model = model
        self.client = OpenAI(
            api_key=os.environ.get("OPEN_AI_API_KEY")
        )

    def ask(self, input, text, reasoning, tools, temperature=0.1, max_output_tokens=2048, top_p=1, store=True):
        # return mock_response()
        response = self.client.responses.parse(
            model=self.model,
            input=input,
            text=text,
            reasoning=reasoning,
            tools=tools,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            top_p=top_p,
            store=store
        )
        logger.info(f'OpenAI response: {response.output_text}')
        
        return response.output_text
    
    def create(self, input, text, reasoning, tools, temperature=0.1, max_output_tokens=2048, top_p=1, store=True):
        # return mock_response()
        response = self.client.responses.create(
            model=self.model,
            input=input,
            text=text,
            reasoning=reasoning,
            tools=tools,
            temperature=temperature,
            max_output_tokens=max_output_tokens,
            top_p=top_p,
            store=store
        )
        logger.info(f'OpenAI response: {response.output_text}')
        
        return response.output_text
