from typing import List, Tuple, Dict, Any


def build_classify_csv_prompt(
    categories: List[str],
    descriptions: List[str],
) -> Tuple[str, Dict[str, Any], Dict[str, Any]]:
    output_shape = """
    {
        [category]: {
            name: description, // description of financial item
            confidence: number // confidence level of the categorization
            reason: string // reasoning for confidence level
        }
    }
    """
    extra_rules = """
        - "pets plus us" categorizes to "Gimbap Insurance""
        - "petsmart" categorizes to "Pet food"
        - "coquitlam" categorizes to "EV Charging+ parking" because it refers to city parking
        - "payment from -" categorizes to debit
        - "body energy club" categorizes to "food"
        - "uber eats" categorizes to "food"
    """
    prompt = f"""
        Imagine you are a general accountant and I am a Canadian consumer living in Vancouver, B.C. I will provide you with 2 arrays. The first array will include a list of categories. The second array will include a list of financial statement descriptions. You must do the following:
        - categorize each description to the predefined category as best as you can
        - if a description doesn't belong to any predefined category, categorize it as "uncategorized"
        - the output should be a JSON object with the following shape:
        - {output_shape}
        - any item that has confidence level lower than 0.6 should be categorized as "uncategorized"
        - summarize your reasoning for the confidence level in a single sentence
        - do not assume order specifics, categorize solely based on description
        - do not make up any descriptions
        - do not change the descriptions
        - the keys of the output object must match the first array
        - for each description, if it matches a company name, use the context of the company to help categorize
        - in general, groceries categorizes to "food"

        Follow these extra rules:
        {extra_rules}

        The inputs will follow === inputs === and separated by newline.
        === inputs ===
        {categories}\n
        {descriptions}
    """
    output_schema = {}
    item_schema = {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "confidence": {"type": "number", "minimum": 0, "maximum": 1},
            "reason": {"type": "string"},
        },
        "required": ["name", "confidence", "reason"],
        "additionalProperties": False,
    }
    for category in categories:
        output_schema[category] = {"type": "array", "items": item_schema}
    text_format = {
        "format": {
            "type": "json_schema",
            "name": "line_items",
            "schema": {
                "type": "object",
                "properties": output_schema,
                "additionalProperties": False,
                "required": list(output_schema.keys()),
            },
            "strict": False,  # TODO: parallelize the call instead
        }
    }

    return prompt, text_format


def build_ocr_pdf_prompt() -> Tuple[str, Dict[str, Any]]:
    prompt = """
        Parse the uploaded PDF file as a credit card statement into an array of line items. Parse using the following rules:
        - look for amounts and charges made as a table, then parse each line into the output schema.
        - if there are 2 date columns, check the table header and use the transaction date as the output.
        - ignore any text that doesn't fit into the output schema.
        - if the transaction is a payment, then treat that line item type as credit. Otherwise, and by default, treat it as debit since this is a credit card balance
        - state the confidence of the text extraction in the confidence as a number, and the reason as a string
    """
    text_format = {
        "format": {
            "type": "json_schema",
            "name": "transaction_list",
            "strict": False,
            "schema": {
                "type": "object",
                "items": {
                    "type": "object",
                    "properties": {
                        "date": {"type": "string", "format": "date"},
                        "description": {"type": "string"},
                        "amount": {"type": "number"},
                        "confidence": {"type": "string"},
                        "reason": {"type": "number"},
                    },
                    "required": [
                        "date",
                        "description",
                        "amount",
                        "confidence",
                        "number",
                    ],
                    "additionalProperties": False,
                },
                "properties": {},
                "required": ["items"],
            },
        }
    }

    return prompt, text_format
