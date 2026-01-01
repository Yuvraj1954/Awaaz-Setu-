let currentLanguage = 'en';
let recognition;
let isListening = false;
let currentPage = 1;
const itemsPerPage = 10; 

const UI_TEXT = {
    en: { 
        home: "Home", history: "History", recent: "RECENT QUERIES", 
        status: "Bridge Active", tap: "Tap to Speak", stop: "Stop", 
        try: "TRY ASKING", listening: "Listening...", clear: "Clear History" 
    },
    hi: { 
        home: "मुख्य", history: "इतिहास", recent: "हाल के प्रश्न", 
        status: "ब्रिज सक्रिय है", tap: "बोलने के लिए टैप करें", stop: "रुको", 
        try: "पूछ कर देखें", listening: "सुन रहा हूँ...", clear: "इतिहास साफ़ करें" 
    }
};

const PROMPTS = {
    en: ["Hi", "Help", "Ayushman Bharat", "Ration Card", "PM Kisan", "Hospitals", "Police 100", "Ambulance 108", "Apply Card", "Benefits", "Farmer Info", "Emergency", "Health ID", "Contact", "Status"],
    hi: ["नमस्ते", "मदद", "आयुष्मान भारत", "राशन कार्ड", "पीएम किसान", "अस्पताल", "पुलिस १००", "एम्बुलेंस १०८", "आवेदन", "फायदे", "किसान सूचना", "आपातकाल", "हेल्थ कार्ड", "संपर्क", "स्थिति"]
};

// --- 1. SPEECH RECOGNITION ---
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false; 
    recognition.interimResults = false;

    recognition.onstart = () => { 
        setListeningState(true);
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const userInput = document.getElementById('user-input');
        if (userInput) userInput.value = transcript;
    };

    recognition.onerror = (event) => {
        console.error("Mic Error:", event.error);
        setListeningState(false);
    };

    recognition.onend = () => { 
        setListeningState(false);
        const userInput = document.getElementById('user-input');
        if (userInput && userInput.value.trim() !== "") {
            submitQuery(); 
        }
    };
}

// FIXED: UI State (Button never hides now)
function setListeningState(active) {
    isListening = active;
    const micContainer = document.getElementById('mic-button');
    const micLabel = document.getElementById('mic-label');
    const innerCircle = document.querySelector('.inner-circle');

    // NOTE: We do NOT hide the stop button here anymore.
    
    if (active) {
        if (innerCircle) innerCircle.style.background = "#ec4899"; // Pink pulse
        if (micContainer) micContainer.classList.add('pulse-active');
        if (micLabel) micLabel.textContent = UI_TEXT[currentLanguage].listening;
    } else {
        if (innerCircle) innerCircle.style.background = "var(--primary)";
        if (micContainer) micContainer.classList.remove('pulse-active');
        if (micLabel) micLabel.textContent = UI_TEXT[currentLanguage].tap;
    }
}

function startMic() {
    // If AI is speaking, stop it before starting new listen
    window.speechSynthesis.cancel();
    
    if (isListening) return;
    if (recognition) {
        try { recognition.start(); } 
        catch (e) { console.warn("Mic already active"); }
    }
}

// FIXED: STOP BUTTON LOGIC (Handles Mic AND Audio)
function stopMic() {
    // 1. Force AI to Shut Up (Stop TTS)
    window.speechSynthesis.cancel();

    // 2. Stop Recording if active
    if (recognition && isListening) {
        recognition.stop(); 
    }
    
    // 3. Reset UI immediately
    setListeningState(false);
}

// --- 2. ACTIVITY LOGS ---
async function fetchHistoryLogs() {
    const tbody = document.getElementById('history-body');
    if (!tbody) return; 

    try {
        const res = await fetch('/api/history');
        const allData = await res.json();
        
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const paginatedData = allData.slice(start, end);
        
        if (allData.length === 0) {
            tbody.innerHTML = "<tr><td colspan='3' style='text-align:center; padding:20px;'>No history found.</td></tr>";
        } else {
            tbody.innerHTML = paginatedData.map(item => `
                <tr>
                    <td style="color:var(--primary); font-weight:800;">${item.time}</td>
                    <td style="font-weight:600;">${item.text}</td>
                    <td><span style="background:rgba(79,70,229,0.1); padding:4px 10px; border-radius:8px; color:var(--primary); font-size:0.75rem;">${item.language.toUpperCase()}</span></td>
                </tr>
            `).join('');
        }
        
        document.getElementById('page-num').textContent = `Page ${currentPage}`;
        document.getElementById('prev-btn').disabled = currentPage === 1;
        document.getElementById('next-btn').disabled = end >= allData.length;

    } catch (e) { console.error("History fetch failed:", e); }
}

// --- 3. SIDEBAR RECENT QUERIES ---
async function refreshRecentQueries() {
    try {
        const res = await fetch('/api/history');
        const data = await res.json();
        const container = document.getElementById('history-list');
        if (!container) return;
        
        container.innerHTML = data.slice(0, 5).map(item => `
            <div class="history-item" onclick="document.getElementById('user-input').value='${item.text}'; submitQuery();" 
                 style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; cursor:pointer; font-size:0.8rem; color:#cbd5e1; width:100%;">
                ${item.text.length > 20 ? item.text.substring(0, 20) + '...' : item.text}
            </div>
        `).join('');
    } catch (e) { console.error("Sidebar update failed", e); }
}

// --- 4. UI & LANGUAGE ---
function updateFullUI() {
    const t = UI_TEXT[currentLanguage];
    const elements = {
        'nav-home': t.home, 'nav-hist': t.history, 'side-recent': t.recent,
        'status-text': t.status, 'mic-label': t.tap, 'pause-btn': t.stop, 'grid-label': t.try
    };

    for (const [id, text] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
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
        chip.style.cssText = "background:rgba(255,255,255,0.05); padding:8px 15px; border-radius:20px; font-size:0.9rem; cursor:pointer; border:1px solid transparent; transition:0.3s;";
        
        chip.onmouseover = function() { this.style.borderColor = "#4f46e5"; this.style.background = "rgba(79,70,229,0.1)"; };
        chip.onmouseout = function() { this.style.borderColor = "transparent"; this.style.background = "rgba(255,255,255,0.05)"; };
        
        chip.onclick = () => { 
            const input = document.getElementById('user-input');
            if (input) input.value = text; 
            submitQuery(); 
        };
        grid.appendChild(chip);
    });
}

// --- 5. QUERY SUBMISSION ---
async function submitQuery() {
    const userInput = document.getElementById('user-input');
    if (!userInput || !userInput.value) return;
    
    // Stop any current speaking before processing new one
    window.speechSynthesis.cancel();
    
    try {
        const res = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: userInput.value, language: currentLanguage })
        });
        const data = await res.json();
        
        const respBox = document.getElementById('response-section');
        const respText = document.getElementById('response-text');
        
        if (respBox && respText) {
            // FIX: Convert **text** to <b>text</b> and \n to <br> to render styling
            let formattedText = data.response
                .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--secondary);">$1</strong>')
                .replace(/\n/g, '<br>');

            respText.innerHTML = formattedText; 
            respBox.style.display = 'block';
        }
        
        // Voice Feedback (Uses raw text for speech)
        const utt = new SpeechSynthesisUtterance(data.response.replace(/\*\*/g, ''));
        utt.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
        window.speechSynthesis.speak(utt);
        
        refreshRecentQueries();
        userInput.value = ""; 
    } catch (e) { console.error("Query failed", e); }
}

window.clearLogs = async function() {
    if (!confirm("Clear all logs?")) return;
    try {
        const res = await fetch('/api/clear', { method: 'POST' });
        const result = await res.json();
        if (result.status === "success") window.location.reload(); 
    } catch (e) { console.error("Clear error:", e); }
};

// --- INITIALIZATION ---
window.onload = () => {
    updateFullUI();
    refreshRecentQueries();
    
    // FORCE STOP BUTTON TO BE VISIBLE ALWAYS
    const stopBtn = document.getElementById('pause-btn');
    if (stopBtn) {
        stopBtn.style.display = 'inline-block'; 
        stopBtn.onclick = stopMic;
    }

    if (document.getElementById('history-body')) {
        fetchHistoryLogs();
    }

    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLanguage = btn.dataset.lang;
            updateFullUI();
        };
    });

    const micBtn = document.getElementById('mic-button');
    if (micBtn) micBtn.onclick = startMic;

    if (document.getElementById('prev-btn')) {
        document.getElementById('prev-btn').onclick = () => { 
            if (currentPage > 1) { currentPage--; fetchHistoryLogs(); } 
        };
    }
    if (document.getElementById('next-btn')) {
        document.getElementById('next-btn').onclick = () => { 
            currentPage++; fetchHistoryLogs(); 
        };
    }
};
