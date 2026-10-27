/**
 * TECH AGE TEST
 * Full-screen half-card split, Grayscale theme with a single Light Blue highlight,
 * center Game Over & year-difference display, and "Click to proceed" / "New Game" flow.
 */

// Audio Synthesizer via Web Audio API
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('tech_age_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('tech_age_muted', this.muted);
    return this.muted;
  }

  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(760, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.09, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  playCorrect() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);
      gain.gain.setValueAtTime(0.12, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  }

  playWrong() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }
}

// Confetti Particle Engine (Grayscale + Single Light Blue Accent ONLY)
class ConfettiEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  burst(x, y, count = 28) {
    if (!this.ctx) return;
    // Strictly Grayscale + The Single Light Blue Accent (#70b5ff)
    const colors = ['#ffffff', '#e4e4e7', '#a1a1aa', '#70b5ff', '#52525b'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 3;
      this.particles.push({
        x: x || window.innerWidth * 0.5,
        y: y || window.innerHeight * 0.45,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        life: 1,
        decay: Math.random() * 0.02 + 0.02
      });
    }
    if (!this.animId) {
      this.loop();
    }
  }

  loop() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.particles = this.particles.filter(p => p.life > 0);

    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.22;
      p.vx *= 0.98;
      p.rotation += p.rotSpeed;
      p.life -= p.decay;

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.loop());
    } else {
      this.animId = null;
    }
  }
}

// Main Game Controller
class TechAgeApp {
  constructor() {
    this.sound = new SoundEngine();
    this.confetti = new ConfettiEngine('confetti-canvas');

    // Target question mode: 'before' (default) vs 'after'
    let savedMode = localStorage.getItem('tech_age_target_mode') || 'before';
    if (savedMode === 'older') savedMode = 'before';
    if (savedMode === 'newer') savedMode = 'after';
    this.targetMode = savedMode;

    // Progression mode: 'manual' ("Click to proceed") is DEFAULT
    this.progressionMode = localStorage.getItem('tech_age_prog_mode') || 'manual';

    // Dataset
    this.items = typeof TECHNOLOGIES_DATA !== 'undefined' ? TECHNOLOGIES_DATA : [];
    this.usedIds = new Set();

    // Scores & State
    this.score = 0;
    this.bestScore = parseInt(localStorage.getItem('tech_age_best') || '0', 10);
    this.isLocked = false;
    this.waitingForProceed = false;
    this.isGameOver = false;

    // Current Round Items
    this.leftItem = null;
    this.rightItem = null;
    this.leftRevealedFromPrevious = false;
    this.nextRightCandidate = null;

    this.bindElements();
    this.init();
  }

  bindElements() {
    this.el = {
      // Header
      questionModeBtn: document.getElementById('question-mode-btn'),
      questionText: document.getElementById('question-text'),
      switchTag: document.getElementById('switch-tag'),
      scoreValue: document.getElementById('score-value'),
      bestValue: document.getElementById('best-value'),
      centerDivider: document.getElementById('center-divider'),
      centerTitle: document.getElementById('center-title'),
      centerSubtitle: document.getElementById('center-subtitle'),
      centerScore: document.getElementById('center-score'),

      // Settings
      settingsBtn: document.getElementById('settings-btn'),
      settingsDropdown: document.getElementById('settings-dropdown'),
      settingBtnSound: document.getElementById('setting-btn-sound'),
      settingBtnProg: document.getElementById('setting-btn-prog'),

      // Left Half Card
      leftCard: document.getElementById('left-card'),
      leftImg: document.getElementById('left-img'),
      leftCategory: document.getElementById('left-category'),
      leftTitle: document.getElementById('left-title'),
      leftRevealBox: document.getElementById('left-reveal-box'),
      leftYearNumber: document.getElementById('left-year-number'),
      leftStatusBadge: document.getElementById('left-status-badge'),
      leftLocationTag: document.getElementById('left-location-tag'),
      leftTriviaText: document.getElementById('left-trivia-text'),

      // Right Half Card
      rightCard: document.getElementById('right-card'),
      rightImg: document.getElementById('right-img'),
      rightCategory: document.getElementById('right-category'),
      rightTitle: document.getElementById('right-title'),
      rightRevealBox: document.getElementById('right-reveal-box'),
      rightYearNumber: document.getElementById('right-year-number'),
      rightStatusBadge: document.getElementById('right-status-badge'),
      rightLocationTag: document.getElementById('right-location-tag'),
      rightTriviaText: document.getElementById('right-trivia-text'),

      // Proceed Button
      proceedBtn: document.getElementById('proceed-btn'),

      // Arena
      splitArena: document.getElementById('split-arena')
    };
  }

  init() {
    this.updateQuestionBanner();
    this.updateScoreDisplay();
    this.updateSettingsUI();
    this.setupEvents();

    if (this.items.length === 0) {
      console.error('No technologies dataset available.');
      return;
    }

    this.startNewGame();
  }

  updateQuestionBanner() {
    const isBefore = this.targetMode === 'before';
    this.el.questionText.textContent = isBefore ? "WHICH CAME BEFORE?" : "WHICH CAME AFTER?";
  }

  toggleTargetMode() {
    this.targetMode = this.targetMode === 'before' ? 'after' : 'before';
    localStorage.setItem('tech_age_target_mode', this.targetMode);
    this.sound.playClick();
    this.updateQuestionBanner();
  }

  toggleProgressionMode() {
    this.progressionMode = this.progressionMode === 'auto' ? 'manual' : 'auto';
    localStorage.setItem('tech_age_prog_mode', this.progressionMode);
    this.sound.playClick();
    this.updateSettingsUI();
  }

  updateSettingsUI() {
    this.el.settingBtnSound.textContent = this.sound.muted ? "Off" : "On";
    if (!this.sound.muted) {
      this.el.settingBtnSound.classList.add('active');
    } else {
      this.el.settingBtnSound.classList.remove('active');
    }

    this.el.settingBtnProg.textContent = this.progressionMode === 'manual' ? "Click to proceed" : "Automatic";
    if (this.progressionMode === 'manual') {
      this.el.settingBtnProg.classList.add('active');
    } else {
      this.el.settingBtnProg.classList.remove('active');
    }
  }

  updateScoreDisplay() {
    this.el.scoreValue.textContent = this.score;
    this.el.bestValue.textContent = this.bestScore;
  }

  setupEvents() {
    // Question mode switch
    this.el.questionModeBtn.addEventListener('click', () => this.toggleTargetMode());

    // Settings dropdown toggle
    this.el.settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.el.settingsDropdown.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!this.el.settingsDropdown.contains(e.target) && e.target !== this.el.settingsBtn) {
        this.el.settingsDropdown.classList.remove('open');
      }
    });

    // Sound toggle
    this.el.settingBtnSound.addEventListener('click', (e) => {
      e.stopPropagation();
      this.sound.toggleMute();
      this.sound.playClick();
      this.updateSettingsUI();
    });

    // Advance mode toggle
    this.el.settingBtnProg.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleProgressionMode();
    });

    // Screen half clicks
    this.el.leftCard.addEventListener('click', () => {
      if (this.isGameOver) {
        this.startNewGame();
      } else if (this.waitingForProceed) {
        this.advanceContinuousProgression();
      } else if (!this.isLocked) {
        this.handleCardPick('left');
      }
    });

    this.el.rightCard.addEventListener('click', () => {
      if (this.isGameOver) {
        this.startNewGame();
      } else if (this.waitingForProceed) {
        this.advanceContinuousProgression();
      } else if (!this.isLocked) {
        this.handleCardPick('right');
      }
    });

    // Proceed button click
    this.el.proceedBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.isGameOver) {
        this.startNewGame();
      } else if (this.waitingForProceed) {
        this.advanceContinuousProgression();
      }
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (this.isGameOver) {
          this.startNewGame();
        } else if (this.waitingForProceed) {
          this.advanceContinuousProgression();
        }
      } else if (!this.isLocked && !this.waitingForProceed && !this.isGameOver) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.handleCardPick('left');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.handleCardPick('right');
        } else if (e.key.toLowerCase() === 't') {
          this.toggleTargetMode();
        }
      }
    });
  }

  getRandomItem(excludeIds = []) {
    const available = this.items.filter(it => !excludeIds.includes(it.id));
    if (available.length === 0) return this.items[Math.floor(Math.random() * this.items.length)];
    return available[Math.floor(Math.random() * available.length)];
  }

  startNewGame() {
    this.score = 0;
    this.usedIds.clear();
    this.leftRevealedFromPrevious = false;
    this.waitingForProceed = false;
    this.isGameOver = false;
    this.nextRightCandidate = null;

    this.el.proceedBtn.style.display = 'none';
    this.el.proceedBtn.className = 'proceed-btn';
    this.el.proceedBtn.textContent = 'Next Round (Space)';
    this.updateScoreDisplay();

    this.leftItem = this.getRandomItem();
    this.usedIds.add(this.leftItem.id);

    let candidate = this.getRandomItem([...this.usedIds]);
    let tries = 0;
    while (candidate.year === this.leftItem.year && tries < 20) {
      candidate = this.getRandomItem([...this.usedIds]);
      tries++;
    }
    this.rightItem = candidate;
    this.usedIds.add(this.rightItem.id);

    this.renderCurrentRound();
  }

  renderCurrentRound() {
    this.isLocked = false;
    this.waitingForProceed = false;
    this.isGameOver = false;

    this.el.proceedBtn.style.display = 'none';
    this.el.proceedBtn.className = 'proceed-btn';
    this.el.proceedBtn.textContent = 'Next Round (Space)';

    // Reset center divider to VS
    this.el.centerDivider.className = 'center-divider';
    this.el.centerTitle.textContent = 'VS';
    this.el.centerSubtitle.style.display = 'none';
    this.el.centerScore.style.display = 'none';

    // Reset card classes
    this.el.leftCard.className = 'half-card left-side';
    this.el.rightCard.className = 'half-card right-side';

    // Reset styles
    this.el.leftCard.style.transition = 'none';
    this.el.rightCard.style.transition = 'none';
    this.el.leftCard.style.transform = 'none';
    this.el.rightCard.style.transform = 'none';
    this.el.leftCard.style.opacity = '1';
    this.el.rightCard.style.opacity = '1';

    // The left item is the established item that stays: maintain its zoom seamlessly
    this.el.leftImg.style.transition = 'none';
    this.el.leftImg.classList.add('is-zoomed');
    this.setImage(this.el.leftImg, this.leftItem);
    void this.el.leftImg.offsetWidth; // Force reflow while transition is none
    this.el.leftImg.style.transition = '';

    // The right item is the incoming challenger: starts unzoomed, ready for hover
    this.el.rightImg.classList.remove('is-zoomed');
    this.setImage(this.el.rightImg, this.rightItem);

    // Hide status badges initially (revealed upon player pick)
    this.el.leftStatusBadge.style.display = 'none';
    this.el.rightStatusBadge.style.display = 'none';

    // Right card starts hidden
    this.el.rightRevealBox.style.display = 'none';

    // Left card data retention
    if (this.leftRevealedFromPrevious) {
      this.el.leftRevealBox.style.display = 'flex';
      this.el.leftYearNumber.textContent = this.leftItem.yearFormattedEn;

      if (this.leftItem.location && this.leftItem.location.trim().length > 0) {
        this.el.leftLocationTag.textContent = this.leftItem.location;
        this.el.leftLocationTag.style.display = 'inline-flex';
      } else {
        this.el.leftLocationTag.style.display = 'none';
      }

      if (this.leftItem.trivia && this.leftItem.trivia.trim().length > 0) {
        this.el.leftTriviaText.textContent = this.leftItem.trivia;
        this.el.leftTriviaText.style.display = 'block';
      } else {
        this.el.leftTriviaText.style.display = 'none';
      }
    } else {
      this.el.leftRevealBox.style.display = 'none';
    }

    // Set Left Item: English title only
    this.el.leftTitle.textContent = this.leftItem.titleEn;
    this.el.leftCategory.textContent = this.leftItem.categoryEn || 'Technology';

    // Set Right Item: English title only
    this.el.rightTitle.textContent = this.rightItem.titleEn;
    this.el.rightCategory.textContent = this.rightItem.categoryEn || 'Technology';
  }

  setImage(imgEl, item, onReady) {
    const src = item.imageHighRes || item.imageUrl;
    
    // If the image is already showing this exact src and is loaded, keep it visible
    if (imgEl.src === src && imgEl.complete && imgEl.naturalWidth > 0) {
      imgEl.style.opacity = '1';
      if (onReady) onReady();
      return;
    }

    // Immediately hide so the previous item's pixels are NEVER shown!
    imgEl.style.opacity = '0';

    const handleLoaded = () => {
      imgEl.style.opacity = '1';
      if (onReady) onReady();
    };

    imgEl.onload = handleLoaded;
    imgEl.onerror = () => {
      if (imgEl.src !== item.imageUrl) {
        imgEl.src = item.imageUrl;
        imgEl.onload = handleLoaded;
      }
    };

    imgEl.src = src;
    if (imgEl.complete && imgEl.naturalWidth > 0) {
      handleLoaded();
    }
  }

  handleCardPick(chosenSide) {
    if (this.isLocked || this.isGameOver) return;
    this.isLocked = true;
    this.sound.playClick();

    const isBeforeMode = this.targetMode === 'before';
    const leftCameBefore = this.leftItem.year < this.rightItem.year;
    const leftCameAfter = this.leftItem.year > this.rightItem.year;
    const isTie = this.leftItem.year === this.rightItem.year;

    let userCorrect = false;
    let winningSide = 'left';

    if (isBeforeMode) {
      winningSide = leftCameBefore ? 'left' : 'right';
      userCorrect = (chosenSide === winningSide) || isTie;
    } else {
      winningSide = leftCameAfter ? 'left' : 'right';
      userCorrect = (chosenSide === winningSide) || isTie;
    }

    this.revealRoundInfo(chosenSide, winningSide, userCorrect);
  }

  revealRoundInfo(chosenSide, winningSide, userCorrect) {
    const diff = Math.abs(this.leftItem.year - this.rightItem.year);
    const diffText = diff === 0 ? "SAME YEAR" : `${diff.toLocaleString('en-US')} YEARS APART`;

    // Reveal BOTH cards info
    this.el.leftRevealBox.style.display = 'flex';
    this.el.rightRevealBox.style.display = 'flex';

    // Years
    this.el.leftYearNumber.textContent = this.leftItem.yearFormattedEn;
    this.el.rightYearNumber.textContent = this.rightItem.yearFormattedEn;

    // Locations
    if (this.leftItem.location && this.leftItem.location.trim().length > 0) {
      this.el.leftLocationTag.textContent = this.leftItem.location;
      this.el.leftLocationTag.style.display = 'inline-flex';
    } else {
      this.el.leftLocationTag.style.display = 'none';
    }

    if (this.rightItem.location && this.rightItem.location.trim().length > 0) {
      this.el.rightLocationTag.textContent = this.rightItem.location;
      this.el.rightLocationTag.style.display = 'inline-flex';
    } else {
      this.el.rightLocationTag.style.display = 'none';
    }

    // Trivia: hide if empty
    if (this.leftItem.trivia && this.leftItem.trivia.trim().length > 0) {
      this.el.leftTriviaText.textContent = this.leftItem.trivia;
      this.el.leftTriviaText.style.display = 'block';
    } else {
      this.el.leftTriviaText.style.display = 'none';
    }

    if (this.rightItem.trivia && this.rightItem.trivia.trim().length > 0) {
      this.el.rightTriviaText.textContent = this.rightItem.trivia;
      this.el.rightTriviaText.style.display = 'block';
    } else {
      this.el.rightTriviaText.style.display = 'none';
    }

    // Prominent Standalone Verdict Badges (BEFORE / AFTER)
    const isTie = this.leftItem.year === this.rightItem.year;
    let leftBadge = "BEFORE";
    let rightBadge = "AFTER";
    if (isTie) {
      leftBadge = "SAME YEAR";
      rightBadge = "SAME YEAR";
    } else if (this.leftItem.year > this.rightItem.year) {
      leftBadge = "AFTER";
      rightBadge = "BEFORE";
    }

    this.el.leftStatusBadge.textContent = leftBadge;
    this.el.rightStatusBadge.textContent = rightBadge;
    this.el.leftStatusBadge.style.display = 'inline-flex';
    this.el.rightStatusBadge.style.display = 'inline-flex';

    // Keep images steadily zoomed upon reveal so user mouse movement doesn't cause zoom stutter
    this.el.rightImg.classList.add('is-zoomed');
    this.el.leftImg.classList.add('is-zoomed');

    if (winningSide === 'left') {
      this.el.leftStatusBadge.className = 'status-badge winner-badge';
      this.el.rightStatusBadge.className = 'status-badge loser-badge';
      this.el.rightCard.classList.add('dimmed');
    } else {
      this.el.rightStatusBadge.className = 'status-badge winner-badge';
      this.el.leftStatusBadge.className = 'status-badge loser-badge';
      this.el.leftCard.classList.add('dimmed');
    }

    if (userCorrect) {
      // CENTER BADGE: Shows Year Difference
      this.el.centerDivider.className = 'center-divider revealed';
      this.el.centerTitle.textContent = diffText;
      this.el.centerSubtitle.style.display = 'none';
      this.el.centerScore.style.display = 'none';

      this.onWinRound();
    } else {
      // GAME OVER IN CENTER
      this.isGameOver = true;
      this.sound.playWrong();

      this.el.centerDivider.className = 'center-divider game-over';
      this.el.centerTitle.textContent = "GAME OVER";
      this.el.centerSubtitle.textContent = diffText;
      this.el.centerSubtitle.style.display = 'block';
      this.el.centerScore.textContent = `FINAL SCORE: ${this.score}`;
      this.el.centerScore.style.display = 'block';

      this.el.proceedBtn.textContent = 'New Game (Space)';
      this.el.proceedBtn.className = 'proceed-btn new-game-btn';
      this.el.proceedBtn.style.display = 'block';
    }
  }

  onWinRound() {
    this.sound.playCorrect();
    this.confetti.burst(window.innerWidth * 0.5, window.innerHeight * 0.45, 60);

    this.score++;
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('tech_age_best', this.bestScore);
    }
    this.updateScoreDisplay();

    // Preload the next challenger immediately while player is on victory screen
    this.preloadNextChallenger();

    // Progression: "Click to proceed" is default
    if (this.progressionMode === 'manual') {
      this.waitingForProceed = true;
      this.el.proceedBtn.textContent = 'Next Round (Space)';
      this.el.proceedBtn.className = 'proceed-btn';
      this.el.proceedBtn.style.display = 'block';
    } else {
      setTimeout(() => {
        this.advanceContinuousProgression();
      }, 2100);
    }
  }

  preloadNextChallenger() {
    const futureLeftItem = this.rightItem;
    let candidate = this.getRandomItem([...this.usedIds]);
    let tries = 0;
    while (candidate.year === futureLeftItem.year && tries < 20) {
      candidate = this.getRandomItem([...this.usedIds]);
      tries++;
    }
    this.nextRightCandidate = candidate;
    this.usedIds.add(this.nextRightCandidate.id);

    // Preload image so it is fully cached and decodes with zero delay
    const src = this.nextRightCandidate.imageHighRes || this.nextRightCandidate.imageUrl;
    const preloader = new Image();
    preloader.src = src;
  }

  /**
   * CONTINUOUS PROGRESSION:
   * The right element moves over and takes the left spot, retaining all its revealed data!
   * The image that stays retains its zoom level seamlessly across the entire transition.
   */
  advanceContinuousProgression() {
    this.waitingForProceed = false;
    this.el.proceedBtn.style.display = 'none';

    // Disable pointer hover events on the arena during the slide to prevent accidental zoom twitches
    if (this.el.splitArena) this.el.splitArena.style.pointerEvents = 'none';

    // 1. Ensure right image remains steadily zoomed while sliding across
    this.el.rightImg.classList.add('is-zoomed');

    // 2. Pre-assign and pre-zoom leftImg BEFORE the swap with NO transition,
    // so leftImg is ALREADY displaying the exact same image at scale(1.04)
    this.el.leftImg.style.transition = 'none';
    this.el.leftImg.classList.add('is-zoomed');
    this.setImage(this.el.leftImg, this.rightItem);

    // Slide Left card out, Slide Right card into Left position
    this.el.leftCard.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease';
    this.el.rightCard.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease';

    this.el.leftCard.style.transform = 'translateX(-100%)';
    this.el.leftCard.style.opacity = '0';
    this.el.rightCard.style.transform = 'translateX(-100%)';

    setTimeout(() => {
      // Right item now becomes Left item, with all its revealed data kept visible!
      this.leftItem = this.rightItem;
      this.leftRevealedFromPrevious = true;

      // Use preloaded candidate or pick fresh
      if (this.nextRightCandidate) {
        this.rightItem = this.nextRightCandidate;
        this.nextRightCandidate = null;
      } else {
        let nextCandidate = this.getRandomItem([...this.usedIds]);
        let tries = 0;
        while (nextCandidate.year === this.leftItem.year && tries < 20) {
          nextCandidate = this.getRandomItem([...this.usedIds]);
          tries++;
        }
        this.rightItem = nextCandidate;
        this.usedIds.add(this.rightItem.id);
      }

      // Re-render
      this.renderCurrentRound();

      // Animate new right card sliding in from the right
      this.el.rightCard.style.transition = 'none';
      this.el.rightCard.style.transform = 'translateX(100%)';
      this.el.rightCard.style.opacity = '0';

      void this.el.rightCard.offsetWidth; // Force reflow

      this.el.rightCard.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s ease';
      this.el.rightCard.style.transform = 'none';
      this.el.rightCard.style.opacity = '1';

      // Restore pointer events once incoming right card finishes sliding
      setTimeout(() => {
        if (this.el.splitArena) this.el.splitArena.style.pointerEvents = '';
      }, 460);
    }, 510);
  }
}

// Start Game on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new TechAgeApp();
});
