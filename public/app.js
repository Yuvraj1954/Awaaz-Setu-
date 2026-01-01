let currentLanguage = 'en';
let recognition;
let isListening = false;

const translations = { 
    en: { micLabel: 'Tap to Speak', listening: 'Listening...', status: 'Bridge Active', stopBtn: 'Stop Listening', askAnother: 'Ask Another', carousel: 'TRY ASKING' }, 
    hi: { micLabel: 'बोलने के लिए टैप करें', listening: 'सुन रहा हूँ...', status: 'ब्रिज सक्रिय है', stopBtn: 'सुनना बंद करें', askAnother: 'दूसरा पूछें', carousel: 'पूछ कर देखें' } 
};

const SUGGESTIONS = {
    en: ["Hi", "How can you help me?", "Benefits of Ayushman Bharat", "Apply for Ration Card", "Emergency numbers near me", "PM Kisan status", "Find a doctor", "Health schemes"],
    hi: ["नमस्ते", "आप मेरी क्या मदद कर सकते हैं?", "आयुष्मान भारत के लाभ", "राशन कार्ड के लिए आवेदन", "आपातकालीन नंबर दिखाएं", "पीएम किसान स्थिति", "डॉक्टर खोजें", "स्वास्थ्य योजनाएं"]
};

function renderCarousel() {
    const container = document.getElementById('command-carousel');
    if (!container) return;
    container.innerHTML = "";
    const shuffled = [...SUGGESTIONS[currentLanguage]].sort(() => 0.5 - Math.random()).slice(0, 5);
    shuffled.forEach(text => {
        const chip = document.createElement('div');
        chip.className = "suggest-chip";
        chip.textContent = text;
        chip.onclick = () => { document.getElementById('user-input').value = text; submitQuery(); };
        container.appendChild(chip);
    });
    document.getElementById('carousel-label').textContent = translations[currentLanguage].carousel;
}

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
        utterance.rate = 1.05; 
    }
    window.speechSynthesis.speak(utterance);
}

window.onload = () => { 
    refreshSidebar(); 
    renderCarousel();
    document.querySelectorAll('.lang-btn').forEach(btn => { 
        btn.onclick = () => { 
            document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active')); 
            btn.classList.add('active'); 
            currentLanguage = btn.dataset.lang; 
            document.getElementById('mic-label').textContent = translations[currentLanguage].micLabel;
            document.getElementById('status-text').textContent = translations[currentLanguage].status;
            renderCarousel();
        }; 
    });
};

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.onstart = () => { setUiState(true); document.getElementById('mic-label').textContent = translations[currentLanguage].listening; };
    recognition.onresult = (e) => { document.getElementById('user-input').value = e.results[0][0].transcript; };
    recognition.onend = () => { 
        setUiState(false); 
        document.getElementById('mic-label').textContent = translations[currentLanguage].micLabel; 
        if (document.getElementById('user-input').value) submitQuery(); 
    };
}

async function submitQuery() {
    const text = document.getElementById('user-input').value;
    if (!text) return;
    try {
        const res = await fetch('/api/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, language: currentLanguage }) });
        const data = await res.json();
        document.getElementById('response-text').textContent = data.response;
        document.getElementById('response-section').style.display = 'block';
        speakResponse(data.response, currentLanguage);
        refreshSidebar();
    } catch (e) { console.error(e); }
}

document.getElementById('mic-button').onclick = () => { 
    if (!recognition) return alert("Not supported.");
    recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN'; 
    recognition.start(); 
};
document.getElementById('history-btn').onclick = () => { window.location.href = 'history.html'; };
document.getElementById('pause-btn').onclick = () => { window.speechSynthesis.cancel(); recognition.stop(); setUiState(false); };
document.getElementById('new-query-btn').onclick = () => { 
    document.getElementById('response-section').style.display = 'none'; 
    document.getElementById('user-input').value = ''; 
    renderCarousel();
};
