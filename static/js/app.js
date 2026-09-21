/**
 * app.js - ALFRED // BATCOMPUTER TACTICAL COMMAND INTERFACE
 * The Batman // Gotham Enclave
 * Real-time Groq inference, Gotham Operative Dossiers, Red HUD Comms,
 * Canvas Rain & Lightning, and zero-trace data purging.
 */

// ==========================================
// Application State
// ==========================================
const state = {
    activeConversationId: null,
    conversations: [],
    isStreaming: false,
    autoTtsEnabled: localStorage.getItem('nexus_batcomputer_auto_tts') === 'true',
    isListening: false,
    isSpeaking: false,
    currentUtterance: null,
    recognition: null,
};

// ==========================================
// 14 Gotham Characters Intelligence Dossier Data
// ==========================================
const GOTHAM_CHARACTERS = [
    {
        id: "batman",
        name: "BATMAN",
        role: "TACTICAL ANALYSIS // DETECTIVE MODE",
        status: "ACTIVE",
        statusClass: "status-active",
        icon: "🦇",
        summary: "Master tactician, deductive forensic specialist, peak combat readiness.",
        prompt: "Activate Detective Mode: Analyze the following threat matrix and suggest precision counter-measures:"
    },
    {
        id: "robin",
        name: "ROBIN",
        role: "ACROBATIC RECON // COMBAT SUPPORT",
        status: "ACTIVE",
        statusClass: "status-active",
        icon: "🦅",
        summary: "Rapid urban reconnaissance, aerial infiltration, and tactical support.",
        prompt: "Robin, assist with field reconnaissance and rapid perimeter threat analysis for:"
    },
    {
        id: "nightwing",
        name: "NIGHTWING",
        role: "BLÜDHAVEN INTEL // INFILTRATION",
        status: "ACTIVE",
        statusClass: "status-active",
        icon: "🔷",
        summary: "Specialist in urban acrobatics, covert infiltration, and field leadership.",
        prompt: "Nightwing, provide covert tactical infiltration blueprints and egress routes for:"
    },
    {
        id: "batgirl",
        name: "BATGIRL / ORACLE",
        role: "ORACLE NETWORK // CYBER WARFARE",
        status: "ACTIVE",
        statusClass: "status-active",
        icon: "💻",
        summary: "Master cryptographer, network intrusion analyst, global telemetry tracker.",
        prompt: "Oracle / Batgirl, initiate a cryptographic sweep and decrypt these data vectors:"
    },
    {
        id: "redhood",
        name: "RED HOOD",
        role: "UNDERWORLD INTEL // LETHAL PROTOCOL",
        status: "STANDBY",
        statusClass: "status-standby",
        icon: "🔴",
        summary: "Underworld informant network, tactical weaponry, counter-syndicate raids.",
        prompt: "Red Hood, assess Gotham underworld syndicate movements and armaments for:"
    },
    {
        id: "alfred",
        name: "ALFRED PENNYWORTH",
        role: "COMMAND OPS // STRATEGIC LOGISTICS",
        status: "ACTIVE",
        statusClass: "status-active",
        icon: "☕",
        summary: "Field operations director, diplomatic liaison, operational life support.",
        prompt: "Alfred, assist me with operational planning, logistics, and strategic contingencies for:"
    },
    {
        id: "gordon",
        name: "COMMISSIONER GORDON",
        role: "GCPD DISPATCH // MAJOR CRIMES",
        status: "ACTIVE",
        statusClass: "status-active",
        icon: "🚨",
        summary: "GCPD municipal records, police dispatch telemetry, forensic archives.",
        prompt: "Analyze Gotham intelligence, crime telemetry, and municipal records regarding:"
    },
    {
        id: "catwoman",
        name: "CATWOMAN",
        role: "BLACK MARKET INTEL // INFILTRATION",
        status: "STANDBY",
        statusClass: "status-standby",
        icon: "🐾",
        summary: "High-security burglary specialist, underground fence networks, rooftop access.",
        prompt: "Identify stealth infiltration routes and vault bypass vulnerabilities for:"
    },
    {
        id: "joker",
        name: "THE JOKER",
        role: "ARKHAM RECORD #01 // PSYCHOLOGICAL",
        status: "INCARCERATED",
        statusClass: "status-incarcerated",
        icon: "🃏",
        summary: "Severe psychological threat, asymmetric chaos methodology, toxic weaponry.",
        prompt: "Analyze psychological threat profile and behavioral chaos theory regarding The Joker's methodology:"
    },
    {
        id: "harley",
        name: "HARLEY QUINN",
        role: "ARKHAM RECORD #08 // UNPREDICTABLE",
        status: "STANDBY",
        statusClass: "status-standby",
        icon: "♦",
        summary: "Erratic behavioral patterns, gymnast combatant, psychological manipulation.",
        prompt: "Examine psychological triggers, chaotic distraction patterns, and syndicate ties for:"
    },
    {
        id: "riddler",
        name: "THE RIDDLER",
        role: "CRYPTOGRAPHIC CIPHERS // SABOTAGE",
        status: "INCARCERATED",
        statusClass: "status-incarcerated",
        icon: "❓",
        summary: "High-level cryptographic puzzles, algorithmic traps, municipal sabotage.",
        prompt: "Solve this complex cryptographic cipher and decipher the hidden logic:"
    },
    {
        id: "bane",
        name: "BANE",
        role: "TACTICAL WARFARE // VENOM SYNTHESIS",
        status: "INCARCERATED",
        statusClass: "status-incarcerated",
        icon: "💉",
        summary: "Military tactician, chemical physical enhancement, infrastructure siege.",
        prompt: "Assess military siege tactics, physical attrition strategies, and chemical enhancements:"
    },
    {
        id: "scarecrow",
        name: "SCARECROW",
        role: "FEAR TOXIN // BIOCHEMICAL THREAT",
        status: "STANDBY",
        statusClass: "status-standby",
        icon: "🎃",
        summary: "Aerosol fear neurotoxins, psychological conditioning, chemical dispersal.",
        prompt: "Analyze biochemical neurotoxin compositions, fear conditioning, and antidote protocols for:"
    },
    {
        id: "twoface",
        name: "TWO-FACE",
        role: "DUAL LOGISTICS // SYNDICATES",
        status: "INCARCERATED",
        statusClass: "status-incarcerated",
        icon: "⚖",
        summary: "Dual-split decision algorithms, extortion networks, racketeering operations.",
        prompt: "Break down the binary game theory and probability distribution for this scenario:"
    }
];

// ==========================================
// Markdown & Highlight.js Configuration
// ==========================================
if (typeof marked !== 'undefined') {
    marked.setOptions({
        breaks: true,
        gfm: true,
        highlight: function (code, lang) {
            if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(code, { language: lang }).value;
                } catch (e) {}
            }
            if (typeof hljs !== 'undefined') {
                try {
                    return hljs.highlightAuto(code).value;
                } catch (e) {}
            }
            return code;
        }
    });
}

function renderMarkdown(rawText) {
    if (typeof marked === 'undefined') return rawText;
    const rawHtml = marked.parse(rawText || '');
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(rawHtml);
    }
    return rawHtml;
}

// ==========================================
// Batcomputer Boot Sequence HUD
// ==========================================
function runBootSequenceIfFirstVisit() {
    const overlay = document.getElementById('bootOverlay');
    if (!overlay) return;

    if (sessionStorage.getItem('batcomputer_booted') === 'true') {
        overlay.classList.add('hidden');
        return;
    }

    overlay.classList.remove('hidden');
    const consoleEl = document.getElementById('bootConsole');
    consoleEl.innerHTML = '';

    const lines = [
        "INITIALIZING BATCOMPUTER NEURAL CORE...",
        "WAYNE TACTICAL NETWORK ......... CONNECTED",
        "GOTHAM SATELLITE LINK .......... ACTIVE",
        "FORENSIC & CRYPTO CORES ........ ONLINE",
        "COMMS & AUDIO RADAR ............ READY",
        "ALFRED SYSTEM .................. ARMED"
    ];

    let index = 0;
    const interval = setInterval(() => {
        if (index < lines.length) {
            const lineDiv = document.createElement('div');
            lineDiv.className = 'boot-line';
            if (index === lines.length - 1) {
                lineDiv.style.color = 'var(--c-crimson-glow)';
                lineDiv.style.fontWeight = 'bold';
            }
            lineDiv.textContent = lines[index];
            consoleEl.appendChild(lineDiv);
            index++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                overlay.style.transition = 'opacity 0.4s ease';
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    sessionStorage.setItem('batcomputer_booted', 'true');
                }, 400);
            }, 600);
        }
    }, 240);
}

// ==========================================
// Gotham Rain & Lightning Environment
// ==========================================
function initGothamEnvironment() {
    // 1. Lightweight Canvas Rain
    const canvas = document.getElementById('gothamRainCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        window.addEventListener('resize', () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        });

        const drops = [];
        const count = Math.min(85, Math.floor(w / 18));
        for (let i = 0; i < count; i++) {
            drops.push({
                x: Math.random() * w,
                y: Math.random() * h,
                l: 14 + Math.random() * 20,
                v: 9 + Math.random() * 12,
                c: Math.random() > 0.88 ? 'rgba(255, 30, 30, 0.45)' : 'rgba(120, 120, 120, 0.16)'
            });
        }

        function renderRain() {
            ctx.clearRect(0, 0, w, h);
            for (let i = 0; i < drops.length; i++) {
                const d = drops[i];
                ctx.strokeStyle = d.c;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + 0.8, d.y + d.l);
                ctx.stroke();

                d.y += d.v;
                d.x += 0.4;
                if (d.y > h) {
                    d.y = -d.l;
                    d.x = Math.random() * w;
                }
            }
            requestAnimationFrame(renderRain);
        }

        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            renderRain();
        }
    }

    // 2. Rare Distant Lightning Effect
    const flashEl = document.getElementById('lightningFlash');
    if (flashEl && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        function scheduleLightning() {
            const nextFlashDelay = 15000 + Math.random() * 25000; // Rare: 15-40s
            setTimeout(() => {
                flashEl.classList.add('flashing');
                setTimeout(() => {
                    flashEl.classList.remove('flashing');
                    // Occasional double strike
                    if (Math.random() > 0.6) {
                        setTimeout(() => {
                            flashEl.classList.add('flashing');
                            setTimeout(() => flashEl.classList.remove('flashing'), 70);
                        }, 90);
                    }
                    scheduleLightning();
                }, 90);
            }, nextFlashDelay);
        }
        scheduleLightning();
    }

    // 3. Subtle Tactical Cursor Reticle
    const cursorDot = document.getElementById('tacticalCursor');
    if (cursorDot && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.addEventListener('mousemove', (e) => {
            cursorDot.style.left = e.clientX + 'px';
            cursorDot.style.top = e.clientY + 'px';
        });
    }
}

// ==========================================
// Character Intelligence Section Generator
// ==========================================
function populateCharacterGrid() {
    const grid = document.getElementById('characterCardsGrid');
    if (!grid) return;

    grid.innerHTML = '';
    GOTHAM_CHARACTERS.forEach(char => {
        const card = document.createElement('div');
        card.className = 'character-tactical-card';
        card.onclick = () => selectCharacterPrompt(char.prompt);

        card.innerHTML = `
            <div class="char-scan-line"></div>
            <div class="char-visual-area">
                <span class="char-silhouette-icon">${char.icon}</span>
                <span class="char-status-badge ${char.statusClass}">${char.status}</span>
            </div>
            <div class="char-info-area">
                <span class="char-name">${char.name}</span>
                <span class="char-role">${char.role}</span>
                <p class="char-intel-summary">${char.summary}</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

function openCharacterModal() {
    document.getElementById('characterModalBackdrop').classList.remove('hidden');
    populateCharacterGrid();
}

function closeCharacterModal() {
    document.getElementById('characterModalBackdrop').classList.add('hidden');
}

function selectCharacterPrompt(promptText) {
    closeCharacterModal();
    const input = document.getElementById('userInput');
    input.value = promptText + " ";
    adjustTextareaHeight();
    input.focus();
}

// ==========================================
// Audio AI Engine (Comms STT & Voice Synthesis)
// ==========================================
function initAudioEngines() {
    // 1. Comms Speech-to-Text
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        state.recognition = new SpeechRecognition();
        state.recognition.continuous = false;
        state.recognition.interimResults = true;
        state.recognition.lang = 'en-US';

        state.recognition.onstart = () => {
            state.isListening = true;
            updateVoiceUiState();
        };

        state.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const input = document.getElementById('userInput');
            if (finalTranscript) {
                input.value = (input.value ? input.value + ' ' : '') + finalTranscript;
                adjustTextareaHeight();
            } else if (interimTranscript) {
                document.getElementById('voiceStatusText').innerText = `TRANSMITTING: "${interimTranscript}"`;
            }
        };

        state.recognition.onerror = (event) => {
            console.warn('Speech recognition warning:', event.error);
            state.isListening = false;
            updateVoiceUiState();
        };

        state.recognition.onend = () => {
            state.isListening = false;
            updateVoiceUiState();
        };
    } else {
        const micBtn = document.getElementById('btnVoiceInput');
        if (micBtn) {
            micBtn.title = 'Voice capture not supported in this browser';
            micBtn.style.opacity = '0.35';
        }
    }

    // 2. Text-to-Speech (Batcomputer Synthesis)
    updateTtsButtonUi();
}

function toggleVoiceRecognition() {
    if (!state.recognition) {
        alert('Voice capture requires a browser supporting Web Speech API (Chrome, Edge, Safari).');
        return;
    }

    if (state.isListening) {
        state.recognition.stop();
        state.isListening = false;
    } else {
        stopAllSpeech();
        try {
            state.recognition.start();
            state.isListening = true;
        } catch (e) {
            console.error('Recognition start error:', e);
        }
    }
    updateVoiceUiState();
}

function updateVoiceUiState() {
    const micBtn = document.getElementById('btnVoiceInput');
    const label = document.getElementById('commsBtnLabel');
    const banner = document.getElementById('voiceStatusBar');
    const statusText = document.getElementById('voiceStatusText');

    if (state.isListening) {
        micBtn.classList.add('listening');
        if (label) label.innerText = 'LISTENING...';
        banner.classList.remove('hidden');
        statusText.innerText = 'BATCOMPUTER LISTENING...';
    } else {
        micBtn.classList.remove('listening');
        if (label) label.innerText = 'COMMS';
        banner.classList.add('hidden');
    }
}

function cancelVoiceRecognition() {
    if (state.recognition && state.isListening) {
        state.recognition.abort();
        state.isListening = false;
        updateVoiceUiState();
    }
}

// Batcomputer Voice Synthesizer
function speakBatcomputer(text, onEndCallback = null) {
    if (!('speechSynthesis' in window)) return;

    stopAllSpeech();

    // Clean formatting for spoken voice
    const cleanSpokenText = text
        .replace(/```[\s\S]*?```/g, 'Code block omitted.')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[*_~#]/g, '')
        .trim();

    if (!cleanSpokenText) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpokenText);
    utterance.rate = 1.02;
    utterance.pitch = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('UK') || v.name.includes('David')));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => {
        state.isSpeaking = true;
        state.currentUtterance = utterance;
        const stopBtn = document.getElementById('btnStopSpeech');
        if (stopBtn) stopBtn.classList.remove('hidden');
        const banner = document.getElementById('voiceOutputBanner');
        if (banner) banner.classList.remove('hidden');
    };

    utterance.onend = () => {
        state.isSpeaking = false;
        state.currentUtterance = null;
        const stopBtn = document.getElementById('btnStopSpeech');
        if (stopBtn) stopBtn.classList.add('hidden');
        const banner = document.getElementById('voiceOutputBanner');
        if (banner) banner.classList.add('hidden');
        if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
        state.isSpeaking = false;
        state.currentUtterance = null;
        const stopBtn = document.getElementById('btnStopSpeech');
        if (stopBtn) stopBtn.classList.add('hidden');
        const banner = document.getElementById('voiceOutputBanner');
        if (banner) banner.classList.add('hidden');
    };

    window.speechSynthesis.speak(utterance);
}

function stopAllSpeech() {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }
    state.isSpeaking = false;
    state.currentUtterance = null;
    const stopBtn = document.getElementById('btnStopSpeech');
    if (stopBtn) stopBtn.classList.add('hidden');
    const banner = document.getElementById('voiceOutputBanner');
    if (banner) banner.classList.add('hidden');

    document.querySelectorAll('.btn-tactical-action.speaking-now').forEach(btn => {
        btn.classList.remove('speaking-now');
        btn.innerHTML = `<span class="action-icon">🔊</span> LISTEN`;
    });
}

function toggleAutoTts() {
    state.autoTtsEnabled = !state.autoTtsEnabled;
    localStorage.setItem('nexus_batcomputer_auto_tts', state.autoTtsEnabled);
    updateTtsButtonUi();
}

function updateTtsButtonUi() {
    const btn = document.getElementById('btnAutoTtsToggle');
    const tag = document.getElementById('ttsStatusTag');
    const sideTag = document.getElementById('sidebarVoiceTag');
    if (!btn || !tag) return;

    if (state.autoTtsEnabled) {
        btn.classList.add('active');
        tag.innerText = 'VOICE: ON';
        if (sideTag) sideTag.innerText = 'ON';
    } else {
        btn.classList.remove('active');
        tag.innerText = 'VOICE: OFF';
        if (sideTag) sideTag.innerText = 'OFF';
    }
}

// ==========================================
// Investigations / Case Files Operations
// ==========================================
async function loadConversations() {
    try {
        const response = await fetch('/api/conversations');
        if (!response.ok) throw new Error('Failed to query investigations');
        const data = await response.json();
        state.conversations = data.conversations || [];
        renderConversationsList();

        if (state.activeConversationId) {
            await selectConversation(state.activeConversationId);
        }
    } catch (err) {
        console.error('Batcomputer query error:', err);
    }
}

function renderConversationsList(filterText = '') {
    const listContainer = document.getElementById('conversationsList');
    const countBadge = document.getElementById('caseFileCount');
    if (!listContainer) return;

    const filtered = state.conversations.filter(c => 
        c.title.toLowerCase().includes(filterText.toLowerCase())
    );

    if (countBadge) {
        countBadge.innerText = `${state.conversations.length} FILES`;
    }

    if (filtered.length === 0) {
        listContainer.innerHTML = `<div class="conv-skeleton">No investigations found</div>`;
        return;
    }

    listContainer.innerHTML = '';
    filtered.forEach((conv, idx) => {
        const item = document.createElement('div');
        item.className = `conv-item ${conv.id === state.activeConversationId ? 'active' : ''}`;
        item.onclick = () => selectConversation(conv.id);

        let displayTitle = conv.title;
        if (!displayTitle.startsWith('CASE FILE')) {
            const fileNum = String(state.conversations.length - idx).padStart(3, '0');
            displayTitle = `CASE FILE ${fileNum} // ${displayTitle}`;
        }

        item.innerHTML = `
            <div class="conv-item-left">
                <span class="conv-file-badge">CASE</span>
                <span class="conv-title">${escapeHtml(displayTitle)}</span>
            </div>
            <div class="conv-item-actions">
                <button class="conv-btn-del" title="Erase case file" onclick="event.stopPropagation(); deleteConversation('${conv.id}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        listContainer.appendChild(item);
    });
}

async function selectConversation(conversationId) {
    if (state.isStreaming) return;
    stopAllSpeech();

    state.activeConversationId = conversationId;
    renderConversationsList();

    const current = state.conversations.find(c => c.id === conversationId);
    if (current) {
        let title = current.title;
        if (!title.startsWith('CASE FILE')) {
            title = `CASE FILE // ${title}`;
        }
        document.getElementById('activeChatTitle').innerText = title;
    }

    try {
        const res = await fetch(`/api/conversations/${conversationId}`);
        if (!res.ok) throw new Error('Investigation not found');
        const data = await res.json();
        renderMessages(data.messages || []);
    } catch (err) {
        console.error('Case file retrieval failed:', err);
    }
}

function startNewChat() {
    if (state.isStreaming) return;
    stopAllSpeech();

    state.activeConversationId = null;
    document.getElementById('activeChatTitle').innerText = 'CASE FILE // New Investigation';
    document.getElementById('messagesList').innerHTML = '';
    document.getElementById('heroWelcome').classList.remove('hidden');
    renderConversationsList();

    const input = document.getElementById('userInput');
    input.value = '';
    adjustTextareaHeight();
    input.focus();
}

async function deleteConversation(conversationId) {
    if (!confirm('Permanently erase this investigation file from the Batcomputer?')) return;

    try {
        const res = await fetch(`/api/conversations/${conversationId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete rejected');

        state.conversations = state.conversations.filter(c => c.id !== conversationId);
        if (state.activeConversationId === conversationId) {
            startNewChat();
        } else {
            renderConversationsList();
        }
    } catch (err) {
        alert('Could not erase case: ' + err.message);
    }
}

async function renameCurrentConversation() {
    if (!state.activeConversationId) return;
    const current = state.conversations.find(c => c.id === state.activeConversationId);
    const newTitle = prompt('Enter new Case File title:', current ? current.title : '');
    if (!newTitle || !newTitle.trim()) return;

    let formatted = newTitle.trim();
    if (!formatted.startsWith('CASE FILE')) {
        formatted = `CASE FILE // ${formatted}`;
    }

    try {
        const res = await fetch(`/api/conversations/${state.activeConversationId}/title`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: formatted })
        });
        if (res.ok) {
            if (current) current.title = formatted;
            document.getElementById('activeChatTitle').innerText = formatted;
            renderConversationsList();
        }
    } catch (err) {
        console.error('Rename failed:', err);
    }
}

// ==========================================
// Rendering Messages & Tactical Actions
// ==========================================
function renderMessages(messages) {
    const hero = document.getElementById('heroWelcome');
    const list = document.getElementById('messagesList');
    list.innerHTML = '';

    if (!messages || messages.length === 0) {
        hero.classList.remove('hidden');
        return;
    }

    hero.classList.add('hidden');
    messages.forEach(msg => {
        appendMessageElement(msg.sender, msg.content, false);
    });

    scrollToBottom();
}

function appendMessageElement(sender, content, isStreamingNow = false) {
    document.getElementById('heroWelcome').classList.add('hidden');
    const list = document.getElementById('messagesList');

    const row = document.createElement('div');
    row.className = `message-row message-${sender}`;

    if (sender === 'user') {
        row.innerHTML = `
            <div class="message-bubble">${escapeHtml(content)}</div>
        `;
    } else {
        const bubbleId = 'bat-msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        row.innerHTML = `
            <div class="assistant-avatar-bat" title="Batcomputer Neural Core">
                <img src="/static/images/batman%20red%20logo.jpg" alt="Batcomputer" class="assistant-avatar-logo">
            </div>
            <div class="message-content-wrap">
                <div class="assistant-name-bar">
                    <span>BATCOMPUTER // ALFRED</span>
                    <span class="assistant-bat-indicator">🦇 LEVEL 9 ENCLAVE</span>
                </div>
                <div class="message-bubble ${isStreamingNow ? 'typing-cursor' : ''}" id="${bubbleId}">
                    ${renderMarkdown(content)}
                </div>
                <div class="assistant-toolbar">
                    <button class="btn-tactical-action" onclick="copyMessageText('${bubbleId}', this)">
                        <span class="action-icon">📋</span> COPY
                    </button>
                    <button class="btn-tactical-action" onclick="toggleSpeakMessage('${bubbleId}', this)">
                        <span class="action-icon">🔊</span> LISTEN
                    </button>
                    <button class="btn-tactical-action" onclick="triggerRegenerate()">
                        <span class="action-icon">🔄</span> REGENERATE
                    </button>
                    <button class="btn-tactical-action" onclick="triggerTacticalAnalysis('${bubbleId}')">
                        <span class="action-icon">🧠</span> ANALYZE
                    </button>
                </div>
            </div>
        `;
    }

    list.appendChild(row);
    enhanceCodeBlocks(row);
    return row;
}

// Enhance Code Blocks into Batcomputer Terminals
function enhanceCodeBlocks(container) {
    const preBlocks = container.querySelectorAll('pre');
    preBlocks.forEach(pre => {
        if (pre.parentElement.classList.contains('code-block-wrapper')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'code-block-wrapper';

        const codeEl = pre.querySelector('code');
        let language = 'PYTHON';
        if (codeEl) {
            const classMatch = codeEl.className.match(/language-(\w+)/);
            if (classMatch) language = classMatch[1].toUpperCase();
        }

        const header = document.createElement('div');
        header.className = 'code-block-header';
        header.innerHTML = `
            <div class="code-title-wrap">
                <span class="code-pip-red"></span>
                <span>BATCOMPUTER TERMINAL // ${language}</span>
            </div>
            <button class="btn-copy-code" onclick="copyCode(this)">
                COPY CODE
            </button>
        `;

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(header);
        wrapper.appendChild(pre);
    });
}

function copyCode(btn) {
    const codeEl = btn.closest('.code-block-wrapper').querySelector('pre code');
    if (!codeEl) return;
    navigator.clipboard.writeText(codeEl.innerText).then(() => {
        btn.innerText = 'COPIED';
        setTimeout(() => { btn.innerText = 'COPY CODE'; }, 2000);
    });
}

function copyMessageText(bubbleId, btn) {
    const bubble = document.getElementById(bubbleId);
    if (!bubble) return;
    navigator.clipboard.writeText(bubble.innerText).then(() => {
        const original = btn.innerHTML;
        btn.innerHTML = `<span class="action-icon">✓</span> COPIED`;
        setTimeout(() => { btn.innerHTML = original; }, 2000);
    });
}

function toggleSpeakMessage(bubbleId, btn) {
    const bubble = document.getElementById(bubbleId);
    if (!bubble) return;

    if (btn.classList.contains('speaking-now')) {
        stopAllSpeech();
        btn.classList.remove('speaking-now');
        btn.innerHTML = `<span class="action-icon">🔊</span> LISTEN`;
    } else {
        stopAllSpeech();
        btn.classList.add('speaking-now');
        btn.innerHTML = `<span class="action-icon">⏹</span> STOP VOICE`;
        speakBatcomputer(bubble.innerText, () => {
            btn.classList.remove('speaking-now');
            btn.innerHTML = `<span class="action-icon">🔊</span> LISTEN`;
        });
    }
}

function triggerRegenerate() {
    const userMessages = document.querySelectorAll('.message-user .message-bubble');
    if (userMessages.length === 0) return;
    const lastUserText = userMessages[userMessages.length - 1].innerText;
    document.getElementById('userInput').value = lastUserText;
    sendMessage();
}

function triggerTacticalAnalysis(bubbleId) {
    const input = document.getElementById('userInput');
    input.value = "Activate Tactical Analysis: Break down the preceding intelligence, examine structural vulnerabilities, and provide tactical recommendations.";
    adjustTextareaHeight();
    sendMessage();
}

// ==========================================
// Real-Time Chat Streaming Engine (Groq)
// ==========================================
async function sendMessage() {
    const input = document.getElementById('userInput');
    const messageText = input.value.trim();
    if (!messageText || state.isStreaming) return;

    input.value = '';
    adjustTextareaHeight();
    stopAllSpeech();

    // Render user message bubble
    appendMessageElement('user', messageText);
    scrollToBottom();

    // Show neural processing HUD
    const procHud = document.getElementById('neuralProcessingHud');
    if (procHud) procHud.classList.remove('hidden');

    // Prepare streaming assistant bubble
    state.isStreaming = true;
    document.getElementById('btnSendMessage').disabled = true;

    const row = appendMessageElement('assistant', '', true);
    const bubble = row.querySelector('.message-bubble');
    let accumulatedContent = '';

    const model = document.getElementById('modelSelect').value;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: messageText,
                conversation_id: state.activeConversationId,
                model: model
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || `HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        // Hide processing HUD once stream initiates
        if (procHud) procHud.classList.add('hidden');

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith('data:')) continue;

                const jsonStr = trimmed.slice(5).trim();
                if (!jsonStr) continue;

                try {
                    const data = JSON.parse(jsonStr);

                    if (data.type === 'meta') {
                        if (!state.activeConversationId && data.conversation_id) {
                            state.activeConversationId = data.conversation_id;
                            loadConversations();
                        }
                    } else if (data.type === 'chunk') {
                        accumulatedContent += data.content;
                        bubble.innerHTML = renderMarkdown(accumulatedContent);
                        enhanceCodeBlocks(row);
                        scrollToBottom();
                    } else if (data.type === 'done') {
                        break;
                    }
                } catch (e) {
                    console.error('SSE parsing error:', e);
                }
            }
        }
    } catch (err) {
        console.error('Batcomputer transmission error:', err);
        accumulatedContent += `\n\n*(Batcomputer Transmission Error: ${err.message})*`;
        bubble.innerHTML = renderMarkdown(accumulatedContent);
    } finally {
        if (procHud) procHud.classList.add('hidden');
        state.isStreaming = false;
        bubble.classList.remove('typing-cursor');
        document.getElementById('btnSendMessage').disabled = false;
        enhanceCodeBlocks(row);
        scrollToBottom();

        // If Auto-Voice is active, voice the answer
        if (state.autoTtsEnabled && accumulatedContent) {
            speakBatcomputer(bubble.innerText);
        }
    }
}

// ==========================================
// Security Modals & Data Purging
// ==========================================
function openWipeModal() {
    document.getElementById('wipeModalBackdrop').classList.remove('hidden');
}

function closeWipeModal() {
    document.getElementById('wipeModalBackdrop').classList.add('hidden');
}

async function performDataWipe() {
    try {
        const res = await fetch('/api/user/wipe-data', { method: 'POST' });
        if (!res.ok) throw new Error('Erase command failed');

        closeWipeModal();
        stopAllSpeech();

        state.conversations = [];
        state.activeConversationId = null;

        startNewChat();
        renderConversationsList();

        alert('Batcomputer Confirmed: All intelligence records and case files have been permanently erased.');
    } catch (e) {
        alert('Security purge error: ' + e.message);
    }
}

// Tactical Logout Sequence
function performSecureLogout() {
    stopAllSpeech();
    cancelVoiceRecognition();

    const overlay = document.getElementById('logoutOverlay');
    const logs = document.getElementById('logoutLogs');
    overlay.classList.remove('hidden');
    logs.innerHTML = '';

    const lines = [
        "SECURING SESSION...",
        "CLEARING LOCAL ENCLAVE DATA...",
        "TERMINATING CONNECTION...",
        "BATCOMPUTER OFFLINE."
    ];

    let idx = 0;
    const interval = setInterval(() => {
        if (idx < lines.length) {
            const line = document.createElement('div');
            line.className = 'log-line';
            if (idx === lines.length - 1) {
                line.style.color = 'var(--c-crimson-glow)';
                line.style.fontWeight = 'bold';
            }
            line.textContent = lines[idx];
            logs.appendChild(line);
            idx++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                localStorage.removeItem('nexus_batcomputer_auto_tts');
                sessionStorage.clear();
                window.location.href = '/logout';
            }, 600);
        }
    }, 280);
}

// ==========================================
// System Diagnostics & Network Modals
// ==========================================
function openDiagnosticsModal() {
    document.getElementById('diagnosticsModalBackdrop').classList.remove('hidden');
}

function closeDiagnosticsModal() {
    document.getElementById('diagnosticsModalBackdrop').classList.add('hidden');
}

function openWayneNetworkModal() {
    document.getElementById('wayneNetworkModalBackdrop').classList.remove('hidden');
}

function closeWayneNetworkModal() {
    document.getElementById('wayneNetworkModalBackdrop').classList.add('hidden');
}

// ==========================================
// Utilities
// ==========================================
function escapeHtml(str) {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function scrollToBottom() {
    const container = document.getElementById('chatContainer');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

function adjustTextareaHeight() {
    const textarea = document.getElementById('userInput');
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
}

function applySuggestion(promptText) {
    const input = document.getElementById('userInput');
    input.value = promptText;
    adjustTextareaHeight();
    input.focus();
    sendMessage();
}

function exportCurrentChatAsMarkdown() {
    const messages = document.querySelectorAll('.message-row');
    if (messages.length === 0) {
        alert('No active case telemetry to export.');
        return;
    }

    let mdContent = `# BATCOMPUTER // TACTICAL INVESTIGATION DOSSIER\n`;
    mdContent += `*Classification: TOP SECRET // WAYNE ENCLAVE*\n`;
    mdContent += `*Timestamp: ${new Date().toUTCString()}*\n\n---\n\n`;

    messages.forEach(row => {
        const isUser = row.classList.contains('message-user');
        const role = isUser ? 'OPERATIVE / INVESTIGATOR' : 'BATCOMPUTER (ALFRED)';
        const text = row.querySelector('.message-bubble').innerText;
        mdContent += `### [${role}]\n\n${text}\n\n---\n\n`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batcomputer_dossier_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
}

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Run Boot HUD if first session visit
    runBootSequenceIfFirstVisit();

    // 2. Gotham Environment: Rain, Lightning, Cursor
    initGothamEnvironment();

    // 3. Populate 14 Character Intelligence Dossiers
    populateCharacterGrid();

    // 4. Audio Engine (Comms & Synthesis)
    initAudioEngines();

    // 5. Load Investigations
    loadConversations();

    // 6. Textarea listeners
    const userInput = document.getElementById('userInput');
    if (userInput) {
        userInput.addEventListener('input', adjustTextareaHeight);
        userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    // 7. Send Button
    const btnSend = document.getElementById('btnSendMessage');
    if (btnSend) btnSend.addEventListener('click', sendMessage);

    // 8. New Investigation & Shortcuts
    const btnNewChat = document.getElementById('btnNewChat');
    if (btnNewChat) btnNewChat.addEventListener('click', startNewChat);

    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            startNewChat();
        }
        if (e.key === 'Escape') {
            closeWipeModal();
            closeDiagnosticsModal();
            closeWayneNetworkModal();
            closeCharacterModal();
        }
    });

    // 9. Comms Voice Trigger
    const btnVoice = document.getElementById('btnVoiceInput');
    if (btnVoice) btnVoice.addEventListener('click', toggleVoiceRecognition);

    const btnCancelVoice = document.getElementById('btnCancelVoice');
    if (btnCancelVoice) btnCancelVoice.addEventListener('click', cancelVoiceRecognition);

    const btnAutoTts = document.getElementById('btnAutoTtsToggle');
    if (btnAutoTts) btnAutoTts.addEventListener('click', toggleAutoTts);

    const btnStopSpeech = document.getElementById('btnStopSpeech');
    if (btnStopSpeech) btnStopSpeech.addEventListener('click', stopAllSpeech);

    // 10. Rename & Export
    const btnRename = document.getElementById('btnRenameChat');
    if (btnRename) btnRename.addEventListener('click', renameCurrentConversation);

    const btnExport = document.getElementById('btnExportChat');
    if (btnExport) btnExport.addEventListener('click', exportCurrentChatAsMarkdown);

    // 11. Sidebar Toggle
    const btnToggleSidebar = document.getElementById('btnToggleSidebar');
    const sidebar = document.getElementById('sidebar');
    if (btnToggleSidebar && sidebar) {
        btnToggleSidebar.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('mobile-open');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    const btnCloseMobile = document.getElementById('btnCloseSidebarMobile');
    if (btnCloseMobile && sidebar) {
        btnCloseMobile.addEventListener('click', () => {
            sidebar.classList.remove('mobile-open');
        });
    }

    // 12. Search Case Files Filter
    const searchInput = document.getElementById('searchChatsInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderConversationsList(e.target.value);
        });
    }

    // 13. Security Modals & Logout
    const btnOpenWipe = document.getElementById('btnOpenWipeModal');
    if (btnOpenWipe) btnOpenWipe.addEventListener('click', openWipeModal);

    const btnCancelWipe = document.getElementById('btnCancelWipe');
    if (btnCancelWipe) btnCancelWipe.addEventListener('click', closeWipeModal);

    const btnConfirmWipe = document.getElementById('btnConfirmWipe');
    if (btnConfirmWipe) btnConfirmWipe.addEventListener('click', performDataWipe);

    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) btnLogout.addEventListener('click', performSecureLogout);
});
