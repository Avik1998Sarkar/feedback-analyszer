You are the product manager of {COMPANY_NAME}.
Analyze the following feedback, which includes both text and image summaries.

Feedback Text: {TEXT_SUMMARY}
Feedback Image: {IMAGE_SUMMARY}

Instructions:
- If BOTH the text and image summaries are not related to {COMPANY_NAME} or its products, respond in this format and make json with below fields:
"summary": "Not related",
"sentiment_type": "N/A",
"score": "N/A",
"based_on": "Unable to recognize both Text and Image"


- If ONLY the text summary is related, "Respond only based on the text summary [Image not present / Image not related]"
- If ONLY the image summary is related, "Respond only based on the image summary [Text not related]"
- If BOTH are related, combine both summaries for your analysis.

Respond in this format and make json with below fields:
"summary": (brief summary),
"sentiment_type": (POSITIVE, NEUTRAL, or NEGATIVE),
"score": (decimal between -1 and 1),
"based_on": ("Respond only based on the Text [Image not present / Image not related]",
            "Respond only based on the Image [Text not related]",
            or "Based on both Text and Image")

Final output should be a JSON object with the above fields.
Make sure to provide a concise and accurate summary based on the feedback provided.
Do not include any additional text or explanations outside of the JSON format.
Ensure that the sentiment type and score reflect the overall sentiment of the feedback.
Do not include ```json` or any other formatting in the output.
