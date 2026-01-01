let currentLanguage = 'en';
let recognition;
let isListening = false;

// --- PERSISTENT LOGS (Last 5 for Sidebar) ---
function saveToPersistentLog(text) {
    let fullHistory = JSON.parse(localStorage.getItem('awaazSetu_FullHistory') || '[]');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    fullHistory.unshift({ text, lang: currentLanguage, time: timestamp });
    localStorage.setItem('awaazSetu_FullHistory', JSON.stringify(fullHistory));
    
    updateSidebarUI(fullHistory.slice(0, 5));
}

function updateSidebarUI(items) {
    const container = document.getElementById('history-list');
    if (!container) return;
    container.innerHTML = ""; 
    items.forEach(item => {
        const div = document.createElement('div');
        div.style = "background: rgba(255,255,255,0.05); padding: 12px; border-radius: 10px; font-size: 0.8rem; margin-top: 10px; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); color: #94a3b8; font-weight: 600;";
        div.textContent = item.text.length > 20 ? item.text.substring(0, 20) + "..." : item.text;
        div.onclick = () => { document.getElementById('user-input').value = item.text; submitQuery(); };
        container.appendChild(div);
    });
}

window.onload = () => {
    const history = JSON.parse(localStorage.getItem('awaazSetu_FullHistory') || '[]');
    updateSidebarUI(history.slice(0, 5));
    window.speechSynthesis.cancel();
};

// --- API & VOICE ---
if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.onstart = () => { 
        isListening = true; 
        document.querySelector('.inner-circle').style.transform = 'scale(1.2)'; 
    };
    recognition.onresult = (e) => { document.getElementById('user-input').value = e.results[0][0].transcript; };
    recognition.onend = () => { 
        isListening = false; 
        document.querySelector('.inner-circle').style.transform = 'scale(1)'; 
        if (document.getElementById('user-input').value) submitQuery(); 
    };
}

async function submitQuery() {
    const text = document.getElementById('user-input').value;
    if (!text) return;
    saveToPersistentLog(text);
    try {
        const res = await fetch('/api/query', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ text, language: currentLanguage }) 
        });
        const data = await res.json();
        document.getElementById('response-text').textContent = data.response;
        document.getElementById('response-section').style.display = 'block';
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(data.response);
        u.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN';
        window.speechSynthesis.speak(u);
    } catch (e) { console.error(e); }
}

// Button Listeners
document.getElementById('mic-button').onclick = () => { 
    recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN'; 
    isListening ? recognition.stop() : recognition.start(); 
};

// LINK TO HISTORY PAGE
document.getElementById('history-btn').onclick = () => { window.location.href = 'history.html'; };

document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLanguage = btn.dataset.lang;
    };
});

document.getElementById('new-query-btn').onclick = () => {
    document.getElementById('response-section').style.display = 'none';
    document.getElementById('user-input').value = '';
    window.speechSynthesis.cancel();
};

document.getElementById('pause-btn').onclick = () => {
    window.speechSynthesis.cancel();
    if (recognition) recognition.stop();
};
