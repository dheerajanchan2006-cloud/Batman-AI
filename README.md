# 🦇 ALFRED — BATCOMPUTER TACTICAL COMMAND INTERFACE
### The Batman // Wayne Enterprises Enclave

An ultra-immersive, cinematic, futuristic Batcomputer command center interface powered by **Flask**, **Groq Cloud API**, and a black & crimson tactical HUD visual system.

---

## 🎨 Core Visual Identity & Assets

- **Primary Welcome Artwork**: `welcome page.jpg` seamlessly layered behind the cinematic hero section with dark red vignettes, radial gradient masks (`linear-gradient(rgba(0,0,0,0.42), rgba(3,3,5,0.96))`), and tactical HUD reticles.
- **Main Application Logo**: `batman red logo.jpg` with a custom crimson glow (`filter: drop-shadow(0 0 8px rgba(255,0,0,.45)) drop-shadow(0 0 25px rgba(150,0,0,.25));`) integrated into the login screen, navbar, sidebar, welcome hero, loading sequence, and message avatars.
- **Color Hierarchy**:
  - Dominant Black & Charcoal: `#000000`, `#050505`, `#080808`, `#0d0d0d`, `#111111`, `#151515`
  - Dark Red Surfaces: `#250000`, `#3a0000`, `#500000`, `#680000`
  - Crimson & Blood-Red Accents: `#8b0000`, `#b30000`, `#d00000`, `#ff1a1a`
  - Text: `#f2f2f2`, `#c8c8c8`, `#888888`
- **Dynamic Gotham Atmosphere**:
  - **Canvas Rain Animation**: Ultra-lightweight vertical dark-gray raindrops with crimson refraction.
  - **Distant Lightning Effect**: Rare, subtle atmospheric flashes across the sky.
  - **Pulsing Red Bat-Signal**: Distant atmospheric projection drifting through Gotham cloud layers.

---

## ⚡ Key Features

1. **Cinematic Hero Welcome Screen**:
   - `[BATMAN RED LOGO]`
   - `ALFRED`
   - `BATCOMPUTER ONLINE`
   - *"How can I assist you, sir?"*
   - Categorized command cards: `DETECTIVE MODE`, `GOTHAM INTEL`, `WAYNE TECH`, `CYBER SECURITY`, `SCIENCE LAB`, `STRATEGIC ANALYSIS`.

2. **14 Gotham Character Intelligence Dossiers**:
   - Tactical character database featuring: **Batman, Robin, Nightwing, Batgirl/Oracle, Red Hood, Alfred, Commissioner Gordon, Catwoman, The Joker, Harley Quinn, The Riddler, Bane, Scarecrow, and Two-Face**.
   - Interactive hover with HUD scanner sweep, zoom, and crimson border illumination.
   - Click to automatically inject customized forensic and intelligence prompts into the Batcomputer terminal.

3. **Batcomputer Comms & Voice AI**:
   - **Comms Voice Capture (STT)**: Futuristic red communication device (`COMMS`, `LISTENING...`, `TRANSMITTING...`) with animated frequency radar rings.
   - **Voice Output (TTS)**: Animated red frequency bars with toggleable auto-synthesis and `STOP VOICE` controls.

4. **Batcomputer Terminal Streaming & Code**:
   - Neural processing HUD animation:
     `BATCOMPUTER // NEURAL PROCESSING... ANALYZING INPUT ██████████░░░░`
   - Code blocks styled like Batcomputer terminals (`BATCOMPUTER TERMINAL // PYTHON`) with syntax highlighting, red indicators, and one-click `COPY CODE`.

5. **Security & Zero-Trace Protocol**:
   - Encrypted user sessions with Werkzeug PBKDF2:SHA256 password hashing.
   - One-click classified purge (`Purge Data`) permanently destroys all case files and records from the SQLite database.
   - Secure logout sequence (`SECURING SESSION...` -> `CLEARING LOCAL ENCLAVE DATA...` -> `TERMINATING CONNECTION...` -> `BATCOMPUTER OFFLINE.`).

---

## 🚀 Running the Batcomputer

```bash
# 1. Ensure dependencies are installed
pip install -r requirements.txt

# 2. Run the server
python app.py
```

Access the Batcomputer command terminal at **`http://127.0.0.1:5000`**.
