import sys
import json
import google.generativeai as genai

# Configure the Gemini API Key
genai.configure(api_key="AIzaSyASbU8qMs6eSKPO2lrO2uTH2Re9BK9XFFE")

def analyze_product(product_data):
    try:
        # Extract product details
        title = product_data.get('title', '')
        description = product_data.get('description', '')
        brand = product_data.get('brand', '')
        price = product_data.get('price', '')
        specifications = product_data.get('specifications', {})

        # Format specifications for the prompt
        specs_text = ""
        if specifications:
            specs_text = "\nProduct Specifications:\n" + "\n".join([
                f"- {key}: {value}"
                for key, value in specifications.items()
            ])

        # Call Gemini AI with a structured response prompt
        model = genai.GenerativeModel("gemini-2.0-flash")
        response = model.generate_content([
            """Analyze the product and provide a detailed sustainability assessment.

            ⚠️ **IMPORTANT:** Return **ONLY** a valid JSON object. No extra text, no explanations.  

            JSON format:
            ```json
            {
                "title": "string",
                "score": float,
                "analysis": {
                    "environmental": "string",
                    "health": "string",
                    "social": "string"
                },
                "recommendations": {
                    "environmental": ["string"],
                    "health": ["string"],
                    "social": ["string"]
                },
                "certifications": ["string"],
                "key_features": {
                    "positive": ["string", "string"],
                    "negative": ["string", "string"]
                }
            }
            ```

            Product Details:
            - Title: """ + title + """
            - Brand: """ + brand + """
            - Description: """ + description + """
            - Price: """ + price + """
            """ + specs_text + """

            Note: Score should be out of 5, not 10.

            **CRITICAL FORMAT REQUIREMENTS:**
            1. The recommendations MUST be a nested object with three categories:
               ```json
               "recommendations": {
                   "environmental": ["specific recommendation 1"],
                   "health": ["specific recommendation 1"],
                   "social": ["specific recommendation 1"]
               }
               ```

            2. DO NOT return recommendations as a flat array or string.

            3. Each category MUST be an array of strings, even if it's just one recommendation.

            4. Example of correct format:
               ```json
               "recommendations": {
                   "environmental": ["Replace plastic packaging with biodegradable materials"],
                   "health": ["Remove artificial preservatives"],
                   "social": ["Implement fair trade certification"]
               }
               ```

            **ONLY return JSON, no extra text!**
            """
        ])

        # Debug: Print raw API response
        print("Raw API Response:", response.text, file=sys.stderr)

        # Validate response
        if response and hasattr(response, 'text'):
            try:
                # Extract JSON part and return clean data
                json_str = response.text.strip("```json").strip("```").strip()
                structured_data = json.loads(json_str)  # Convert to JSON
                
                # Force proper recommendations structure
                if 'recommendations' in structured_data:
                    recommendations = structured_data['recommendations']
                    
                    # If recommendations is a list or string, convert to proper structure
                    if isinstance(recommendations, (list, str)):
                        structured_data['recommendations'] = {
                            "environmental": ["No specific recommendation available."],
                            "health": ["No specific recommendation available."],
                            "social": ["No specific recommendation available."]
                        }
                    # If recommendations is a dict but missing categories
                    elif isinstance(recommendations, dict):
                        for category in ['environmental', 'health', 'social']:
                            if category not in recommendations:
                                recommendations[category] = ["No specific recommendation available."]
                            elif not isinstance(recommendations[category], list):
                                recommendations[category] = [recommendations[category]]
                
                # Debug: Print structured data
                print("Structured Data:", json.dumps(structured_data, indent=2), file=sys.stderr)
                
                # Ensure exact JSON scheme
                output = {
                    "title": structured_data.get('title', ''),
                    "score": structured_data.get('score', 0),
                    "analysis": {
                        "environmental": structured_data.get('analysis', {}).get('environmental', ''),
                        "health": structured_data.get('analysis', {}).get('health', ''),
                        "social": structured_data.get('analysis', {}).get('social', '')
                    },
                    "recommendations": {
                        "environmental": ["No specific recommendation available."],
                        "health": ["No specific recommendation available."],
                        "social": ["No specific recommendation available."]
                    },
                    "certifications": structured_data.get('certifications', []),
                    "key_features": {
                        "positive": structured_data.get('key_features', {}).get('positive', []),
                        "negative": structured_data.get('key_features', {}).get('negative', [])
                    }
                }
                
                print(json.dumps(output))  # ✅ Proper JSON Output
            except json.JSONDecodeError as e:
                print("JSON Decode Error:", str(e), file=sys.stderr)
                print(json.dumps({
                    "error": "Invalid JSON response from AI.",
                    "title": title,
                    "score": 0,
                    "analysis": {
                        "environmental": "Failed to analyze product.",
                        "health": "Failed to analyze product.",
                        "social": "Failed to analyze product."
                    },
                    "recommendations": {
                        "environmental": ["Please try again later."],
                        "health": ["Please try again later."],
                        "social": ["Please try again later."]
                    },
                    "certifications": [],
                    "key_features": {
                        "positive": [],
                        "negative": []
                    }
                }))
        else:
            print("No valid response from AI", file=sys.stderr)
            print(json.dumps({
                "error": "No valid response from AI.",
                "title": title,
                "score": 0,
                "analysis": {
                    "environmental": "Failed to analyze product.",
                    "health": "Failed to analyze product.",
                    "social": "Failed to analyze product."
                },
                "recommendations": {
                    "environmental": ["Please try again later."],
                    "health": ["Please try again later."],
                    "social": ["Please try again later."]
                },
                "certifications": [],
                "key_features": {
                    "positive": [],
                    "negative": []
                }
            }))

    except Exception as e:
        print("Error:", str(e), file=sys.stderr)
        print(json.dumps({
            "error": f"Error analyzing product: {str(e)}",
            "title": title,
            "score": 0,
            "analysis": {
                "environmental": "An unexpected error occurred.",
                "health": "An unexpected error occurred.",
                "social": "An unexpected error occurred."
            },
            "recommendations": {
                "environmental": ["Please try again later."],
                "health": ["Please try again later."],
                "social": ["Please try again later."]
            },
            "certifications": [],
            "key_features": {
                "positive": [],
                "negative": []
            }
        }))

if __name__ == "__main__":
    try:
        # Read input JSON from stdin
        input_data = sys.stdin.read()
        product = json.loads(input_data)
        analyze_product(product)
    except json.JSONDecodeError:
        print("Invalid input JSON", file=sys.stderr)
        print(json.dumps({
            "error": "Invalid input JSON",
            "title": "",
            "score": 0,
            "analysis": {
                "environmental": "Failed to parse input.",
                "health": "Failed to parse input.",
                "social": "Failed to parse input."
            },
            "recommendations": {
                "environmental": ["Please try again."],
                "health": ["Please try again."],
                "social": ["Please try again."]
            },
            "certifications": [],
            "key_features": {
                "positive": [],
                "negative": []
            }
        }))
    except Exception as e:
        print("Unexpected error:", str(e), file=sys.stderr)
        print(json.dumps({
            "error": f"Unexpected error: {str(e)}",
            "title": "",
            "score": 0,
            "analysis": {
                "environmental": "An unexpected error occurred.",
                "health": "An unexpected error occurred.",
                "social": "An unexpected error occurred."
            },
            "recommendations": {
                "environmental": ["Please try again later."],
                "health": ["Please try again later."],
                "social": ["Please try again later."]
            },
            "certifications": [],
            "key_features": {
                "positive": [],
                "negative": []
            }
        })) 