from flask import Flask, render_template, request, jsonify
from services.groq_service import GroqService
from utils.calculator import ConstructionCalculator
import os
import re
import json

app = Flask(__name__)
# app.secret_key = ... (Removed)

# --- APP ROUTES ---
@app.route('/')
def index():
    return render_template('dashboard.html')

@app.route('/api/calculate', methods=['POST'])
def calculate():
    data = request.json
    area = int(data.get('area', 1000))
    floors = int(data.get('floors', 1))
    project_type = data.get('type', 'Residential')
    budget_pref = data.get('budget', 'Standard')
    timeline_pref = data.get('timeline', 'Standard')
    country = data.get('country', 'India')
    currency = data.get('currency', 'INR')
    
    # Deterministic Calcs
    materials = ConstructionCalculator.calculate_material_estimates(area, floors)
    costs = ConstructionCalculator.calculate_cost_breakdown(
        area, 
        floors, 
        quality=budget_pref, 
        country=country, 
        target_currency=currency
    )
    
    # Context Construction
    calc_context = f"\n\n[CONTEXT DATA]:\n" \
                   f"Project: {project_type}, {area} sq ft, G+{floors}.\n" \
                   f"Constraints: Budget={budget_pref}, TimelinePriority={timeline_pref}.\n" \
                   f"Deterministic Calc Results:\n" \
                   f"- Total Area: {materials['total_built_up_area_sqft']} sqft\n" \
                   f"- Est Cost: {costs['total_estimated_cost']}\n" \
                   f"- Cement: {materials['cement_bags']} bags\n" \
                   f"- Steel: {materials['steel_kg']} kg\n" \
                   f"If TimelinePriority is 'Fast Track', reduce total weeks by 20-30% and increase worker count." \
                   f"Use these exact figures in the JSON response."

    user_message = f"Generate a construction plan for a {project_type} building, {area} sq ft, G+{floors} floors. Priority: {timeline_pref}."
    messages = [{"role": "user", "content": user_message + calc_context}]
    
    response = GroqService.get_chat_response(messages)
    
    if "error" in response:
        return jsonify({"error": response["error"]}), 500
        
    try:
        ai_content = response['choices'][0]['message']['content']
        ai_json = json.loads(ai_content)
        
        # Merge deterministic data (Force calculator values over AI values)
        # This ensures our detailed breakdown is always present and accurate
        ai_json.update(costs)
        
        return jsonify(ai_json)
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to parse AI response. Please try again."}), 500

if __name__ == '__main__':
    #print("Starting BuildWise (Groq Edition) on http://localhost:5002")
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
