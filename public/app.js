let currentLanguage = 'en';
let recognition;
let currentPage = 1;
const itemsPerPage = 7;

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

async function fetchHistoryLogs() {
    const tbody = document.getElementById('history-body');
    if (!tbody) return;
    const res = await fetch('/api/history');
    const allData = await res.json();
    const start = (currentPage - 1) * itemsPerPage;
    const paginatedData = allData.slice(start, start + itemsPerPage);
    tbody.innerHTML = paginatedData.map(item => `
        <tr><td>${item.time}</td><td>${item.text}</td><td>${item.language.toUpperCase()}</td></tr>
    `).join('');
    document.getElementById('page-num').textContent = `Page ${currentPage}`;
    document.getElementById('prev-btn').disabled = currentPage === 1;
    document.getElementById('next-btn').disabled = (start + itemsPerPage) >= allData.length;
}

async function refreshRecentQueries() {
    const res = await fetch('/api/history');
    const data = await res.json();
    const container = document.getElementById('history-list');
    if (!container) return;
    container.innerHTML = data.slice(0, 5).map(item => `
        <div class="history-item" onclick="document.getElementById('user-input').value='${item.text}'; submitQuery();">${item.text}</div>
    `).join('');
}

async function submitQuery() {
    const text = document.getElementById('user-input').value;
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
    if (document.getElementById('history-body')) fetchHistoryLogs();
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
    recognition.onend = () => { document.getElementById('mic-container').classList.remove('pulse-active'); if(document.getElementById('user-input').value) submitQuery(); };
    recognition.onresult = (e) => { document.getElementById('user-input').value = e.results[0][0].transcript; };
}
document.getElementById('mic-button').onclick = () => { recognition.start(); };
