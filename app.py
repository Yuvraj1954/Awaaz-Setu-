from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__, static_folder="public")
CORS(app)

# ---------------- MASSIVE SMART RESPONSES DATABASE ----------------
SMART_RESPONSES = {
    # HEALTHCARE & MEDICAL
    "hospital": {
        "en": "Visit the nearest District Hospital or PHC for 24/7 care. Call 108 for emergency transport.",
        "hi": "24/7 सहायता के लिए निकटतम जिला अस्पताल या PHC पर जाएँ। आपातकालीन परिवहन के लिए 108 पर कॉल करें।"
    },
    "pregnancy": {
        "en": "Pregnant women receive free checkups and delivery under JSY. Register at your local Anganwadi.",
        "hi": "गर्भवती महिलाओं को JSY के तहत मुफ्त जांच और प्रसव मिलता है। अपनी स्थानीय आंगनवाड़ी में पंजीकरण करें।"
    },
    "vaccination": {
        "en": "Free vaccinations for children are available every Wednesday at government health centers.",
        "hi": "सरकारी स्वास्थ्य केंद्रों पर हर बुधवार को बच्चों का मुफ्त टीकाकरण उपलब्ध है।"
    },
    "blood_bank": {
        "en": "Check blood availability on the e-RaktKosh portal or contact the Red Cross Society.",
        "hi": "e-RaktKosh पोर्टल पर रक्त की उपलब्धता की जांच करें या रेड क्रॉस सोसाइटी से संपर्क करें।"
    },
    "tb_dots": {
        "en": "Free TB testing and DOTS treatment are available at all government chest clinics.",
        "hi": "सभी सरकारी चेस्ट क्लीनिकों में मुफ्त टीबी परीक्षण और डॉट्स (DOTS) उपचार उपलब्ध है।"
    },
    "mental_health": {
        "en": "Call the 'Tele-MANAS' helpline at 14416 for 24/7 free mental health counseling.",
        "hi": "24/7 मुफ्त मानसिक स्वास्थ्य परामर्श के लिए 'Tele-MANAS' हेल्पलाइन 14416 पर कॉल करें।"
    },
    "ayushman_bharat": {
        "en": "Ayushman Bharat (PM-JAY) offers ₹5 lakh coverage. Apply at any empanelled hospital with your Ration card.",
        "hi": "आयुष्मान भारत (PM-JAY) ₹5 लाख का कवरेज प्रदान करता है। अपने राशन कार्ड के साथ किसी भी सूचीबद्ध अस्पताल में आवेदन करें।"
    },

    # GOVERNMENT SCHEMES & SUBSIDIES
    "ration_card": {
        "en": "Apply for a New Ration Card at the State Food Portal. You need Aadhaar and a family photo.",
        "hi": "राज्य खाद्य पोर्टल पर नए राशन कार्ड के लिए आवेदन करें। आपको आधार और परिवार की फोटो की आवश्यकता होगी।"
    },
    "pm_awas": {
        "en": "PM Awas Yojana provides housing subsidies. Apply via the PMAY portal or your Gram Panchayat.",
        "hi": "पीएम आवास योजना आवास सब्सिडी प्रदान करती है। PMAY पोर्टल या अपनी ग्राम पंचायत के माध्यम से आवेदन करें।"
    },
    "kisan_samman": {
        "en": "PM-Kisan provides ₹6000/year to farmers. Check your status on the PM-Kisan portal using Aadhaar.",
        "hi": "PM-Kisan किसानों को ₹6000/वर्ष प्रदान करता है। आधार का उपयोग करके PM-Kisan पोर्टल पर अपनी स्थिति जांचें।"
    },
    "pension_old_age": {
        "en": "Citizens above 60 can apply for the Old Age Pension at the Social Welfare Office.",
        "hi": "60 वर्ष से अधिक आयु के नागरिक समाज कल्याण कार्यालय में वृद्धावस्था पेंशन के लिए आवेदन कर सकते हैं।"
    },
    "pension_widow": {
        "en": "Widow pension applications are accepted at the Jan Seva Kendra or Block office.",
        "hi": "विधवा पेंशन आवेदन जन सेवा केंद्र या ब्लॉक कार्यालय में स्वीकार किए जाते हैं।"
    },
    "scholarship": {
        "en": "Students can apply for Pre-matric and Post-matric scholarships on the National Scholarship Portal (NSP).",
        "hi": "छात्र नेशनल स्कॉलरशिप पोर्टल (NSP) पर प्री-मैट्रिक और पोस्ट-मैट्रिक स्कॉलरशिप के लिए आवेदन कर सकते हैं।"
    },

    # CIVIL IDS & DOCUMENTS
    "aadhar": {
        "en": "For Aadhaar updates, book an appointment at an Aadhaar Seva Kendra via the UIDAI website.",
        "hi": "आधार अपडेट के लिए, UIDAI वेबसाइट के माध्यम से आधार सेवा केंद्र पर अपॉइंटमेंट बुक करें।"
    },
    "pan_card": {
        "en": "Apply for an Instant E-PAN using your Aadhaar on the Income Tax e-filing portal.",
        "hi": "आयकर ई-फाइलिंग पोर्टल पर अपने आधार का उपयोग करके तत्काल ई-पैन के लिए आवेदन करें।"
    },
    "voter_id": {
        "en": "Download the Voter Helpline App to register or update your Voter ID card details.",
        "hi": "अपना वोटर आईडी कार्ड पंजीकृत या अपडेट करने के लिए वोटर हेल्पलाइन ऐप डाउनलोड करें।"
    },
    "birth_certificate": {
        "en": "Birth certificates are issued by the Municipal Corporation or Gram Panchayat within 21 days of birth.",
        "hi": "जन्म प्रमाण पत्र जन्म के 21 दिनों के भीतर नगर निगम या ग्राम पंचायत द्वारा जारी किए जाते हैं।"
    },
    "caste_certificate": {
        "en": "Apply for SC/ST/OBC certificates on your state's e-District portal.",
        "hi": "अपने राज्य के ई-डिस्ट्रिक्ट पोर्टल पर SC/ST/OBC प्रमाणपत्रों के लिए आवेदन करें।"
    },

    # EMERGENCY & SAFETY
    "emergency_all": {
        "en": "Emergency: Dial 112 (All-in-one), 108 (Ambulance), 101 (Fire), 1098 (Child), 181 (Women).",
        "hi": "आपातकाल: 112 (सब-इन-वन), 108 (एम्बुलेंस), 101 (फायर), 1098 (चाइल्ड), 181 (महिला) डायल करें।"
    },
    "cyber_crime": {
        "en": "Report cyber fraud immediately at cybercrime.gov.in or call 1930.",
        "hi": "साइबर धोखाधड़ी की सूचना तुरंत cybercrime.gov.in पर दें या 1930 पर कॉल करें।"
    },
    "gas_leak": {
        "en": "In case of gas leak, call the LPG emergency helpline at 1906.",
        "hi": "गैस रिसाव के मामले में, एलपीजी आपातकालीन हेल्पलाइन 1906 पर कॉल करें।"
    },

    "default": {
        "en": "I'm not sure. Try asking about 'Hospitals', 'Ration Card', 'Pension', or 'Emergency'.",
        "hi": "मुझे यकीन नहीं है। 'अस्पताल', 'राशन कार्ड', 'पेंशन', या 'आपातकाल' के बारे में पूछने का प्रयास करें।"
    }
}

# ---------------- ROBUST CLUSTER INTENT DETECTION ----------------
def detect_intent(text):
    t = text.lower().strip()
    
    # Emergency Cluster
    if any(x in t for x in ["emergency", "police", "112", "accident", "fire", "safety", "danger", "help", "पुलिस", "आपात", "खतरा", "बचाओ"]):
        if "child" in t or "baccha" in t: return "emergency_all"
        if "cyber" in t or "online fraud" in t: return "cyber_crime"
        if "gas" in t or "cylinder" in t: return "gas_leak"
        return "emergency_all"

    # Medical Cluster
    if any(x in t for x in ["hospital", "doctor", "clinic", "medical", "sick", "अस्पताल", "डॉक्टर", "तबीयत"]): return "hospital"
    if any(x in t for x in ["pregnant", "delivery", "maternity", "baby", "delivery", "गर्भवती", "प्रसव"]): return "pregnancy"
    if any(x in t for x in ["vaccine", "polio", "injection", "teeka", "टीका", "सुई"]): return "vaccination"
    if any(x in t for x in ["blood", "donat", "plasma", "रक्त", "खून"]): return "blood_bank"
    if any(x in t for x in ["tb", "coughing", "dots", "खांसी", "टीबी"]): return "tb_dots"
    if any(x in t for x in ["mental", "stress", "depression", "counsel", "तनाव", "मानसिक"]): return "mental_health"
    if any(x in t for x in ["ayushman", "golden card", "5 lakh", "health card", "आयुष्मान"]): return "ayushman_bharat"

    # Schemes Cluster
    if any(x in t for x in ["ration", "quota", "food card", "wheat", "rice", "राशन", "कोटा", "गल्ला"]): return "ration_card"
    if any(x in t for x in ["house", "awas", "home subsidy", "pmay", "आवास", "घर"]): return "pm_awas"
    if any(x in t for x in ["farmer", "kisan", "6000", "agriculture", "किसान", "खेती"]): return "kisan_samman"
    if any(x in t for x in ["pension", "60 years", "old age", "वृद्धा", "पेंशन"]): return "pension_old_age"
    if any(x in t for x in ["widow", "husband death", "विधवा"]): return "pension_widow"
    if any(x in t for x in ["scholarship", "fees", "study money", "छात्रवृत्ति", "पढ़ाई"]): return "scholarship"

    # Documents Cluster
    if any(x in t for x in ["aadhar", "uidai", "update card", "आधार"]): return "aadhar"
    if any(x in t for x in ["pan card", "income tax", "pancard", "पैन"]): return "pan_card"
    if any(x in t for x in ["voter", "election", "vote", "वोटर", "चुनाव"]): return "voter_id"
    if any(x in t for x in ["birth", "janam", "born", "जन्म"]): return "birth_certificate"
    if any(x in t for x in ["caste", "obc", "sc", "st", "jati", "जाति"]): return "caste_certificate"

    return "default"

@app.route("/api/query", methods=["POST"])
def process_query():
    data = request.json
    text = data.get("text", "")
    language = data.get("language", "en")
    intent = detect_intent(text)
    response = SMART_RESPONSES.get(intent, SMART_RESPONSES["default"])[language]
    return jsonify({"response": response})

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")

if __name__ == "__main__":
    app.run(debug=True, port=5000)
