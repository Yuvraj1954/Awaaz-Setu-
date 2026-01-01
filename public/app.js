let currentLanguage = 'en';
let recognition;
let isListening = false;
const translations = { 
    en: { micLabel: 'Tap to Speak', listening: 'Listening...', status: 'Bridge Active' }, 
    hi: { micLabel: 'बोलने के लिए टैप करें', listening: 'सुन रहा हूँ...', status: 'ब्रिज सक्रिय है' } 
};

function setUiState(listening) {
    const icon = document.getElementById('mic-icon');
    const wave = document.getElementById('waveform');
    const container = document.getElementById('mic-container');
    if (listening) { 
        icon.style.display = 'none'; 
        wave.style.display = 'flex'; 
        container.classList.add('pulse-active'); 
    } else { 
        icon.style.display = 'block'; 
        wave.style.display = 'none'; 
        container.classList.remove('pulse-active'); 
    }
}

// Fetch history from MongoDB via the Backend
async function refreshSidebar() {
    try {
        const res = await fetch('/api/history'); // Rewritten via vercel.json
        const history = await res.json();
        updateSidebarUI(history.slice(0, 5));
    } catch (e) { console.error("History fetch failed", e); }
}

function updateSidebarUI(items) {
    const container = document.getElementById('history-list');
    if (!container) return;
    container.innerHTML = ""; 
    items.forEach(item => {
        const div = document.createElement('div'); 
        div.className = "history-item"; // Use a class for cleaner CSS
        div.style = "padding: 10px; font-size: 0.8rem; margin-top: 8px; cursor: pointer; color: #94a3b8; border-radius: 10px; background: rgba(255,255,255,0.05); transition: 0.2s;";
        div.textContent = item.text.length > 20 ? item.text.substring(0, 20) + "..." : item.text;
        div.onclick = () => { document.getElementById('user-input').value = item.text; submitQuery(); };
        container.appendChild(div);
    });
}

window.onload = () => { 
    refreshSidebar(); 
    window.speechSynthesis.cancel(); 
};

if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
    recognition.onstart = () => { 
        isListening = true; 
        setUiState(true); 
        document.getElementById('mic-label').textContent = translations[currentLanguage].listening; 
    };
    recognition.onresult = (e) => { 
        document.getElementById('user-input').value = e.results[0][0].transcript; 
    };
    recognition.onend = () => { 
        isListening = false; 
        setUiState(false); 
        document.getElementById('mic-label').textContent = translations[currentLanguage].micLabel; 
        if (document.getElementById('user-input').value) submitQuery(); 
    };
}

async function submitQuery() {
    const text = document.getElementById('user-input').value;
    if (!text) return;
    
    try {
        const res = await fetch('/api/query', { // Rewritten via vercel.json
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ text, language: currentLanguage }) 
        });
        const data = await res.json();
        
        const responseSection = document.getElementById('response-section');
        document.getElementById('response-text').textContent = data.response;
        responseSection.style.display = 'block';

        // Auto-scroll logic for fixed height box
        setTimeout(() => { responseSection.scrollTop = responseSection.scrollHeight; }, 100);

        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(data.response); 
        u.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN'; 
        window.speechSynthesis.speak(u);

        refreshSidebar();
    } catch (e) { 
        console.error(e); 
        setUiState(false); 
    }
}

document.getElementById('mic-button').onclick = () => { 
    recognition.lang = currentLanguage === 'hi' ? 'hi-IN' : 'en-IN'; 
    isListening ? recognition.stop() : recognition.start(); 
};

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
};

document.getElementById('pause-btn').onclick = () => { 
    window.speechSynthesis.cancel(); 
    if (recognition) recognition.stop(); 
    setUiState(false); 
};
