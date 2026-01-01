let currentLanguage = 'en';
let recognition;
let isListening = false;

const translations = {
    en: { title: 'AwaazSetu', micLabel: 'Ready to Listen', listening: 'Listening...', responseTitle: 'Assistant Insights' },
    hi: { title: 'आवाज़सेतु', micLabel: 'बोलने के लिए तैयार', listening: 'सुन रहा हूँ...', responseTitle: 'सहायक अंतर्दृष्टि' }
};

// History Manager
function addToHistory(text) {
    const container = document.getElementById('history-list');
    const item = document.createElement('div');
    item.className = 'history-item';
    item.textContent = text.length > 30 ? text.substring(0, 30) + "..." : text;
    item.onclick = () => { document.getElementById('user-input').value = text; submitQuery(); };
    container.prepend(item);
}

// UI Feedback
function setMicActive(active) {
    const circle = document.querySelector('.inner-circle');
    const glow = document.querySelector('.outer-glow');
    if (active) {
        circle.style.transform = 'scale(1.2)';
        circle.style.boxShadow = '0 0 60px #10b981';
        glow.style.borderColor = '#10b981';
    } else {
        circle.style.transform = 'scale(1)';
        circle.style.boxShadow = '0 0 50px rgba(79, 70, 229, 0.5)';
        glow.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    }
}

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.onstart = () => { 
        isListening = true; 
        setMicActive(true);
        document.getElementById('mic-label').textContent = translations[currentLanguage].listening;
    };
    recognition.onresult = (e) => { document.getElementById('user-input').value = e.results[0][0].transcript; };
    recognition.onend = () => {
        isListening = false;
        setMicActive(false);
        document.getElementById('mic-label').textContent = translations[currentLanguage].micLabel;
        if (document.getElementById('user-input').value) submitQuery();
    };
}

async function submitQuery() {
    const text = document.getElementById('user-input').value;
    if (!text) return;
    document.getElementById('loading').style.display = 'flex';
    addToHistory(text);

    try {
        const res = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, language: currentLanguage })
        });
        const data = await res.json();
        document.getElementById('loading').style.display = 'none';
        document.getElementById('response-text').textContent = data.response;
        document.getElementById('response-section').style.display = 'block';
        speakText(data.response, currentLanguage);
    } catch (e) {
        document.getElementById('loading').style.display = 'none';
        alert("Check your server connection.");
    }
}

function speakText(text, lang) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
}

document.getElementById('mic-button').onclick = () => { 
    if (!recognition) return alert('Please use Chrome Browser');
    recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    isListening ? recognition.stop() : recognition.start(); 
};

document.querySelectorAll('.lang-btn').forEach(b => b.onclick = () => {
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    b.classList.add('active');
    currentLanguage = b.dataset.lang;
    document.getElementById('app-title').textContent = translations[currentLanguage].title;
    document.getElementById('mic-label').textContent = translations[currentLanguage].micLabel;
});

document.getElementById('new-query-btn').onclick = () => {
    document.getElementById('response-section').style.display = 'none';
    document.getElementById('user-input').value = '';
};
