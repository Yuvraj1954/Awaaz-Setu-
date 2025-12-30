import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Firebase imports (optional, safe)
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

app = Flask(__name__, static_folder="public")
CORS(app)

# ---------------- SMART RESPONSES ----------------
# (DETAILED, NON-VAGUE, PROMPT-SAFE)

SMART_RESPONSES = {

    # -------- GENERAL --------
    "greeting": {
        "en": "Hello! You can ask me about hospitals, pregnancy care, pensions, certificates, government schemes or emergency help.",
        "hi": "नमस्ते! आप मुझसे अस्पताल, गर्भावस्था, पेंशन, प्रमाण पत्र या सरकारी योजनाओं के बारे में पूछ सकते हैं।"
    },

    "help": {
        "en": "I help with ration cards, pensions, Ayushman Bharat, Aadhaar, voter ID, hospitals, women and child support services.",
        "hi": "मैं राशन कार्ड, पेंशन, आयुष्मान भारत, आधार, वोटर आईडी और स्वास्थ्य सहायता में मदद करता हूँ।"
    },

    # -------- EMERGENCY --------
    "emergency_numbers": {
        "en": "Emergency numbers in India: Police 112, Ambulance 108, Fire 101, Women Helpline 181, Child Helpline 1098.",
        "hi": "भारत के आपातकालीन नंबर: पुलिस 112, एम्बुलेंस 108, फायर 101, महिला 181, चाइल्ड 1098।"
    },

    "emergency_guidance": {
        "en": "In case of accident or serious illness, immediately call 108 or visit the nearest government hospital.",
        "hi": "दुर्घटना या गंभीर बीमारी में तुरंत 108 पर कॉल करें या नजदीकी सरकारी अस्पताल जाएं।"
    },

    # -------- WOMEN --------
    "women_helpline": {
        "en": "Women Helpline 181 provides 24x7 support for domestic violence, harassment, safety and legal help.",
        "hi": "महिला हेल्पलाइन 181 घरेलू हिंसा, उत्पीड़न और सुरक्षा सहायता के लिए है।"
    },

    "pregnancy": {
        "en": "Pregnant women should register at government hospitals or Anganwadi centres. Free checkups, medicines and delivery are provided.",
        "hi": "गर्भवती महिलाओं को सरकारी अस्पताल या आंगनवाड़ी में पंजीकरण कराना चाहिए। मुफ्त जांच और प्रसव सुविधा मिलती है।"
    },

    # -------- CHILD --------
    "child_health": {
        "en": "Children receive free health checkups, nutrition support and treatment at government hospitals and Anganwadi centres.",
        "hi": "बच्चों को सरकारी अस्पतालों और आंगनवाड़ी में मुफ्त स्वास्थ्य सेवाएं मिलती हैं।"
    },

    "child_helpline": {
        "en": "Child Helpline 1098 helps children facing abuse, neglect, trafficking or emergency situations.",
        "hi": "चाइल्ड हेल्पलाइन 1098 बच्चों की सुरक्षा और सहायता के लिए है।"
    },

    "child_vaccination": {
        "en": "Child vaccinations are provided free under the Universal Immunization Programme at PHCs and government hospitals.",
        "hi": "बच्चों का टीकाकरण PHC और सरकारी अस्पतालों में मुफ्त होता है।"
    },

    # -------- HEALTH --------
    "fever": {
        "en": "For fever, take paracetamol, drink plenty of fluids and rest. Visit a doctor if fever lasts more than 2 days.",
        "hi": "बुखार में पैरासिटामोल लें, पानी पिएं और आराम करें। 2 दिन से अधिक हो तो डॉक्टर को दिखाएं।"
    },

    "cough_cold": {
        "en": "Warm fluids, steam inhalation and rest help cough and cold. Consult a doctor if breathing difficulty occurs.",
        "hi": "खांसी-जुकाम में गर्म तरल लें और भाप लें।"
    },

    "headache": {
        "en": "Headaches may be due to stress or dehydration. Rest and hydrate. Seek medical help if frequent.",
        "hi": "सिर दर्द तनाव या पानी की कमी से हो सकता है।"
    },

    "stomach_pain": {
        "en": "Avoid oily food, drink ORS and rest. Severe or persistent pain needs medical checkup.",
        "hi": "पेट दर्द में हल्का भोजन करें और ORS लें।"
    },

    # -------- GOVERNMENT DOCUMENTS --------
    "ration_card": {
        "en": "Ration card allows access to subsidized food grains. Apply via state food portal or nearest CSC with Aadhaar and address proof.",
        "hi": "राशन कार्ड से सस्ता अनाज मिलता है। राज्य पोर्टल या CSC से आवेदन करें।"
    },

    "ayushman_bharat": {
        "en": "Ayushman Bharat provides ₹5 lakh free hospital treatment per family per year at empanelled hospitals.",
        "hi": "आयुष्मान भारत योजना में ₹5 लाख तक का मुफ्त इलाज मिलता है।"
    },

    "pension": {
        "en": "Old age pension under NSAP is available for citizens aged 60+. Apply through CSC or state portals.",
        "hi": "वृद्धावस्था पेंशन 60 वर्ष से अधिक आयु वालों को मिलती है।"
    },

    "aadhar": {
        "en": "Aadhaar enrollment and update services are available at Aadhaar Seva Kendras.",
        "hi": "आधार नामांकन और अपडेट सेवा केंद्रों पर उपलब्ध है।"
    },

    "voter_id": {
        "en": "Voter ID allows you to vote in elections. Apply via NVSP portal or local election office.",
        "hi": "वोटर आईडी से मतदान किया जाता है।"
    },

    "income_certificate": {
        "en": "Income certificate is required for scholarships and welfare schemes. Apply via state e-district portal or CSC.",
        "hi": "आय प्रमाण पत्र सरकारी योजनाओं के लिए आवश्यक होता है।"
    },

    "birth_certificate": {
        "en": "Birth certificate is issued by municipal office or gram panchayat and is required for school admission.",
        "hi": "जन्म प्रमाण पत्र स्कूल प्रवेश के लिए जरूरी होता है।"
    },

    "housing": {
        "en": "PM Awas Yojana helps eligible families build or buy permanent houses with government assistance.",
        "hi": "पीएम आवास योजना से गरीब परिवारों को घर मिलता है।"
    },

    "hospital_near_me": {
        "en": "You can visit the nearest government hospital or Primary Health Centre. Call 108 for ambulance support.",
        "hi": "आप नजदीकी सरकारी अस्पताल या PHC जा सकते हैं।"
    },

    # -------- DEFAULT (SAFE) --------
    "default": {
        "en": "Please ask about a specific service like certificate, scheme, hospital, pension or health issue.",
        "hi": "कृपया किसी विशेष सेवा, योजना या स्वास्थ्य समस्या के बारे में पूछें।"
    }
}

# ---------------- INTENT DETECTION ----------------

def detect_intent(text, service, language):
    t = text.lower()

    # -------- GREETING --------
    if any(x in t for x in ["hi", "hello", "hey", "namaste", "नमस्ते"]):
        return "greeting"

    # -------- HELP --------
    if "help" in t or "what can you do" in t or "मदद" in t:
        return "help"

    # -------- EMERGENCY --------
    if "emergency" in t or "आपात" in t:
        return "emergency_numbers"

    if "police" in t or "112" in t:
        return "police_number"

    if "ambulance" in t or "108" in t:
        return "ambulance_number"

    if "hospital near" in t or "government hospital" in t or "अस्पताल" in t:
        return "emergency_guidance"

    # -------- WOMEN --------
    if "women helpline" in t or "महिला हेल्पलाइन" in t or "181" in t:
        return "women_helpline"

    if "pregnancy" in t or "pregnant" in t or "गर्भ" in t:
        return "pregnancy"

    if "maternity" in t or "मातृत्व" in t:
        return "maternity_benefit"

    # -------- CHILD --------
    if "child helpline" in t or "1098" in t or "चाइल्ड हेल्पलाइन" in t:
        return "child_helpline"

    if ("child" in t or "बच्चा" in t) and ("vaccine" in t or "vaccination" in t or "टीका" in t):
        return "child_vaccination"

    if "child" in t or "बच्चा" in t:
        return "child_health"

    # -------- HEALTH --------
    if "fever" in t or "बुखार" in t:
        return "fever"

    if "cough" in t or "cold" in t or "खांसी" in t:
        return "cough_cold"

    if "headache" in t or "सिर दर्द" in t:
        return "headache"

    if "stomach" in t or "पेट" in t:
        return "stomach_pain"

    # -------- GOVERNMENT SCHEMES --------
    if "ration" in t or "राशन" in t:
        return "ration_card"

    if "ayushman" in t or "आयुष्मान" in t or "health card" in t:
        return "ayushman_bharat"

    if "pension" in t or "पेंशन" in t or "senior citizen" in t:
        return "pension"

    if "pm awas" in t or "awas yojana" in t or "आवास योजना" in t:
        return "housing"

    # -------- DOCUMENTS --------
    if "aadhar" in t or "aadhaar" in t or "आधार" in t:
        return "aadhar"

    if "voter" in t or "मतदाता" in t:
        return "voter_id"

    if "income" in t or "आय" in t:
        return "income_certificate"

    if "birth" in t or "जन्म" in t:
        return "birth_certificate"

    # -------- DEFAULT (SAFE) --------
    return "default"

# ---------------- API ----------------

@app.route("/api/query", methods=["POST"])
def process_query():
    data = request.json
    text = data.get("text", "")
    language = data.get("language", "en")

    intent = detect_intent(text, "general", language)
    response = SMART_RESPONSES.get(intent, SMART_RESPONSES["default"])[language]

    return jsonify({"response": response})

# ---------------- FRONTEND ----------------

@app.route("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(PUBLIC_DIR, path)
