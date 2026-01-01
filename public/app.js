let currentLanguage = 'en';
let recognition;

const UI_TEXT = {
    en: { home: "Home", history: "History", recent: "RECENT QUERIES", status: "Bridge Active", tap: "Tap to Speak", stop: "Stop Listening", try: "TRY ASKING" },
    hi: { home: "मुख्य", history: "इतिहास", recent: "हाल के प्रश्न", status: "ब्रिज सक्रिय है", tap: "बोलने के लिए टैप करें", stop: "सुनना बंद करें", try: "पूछ कर देखें" }
};

const PROMPTS = {
    en: ["Hi", "Help", "Ayushman Bharat", "Ration Card", "PM Kisan", "Hospitals", "Police 100", "Ambulance 108", "Apply Card", "Benefits", "Farmer Info", "Emergency", "Health ID", "Contact", "Status"],
    hi: ["नमस्ते", "मदद", "आयुष्मान भारत", "राशन कार्ड", "पीएम किसान", "अस्पताल", "पुलिस १००", "एम्बुलेंस १०८", "आवेदन", "फायदे", "किसान सूचना", "आपातकाल", "हेल्थ कार्ड", "संपर्क", "स्थिति"]
};

function updateFullUI() {
    const t = UI_TEXT[currentLanguage];
    document.getElementById('nav-home').textContent = t.home;
    document.getElementById('nav-hist').textContent = t.history;
    document.getElementById('side-recent').textContent = t.recent;
    document.getElementById('status-text').textContent = t.status;
    document.getElementById('mic-label').textContent = t.tap;
    document.getElementById('pause-btn').textContent = t.stop;
    document.getElementById('grid-label').textContent = t.try;
    renderGrid();
}

async function refreshRecentQueries() {
    try {
        const res = await fetch('/api/history');
        const data = await res.json();
        const container = document.getElementById('history-list');
        container.innerHTML = "";
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = "history-item";
            div.textContent = item.text.length > 20 ? item.text.substring(0, 20) + "..." : item.text;
            div.onclick = () => { document.getElementById('user-input').value = item.text; submitQuery(); };
            container.appendChild(div);
        });
    } catch (e) { console.error(e); }
}

function renderGrid() {
    const grid = document.getElementById('command-grid');
    grid.innerHTML = "";
    PROMPTS[currentLanguage].forEach(text => {
        const chip = document.createElement('div');
        chip.className = "suggest-chip";
        chip.textContent = text;
        chip.onclick = () => { document.getElementById('user-input').value = text; submitQuery(); };
        grid.appendChild(chip);
    });
}

async function submitQuery() {
    const text = document.getElementById('user-input').value;
    if (!text) return;
    const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language: currentLanguage })
    });
    const data = await res.json();
    document.getElementById('response-text').textContent = data.response;
    document.getElementById('response-section').style.display = 'block';
    refreshRecentQueries();
}

window.onload = () => {
    updateFullUI();
    refreshRecentQueries();
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLanguage = btn.dataset.lang;
            updateFullUI();
        };
    });
};

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.onstart = () => { document.getElementById('mic-container').classList.add('pulse-active'); };
    recognition.onresult = (e) => { document.getElementById('user-input').value = e.results[0][0].transcript; };
    recognition.onend = () => { 
        document.getElementById('mic-container').classList.remove('pulse-active');
        if (document.getElementById('user-input').value) submitQuery(); 
    };
}
document.getElementById('mic-button').onclick = () => { recognition.start(); };
document.getElementById('pause-btn').onclick = () => { recognition.stop(); };
