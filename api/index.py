from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Updated Knowledge Base with Ayushman Bharat
KNOWLEDGE = {
    "ayushman": {
        "en": "Ayushman Bharat provides up to 5 lakh rupees of free health cover per family per year for secondary and tertiary care. You can check your eligibility at any PMJAY empanelled hospital.",
        "hi": "आयुष्मान भारत प्रति वर्ष प्रति परिवार 5 लाख रुपये तक का मुफ्त स्वास्थ्य कवर प्रदान करता है। आप किसी भी PMJAY सूचीबद्ध अस्पताल में अपनी पात्रता की जांच कर सकते हैं।"
    },
    "emergency": {
        "en": "Emergency detected. Dial 112 for Police or 108 for an Ambulance immediately.",
        "hi": "आपातकाल की स्थिति। तुरंत पुलिस के लिए 112 या एम्बुलेंस के लिए 108 डायल करें।"
    },
    "hospital": {
        "en": "The nearest Government Hospital or PHC is available 24/7. Use your Ayushman card for free care.",
        "hi": "निकटतम सरकारी अस्पताल या PHC 24/7 उपलब्ध है। मुफ्त इलाज के लिए अपने आयुष्मान कार्ड का उपयोग करें।"
    },
    "ration": {
        "en": "You can apply for a new Ration Card at the State Food Portal. Keep your Aadhaar ready.",
        "hi": "आप राज्य खाद्य पोर्टल पर नए राशन कार्ड के लिए आवेदन कर सकते हैं। अपना आधार तैयार रखें।"
    },
    "default": {
        "en": "I can help with Hospitals, Ration Cards, and Government schemes. Try asking about Ayushman Bharat.",
        "hi": "मैं अस्पताल, राशन कार्ड और सरकारी योजनाओं में मदद कर सकता हूँ। आयुष्मान भारत के बारे में पूछें।"
    }
}

def get_intent(text):
    t = text.lower()
    # Fixed: Added Ayushman Bharat keyword triggers
    if any(x in t for x in ["ayushman", "bharat", "pmjay", "5 lakh", "आयुष्मान", "भारत"]): return "ayushman"
    if any(x in t for x in ["police", "112", "108", "emergency", "पुलिस", "खतरा"]): return "emergency"
    if any(x in t for x in ["hospital", "doctor", "medical", "sick", "अस्पताल", "डॉक्टर", "तबीयत"]): return "hospital"
    if any(x in t for x in ["ration", "food", "राशन", "कार्ड"]): return "ration"
    return "default"

@app.route("/api/query", methods=["POST"])
def handle_query():
    data = request.json
    text = data.get("text", "")
    lang = data.get("language", "en")
    
    intent = get_intent(text)
    return jsonify({"response": KNOWLEDGE[intent][lang]})
