let currentLanguage = 'en';
let recognition;
let isListening = false;

const translations = { 
    en: { micLabel: 'Tap to Speak', listening: 'Listening...', status: 'Bridge Active', stopBtn: 'Stop Listening', askAnother: 'Ask Another' }, 
    hi: { micLabel: 'बोलने के लिए टैप करें', listening: 'सुन रहा हूँ...', status: 'ब्रिज सक्रिय है', stopBtn: 'सुनना बंद करें', askAnother: 'दूसरा पूछें' } 
};

function setUiState(listening) {
    const container = document.getElementById('mic-container');
    if (listening) container.classList.add('pulse-active');
    else container.classList.remove('pulse-active');
}

async function refreshSidebar() {
    try {
        const res = await fetch('/api/history');
        const history = await res.json();
        const container = document.getElementById('history-list');
        if (!container) return;
        container.innerHTML = ""; 
        history.slice(0, 5).forEach(item => {
            const div = document.createElement('div'); 
            div.className = "history-item";
            div.textContent = item.text.length > 25 ? item.text.substring(0, 25) + "..." : item.text;
            div.onclick = () => { document.getElementById('user-input').value = item.text; submitQuery(); };
            container.appendChild(div);
        });
    } catch (e) { console.error(e); }
}

function speakResponse(text, lang) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (lang === 'hi') {
        utterance.lang = 'hi-IN';
        utterance.voice = voices.find(v => v.lang === 'hi-IN' && v.name.includes('Google')) || voices.find(v => v.lang === 'hi-IN');
        utterance.rate = 1.0; 
    } else {
        utterance.lang = 'en-IN';
        utterance.voice = voices.find(v => v.name.includes('Neural') && v.lang === 'en-IN') || voices.find(v => v.lang === 'en-IN' && v.name.includes('Google'));
        utterance.rate = 0.9; 
    }
    window.speechSynthesis.speak(utterance);
}

window.onload = () => { 
    refreshSidebar(); 
    document.querySelectorAll('.lang-btn').forEach(btn => { 
        btn.onclick = () => { 
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active')); 
            btn.classList.add('active'); 
            currentLanguage = btn.dataset.lang; 
            document.getElementById('mic-label').textContent = translations[currentLanguage].micLabel;
            document.getElementById('status-text').textContent = translations[currentLanguage].status;
        }; 
    });
};

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.onstart = () => { setUiState(true); document.getElementById('mic-label').textContent = translations[currentLanguage].listening; };
    recognition.onresult = (e) => { document.getElementById('user-input').value = e.results[0][0].transcript; };
    recognition.onend = () => { setUiState(false); document.getElementById('mic-label').textContent = translations[currentLanguage].micLabel; if (document.getElementById('user-input').value) submitQuery(); };
}

async function submitQuery() {
    const text = document.getElementById('user-input').value;
    if (!text) return;
    try {
        const res = await fetch('/api/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, language: currentLanguage }) });
        const data = await res.json();
        const section = document.getElementById('response-section');
        document.getElementById('response-text').textContent = data.response;
        section.style.display = 'block';
        speakResponse(data.response, currentLanguage);
        refreshSidebar();
    } catch (e) { console.error(e); }
}

document.getElementById('mic-button').onclick = () => { recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN'; recognition.start(); };
document.getElementById('history-btn').onclick = () => { window.location.href = 'history.html'; };
document.getElementById('pause-btn').onclick = () => { window.speechSynthesis.cancel(); recognition.stop(); setUiState(false); };
document.getElementById('new-query-btn').onclick = () => { document.getElementById('response-section').style.display = 'none'; document.getElementById('user-input').value = ''; };
