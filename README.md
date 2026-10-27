# ⏳ Tech Age Test

A modern, fast-paced historical technology comparison game for the browser. Inspired by *The Higher Lower Game*, featuring 777 curated human inventions and scientific breakthroughs with high-resolution imagery and trivia.

---

## 🎮 How to Play

- **Objective**: Decide which of two historical technologies came **BEFORE** or **AFTER**.
- **Controls**:
  - **Click**: Click directly on the left or right half of the screen.
  - **Keyboard**: 
    - `←` Left Arrow: Choose left technology
    - `→` Right Arrow: Choose right technology
    - `T`: Toggle question mode (`WHICH CAME BEFORE?` ↔ `WHICH CAME AFTER?`)
    - `Space`: Proceed to Next Round or start New Game
- **Continuous Flow**: Each round you win, the new technology smoothly slides into the established position with all its historical dates, locations, and trivia preserved.
- **Non-Blocking Game Over**: When you lose, the screen does not cover up the answer with annoying popups. The central verdict shows `GAME OVER`, your final score, and the exact year difference, allowing you to study both technologies at your own pace.

---

## ✨ Key Features

- **777 Curated Technologies**: Spanning from early stone tools to modern artificial intelligence and quantum computing.
- **High-Resolution Imagery**: Enriched with authentic, full-resolution photographs and illustrations from Wikimedia Commons and Wikipedia.
- **Strict Minimalist Aesthetic**:
  - Clean grayscale dark mode palette (`#000000`, `#0c0c0e`, `#151518`) with a single crisp light-blue accent (`#70b5ff`).
  - No visual clutter, glowing neon distractions, or unnecessary border frames.
  - Powered by a single typographic system: **Inter** (weights 300 to 900).
- **Audio Synthesizer**: Custom real-time sound effects generated via Web Audio API (toggleable via the `⚙️` Settings menu).
- **Instant Preloading**: Background image preloader ensures zero delay and seamless visual transitions between rounds.

---

## 🚀 Quick Start

### Option 1: Direct in Browser
Simply double-click `pokreni_igru.bat` or open `index.html` directly in any modern web browser.

### Option 2: Local HTTP Server (Node.js)
Run the lightweight built-in Node server:
```bash
# Double-click pokreni_server.bat or run:
node server.js
```
Then visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 (Modern Flexbox, CSS Grid, Custom Properties, Keyframe Animations)
- **Typography**: Inter (Variable optical sizing & weights 300..900)
- **Audio**: Web Audio API (Oscillators, Gain nodes, Frequency modulation)
- **Server**: Lightweight zero-dependency Node.js HTTP static server
- **Data Source**: Curated from Historical Tech Tree & Wikipedia Commons

---

## 📜 License

MIT License. Free for educational and personal use.
