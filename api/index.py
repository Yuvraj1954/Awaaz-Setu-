from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# --- MONGODB CONNECTION ---
# Using your exact URI and credentials
MONGO_URI = "mongodb+srv://yuvrajk863888_db_user:aMnHBizntIPta5VX@cluster0.x4euc3w.mongodb.net/awaaz_setu_db?retryWrites=true&w=majority&appName=Cluster0"

try:
    client = MongoClient(MONGO_URI)
    db = client['awaaz_setu_db']
    logs_collection = db['query_logs']
    # Trigger a connection test
    client.admin.command('ping')
    print("✅ Success: Connected to MongoDB Atlas!")
except Exception as e:
    print(f"❌ Error: Could not connect to MongoDB. Details: {e}")

KNOWLEDGE = {
    "ayushman": {
        "en": "Ayushman Bharat provides up to 5 lakh rupees of free health cover per family per year. Check eligibility at any PMJAY hospital.",
        "hi": "आयुष्मान भारत प्रति परिवार 5 लाख रुपये तक का मुफ्त स्वास्थ्य कवर प्रदान करता है। PMJAY अस्पताल में जांच करें।"
    },
    "emergency": {
        "en": "Emergency detected. Dial 112 for Police or 108 for an Ambulance immediately.",
        "hi": "आपातकाल की स्थिति। तुरंत पुलिस के लिए 112 या एम्बुलेंस के लिए 108 डायल करें।"
    },
    "hospital": {
        "en": "The nearest Government Hospital is available 24/7. Use your Ayushman card for free care.",
        "hi": "निकटतम सरकारी अस्पताल 24/7 उपलब्ध है। मुफ्त इलाज के लिए आयुष्मान कार्ड का उपयोग करें।"
    },
    "default": {
        "en": "I can help with Hospitals, Ration Cards, and Government schemes. Try asking about Ayushman Bharat.",
        "hi": "मैं अस्पताल, राशन कार्ड और सरकारी योजनाओं में मदद कर सकता हूँ। आयुष्मान भारत के बारे में पूछें।"
    }
}

def get_intent(text):
    t = text.lower()
    if any(x in t for x in ["ayushman", "bharat", "pmjay", "आयुष्मान", "भारत"]): return "ayushman"
    if any(x in t for x in ["police", "112", "108", "emergency", "पुलिस"]): return "emergency"
    if any(x in t for x in ["hospital", "doctor", "medical", "अस्पताल", "डॉक्टर"]): return "hospital"
    return "default"

@app.route("/api/query", methods=["POST"])
def handle_query():
    try:
        data = request.json
        user_text = data.get("text", "")
        lang = data.get("language", "en")
        
        intent = get_intent(user_text)
        response_text = KNOWLEDGE[intent][lang]

        # Log to MongoDB
        log_entry = {
            "text": user_text,
            "response": response_text,
            "language": lang,
            "intent": intent,
            "timestamp": datetime.utcnow()
        }
        logs_collection.insert_one(log_entry)

        return jsonify({"response": response_text})
    except Exception as e:
        return jsonify({"response": "Error saving to database", "details": str(e)}), 500

@app.route("/api/history", methods=["GET"])
def get_history():
    try:
        # Fetch last 50 logs, newest first
        history = list(logs_collection.find().sort("timestamp", -1).limit(50))
        for item in history:
            item["_id"] = str(item["_id"])
            if "timestamp" in item:
                item["time"] = item["timestamp"].strftime("%b %d, %H:%M")
            else:
                item["time"] = "N/A"
        return jsonify(history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/clear", methods=["POST"])
def clear_history():
    try:
        logs_collection.delete_many({})
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Required for Vercel
app = app

if __name__ == "__main__":
    app.run(debug=True)
