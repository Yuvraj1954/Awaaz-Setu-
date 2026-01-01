let currentLanguage = 'en';
let recognition;

const UI_TEXT = {
    en: { home: "Home", history: "History", recent: "RECENT QUERIES", status: "Bridge Active", tap: "Tap to Speak", stop: "Stop Listening", try: "TRY ASKING", listening: "Listening..." },
    hi: { home: "मुख्य", history: "इतिहास", recent: "हाल के प्रश्न", status: "ब्रिज सक्रिय है", tap: "बोलने के लिए टैप करें", stop: "सुनना बंद करें", try: "पूछ कर देखें", listening: "सुन रहा हूँ..." }
};

const PROMPTS = {
    en: ["Hi", "Help", "Ayushman Bharat", "Ration Card", "PM Kisan", "Hospitals", "Police 100", "Ambulance 108", "Apply Card", "Benefits", "Farmer Info", "Emergency", "Health ID", "Contact", "Status"],
    hi: ["नमस्ते", "मदद", "आयुष्मान भारत", "राशन कार्ड", "पीएम किसान", "अस्पताल", "पुलिस १००", "एम्बुलेंस १०८", "आवेदन", "फायदे", "किसान सूचना", "आपातकाल", "हेल्थ कार्ड", "संपर्क", "स्थिति"]
};

function updateFullUI() {
    const t = UI_TEXT[currentLanguage];
    if (document.getElementById('nav-home')) document.getElementById('nav-home').textContent = t.home;
    if (document.getElementById('nav-hist')) document.getElementById('nav-hist').textContent = t.history;
    if (document.getElementById('side-recent')) document.getElementById('side-recent').textContent = t.recent;
    if (document.getElementById('status-text')) document.getElementById('status-text').textContent = t.status;
    if (document.getElementById('mic-label')) document.getElementById('mic-label').textContent = t.tap;
    if (document.getElementById('pause-btn')) document.getElementById('pause-btn').textContent = t.stop;
    if (document.getElementById('grid-label')) document.getElementById('grid-label').textContent = t.try;
    renderGrid();
}

function renderGrid() {
    const grid = document.getElementById('command-grid');
    if (!grid) return;
    grid.innerHTML = "";
    PROMPTS[currentLanguage].forEach(text => {
        const chip = document.createElement('div');
        chip.className = "suggest-chip";
        chip.textContent = text;
        chip.onclick = () => { document.getElementById('user-input').value = text; submitQuery(); };
        grid.appendChild(chip);
    });
}

async function refreshRecentQueries() {
    try {
        const res = await fetch('/api/history');
        const data = await res.json();
        const container = document.getElementById('history-list');
        if (!container) return;
        container.innerHTML = data.slice(0, 5).map(item => `
            <div class="history-item" onclick="document.getElementById('user-input').value='${item.text}'; submitQuery();">
                ${item.text.length > 20 ? item.text.substring(0, 20) + '...' : item.text}
            </div>
        `).join('');
    } catch (e) { console.error(e); }
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
    
    // Voice response
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(data.response);
    utt.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    window.speechSynthesis.speak(utt);
    
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
    recognition.onstart = () => { 
        document.getElementById('mic-container').classList.add('pulse-active'); 
        document.getElementById('mic-label').textContent = UI_TEXT[currentLanguage].listening;
    };
    recognition.onend = () => { 
        document.getElementById('mic-container').classList.remove('pulse-active');
        document.getElementById('mic-label').textContent = UI_TEXT[currentLanguage].tap;
        if (document.getElementById('user-input').value) submitQuery(); 
    };
    recognition.onresult = (e) => { document.getElementById('user-input').value = e.results[0][0].transcript; };
}

document.getElementById('mic-button').onclick = () => { recognition.start(); };
document.getElementById('pause-btn').onclick = () => { recognition.stop(); window.speechSynthesis.cancel(); };
