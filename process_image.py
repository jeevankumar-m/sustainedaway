import sys
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
            """Analyze the product in the image and provide the sustainability rating in a structured format.
            Format:
            Product Name: <Product Name>
            Brand: <Brand>
            Ingredients Impact: <Description>
            Packaging Material: <Description>
            Carbon Footprint: <Description>
            Recycling Feasibility: <Description>
            Alternative Options: <Description>
            Sustainability Rating (out of 5): <Rating>
            """, 
            image
        ])

        # Check if response is valid
        if response and response.text:
            print(response.text.encode("utf-8", "ignore").decode("utf-8"))  # Ensure encoding compatibility
        else:
            print("No valid response from the AI.")

    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        image_path = sys.argv[1]  # Get image path from Node.js
        process_image(image_path)
    else:
        print("Error: No image path provided.")
