import sys
import json
import google.generativeai as genai
from PIL import Image

# Configure the Gemini API Key
genai.configure(api_key="AIzaSyBkHPWBOwk4O7D73q7zkAdTUitXqO1c9AY")

def process_image(image_path):
    try:
        image = Image.open(image_path)

        # Call Gemini AI with a structured response prompt
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([
            """Analyze the products in the image and provide the sustainability rating for each product. For each product, give Recycling Tips worth 10 lines. Try to avoid suggesting recycling centres and instead help the user make the best out of the products themselves.
            
            ⚠️ **IMPORTANT:** Return **ONLY** a valid JSON array. Each item in the array should represent a product. No extra text, no explanations, sustainability rating should be out of 5.  
            
            JSON format:
            ```
            [
                {
                    "Product Name": "string",
                    "Brand": "string",
                    "Ingredients Impact": "string",
                    "Packaging Material": "string",
                    "Carbon Footprint": "string",
                    "Recycling Feasibility": "string",
                    "Alternative Options": "string",
                    "Sustainability Rating": float, 
                    "Health Impact": "string",
                    "Recycling Tips": "string"
                },
                {
                    "Product Name": "string",
                    "Brand": "string",
                    "Ingredients Impact": "string",
                    "Packaging Material": "string",
                    "Carbon Footprint": "string",
                    "Recycling Feasibility": "string",
                    "Alternative Options": "string",
                    "Sustainability Rating": float, 
                    "Health Impact": "string",
                    "Recycling Tips": "string"
                }
            ]
            ```
            Remember: **NO extra text, just pure JSON.**
            """,
            image
        ])

        # Validate response
        if response and hasattr(response, 'text'):
            try:
                # Extract JSON part and return clean data
                json_str = response.text.strip("```json").strip("```")  # Remove Markdown formatting
                structured_data = json.loads(json_str)  # Convert to JSON
                print(json.dumps(structured_data))  # ✅ Proper JSON Output
            except json.JSONDecodeError:
                print(json.dumps({"error": "Invalid JSON response from AI."}))
        else:
            print(json.dumps({"error": "No valid response from AI."}))

    except Exception as e:
        print(json.dumps({"error": f"Error processing image: {str(e)}"}))

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]  # Get image path from Node.js
        process_image(image_path)
    else:
        print(json.dumps({"error": "No image path provided."}))