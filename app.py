import os
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# Firebase imports
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("Warning: firebase-admin not installed. Using fallback mode.")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(BASE_DIR, "public")

app = Flask(__name__, static_folder="public")
CORS(app)

# ---------------- FIREBASE INIT ----------------

db = None
firebase_initialized = False

def init_firebase():
    global db, firebase_initialized
    if not FIREBASE_AVAILABLE:
        return False
    try:
        firebase_service_account = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
        if not firebase_service_account:
            return False
        service_account_info = json.loads(firebase_service_account)
        if not firebase_admin._apps:
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred)
        db = firestore.client()
        firebase_initialized = True
        return True
    except Exception:
        return False

init_firebase()

# ---------------- SMART RESPONSES ----------------

SMART_RESPONSES = {

    "greeting": {
        "en": "Hello! I can help you with healthcare, government services, pensions, schemes and emergencies.",
        "hi": "नमस्ते! मैं स्वास्थ्य, सरकारी सेवाओं, पेंशन और आपातकालीन सहायता में आपकी मदद कर सकता हूँ।"
    },

    "help": {
        "en": "You can ask about ration cards, pensions, Ayushman Bharat, pregnancy care, vaccinations, hospitals, Aadhaar, voter ID or emergencies.",
        "hi": "आप राशन कार्ड, पेंशन, आयुष्मान भारत, गर्भावस्था, टीकाकरण, अस्पताल, आधार या आपातकाल के बारे में पूछ सकते हैं।"
    },

    "emergency_numbers": {
        "en": "Emergency numbers in India: Police 112, Ambulance 108, Fire 101, Women 181, Child 1098.",
        "hi": "भारत के आपातकालीन नंबर: पुलिस 112, एम्बुलेंस 108, फायर 101, महिला 181, चाइल्ड 1098।"
    },

    "ration_card": {
        "en": "Apply for a ration card via your state food department website or nearest CSC. Documents needed: Aadhaar, address proof and family details.",
        "hi": "राशन कार्ड के लिए राज्य खाद्य विभाग वेबसाइट या CSC से आवेदन करें। आधार और पता प्रमाण आवश्यक है।"
    },

    "ayushman_bharat": {
        "en": "Ayushman Bharat provides free hospital treatment up to ₹5 lakh per family per year at government and empanelled hospitals.",
        "hi": "आयुष्मान भारत योजना में ₹5 लाख तक का मुफ्त इलाज सरकारी व सूचीबद्ध अस्पतालों में मिलता है।"
    },

    "pension": {
        "en": "Old age pension is provided under NSAP. Eligible citizens aged 60+ can apply through CSC or state portals.",
        "hi": "वृद्धावस्था पेंशन NSAP के तहत मिलती है। 60 वर्ष से अधिक आयु वाले आवेदन कर सकते हैं।"
    },

    "aadhar": {
        "en": "Aadhaar services are available at Aadhaar Seva Kendras. Carry identity proof and mobile number.",
        "hi": "आधार सेवाएं आधार सेवा केंद्र पर उपलब्ध हैं। पहचान प्रमाण साथ रखें।"
    },

    "voter_id": {
        "en": "Apply for voter ID via the Election Commission website or visit the local election office.",
        "hi": "वोटर आईडी के लिए निर्वाचन आयोग की वेबसाइट या स्थानीय कार्यालय जाएं।"
    },

    "housing": {
        "en": "PM Awas Yojana provides financial support for housing. Apply through CSC or state housing portals.",
        "hi": "पीएम आवास योजना में घर के लिए वित्तीय सहायता मिलती है।"
    },

    "fever": {
        "en": "For fever: Take paracetamol, drink fluids, rest. Visit a hospital if fever lasts more than 2 days.",
        "hi": "बुखार में पैरासिटामोल लें, पानी पिएं। 2 दिन से अधिक हो तो अस्पताल जाएं।"
    },

    "cough_cold": {
        "en": "For cough or cold: Warm fluids, steam inhalation and rest. See a doctor if symptoms worsen.",
        "hi": "खांसी-जुकाम में गर्म पानी, भाप लें और आराम करें।"
    },

    "stomach_pain": {
        "en": "Avoid oily food, take ORS, rest. Seek medical help if pain is severe.",
        "hi": "पेट दर्द में हल्का भोजन करें और ORS लें।"
    },

    "headache": {
        "en": "Headaches can be due to stress or dehydration. Rest and hydrate. Consult a doctor if frequent.",
        "hi": "सिर दर्द तनाव या पानी की कमी से हो सकता है।"
    },

    "pregnancy": {
        "en": "Pregnant women should register at government hospitals or Anganwadi centres for free checkups and safe delivery services.",
        "hi": "गर्भवती महिलाओं को सरकारी अस्पताल या आंगनवाड़ी में पंजीकरण कराना चाहिए।"
    },

    "vaccination": {
        "en": "Vaccinations are provided free at government hospitals and PHCs under the Universal Immunization Programme.",
        "hi": "टीकाकरण सरकारी अस्पतालों और PHC में मुफ्त उपलब्ध है।"
    },

    "child_health": {
        "en": "Children receive free health checkups, nutrition and vaccinations at government facilities.",
        "hi": "बच्चों को सरकारी केंद्रों पर मुफ्त स्वास्थ्य सेवाएं मिलती हैं।"
    },

    "emergency_guidance": {
        "en": "In emergencies, call 108 for ambulance or visit the nearest government hospital immediately.",
        "hi": "आपात स्थिति में 108 पर कॉल करें या तुरंत अस्पताल जाएं।"
    }
}

# ---------------- INTENT DETECTION (UNCHANGED) ----------------

def detect_intent(text, service, language):
    t = text.lower()
    if any(x in t for x in ["hi", "hello", "नमस्ते"]): return "greeting"
    if "emergency" in t or "112" in t or "आपात" in t: return "emergency_numbers"
    if "ration" in t or "राशन" in t: return "ration_card"
    if "ayushman" in t or "आयुष्मान" in t: return "ayushman_bharat"
    if "pension" in t or "पेंशन" in t: return "pension"
    if "aadhar" in t or "आधार" in t: return "aadhar"
    if "voter" in t or "मतदाता" in t: return "voter_id"
    if "house" in t or "आवास" in t: return "housing"
    if "fever" in t or "बुखार" in t: return "fever"
    if "pregnancy" in t or "गर्भ" in t: return "pregnancy"
    if "vaccine" in t or "टीका" in t: return "vaccination"
    if "child" in t or "बच्चा" in t: return "child_health"
    return "default"

# ---------------- API ----------------

@app.route("/api/query", methods=["POST"])
def process_query():
    data = request.json
    text = data.get("text", "")
    language = data.get("language", "en")

    intent = detect_intent(text, "general", language)

    if intent in SMART_RESPONSES:
        return jsonify({"response": SMART_RESPONSES[intent][language]})

    return jsonify({
        "response": "I’m here to help with healthcare and government services." if language == "en"
        else "मैं सरकारी और स्वास्थ्य सेवाओं में आपकी मदद के लिए यहाँ हूँ।"
    })

# ---------------- FRONTEND ----------------

@app.route("/")
def index():
    return send_from_directory(PUBLIC_DIR, "index.html")

@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(PUBLIC_DIR, path)
