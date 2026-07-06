(function () {
  'use strict';

  const FINGER_NAMES = [
    'Polegar',
    'Indicador',
    'Médio',
    'Anelar',
    'Mínimo',
  ];

  const TEMPLATE_URL = chrome.runtime.getURL('src/content/biometric-overlay.html');

  let instance = null;

  class BiometricOverlay {
    constructor() {
      this._events = {};
      this._currentStep = 0;
      this._readerConnected = false;
      this._activeFinger = -1;
      this._capturedFingers = [];
      this._isSimulating = false;
      this._root = null;
      this._passwordVisible = false;
    }

    // ── Observer Pattern ──────────────────────────────────────

    on(event, callback) {
      if (!this._events[event]) this._events[event] = [];
      this._events[event].push(callback);
      return this;
    }

    off(event, callback) {
      const list = this._events[event];
      if (!list) return;
      this._events[event] = list.filter(cb => cb !== callback);
      return this;
    }

    _emit(event, data) {
      const list = this._events[event];
      if (list) list.forEach(cb => cb(data));
    }

    // ── Lifecycle ─────────────────────────────────────────────

    async show() {
      if (this._root) return;

      const resp = await fetch(TEMPLATE_URL);
      const html = await resp.text();

      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      this._root = wrapper.firstElementChild;

      document.documentElement.appendChild(this._root);

      requestAnimationFrame(() => {
        this._root.style.display = 'block';
      });

      this._bindUI();

      if (!this._isSimulating) {
        this._startSimulation();
      }

      this._emit('shown');
    }

    hide() {
      if (!this._root) return;
      this._root.style.display = 'none';
      this._emit('hidden');
    }

    destroy() {
      this._stopSimulation();
      if (this._root && this._root.parentNode) {
        this._root.parentNode.removeChild(this._root);
      }
      this._root = null;
      this._events = {};
      if (instance === this) instance = null;
      this._emit('destroyed');
    }

    // ── DOM Binding ───────────────────────────────────────────

    _bindUI() {
      const $ = (sel) => this._root.querySelector(sel);
      const $$ = (sel) => this._root.querySelectorAll(sel);

      this._els = {
        backdrop: $('#ar-bio-backdrop'),
        card: $('#ar-bio-card'),
        close: $('#ar-bio-close'),
        steps: $$('.ar-bio-step'),
        panels: $$('.ar-bio-panel'),
        readerIcon: $('#ar-bio-reader-icon'),
        readerText: $('#ar-bio-reader-text'),
        readerSpinner: $('#ar-bio-reader-spinner'),
        fingerSegments: $$('.ar-bio-finger-segment'),
        fingerPrompt: $('#ar-bio-finger-prompt'),
        progressFill: $('#ar-bio-progress-fill'),
        progressText: $('#ar-bio-progress-text'),
        captureStatus: $('#ar-bio-capture-status'),
        scanCheck: $('#ar-bio-scan-check'),
        qualiBars: $$('.ar-bio-qual-bar'),
        qualiScore: $('#ar-bio-quality-score'),
        password: $('#ar-bio-password'),
        togglePw: $('#ar-bio-toggle-pw'),
        signBtn: $('#ar-bio-sign-btn'),
        cancelBtn: $('#ar-bio-cancel-btn'),
        nextBtn: $('#ar-bio-next-btn'),
        resultPanel: $('#ar-bio-result-panel'),
        resultIcon: $('#ar-bio-result-icon'),
        resultTitle: $('#ar-bio-result-title'),
        resultDetails: $('#ar-bio-result-details'),
        resultClose: $('#ar-bio-result-close'),
      };

      this._els.close.addEventListener('click', () => {
        this._emit('close');
        this.destroy();
      });

      this._els.cancelBtn.addEventListener('click', () => {
        this._emit('cancel');
        this.destroy();
      });

      this._els.nextBtn.addEventListener('click', () => {
        this._emit('next');
      });

      this._els.togglePw.addEventListener('click', () => {
        this._passwordVisible = !this._passwordVisible;
        this._els.password.type = this._passwordVisible ? 'text' : 'password';
      });

      this._els.signBtn.addEventListener('click', () => {
        const pw = this._els.password.value;
        if (!pw) {
          this._els.password.classList.add('error');
          return;
        }
        this._els.password.classList.remove('error');
        this._els.signBtn.disabled = true;
        this._els.signBtn.textContent = 'Assinando...';
        this._emit('agrSign', pw);
      });

      this._els.resultClose.addEventListener('click', () => {
        this._emit('resultClose');
        this.destroy();
      });

      this._els.password.addEventListener('input', () => {
        this._els.password.classList.remove('error');
        this._els.signBtn.disabled = false;
        this._els.signBtn.textContent = 'Assinar com Token AGR';
      });

      this._els.backdrop.addEventListener('click', (e) => {
        if (e.target === this._els.backdrop) {
          this._emit('backdrop');
        }
      });
    }

    // ── Step Management ──────────────────────────────────────

    setStep(step) {
      if (step < 1 || step > 4) return;
      this._currentStep = step;

      this._els.steps.forEach((el) => {
        const s = parseInt(el.dataset.step, 10);
        el.classList.toggle('active', s === step);
        el.classList.toggle('completed', s < step);
      });

      this._els.panels.forEach((el) => {
        const s = el.dataset.panel;
        if (s) {
          el.style.display = parseInt(s, 10) === step ? 'block' : 'none';
        }
      });

      const isLast = step === 4;
      this._els.nextBtn.style.display = 'none';
      this._els.cancelBtn.style.display = isLast ? 'none' : 'inline-flex';
    }

    // ── Reader Status ─────────────────────────────────────────

    setReaderStatus(connected) {
      this._readerConnected = connected;
      const icon = this._els.readerIcon;
      icon.classList.remove('connected', 'error');
      if (connected) {
        icon.classList.add('connected');
        this._els.readerText.textContent = 'Leitor conectado';
        this._els.readerSpinner.style.display = 'none';
      } else {
        icon.classList.add('error');
        this._els.readerText.textContent = 'Leitor não encontrado';
        this._els.readerSpinner.style.display = 'none';
      }
      this._emit('readerStatus', connected);
    }

    // ── Finger Guide ──────────────────────────────────────────

    setFingerGuide(fingerIndex) {
      if (fingerIndex < 0 || fingerIndex > 4) {
        this._els.fingerSegments.forEach(el => el.classList.remove('active'));
        return;
      }
      this._activeFinger = fingerIndex;

      this._els.fingerSegments.forEach((el) => {
        const idx = parseInt(el.dataset.finger, 10);
        el.classList.remove('active');
        el.classList.toggle('active', idx === fingerIndex && !this._capturedFingers.includes(idx));
        el.classList.toggle('done', this._capturedFingers.includes(idx));
      });

      this._els.fingerPrompt.textContent = `Coloque o ${FINGER_NAMES[fingerIndex].toLowerCase()} no leitor`;
    }

    // ── Capture Progress ──────────────────────────────────────

    setProgress(percent) {
      const p = Math.min(100, Math.max(0, percent));
      this._els.progressFill.style.width = `${p}%`;
      this._els.progressText.textContent = `${Math.round(p)}%`;

      if (percent >= 100) {
        this._els.scanCheck.classList.add('visible');
      } else {
        this._els.scanCheck.classList.remove('visible');
      }
    }

    setQuality(score) {
      const level = Math.min(5, Math.max(1, Math.round(score / 20) + 1));
      this._els.qualiBars.forEach((el, i) => {
        for (let c = 1; c <= 5; c++) el.classList.remove(`active-${c}`);
        if (i < level) el.classList.add(`active-${level}`);
      });
      this._els.qualiScore.textContent = `NFIQ: ${level}`;
      this._emit('quality', { score, level });
    }

    // ── Result Display ────────────────────────────────────────

    showResult(success, data) {
      const icon = this._els.resultIcon;
      icon.classList.remove('success', 'error');
      icon.classList.add(success ? 'success' : 'error');

      this._els.resultTitle.textContent = success ? 'Captura concluída com sucesso!' : 'Falha na captura';

      if (success && data) {
        const lines = [];
        if (data.fingerprints) lines.push(`Impressões: ${data.fingerprints}/5`);
        if (data.nfiq !== undefined) lines.push(`NFIQ: ${data.nfiq}`);
        if (data.quality) lines.push(`Qualidade: ${data.quality}%`);
        if (data.message) lines.push(data.message);
        this._els.resultDetails.innerHTML = lines.map(l => `<p>${l}</p>`).join('');
      } else if (!success && data) {
        this._els.resultDetails.innerHTML = `<p>${data.message || 'Erro desconhecido'}</p>`;
      }

      this._els.resultPanel.style.display = 'flex';
      this._emit('result', { success, data });
    }

    showError(message) {
      this.showResult(false, { message });
    }

    // ── Simulation ────────────────────────────────────────────

    _startSimulation() {
      if (this._isSimulating) return;
      this._isSimulating = true;
      this._capturedFingers = [];
      this.setStep(1);

      this._simulateReaderDetection();
    }

    _stopSimulation() {
      this._isSimulating = false;
    }

    _simulateReaderDetection() {
      if (!this._isSimulating) return;

      this._els.readerSpinner.style.display = 'block';
      this._els.readerText.textContent = 'Detectando leitor biométrico...';

      setTimeout(() => {
        if (!this._isSimulating) return;
        const connected = Math.random() > 0.1;
        this.setReaderStatus(connected);

        if (connected) {
          setTimeout(() => {
            if (!this._isSimulating) return;
            this._simulateFingerPlacement();
          }, 600);
        } else {
          this._els.readerText.textContent = 'Tente conectar o leitor e clique em Avançar';
          this._els.readerText.style.color = '#dc2626';
          this._els.nextBtn.style.display = 'inline-flex';
          this._els.nextBtn.onclick = () => {
            this._els.nextBtn.style.display = 'none';
            this._els.readerText.style.color = '';
            this._simulateReaderDetection();
          };
        }
      }, 2000);
    }

    _simulateFingerPlacement() {
      if (!this._isSimulating) return;
      this.setStep(2);

      let idx = 0;
      const placeNext = () => {
        if (!this._isSimulating || idx >= 5) {
          setTimeout(() => {
            if (!this._isSimulating) return;
            this._simulateCapture();
          }, 500);
          return;
        }

        this.setFingerGuide(idx);
        this._emit('fingerPlaced', idx);

        setTimeout(() => {
          if (!this._isSimulating) return;
          this._capturedFingers.push(idx);
          this._els.fingerSegments.forEach((el) => {
            const fi = parseInt(el.dataset.finger, 10);
            if (fi === idx) el.classList.remove('active');
            if (fi === idx) el.classList.add('done');
          });
          idx++;
          setTimeout(placeNext, 400);
        }, 1200);
      };

      placeNext();
    }

    _simulateCapture() {
      if (!this._isSimulating) return;
      this.setStep(3);

      this._els.captureStatus.textContent = 'Capturando impressões digitais...';
      this.setProgress(0);

      const duration = 3000;
      const interval = 60;
      let elapsed = 0;

      const tick = () => {
        if (!this._isSimulating) return;
        elapsed += interval;
        const pct = Math.min(100, (elapsed / duration) * 100);
        this.setProgress(pct);

        if (pct < 50) {
          this._els.captureStatus.textContent = 'Digitalizando impressões...';
        } else if (pct < 85) {
          this._els.captureStatus.textContent = 'Processando imagem...';
        } else if (pct < 100) {
          this._els.captureStatus.textContent = 'Verificando qualidade...';
        } else {
          this._els.captureStatus.textContent = 'Captura concluída!';
          this._emit('captureComplete', { progress: 100 });

          setTimeout(() => {
            if (!this._isSimulating) return;
            this._simulateQualityCheck();
          }, 500);
          return;
        }

        setTimeout(tick, interval);
      };

      tick();
    }

    _simulateQualityCheck() {
      if (!this._isSimulating) return;
      this.setStep(4);

      const finalNfiq = Math.floor(Math.random() * 3) + 1;
      const qualityScore = Math.floor(Math.random() * 20) + 75;

      let currentScore = 0;
      const animateQual = () => {
        if (!this._isSimulating) return;
        currentScore += 2;
        if (currentScore >= qualityScore) {
          currentScore = qualityScore;
          this.setQuality(finalNfiq);
          this._emit('captureComplete', {
            success: true,
            data: {
              fingerprints: 5,
              nfiq: finalNfiq,
              quality: qualityScore,
            },
          });

          setTimeout(() => {
            if (!this._isSimulating) return;
            this.showResult(true, {
              fingerprints: 5,
              nfiq: finalNfiq,
              quality: qualityScore,
              message: 'Biometria capturada com sucesso. Pronto para assinatura.',
            });
          }, 400);
          return;
        }
        this.setQuality(Math.floor(currentScore / 20) + 1);
        setTimeout(animateQual, 60);
      };

      animateQual();
    }

    // ── Static Factory ───────────────────────────────────────

    static getInstance() {
      if (!instance) {
        instance = new BiometricOverlay();
      }
      return instance;
    }
  }

  window.ARBiometricOverlay = BiometricOverlay;
})();
