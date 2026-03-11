import os
import json
from flask import Flask, render_template, jsonify, request
import google.generativeai as genai
import random
app = Flask(__name__)

# הגדרת מפתח API
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/generate_exam', methods=['POST'])
def generate_exam():
    try:
        if not GEMINI_API_KEY:
            return jsonify({"error": "מפתח API חסר. אנא הגדר GEMINI_API_KEY"}), 500
        
        model = genai.GenerativeModel('gemini-2.5-flash')

        categories = [
            "Biology", "Astronomy", "Physics","Psychology", "Sociology", "Economics","History", "Philosophy", "Archaeology","Arts","Literature", "Biographies", "historical figures"
        ]
        
        # בחירת שתי קטגוריות שונות לחלוטין עבור שני המאמרים
        selected_categories = random.sample(categories, 2)
        cat1, cat2 = selected_categories[0], selected_categories[1]
        
        # פרומפט המשלב את הדרישות האיכותיות, הפורמט המדויק וכמות השאלות המלאה
        prompt = """Create a realistic, full-length AMIRNET English proficiency exam in JSON format.

The exam must have EXACTLY 6 sections with a total of 44 questions:
- Sections 1 & 2: Sentence Completion (10 questions each, total 20)
- Sections 3 & 4: Restatement (6 questions each, total 12)
- Sections 5 & 6: Reading Comprehension (1 passage and 6 questions each, total 12)

### TOPIC SELECTION (CRITICAL):
You must generate the Reading Comprehension passages based on these two randomly selected categories:
1. Passage 1 Category: {cat1}
2. Passage 2 Category: {cat2}

### EXAM STRUCTURE RULES:

Requirements:
- Use academic, challenging vocabulary (CEFR B2-C1 level)
- Sentence completion: test vocabulary in context
- Restatement: test understanding of sentence meaning and structure
- Reading: academic passages (~250 words) with inference, main idea, detail, and vocabulary questions.
- All explanations should be clear and educational
- CRITICAL: Generate completely NEW questions - do NOT copy examples
- Output ONLY valid JSON, no other text

Follow this EXACT structure for the JSON:
{
  "sections": [
    {
      "type": "Sentence Completion 1",
      "instructions": "Choose the best word to complete the sentence.",
      "time_minutes": 10,
      "questions": [
        {
          "text": "The CEO decided to ___ the proposal due to budget constraints.",
          "options": ["curtail", "augment", "reiterate", "exacerbate"],
          "correct_index": 0,
          "explanation": "Curtail means to reduce or restrict something."
        }
      ]
    },
    {
      "type": "Restatement 1",
      "instructions": "Choose the answer that best restates the meaning of the original sentence.",
      "time_minutes": 12,
      "questions": [
        {
          "text": "Hardly had the movie started when the power went out.",
          "options": [
            "The power went out just after the movie began.",
            "The movie started because the power went out.",
            "The power went out before the movie could start.",
            "The movie and power outage were unrelated."
          ],
          "correct_index": 0,
          "explanation": "'Hardly had... when' indicates an event happening immediately after another."
        }
      ]
    },
    {
      "type": "Reading Comprehension 1",
      "instructions": "Read the passage carefully and answer the questions.",
      "time_minutes": 15,
      "passage": "Full academic text here...",
      "questions": [
        {
          "text": "What is the main idea of the passage?",
          "options": ["A", "B", "C", "D"],
          "correct_index": 1,
          "explanation": "The passage primarily discusses..."
        }
      ]
    }
  ]
}"""

        response = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.8,
                "response_mime_type": "application/json"
            }
        )

        if not response.text:
            raise ValueError("Empty response from Gemini API")

        exam_data = json.loads(response.text)
        
        # וידוא מבנה המבחן (6 פרקים)
        if "sections" not in exam_data or len(exam_data["sections"]) != 6:
            raise ValueError(f"Invalid exam structure - expected 6 sections, got {len(exam_data.get('sections', []))}")
        
        return jsonify(exam_data)

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": f"שגיאה ביצירת המבחן: {str(e)}"}), 500

@app.route('/health')
def health():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    # מומלץ להשאיר debug=False בשרת אמיתי
    app.run(host='0.0.0.0', port=5000, debug=False)