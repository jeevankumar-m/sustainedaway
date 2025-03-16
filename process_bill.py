import sys
import json
import google.generativeai as genai
from PIL import Image

# Configure Gemini API Key
genai.configure(api_key="AIzaSyBkHPWBOwk4O7D73q7zkAdTUitXqO1c9AY")

def process_bill(image_path):
    try:
        image = Image.open(image_path)

        # Call Gemini AI with a structured response prompt
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([
            """Extract all product details from the bill image and analyze their sustainability.  

            ⚠️ **IMPORTANT:** Return **ONLY** a valid JSON object. No extra text, no explanations.

            JSON format:
            ```
            {
                "products": [
                    {
                        "Product Name": "string",
                        "Brand": "string",
                        "Ingredients Impact": "string",
                        "Packaging Material": "string",
                        "Carbon Footprint": "string",
                        "Recycling Feasibility": "string",
                        "Alternative Options": "string",
                        "Sustainability Rating": float
                    }
                ],
                "Overall Sustainability Score": float,
                "Recommendations": "string"
            }
            ```

            Ensure accurate product extraction from the receipt and provide sustainability insights.

            Remember: **NO extra text, just pure JSON.**
            """,
            image
        ])

        # Validate response
        if response and hasattr(response, 'text'):
            try:
                json_str = response.text.strip("```json").strip("```")  # Remove Markdown formatting
                structured_data = json.loads(json_str)  # Convert to JSON
                print(json.dumps(structured_data))  # ✅ Proper JSON Output
            except json.JSONDecodeError:
                print(json.dumps({"error": "Invalid JSON response from AI."}))
        else:
            print(json.dumps({"error": "No valid response from AI."}))

    except Exception as e:
        print(json.dumps({"error": f"Error processing bill: {str(e)}"}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]  # Get image path from Node.js
        process_bill(image_path)
    else:
        print(json.dumps({"error": "No image path provided."}))
