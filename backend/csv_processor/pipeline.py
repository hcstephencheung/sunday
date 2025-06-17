import json
from serializers.api_serializers import (
    ClassifiedCategoryDescriptions,
    ClassifiedDescriptionsCategories,
)
from utils.logger import setup_logger
from gpt.prompts import build_classify_csv_prompt
from gpt.completions import Completions

logger = setup_logger()


class CsvProcessorPipeline:
    def __init__(self):
        self.gpt_client = Completions(model="gpt-4.1")

    def preprocess_descriptions(self, requested_descriptions):
        """
        Check if categories requested are cached. return un-cached categories.
        """
        if not requested_descriptions:
            return []

        deduplicated_descriptions = list(
            set(desc.lower() for desc in requested_descriptions)
        )
        return deduplicated_descriptions

    def postprocess_descriptions(
        self, classified_categories_descriptions: ClassifiedCategoryDescriptions
    ):
        """
        Add newly processed categories to the cache.
        """
        logs = ""
        descriptions_categories_dict = {}
        for category, descriptions in classified_categories_descriptions.items():
            sanitized_category = category.lower()
            for description in descriptions:
                description_name = (
                    f'{description["name"]}' if description["name"] else ""
                )
                sanitized_description_name = description_name.lower()

                if sanitized_description_name is not "":
                    descriptions_categories_dict[sanitized_description_name] = (
                        sanitized_category
                    )
                    logs = f'{logs}\n{sanitized_description_name} was categorized as {sanitized_category} at {description["confidence"]}. Reason: {description["reason"]}'

        logger.info(f"Post processed CSV items: \n{logs}")
        return descriptions_categories_dict

    def classify_csv_items(
        self, categories: str, descriptions: str
    ) -> ClassifiedDescriptionsCategories:
        """
        Classify descriptions into categories using GPT. Categories and descriptions will be
        de-duplicated before processing. Results will be cached on instance to reduce cost.
        """
        deduplicated_categories = list(set(categories))
        unclassified_descriptions = self.preprocess_descriptions(descriptions)

        if len(unclassified_descriptions) == 0:
            # return early if empty, skip gpt
            return {}

        logger.info(f"Input descriptions {unclassified_descriptions}")
        logger.info(f"Input categories {deduplicated_categories}")

        prompt, text_format = build_classify_csv_prompt(
            categories=deduplicated_categories, descriptions=unclassified_descriptions
        )

        output = self.gpt_client.ask(
            input=[
                {"role": "system", "content": [{"type": "input_text", "text": prompt}]},
            ],
            text=text_format,
            reasoning={},
            tools=[],
            temperature=0,
            max_output_tokens=2048,
            top_p=1,
            store=True,
        )

        json_output = json.loads(output)

        # includes cached items and newly classified items
        combined_items = self.postprocess_descriptions(json_output)

        # returns { [description_name]: category }
        return combined_items
