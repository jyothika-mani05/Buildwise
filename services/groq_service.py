import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

class GroqService:
    API_URL = "https://api.groq.com/openai/v1/chat/completions"
    API_KEY = os.getenv("GROQ_API_KEY")
    MODEL = "llama-3.1-8b-instant"

    @staticmethod
    def get_chat_response(messages, system_instruction=None):
        if not GroqService.API_KEY:
            return {"error": "GROQ_API_KEY not found in environment variables."}

        headers = {
            "Authorization": f"Bearer {GroqService.API_KEY}",
            "Content-Type": "application/json"
        }

        default_system = (
            "You are BuildWise, an expert construction consultant for Hyderabad, India. "
            "Return ONLY an unformatted JSON object. Do not include markdown formatting like ```json ... ```. "
            "Structure the JSON with the following keys: "
            "'summary' (string), "
            "'cost_breakdown' (object with keys: 'material', 'labor', 'other', 'total'), "
            "'materials' (object with keys: 'cement', 'steel', 'sand', 'bricks'), "
            "'timeline_weeks' (integer), "
            "'schedule_phases' (list of objects with 'phase', 'start_week' (int), 'end_week' (int), 'description'), "
            "'risks' (list of strings), "
            "'optimizations' (list of strings), "
            "'workers_per_day' (string description). "
            "Ensure phases are strictly sequential with NO GAPS. (e.g., Phase 1: 1-4, Phase 2: 5-8). "
            "Provide accurate estimates based on Hyderabad rates (~1800-2500 INR/sqft)."
        )
        
        if system_instruction:
            default_system += f" {system_instruction}"

        # Ensure system message is first
        full_messages = [{"role": "system", "content": default_system}] + messages

        payload = {
            "model": GroqService.MODEL,
            "messages": full_messages,
            "temperature": 0.5, # Lower temperature for more consistent JSON
            "max_tokens": 4096,
            "response_format": {"type": "json_object"}
        }

        try:
            response = requests.post(GroqService.API_URL, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e)}
