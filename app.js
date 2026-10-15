/**
 * Population Genetics Explorer & Wahlund Effect Simulator
 * Modern Application Controller & UI Coordinator
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ========================================================================
  // DOM Elements Cache
  // ========================================================================
  const els = {
    // Theme & Modals
    html: document.documentElement,
    btnTheme: document.getElementById('btn-theme-toggle'),
    iconThemeDark: document.querySelector('.theme-icon-dark'),
    iconThemeLight: document.querySelector('.theme-icon-light'),
    btnOpenTheory: document.getElementById('btn-open-theory'),
    btnCloseTheory: document.getElementById('btn-close-theory'),
    modalTheory: document.getElementById('modal-theory'),
    btnExportCsv: document.getElementById('btn-export-csv'),

    // Core Parameters
    sliderPopSize: document.getElementById('slider-pop-size'),
    numPopSize: document.getElementById('num-pop-size'),
    sliderInitP: document.getElementById('slider-init-p'),
    numInitP: document.getElementById('num-init-p'),
    sliderGenerations: document.getElementById('slider-generations'),
    numGenerations: document.getElementById('num-generations'),
    sliderReplications: document.getElementById('slider-replications'),
    numReplications: document.getElementById('num-replications'),

    // Geography & Substructure
    lblSubpop: document.getElementById('lbl-subpop'),
    subpopButtons: document.querySelectorAll('.subpop-btn'),
    sliderMRate: document.getElementById('slider-m-rate'),
    numMRate: document.getElementById('num-m-rate'),
    chkNonRandom: document.getElementById('chk-non-random'),
    groupDistDecay: document.getElementById('group-dist-decay'),
    sliderDistDecay: document.getElementById('slider-dist-decay'),
    numDistDecay: document.getElementById('num-dist-decay'),

    // Advanced Parameters
    btnToggleAdvanced: document.getElementById('btn-toggle-advanced'),
    bodyAdvanced: document.getElementById('body-advanced'),
    iconAdvancedChevron: document.getElementById('icon-advanced-chevron'),
    numMu: document.getElementById('num-mu'),
    numNu: document.getElementById('num-nu'),
    numW11: document.getElementById('num-w11'),
    numW12: document.getElementById('num-w12'),
    numW22: document.getElementById('num-w22'),

    // Action buttons
    btnRunSim: document.getElementById('btn-run-sim'),
    chkAutoRun: document.getElementById('chk-auto-run'),
    btnReset: document.getElementById('btn-reset'),
    presetChips: document.querySelectorAll('.preset-chip'),

    // KPI Badges
    kpiP: document.getElementById('kpi-p'),
    kpiDeltaP: document.getElementById('kpi-delta-p'),
    kpiPStatus: document.getElementById('kpi-p-status'),
    kpiFst: document.getElementById('kpi-fst'),
    kpiFstPill: document.getElementById('kpi-fst-pill'),
    kpiFis: document.getElementById('kpi-fis'),
    kpiFit: document.getElementById('kpi-fit'),
    kpiDeltaH: document.getElementById('kpi-deltah'),
    kpiRuntime: document.getElementById('kpi-runtime'),
    kpiRepsGens: document.getElementById('kpi-reps-gens'),

    // Visualizations
    pPlot: document.getElementById('p-plot-container'),
    chkShowBounds: document.getElementById('chk-show-bounds'),
    gtPlot: document.getElementById('gt-plot-container'),
    chkShowHw: document.getElementById('chk-show-hw'),
    fPlot: document.getElementById('f-plot-container'),
    insetFst: document.getElementById('inset-fst'),
    insetFis: document.getElementById('inset-fis'),
    insetFit: document.getElementById('inset-fit'),

    // Spatial Canvas & Playback
    spatialCanvas: document.getElementById('spatial-canvas'),
    canvasWrapper: document.getElementById('canvas-wrapper'),
    spatialTooltip: document.getElementById('spatial-tooltip'),
    chkShowHalos: document.getElementById('chk-show-halos'),
    spCountA1A1: document.getElementById('sp-count-a1a1'),
    spCountA1A2: document.getElementById('sp-count-a1a2'),
    spCountA2A2: document.getElementById('sp-count-a2a2'),
    btnPlayPause: document.getElementById('btn-play-pause'),
    iconPlay: document.getElementById('icon-play'),
    iconPause: document.getElementById('icon-pause'),
    btnStepPrev: document.getElementById('btn-step-prev'),
    btnStepNext: document.getElementById('btn-step-next'),
    sliderTimeline: document.getElementById('slider-timeline'),
    lblCurrentGen: document.getElementById('lbl-current-gen'),
    selectPlaybackSpeed: document.getElementById('select-playback-speed'),
    spatialSubpopLabel: document.getElementById('spatial-subpop-label'),

    // Wahlund Calculator
    calcP1: document.getElementById('calc-p1'),
    calcP2: document.getElementById('calc-p2'),
    calcValP1: document.getElementById('calc-val-p1'),
    calcValP2: document.getElementById('calc-val-p2'),
    calcResPbar: document.getElementById('calc-res-pbar'),
    calcResHt: document.getElementById('calc-res-ht'),
    calcResHs: document.getElementById('calc-res-hs'),
    calcResFst: document.getElementById('calc-res-fst'),
  };

  // ========================================================================
  // Application State
  // ========================================================================
  const state = {
    params: {
      pop_size: 500,
      init_p: 0.5,
      generations: 50,
      replications: 1,
      num_subpops: 1,
      m_rate: 0.01,
      non_random_mating: false,
      dist_decay: 10,
      mu: 0,
      nu: 0,
      w11: 1.0,
      w12: 1.0,
      w22: 1.0,
    },
    currentResult: null,
    playback: {
      isPlaying: false,
      currentGen: 50,
      maxGen: 50,
      speed: 1,
      timerId: null,
    },
    theme: localStorage.getItem('popgen_theme') || 'dark',
    autoRun: true,
  };

  // Set initial theme
  els.html.setAttribute('data-theme', state.theme);
  updateThemeIcons();

  // ========================================================================
  // Presets Configuration
  // ========================================================================
  const PRESETS = {
    default: {
      pop_size: 500,
      init_p: 0.5,
      generations: 50,
      replications: 1,
      num_subpops: 1,
      m_rate: 0.01,
      non_random_mating: false,
      dist_decay: 10,
      mu: 0,
      nu: 0,
      w11: 1,
      w12: 1,
      w22: 1,
    },
    wahlund: {
      pop_size: 600,
      init_p: 0.5,
      generations: 80,
      replications: 1,
      num_subpops: 3,
      m_rate: 0.0,
      non_random_mating: false,
      dist_decay: 10,
      mu: 0,
      nu: 0,
      w11: 1,
      w12: 1,
      w22: 1,
    },
    panmixia: {
      pop_size: 600,
      init_p: 0.5,
      generations: 80,
      replications: 1,
      num_subpops: 3,
      m_rate: 0.2,
      non_random_mating: false,
      dist_decay: 10,
      mu: 0,
      nu: 0,
      w11: 1,
      w12: 1,
      w22: 1,
    },
    drift: {
      pop_size: 40,
      init_p: 0.5,
      generations: 100,
      replications: 6,
      num_subpops: 1,
      m_rate: 0.01,
      non_random_mating: false,
      dist_decay: 10,
      mu: 0,
      nu: 0,
      w11: 1,
      w12: 1,
      w22: 1,
    },
    overdominance: {
      pop_size: 500,
      init_p: 0.1,
      generations: 100,
      replications: 1,
      num_subpops: 1,
      m_rate: 0.01,
      non_random_mating: false,
      dist_decay: 10,
      mu: 0,
      nu: 0,
      w11: 0.7,
      w12: 1.0,
      w22: 0.7,
    },
    spatial: {
      pop_size: 500,
      init_p: 0.5,
      generations: 60,
      replications: 1,
      num_subpops: 1,
      m_rate: 0.01,
      non_random_mating: true,
      dist_decay: 25,
      mu: 0,
      nu: 0,
      w11: 1,
      w12: 1,
      w22: 1,
    },
  };

  // ========================================================================
  // Theme Toggle & Helpers
  // ========================================================================
  function updateThemeIcons() {
    const isDark = state.theme === 'dark';
    els.iconThemeDark.style.display = isDark ? 'inline-block' : 'none';
    els.iconThemeLight.style.display = isDark ? 'none' : 'inline-block';
  }

  els.btnTheme.addEventListener('click', () => {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    els.html.setAttribute('data-theme', state.theme);
    localStorage.setItem('popgen_theme', state.theme);
    updateThemeIcons();
    if (state.currentResult) {
      renderPlots(state.currentResult);
      renderSpatialFrame(state.playback.currentGen);
    }
  });

  // Get current theme-aware Plotly layout config
  function getPlotlyTheme() {
    const isDark = state.theme === 'dark';
    return {
      paper_bgcolor: 'transparent',
      plot_bgcolor: isDark ? 'rgba(17, 24, 39, 0.4)' : 'rgba(248, 250, 252, 0.7)',
      font: {
        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: isDark ? '#cbd5e1' : '#475569',
        size: 11,
      },
      xaxis: {
        gridcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        zerolinecolor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
        tickfont: { color: isDark ? '#94a3b8' : '#64748b' },
      },
      yaxis: {
        gridcolor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        zerolinecolor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
        tickfont: { color: isDark ? '#94a3b8' : '#64748b' },
      },
    };
  }

  // ========================================================================
  // Theory Modal & Interactive Calculator
  // ========================================================================
  els.btnOpenTheory.addEventListener('click', () => {
    els.modalTheory.classList.add('open');
    if (window.katex) {
      try {
        const mathEl = document.getElementById('math-derivation');
        if (mathEl && !mathEl.dataset.rendered) {
          window.katex.render(
            '\\bar{P}(A_1A_1) = \\bar{p}^2 + \\sigma_p^2\\\\ \\bar{P}(A_1A_2) = 2\\bar{p}\\bar{q} - 2\\sigma_p^2\\\\ \\bar{P}(A_2A_2) = \\bar{q}^2 + \\sigma_p^2',
            mathEl,
            { displayMode: true }
          );
          mathEl.dataset.rendered = 'true';
        }
      } catch (e) {
        console.warn('KaTeX rendering note:', e);
      }
    }
    updateWahlundCalc();
  });

  els.btnCloseTheory.addEventListener('click', () => {
    els.modalTheory.classList.remove('open');
  });

  els.modalTheory.addEventListener('click', (e) => {
    if (e.target === els.modalTheory) {
      els.modalTheory.classList.remove('open');
    }
  });

  function updateWahlundCalc() {
    const p1 = parseFloat(els.calcP1.value);
    const p2 = parseFloat(els.calcP2.value);
    els.calcValP1.textContent = p1.toFixed(2);
    els.calcValP2.textContent = p2.toFixed(2);

    const pBar = (p1 + p2) / 2;
    const qBar = 1 - pBar;
    const HT = 2 * pBar * qBar;
    const exp1 = 2 * p1 * (1 - p1);
    const exp2 = 2 * p2 * (1 - p2);
    const HS = (exp1 + exp2) / 2;
    const FST = HT > 0 ? (HT - HS) / HT : 0;

    els.calcResPbar.textContent = pBar.toFixed(2);
    els.calcResHt.textContent = HT.toFixed(3);
    els.calcResHs.textContent = HS.toFixed(3);
    els.calcResFst.textContent = FST.toFixed(3);
  }

  els.calcP1.addEventListener('input', updateWahlundCalc);
  els.calcP2.addEventListener('input', updateWahlundCalc);

  // ========================================================================
  // Card Expansion / Fullscreen Toggle
  // ========================================================================
  document.querySelectorAll('.btn-toggle-expand').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const card = document.getElementById(targetId);
      if (card) {
        card.classList.toggle('full-screen');
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
          if (targetId === 'card-spatial-plot') {
            setupCanvasDPI();
            renderSpatialFrame(state.playback.currentGen);
          }
        }, 100);
      }
    });
  });

  // ========================================================================
  // Advanced Accordion Toggle
  // ========================================================================
  els.btnToggleAdvanced.addEventListener('click', () => {
    const isOpen = els.bodyAdvanced.style.display !== 'none';
    els.bodyAdvanced.style.display = isOpen ? 'none' : 'flex';
    els.iconAdvancedChevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
  });

  // ========================================================================
  // Two-way Control Synchronization Helper
  // ========================================================================
  function bindSliderAndNumber(slider, numInput, key, isFloat = false, onChangeCallback) {
    slider.addEventListener('input', () => {
      const val = isFloat ? parseFloat(slider.value) : parseInt(slider.value, 10);
      numInput.value = isFloat ? val.toFixed(2) : val;
      state.params[key] = val;
      if (onChangeCallback) onChangeCallback(val);
      if (state.autoRun) triggerAutoRun();
    });

    numInput.addEventListener('change', () => {
      let val = isFloat ? parseFloat(numInput.value) : parseInt(numInput.value, 10);
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      if (isNaN(val)) val = min;
      val = Math.max(min, Math.min(max, val));
      numInput.value = isFloat ? val.toFixed(2) : val;
      slider.value = val;
      state.params[key] = val;
      if (onChangeCallback) onChangeCallback(val);
      if (state.autoRun) triggerAutoRun();
    });
  }

  // Bind Core Inputs
  bindSliderAndNumber(els.sliderPopSize, els.numPopSize, 'pop_size', false);
  bindSliderAndNumber(els.sliderInitP, els.numInitP, 'init_p', true);
  bindSliderAndNumber(els.sliderGenerations, els.numGenerations, 'generations', false);
  bindSliderAndNumber(els.sliderReplications, els.numReplications, 'replications', false);

  // Subpopulation Buttons
  els.subpopButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      els.subpopButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const k = parseInt(btn.dataset.val, 10);
      state.params.num_subpops = k;
      els.lblSubpop.textContent = k;
      if (state.autoRun) triggerAutoRun();
    });
  });

  // Migration Rate
  bindSliderAndNumber(els.sliderMRate, els.numMRate, 'm_rate', true);

  // Spatial Non-Random Mating
  els.chkNonRandom.addEventListener('change', () => {
    const checked = els.chkNonRandom.checked;
    state.params.non_random_mating = checked;
    els.groupDistDecay.style.display = checked ? 'flex' : 'none';
    if (state.autoRun) triggerAutoRun();
  });
  bindSliderAndNumber(els.sliderDistDecay, els.numDistDecay, 'dist_decay', false);

  // Mutation & Fitness Inputs
  function bindFloatInput(inputEl, key) {
    inputEl.addEventListener('change', () => {
      let val = parseFloat(inputEl.value);
      if (isNaN(val)) val = 0;
      val = Math.max(0, val);
      inputEl.value = val;
      state.params[key] = val;
      if (state.autoRun) triggerAutoRun();
    });
  }
  bindFloatInput(els.numMu, 'mu');
  bindFloatInput(els.numNu, 'nu');
  bindFloatInput(els.numW11, 'w11');
  bindFloatInput(els.numW12, 'w12');
  bindFloatInput(els.numW22, 'w22');

  // Auto-run checkbox
  els.chkAutoRun.addEventListener('change', () => {
    state.autoRun = els.chkAutoRun.checked;
  });

  // Toggle drift bounds / H-W on plots
  els.chkShowBounds.addEventListener('change', () => {
    if (state.currentResult) renderPPlot(state.currentResult);
  });
  els.chkShowHw.addEventListener('change', () => {
    if (state.currentResult) renderGtPlot(state.currentResult);
  });
  els.chkShowHalos.addEventListener('change', () => {
    renderSpatialFrame(state.playback.currentGen);
  });

  // Presets Click Handler
  els.presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      els.presetChips.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const presetKey = chip.dataset.preset;
      applyPreset(presetKey);
    });
  });

  function applyPreset(key) {
    const p = PRESETS[key];
    if (!p) return;

    // Update state params
    Object.assign(state.params, p);

    // Sync UI controls
    els.sliderPopSize.value = p.pop_size;
    els.numPopSize.value = p.pop_size;

    els.sliderInitP.value = p.init_p;
    els.numInitP.value = p.init_p.toFixed(2);

    els.sliderGenerations.value = p.generations;
    els.numGenerations.value = p.generations;

    els.sliderReplications.value = p.replications;
    els.numReplications.value = p.replications;

    els.subpopButtons.forEach((btn) => {
      btn.classList.toggle('active', parseInt(btn.dataset.val, 10) === p.num_subpops);
    });
    els.lblSubpop.textContent = p.num_subpops;

    els.sliderMRate.value = p.m_rate;
    els.numMRate.value = p.m_rate;

    els.chkNonRandom.checked = p.non_random_mating;
    els.groupDistDecay.style.display = p.non_random_mating ? 'flex' : 'none';
    els.sliderDistDecay.value = p.dist_decay;
    els.numDistDecay.value = p.dist_decay;

    els.numMu.value = p.mu;
    els.numNu.value = p.nu;
    els.numW11.value = p.w11;
    els.numW12.value = p.w12;
    els.numW22.value = p.w22;

    runActiveSimulation();
  }

  // Reset to default
  els.btnReset.addEventListener('click', () => {
    applyPreset('default');
  });

  // Debounced Auto-run
  let autoRunTimer = null;
  function triggerAutoRun() {
    clearTimeout(autoRunTimer);
    autoRunTimer = setTimeout(() => {
      runActiveSimulation();
    }, 220);
  }

  // Run Simulation Button
  els.btnRunSim.addEventListener('click', () => {
    runActiveSimulation();
  });

  // Keyboard shortcut: Ctrl + Enter
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runActiveSimulation();
    }
  });

  // ========================================================================
  // Simulation Execution Controller
  // ========================================================================
  function runActiveSimulation() {
    stopPlayback();

    const t0 = performance.now();
    const result = PopGenSimulator.runSimulation(state.params);
    const duration = performance.now() - t0;

    state.currentResult = result;
    state.playback.maxGen = result.generations;
    state.playback.currentGen = result.generations;

    // Update KPIs
    updateKpis(result, duration);

    // Render Charts
    renderPlots(result);

    // Configure and render Spatial view
    initSpatialViewer(result);

    // Update subpopulation territory text
    els.spatialSubpopLabel.textContent =
      result.num_subpops > 1
        ? `${result.num_subpops} subpopulations with ${state.params.m_rate * 100}% migration`
        : 'Panmictic single population';
  }

  // ========================================================================
  // KPI Updates
  // ========================================================================
  function updateKpis(result, duration) {
    const s = result.finalStats;

    els.kpiP.textContent = s.p.toFixed(3);
    const sign = s.delta_p >= 0 ? '+' : '';
    els.kpiDeltaP.textContent = `${sign}${s.delta_p.toFixed(3)}`;

    if (s.fixed_A1) {
      els.kpiPStatus.textContent = 'Fixed (A₁)';
      els.kpiPStatus.style.color = 'var(--color-a1a1)';
    } else if (s.fixed_A2) {
      els.kpiPStatus.textContent = 'Fixed (A₂)';
      els.kpiPStatus.style.color = 'var(--color-a2a2)';
    } else {
      els.kpiPStatus.textContent = 'Polymorphic';
      els.kpiPStatus.style.color = 'var(--text-secondary)';
    }

    // Fst & qualitative badge
    els.kpiFst.textContent = s.Fst.toFixed(3);
    const pill = els.kpiFstPill;
    if (s.Fst < 0.05) {
      pill.textContent = 'Little';
      pill.style.background = 'var(--badge-emerald)';
      pill.style.color = 'var(--badge-emerald-text)';
    } else if (s.Fst < 0.15) {
      pill.textContent = 'Moderate';
      pill.style.background = 'var(--badge-blue)';
      pill.style.color = 'var(--badge-blue-text)';
    } else if (s.Fst < 0.25) {
      pill.textContent = 'Great';
      pill.style.background = 'var(--badge-amber)';
      pill.style.color = 'var(--badge-amber-text)';
    } else {
      pill.textContent = 'Very Great';
      pill.style.background = 'var(--badge-rose)';
      pill.style.color = 'var(--badge-rose-text)';
    }

    els.kpiFis.textContent = s.Fis.toFixed(3);
    els.kpiFit.textContent = s.Fit.toFixed(3);
    els.kpiDeltaH.textContent = s.DeltaH.toFixed(3);

    els.kpiRuntime.textContent = `${duration.toFixed(1)} ms`;
    els.kpiRepsGens.textContent = `${result.reps} rep${result.reps > 1 ? 's' : ''} • ${result.generations} gens`;

    // Inset badge on F-stat chart
    els.insetFst.textContent = s.Fst.toFixed(4);
    els.insetFis.textContent = s.Fis.toFixed(4);
    els.insetFit.textContent = s.Fit.toFixed(4);
  }

  // ========================================================================
  // Plotly Charts Rendering
  // ========================================================================
  function renderPlots(result) {
    renderPPlot(result);
    renderGtPlot(result);
    renderFPlot(result);
  }

  /**
   * Plot 1: Genetic Drift (Gene Frequency p)
   */
  function renderPPlot(result) {
    const isDark = state.theme === 'dark';
    const theme = getPlotlyTheme();
    const traces = [];

    // Color gradient for replications (Turbo / Viridis style)
    const reps = result.reps;
    for (let r = 0; r < reps; r++) {
      const x = [];
      const y = [];
      const repHist = result.all_reps_history[r];
      for (let t = 0; t < repHist.length; t++) {
        x.push(repHist[t].Generation);
        y.push(repHist[t].p);
      }

      // Generate distinct vibrant hue for each rep
      const hue = Math.round((r / Math.max(1, reps)) * 280 + 30);
      const color = reps === 1 ? 'var(--accent-primary)' : `hsl(${hue}, 85%, 60%)`;

      traces.push({
        x: x,
        y: y,
        type: 'scatter',
        mode: 'lines',
        name: `Rep ${r + 1}`,
        line: {
          color: reps === 1 ? (isDark ? '#818cf8' : '#4f46e5') : color,
          width: reps > 10 ? 1 : 1.6,
        },
        opacity: reps > 1 ? 0.75 : 0.95,
        hoverinfo: 'x+y+name',
      });
    }

    // Mean trajectory line if reps > 1
    if (reps > 1) {
      const meanX = [];
      const meanY = [];
      for (let t = 0; t < result.summary.length; t++) {
        meanX.push(result.summary[t].Generation);
        meanY.push(result.summary[t].p_mean);
      }
      traces.push({
        x: meanX,
        y: meanY,
        type: 'scatter',
        mode: 'lines',
        name: 'Mean (All Reps)',
        line: {
          color: isDark ? '#ffffff' : '#0f172a',
          width: 2.8,
        },
        hoverinfo: 'x+y+name',
      });
    }

    // Theoretical 95% Drift Bounds (+/- 2*sqrt(p0(1-p0)*t / (2N)))
    if (els.chkShowBounds.checked) {
      const N = result.params.pop_size;
      const p0 = result.params.init_p;
      const boundX = [];
      const upperY = [];
      const lowerY = [];

      for (let t = 0; t <= result.generations; t++) {
        boundX.push(t);
        // Var(p_t) = p0*(1-p0) * (1 - (1 - 1/(2N))^t)
        const variance = p0 * (1 - p0) * (1 - Math.pow(1 - 1 / (2 * N), t));
        const se = Math.sqrt(Math.max(0, variance));
        upperY.push(Math.min(1, p0 + 1.96 * se));
        lowerY.push(Math.max(0, p0 - 1.96 * se));
      }

      traces.push({
        x: boundX,
        y: upperY,
        type: 'scatter',
        mode: 'lines',
        name: '95% Drift Upper',
        line: { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)', width: 1.2, dash: 'dot' },
        showlegend: false,
        hoverinfo: 'skip',
      });
      traces.push({
        x: boundX,
        y: lowerY,
        type: 'scatter',
        mode: 'lines',
        name: '95% Drift Envelope',
        fill: 'tonexty',
        fillcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        line: { color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)', width: 1.2, dash: 'dot' },
        hoverinfo: 'skip',
      });
    }

    const layout = {
      ...theme,
      margin: { l: 45, r: 20, t: 15, b: 35 },
      showlegend: reps <= 10,
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.08,
        font: { size: 10 },
      },
      xaxis: {
        ...theme.xaxis,
        title: { text: 'Generation', font: { size: 11 } },
        range: [0, result.generations],
      },
      yaxis: {
        ...theme.yaxis,
        title: { text: 'Freq of A₁ (p)', font: { size: 11 } },
        range: [-0.02, 1.02],
      },
      hovermode: 'closest',
    };

    const config = { responsive: true, displayModeBar: true, displaylogo: false };
    Plotly.react(els.pPlot, traces, layout, config);
  }

  /**
   * Plot 2: Genotype Frequencies (Avg)
   */
  function renderGtPlot(result) {
    const isDark = state.theme === 'dark';
    const theme = getPlotlyTheme();
    const x = [];
    const a1a1 = [];
    const a1a2 = [];
    const a2a2 = [];
    const hwA1A1 = [];
    const hwA1A2 = [];
    const hwA2A2 = [];

    for (let t = 0; t < result.summary.length; t++) {
      const row = result.summary[t];
      x.push(row.Generation);
      a1a1.push(row.A1A1_mean);
      a1a2.push(row.A1A2_mean);
      a2a2.push(row.A2A2_mean);
      hwA1A1.push(row.hw_A1A1);
      hwA1A2.push(row.hw_A1A2);
      hwA2A2.push(row.hw_A2A2);
    }

    const traces = [
      {
        x: x,
        y: a1a1,
        type: 'scatter',
        mode: 'lines',
        name: 'A₁A₁ (Observed)',
        line: { color: isDark ? '#60a5fa' : '#2563eb', width: 2.2 },
      },
      {
        x: x,
        y: a1a2,
        type: 'scatter',
        mode: 'lines',
        name: 'A₁A₂ (Observed)',
        line: { color: isDark ? '#c084fc' : '#8b5cf6', width: 2.2 },
      },
      {
        x: x,
        y: a2a2,
        type: 'scatter',
        mode: 'lines',
        name: 'A₂A₂ (Observed)',
        line: { color: isDark ? '#fb7185' : '#f43f5e', width: 2.2 },
      },
    ];

    // Hardy-Weinberg expected dashed lines
    if (els.chkShowHw.checked) {
      traces.push(
        {
          x: x,
          y: hwA1A1,
          type: 'scatter',
          mode: 'lines',
          name: 'A₁A₁ (H-W Exp)',
          line: { color: isDark ? '#60a5fa' : '#2563eb', width: 1.2, dash: 'dash' },
          opacity: 0.6,
        },
        {
          x: x,
          y: hwA1A2,
          type: 'scatter',
          mode: 'lines',
          name: 'A₁A₂ (H-W Exp)',
          line: { color: isDark ? '#c084fc' : '#8b5cf6', width: 1.2, dash: 'dash' },
          opacity: 0.6,
        },
        {
          x: x,
          y: hwA2A2,
          type: 'scatter',
          mode: 'lines',
          name: 'A₂A₂ (H-W Exp)',
          line: { color: isDark ? '#fb7185' : '#f43f5e', width: 1.2, dash: 'dash' },
          opacity: 0.6,
        }
      );
    }

    const layout = {
      ...theme,
      margin: { l: 45, r: 20, t: 15, b: 35 },
      showlegend: true,
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.1,
        font: { size: 9.5 },
      },
      xaxis: {
        ...theme.xaxis,
        title: { text: 'Generation', font: { size: 11 } },
        range: [0, result.generations],
      },
      yaxis: {
        ...theme.yaxis,
        title: { text: 'Genotype Frequency', font: { size: 11 } },
        range: [-0.02, 1.02],
      },
      hovermode: 'x unified',
    };

    const config = { responsive: true, displayModeBar: true, displaylogo: false };
    Plotly.react(els.gtPlot, traces, layout, config);
  }

  /**
   * Plot 4: Wright's F-Statistics
   */
  function renderFPlot(result) {
    const isDark = state.theme === 'dark';
    const theme = getPlotlyTheme();
    const x = [];
    const fst = [];
    const fis = [];
    const fit = [];

    for (let t = 0; t < result.summary.length; t++) {
      const row = result.summary[t];
      x.push(row.Generation);
      fst.push(row.Fst_mean);
      fis.push(row.Fis_mean);
      fit.push(row.Fit_mean);
    }

    const traces = [
      {
        x: x,
        y: fst,
        type: 'scatter',
        mode: 'lines',
        name: 'F_ST (Subpop Divergence)',
        line: { color: isDark ? '#34d399' : '#059669', width: 2.4 },
      },
      {
        x: x,
        y: fis,
        type: 'scatter',
        mode: 'lines',
        name: 'F_IS (Inbreeding in Subpop)',
        line: { color: isDark ? '#fbbf24' : '#d97706', width: 2 },
      },
      {
        x: x,
        y: fit,
        type: 'scatter',
        mode: 'lines',
        name: 'F_IT (Total Inbreeding)',
        line: { color: isDark ? '#22d3ee' : '#0891b2', width: 2 },
      },
    ];

    const layout = {
      ...theme,
      margin: { l: 45, r: 20, t: 15, b: 35 },
      showlegend: true,
      legend: {
        orientation: 'h',
        x: 0,
        y: 1.1,
        font: { size: 9.5 },
      },
      xaxis: {
        ...theme.xaxis,
        title: { text: 'Generation', font: { size: 11 } },
        range: [0, result.generations],
      },
      yaxis: {
        ...theme.yaxis,
        title: { text: 'F-Statistic Value', font: { size: 11 } },
        range: [-0.2, 1.05],
      },
      hovermode: 'x unified',
    };

    const config = { responsive: true, displayModeBar: true, displaylogo: false };
    Plotly.react(els.fPlot, traces, layout, config);
  }

  // ========================================================================
  // Spatial Canvas & Generational Evolution Playback
  // ========================================================================
  const ctx = els.spatialCanvas.getContext('2d');
  let canvasWidth = 400;
  let canvasHeight = 300;

  function setupCanvasDPI() {
    const rect = els.canvasWrapper.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasWidth = rect.width || 400;
    canvasHeight = rect.height || 300;

    els.spatialCanvas.width = canvasWidth * dpr;
    els.spatialCanvas.height = canvasHeight * dpr;
    ctx.resetTransform();
    ctx.scale(dpr, dpr);
  }

  window.addEventListener('resize', () => {
    setupCanvasDPI();
    if (state.currentResult) {
      renderSpatialFrame(state.playback.currentGen);
    }
  });

  function initSpatialViewer(result) {
    setupCanvasDPI();

    // Timeline slider config
    const snapshots = result.spatial_snapshots;
    const maxIdx = snapshots.length - 1;
    els.sliderTimeline.min = 0;
    els.sliderTimeline.max = maxIdx;
    els.sliderTimeline.value = maxIdx;

    state.playback.maxGen = result.generations;
    state.playback.currentGen = result.generations;
    updateTimelineLabel(result.generations, result.generations);

    renderSpatialFrame(result.generations);
  }

  function updateTimelineLabel(currentGen, maxGen) {
    els.lblCurrentGen.textContent = `Gen ${currentGen} / ${maxGen}`;
  }

  function getSnapshotForGen(targetGen) {
    if (!state.currentResult || !state.currentResult.spatial_snapshots.length) return null;
    const list = state.currentResult.spatial_snapshots;
    // Find closest snapshot <= targetGen
    let best = list[0];
    for (let i = 0; i < list.length; i++) {
      if (list[i].gen <= targetGen) {
        best = list[i];
      } else {
        break;
      }
    }
    return best;
  }

  function renderSpatialFrame(targetGen) {
    if (!state.currentResult) return;
    const snapshot = getSnapshotForGen(targetGen);
    if (!snapshot) return;

    const isDark = state.theme === 'dark';
    const numSubpops = state.currentResult.num_subpops;
    const N = state.currentResult.params.pop_size;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Coordinate mapping functions
    const pad = 24;
    const plotW = canvasWidth - 2 * pad;
    const plotH = canvasHeight - 2 * pad;
    const mapX = (normX) => pad + normX * plotW;
    const mapY = (normY) => pad + (1 - normY) * plotH;

    // Draw Subpopulation Territory Halos
    if (els.chkShowHalos.checked && numSubpops > 1) {
      for (let s = 0; s < numSubpops; s++) {
        const cx = 0.2 + (0.6 * s) / (numSubpops - 1);
        const cy = s % 2 === 0 ? 0.2 : 0.8;
        const px = mapX(cx + 0.5 / numSubpops);
        const py = mapY(cy + 0.5 / numSubpops);
        const radius = Math.min(plotW, plotH) / (numSubpops * 1.55);

        // Subpopulation halo
        const grad = ctx.createRadialGradient(px, py, radius * 0.1, px, py, radius);
        grad.addColorStop(0, isDark ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)');
        grad.addColorStop(1, 'rgba(99, 102, 241, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, 2 * Math.PI);
        ctx.fill();

        // Subpopulation boundary dashed ring
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Subpopulation Label
        ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        ctx.font = '600 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Subpop ${s + 1}`, px, py - radius - 4);
      }
    }

    // Counts for mini-legend
    let countA1A1 = 0;
    let countA1A2 = 0;
    let countA2A2 = 0;

    // Determine particle radius based on population size
    const ptRadius = N > 700 ? 3.0 : N > 300 ? 3.8 : 4.8;

    // Colors
    const colA1A1 = isDark ? '#60a5fa' : '#2563eb';
    const colA1A2 = isDark ? '#c084fc' : '#8b5cf6';
    const colA2A2 = isDark ? '#fb7185' : '#f43f5e';

    // Draw individual particles
    for (let i = 0; i < N; i++) {
      const g = snapshot.gt[i];
      let col;
      if (g === 1) {
        countA1A1++;
        col = colA1A1;
      } else if (g === 2) {
        countA1A2++;
        col = colA1A2;
      } else {
        countA2A2++;
        col = colA2A2;
      }

      const px = mapX(snapshot.x[i]);
      const py = mapY(snapshot.y[i]);

      ctx.beginPath();
      ctx.arc(px, py, ptRadius, 0, 2 * Math.PI);
      ctx.fillStyle = col;
      ctx.fill();

      // Subtle particle stroke
      ctx.strokeStyle = isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Update overlay counts
    const pct = (c) => ((c / N) * 100).toFixed(0);
    els.spCountA1A1.textContent = `${countA1A1} (${pct(countA1A1)}%)`;
    els.spCountA1A2.textContent = `${countA1A2} (${pct(countA1A2)}%)`;
    els.spCountA2A2.textContent = `${countA2A2} (${pct(countA2A2)}%)`;
  }

  // Hover tooltip on spatial canvas
  els.spatialCanvas.addEventListener('mousemove', (e) => {
    if (!state.currentResult) return;
    const snapshot = getSnapshotForGen(state.playback.currentGen);
    if (!snapshot) return;

    const rect = els.spatialCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const pad = 24;
    const plotW = canvasWidth - 2 * pad;
    const plotH = canvasHeight - 2 * pad;
    const mapX = (normX) => pad + normX * plotW;
    const mapY = (normY) => pad + (1 - normY) * plotH;

    let closestIdx = -1;
    let minDist = 14; // hover radius

    const N = state.currentResult.params.pop_size;
    for (let i = 0; i < N; i++) {
      const px = mapX(snapshot.x[i]);
      const py = mapY(snapshot.y[i]);
      const d = Math.hypot(mouseX - px, mouseY - py);
      if (d < minDist) {
        minDist = d;
        closestIdx = i;
      }
    }

    if (closestIdx !== -1) {
      const g = snapshot.gt[closestIdx];
      const gtName = g === 1 ? 'A₁A₁' : g === 2 ? 'A₁A₂' : 'A₂A₂';
      const sub = snapshot.subpop[closestIdx] + 1;

      els.spatialTooltip.style.display = 'block';
      els.spatialTooltip.style.left = `${mouseX + 14}px`;
      els.spatialTooltip.style.top = `${mouseY - 24}px`;
      els.spatialTooltip.innerHTML = `
        <strong>Individual #${closestIdx + 1}</strong><br>
        Genotype: <span style="font-weight:700;">${gtName}</span><br>
        Subpopulation: ${sub}
      `;
    } else {
      els.spatialTooltip.style.display = 'none';
    }
  });

  els.spatialCanvas.addEventListener('mouseleave', () => {
    els.spatialTooltip.style.display = 'none';
  });

  // Timeline Slider Drag
  els.sliderTimeline.addEventListener('input', () => {
    if (!state.currentResult) return;
    const snapIdx = parseInt(els.sliderTimeline.value, 10);
    const snap = state.currentResult.spatial_snapshots[snapIdx];
    if (snap) {
      state.playback.currentGen = snap.gen;
      updateTimelineLabel(snap.gen, state.playback.maxGen);
      renderSpatialFrame(snap.gen);
    }
  });

  // Play / Pause Animation
  function startPlayback() {
    state.playback.isPlaying = true;
    els.iconPlay.style.display = 'none';
    els.iconPause.style.display = 'inline-block';

    if (state.playback.currentGen >= state.playback.maxGen) {
      state.playback.currentGen = 0;
      els.sliderTimeline.value = 0;
    }

    animateStep();
  }

  function stopPlayback() {
    state.playback.isPlaying = false;
    els.iconPlay.style.display = 'inline-block';
    els.iconPause.style.display = 'none';
    if (state.playback.timerId) {
      clearTimeout(state.playback.timerId);
      state.playback.timerId = null;
    }
  }

  function animateStep() {
    if (!state.playback.isPlaying || !state.currentResult) return;

    const snapshots = state.currentResult.spatial_snapshots;
    let currentIdx = parseInt(els.sliderTimeline.value, 10);

    if (currentIdx < snapshots.length - 1) {
      currentIdx++;
      els.sliderTimeline.value = currentIdx;
      const snap = snapshots[currentIdx];
      state.playback.currentGen = snap.gen;
      updateTimelineLabel(snap.gen, state.playback.maxGen);
      renderSpatialFrame(snap.gen);

      const delay = Math.round(150 / state.playback.speed);
      state.playback.timerId = setTimeout(animateStep, delay);
    } else {
      stopPlayback();
    }
  }

  els.btnPlayPause.addEventListener('click', () => {
    if (state.playback.isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  });

  // Step Controls
  els.btnStepPrev.addEventListener('click', () => {
    stopPlayback();
    let currentIdx = parseInt(els.sliderTimeline.value, 10);
    if (currentIdx > 0) {
      currentIdx--;
      els.sliderTimeline.value = currentIdx;
      const snap = state.currentResult.spatial_snapshots[currentIdx];
      state.playback.currentGen = snap.gen;
      updateTimelineLabel(snap.gen, state.playback.maxGen);
      renderSpatialFrame(snap.gen);
    }
  });

  els.btnStepNext.addEventListener('click', () => {
    stopPlayback();
    if (!state.currentResult) return;
    const snapshots = state.currentResult.spatial_snapshots;
    let currentIdx = parseInt(els.sliderTimeline.value, 10);
    if (currentIdx < snapshots.length - 1) {
      currentIdx++;
      els.sliderTimeline.value = currentIdx;
      const snap = snapshots[currentIdx];
      state.playback.currentGen = snap.gen;
      updateTimelineLabel(snap.gen, state.playback.maxGen);
      renderSpatialFrame(snap.gen);
    }
  });

  els.selectPlaybackSpeed.addEventListener('change', () => {
    state.playback.speed = parseFloat(els.selectPlaybackSpeed.value) || 1;
  });

  // ========================================================================
  // CSV Data Export
  // ========================================================================
  els.btnExportCsv.addEventListener('click', () => {
    if (!state.currentResult) return;

    let csv = 'Generation,Rep,p,A1A1,A1A2,A2A2,Fst,Fis,Fit,HT,HS,HI\n';
    const all = state.currentResult.all_reps_history;
    for (let r = 0; r < all.length; r++) {
      const rep = all[r];
      for (let t = 0; t < rep.length; t++) {
        const row = rep[t];
        csv += `${row.Generation},${row.Rep},${row.p.toFixed(5)},${row.A1A1.toFixed(5)},${row.A1A2.toFixed(5)},${row.A2A2.toFixed(5)},${row.Fst.toFixed(5)},${row.Fis.toFixed(5)},${row.Fit.toFixed(5)},${row.HT.toFixed(5)},${row.HS.toFixed(5)},${row.HI.toFixed(5)}\n`;
      }
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `population_genetics_simulation_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  });

  // ========================================================================
  // Initial Boot Run
  // ========================================================================
  runActiveSimulation();
});
