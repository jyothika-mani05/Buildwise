# BuildWise - AI Construction Planner (Groq Edition)

BuildWise is an AI-powered construction planning assistant designed for the Hyderabad region. It uses the Groq API (Llama 3 70B) to provide intelligent insights, cost estimates, and schedules, backed by a deterministic calculator for accurate material estimation.

## Features
- **AI Chat Interface**: Ask natural language questions like "Plan a G+2 house on 200 sq yards".
- **Local Construction Data**: Customized for Hyderabad rates and material costs.
- **Fast Responses**: Uses Groq's high-speed inference.
- **Dark Mode UI**: Modern, responsive interface.

## Prerequisites
- Python 3.8+
- Groq API Key (Sign up at [console.groq.com](https://console.groq.com/))

## Installation

1.  **Clone/Setup Project**
    Ensure you have the project files in `buildwise_2`.

2.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure Environment**
    - Rename `.env.example` to `.env`.
    - Add your Groq API key:
        ```
        GROQ_API_KEY=gsk_...
        ```

4.  **Run Application**
    ```bash
    python app.py
    ```

5.  **Access**
    Open your browser and navigate to `http://localhost:5000`.

## file Structure
- `app.py`: Main Flask application.
- `services/groq_service.py`: Handles API interaction.
- `utils/calculator.py`: Logic for area/cost/material calculations.
- `static/`: CSS and JS files.
- `templates/`: HTML templates.

## Usage Scenarios
- **Material Estimation**: "How much cement and steel for 1500 sq ft?"
- **Cost Planning**: "Estimate cost for G+1 in Hyderabad."
- **Scheduling**: "Give me a 6-month schedule for a residential building."
"# Buildwise" 
"# Buildwise" 
