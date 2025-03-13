import sys
import google.generativeai as genai
from PIL import Image

# Configure the Gemini API Key
genai.configure(api_key="AIzaSyBkHPWBOwk4O7D73q7zkAdTUitXqO1c9AY")

def process_image(image_path):
    try:
        image = Image.open(image_path)

        # Call Gemini AI
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content(["With the information about the nutritional facts and packaging information in this image, can you provide me a sustainability rating for the product in the image scrape the web for the product info and also tell me if possible (Just 2 - 3 lines is enough) Also provide a Sustainability Rating for the product based on what you found?", image])

        print(response.text)  # Send result back to Node.js
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    image_path = sys.argv[1]  # Get image path from Node.js
    process_image(image_path)
