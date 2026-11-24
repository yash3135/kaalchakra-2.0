/* Original procedural sound design. Nothing plays before the sound toggle. */
(() => {
  'use strict';
  const button = document.querySelector('#sound-toggle');
  const settingsButton = document.querySelector('#sound-settings-toggle');
  const settings = document.querySelector('#sound-settings');
  const volumeInput = document.querySelector('#sound-volume');
  const volumeOutput = document.querySelector('#sound-volume-value');
  const ambienceInput = document.querySelector('#sound-ambience');
  const effectsInput = document.querySelector('#sound-effects');
  const dock = document.querySelector('.sound-dock');
  const revealVideo = document.querySelector('#logo-reveal video');
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  const storageKey = 'kaalchakra-audio-settings';
  const state = { enabled: false, volume: .35, ambience: true, effects: true };
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && typeof saved === 'object') {
      if (Number.isFinite(saved.volume)) state.volume = Math.max(0, Math.min(1, saved.volume));
      if (typeof saved.ambience === 'boolean') state.ambience = saved.ambience;
      if (typeof saved.effects === 'boolean') state.effects = saved.effects;
    }
  } catch {}
  let context, master, ambientBus, effectsBus, pinkNoise, whiteNoise;
  let unavailable = !AudioEngine, suspendTimer, roomTimer, generation = 0;
  let lastEffect = -Infinity, activeVoices = 0, videoPlaying = false;
  const sceneProgress = new Map(), cueTimes = new Map();

  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify({ volume: state.volume, ambience: state.ambience, effects: state.effects })); } catch {}
  }
  function render() {
    const label = unavailable ? 'No audio' : !state.enabled ? 'Sound off' : state.volume === 0 ? 'Sound muted' : 'Sound on';
    button.querySelector('.sound-label').textContent = label;
    button.setAttribute('aria-pressed', String(state.enabled));
    button.setAttribute('aria-label', unavailable ? 'Sound is unavailable in this browser' : state.enabled ? 'Mute immersive sound' : 'Enable immersive sound');
    button.disabled = unavailable;
    dock.classList.toggle('sound-on', state.enabled && state.volume > 0);
    volumeInput.value = String(Math.round(state.volume * 100));
    volumeOutput.textContent = `${Math.round(state.volume * 100)}%`;
    ambienceInput.checked = state.ambience;
    effectsInput.checked = state.effects;
  }
  function ramp(parameter, value, seconds = .12) {
    if (!context) return;
    parameter.cancelScheduledValues(context.currentTime);
    parameter.setTargetAtTime(value, context.currentTime, seconds / 3);
  }
  function mix() {
    if (!context) return;
    const audible = state.enabled && !document.hidden;
    ramp(master.gain, audible ? state.volume * (videoPlaying ? .12 : 1) : 0);
    ramp(ambientBus.gain, state.ambience ? .6 : 0, .4);
    ramp(effectsBus.gain, state.effects ? .65 : 0);
  }
  function makeNoise(seconds, pink = false, seed = 1297) {
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * seconds), context.sampleRate);
    const data = buffer.getChannelData(0);
    let random = seed, b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < data.length; i++) {
      random = (Math.imul(1664525, random) + 1013904223) | 0;
      const white = (random >>> 0) / 2147483648 - 1;
      b0 = .99765 * b0 + white * .099046;
      b1 = .963 * b1 + white * .2965164;
      b2 = .57 * b2 + white * 1.0526913;
      data[i] = pink ? (b0 + b1 + b2 + white * .1848) * .15 : white * .45;
    }
    return buffer;
  }
  function ambientLayer({ pan, cutoff, gain, speed, offset, wind = false }) {
    const source = context.createBufferSource(); source.buffer = pinkNoise; source.loop = true;
    const filter = context.createBiquadFilter(); filter.type = wind ? 'bandpass' : 'lowpass'; filter.frequency.value = cutoff; filter.Q.value = wind ? .45 : .55;
    const highpass = context.createBiquadFilter(); highpass.type = 'highpass'; highpass.frequency.value = wind ? 180 : 75;
    const amplitude = context.createGain(); amplitude.gain.value = gain;
    const panner = context.createStereoPanner(); panner.pan.value = pan;
    source.connect(filter); filter.connect(highpass); highpass.connect(amplitude); amplitude.connect(panner); panner.connect(ambientBus);
    const swell = context.createOscillator(); swell.frequency.value = speed;
    const depth = context.createGain(); depth.gain.value = gain * .52;
    swell.connect(depth); depth.connect(amplitude.gain);
    const drift = context.createOscillator(); drift.frequency.value = speed * .37;
    const driftDepth = context.createGain(); driftDepth.gain.value = .18;
    drift.connect(driftDepth); driftDepth.connect(panner.pan);
    source.start(0, offset); swell.start(); drift.start();
  }
  function initialize() {
    if (context) return;
    context = new AudioEngine({ latencyHint: 'interactive' });
    master = context.createGain(); master.gain.value = 0;
    ambientBus = context.createGain(); ambientBus.gain.value = .6;
    effectsBus = context.createGain(); effectsBus.gain.value = .65;
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -18; limiter.knee.value = 18; limiter.ratio.value = 4;
    limiter.attack.value = .006; limiter.release.value = .2;
    ambientBus.connect(master); effectsBus.connect(master); master.connect(limiter); limiter.connect(context.destination);
    whiteNoise = makeNoise(1, false, 8351); pinkNoise = makeNoise(12, true, 9157);
    const room = context.createConvolver();
    const impulse = context.createBuffer(2, Math.floor(context.sampleRate * .65), context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
    }
    room.buffer = impulse;
    const wet = context.createGain(); wet.gain.value = .12;
    effectsBus.connect(room); room.connect(wet); wet.connect(master);
    ambientLayer({ pan: -.57, cutoff: 720, gain: .27, speed: .075, offset: 0 });
    ambientLayer({ pan: .57, cutoff: 1100, gain: .22, speed: .103, offset: 4 });
    ambientLayer({ pan: .12, cutoff: 680, gain: .055, speed: .041, offset: 7, wind: true });
    context.addEventListener('statechange', () => {
      if (context.state === 'closed') { state.enabled = false; unavailable = true; render(); }
    });
  }
  function spatialOutput(pan, depth = 1.8) {
    const panner = context.createPanner();
    panner.panningModel = 'HRTF'; panner.distanceModel = 'inverse';
    panner.refDistance = 2; panner.rolloffFactor = .5; panner.maxDistance = 12;
    panner.positionX.value = Math.max(-1, Math.min(1, pan)) * 2.4;
    panner.positionY.value = .2; panner.positionZ.value = -depth;
    panner.connect(effectsBus);
    return panner;
  }
  function envelope(gain, start, duration, peak, attack = .005) {
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0002, peak), start + attack);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  }
  function tone(output, { frequency, end = frequency, duration = .15, peak = .1, type = 'sine', delay = 0 }) {
    const oscillator = context.createOscillator(), gain = context.createGain();
    const start = context.currentTime + delay;
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, end), start + duration);
    envelope(gain, start, duration, peak);
    oscillator.connect(gain); gain.connect(output);
    oscillator.start(start); oscillator.stop(start + duration + .02);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  function noise(output, { duration = .1, peak = .08, frequency = 1300, type = 'bandpass', q = .6, delay = 0 }) {
    const source = context.createBufferSource(), filter = context.createBiquadFilter(), gain = context.createGain();
    const start = context.currentTime + delay;
    source.buffer = whiteNoise; filter.type = type; filter.frequency.value = frequency; filter.Q.value = q;
    envelope(gain, start, duration, peak, Math.min(.02, duration / 4));
    source.connect(filter); filter.connect(gain); gain.connect(output);
    source.start(start); source.stop(start + duration + .02);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  function effect(kind, pan = 0, quiet = 1, ambient = false) {
    if (!state.enabled || !context || context.state !== 'running' || document.hidden || videoPlaying || state.volume === 0) return;
    if ((!ambient && !state.effects) || (ambient && !state.ambience) || activeVoices >= 10) return;
    const now = performance.now();
    if (!ambient && now - lastEffect < 65) return;
    if (!ambient) lastEffect = now;
    const output = spatialOutput(pan, ambient ? 5 : 1.8), level = quiet * (ambient ? .45 : 1);
    activeVoices++;
    if (kind === 'wood' || kind === 'click') {
      tone(output, { frequency: 380, end: 160, duration: .065, peak: .095 * level, type: 'triangle' });
      noise(output, { duration: .045, peak: .055 * level, frequency: 1700 });
    } else if (kind === 'compass' || kind === 'lock') {
      tone(output, { frequency: 980, end: 730, duration: .09, peak: .065 * level });
      tone(output, { frequency: 1640, duration: .11, peak: .025 * level, delay: .025 });
      noise(output, { duration: .07, peak: .07 * level, frequency: 2500, q: 1 });
    } else if (kind === 'paper') {
      noise(output, { duration: .23, peak: .085 * level, frequency: 1800, q: .5 });
      noise(output, { duration: .13, peak: .045 * level, frequency: 3200, delay: .07 });
    } else if (kind === 'creak') {
      tone(output, { frequency: 140, end: 230, duration: .42, peak: .045 * level, type: 'triangle' });
      tone(output, { frequency: 310, end: 220, duration: .32, peak: .02 * level, delay: .07 });
      noise(output, { duration: .3, peak: .025 * level, frequency: 620, q: 2 });
    } else if (kind === 'coins') {
      [1320, 1980, 2640, 1760].forEach((frequency, i) => tone(output, { frequency, end: frequency * .98, duration: .24 + i * .035, peak: .045 * level, delay: i * .055 }));
      noise(output, { duration: .12, peak: .035 * level, frequency: 3800 });
    } else if (kind === 'bell') {
      [660, 1333, 1815].forEach((frequency, i) => tone(output, { frequency, duration: .9 - i * .16, peak: [.08, .027, .016][i] * level, delay: i * .003 }));
    }
    setTimeout(() => { output.disconnect(); activeVoices = Math.max(0, activeVoices - 1); }, 1400);
  }
  function scheduleRoom() {
    clearTimeout(roomTimer);
    if (!state.enabled || document.hidden) return;
    roomTimer = setTimeout(() => {
      if (state.ambience && !videoPlaying) effect('creak', Math.random() * 1.6 - .8, .7, true);
      scheduleRoom();
    }, 11000 + Math.random() * 9000);
  }
  async function setEnabled(enabled) {
    const token = ++generation;
    clearTimeout(suspendTimer); clearTimeout(roomTimer);
    state.enabled = enabled; render();
    if (!enabled) {
      mix();
      suspendTimer = setTimeout(() => { if (!state.enabled && context?.state === 'running') context.suspend().catch(() => {}); }, 180);
      return;
    }
    try {
      initialize();
      await context.resume();
      if (token !== generation || !state.enabled) return;
      if (context.state !== 'running') throw new Error('Audio could not start');
      mix(); scheduleRoom(); effect('bell', 0, .35);
    } catch {
      state.enabled = false; unavailable = true; render();
    }
  }
  button.addEventListener('click', () => setEnabled(!state.enabled));
  function closeSettings(restoreFocus = false) {
    settings.hidden = true; settingsButton.setAttribute('aria-expanded', 'false');
    if (restoreFocus) settingsButton.focus();
  }
  settingsButton.addEventListener('click', () => {
    settings.hidden = !settings.hidden;
    settingsButton.setAttribute('aria-expanded', String(!settings.hidden));
  });
  document.addEventListener('click', event => { if (!dock.contains(event.target)) closeSettings(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !settings.hidden) closeSettings(true); });
  volumeInput.addEventListener('input', () => { state.volume = Number(volumeInput.value) / 100; mix(); render(); save(); });
  ambienceInput.addEventListener('change', () => { state.ambience = ambienceInput.checked; mix(); save(); });
  effectsInput.addEventListener('change', () => { state.effects = effectsInput.checked; mix(); save(); });

  function panFor(element) {
    const rect = element.getBoundingClientRect();
    return Math.max(-.9, Math.min(.9, (rect.left + rect.width / 2) / innerWidth * 2 - 1));
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('a,button,summary,input[type=checkbox]');
    if (!target || target.closest('.sound-dock') || target.disabled) return;
    const kind = target.matches('.domain-tab') ? 'compass' : target.matches('summary') ? 'paper' : 'click';
    effect(kind, panFor(target), .75);
  });
  document.addEventListener('keydown', event => {
    if (!event.target.matches('.domain-tab') || !['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    effect('compass', panFor(event.target), .7);
  });
  const sceneCues = {
    intro: [[.38, 'paper', -.6]],
    journey: [[.34, 'wood', -.45], [.68, 'wood', .45]],
    voyage: [[.04, 'creak', -.6], [.5, 'bell', 0], [.93, 'bell', .65]],
    bounty: [[.29, 'lock', .35], [.46, 'creak', .4], [.64, 'coins', .55]]
  };
  const sceneIds = { intro: 'home', journey: 'journey', voyage: 'voyage', bounty: 'bounty' };
  window.KaalchakraAudio = Object.freeze({
    scene(name, progress) {
      const previous = sceneProgress.get(name);
      sceneProgress.set(name, progress);
      if (previous === undefined || !state.enabled || !state.effects || Math.abs(progress - previous) > .3) return;
      const section = document.getElementById(sceneIds[name]);
      if (!section || section.getBoundingClientRect().top > 2 || section.getBoundingClientRect().bottom < innerHeight * .65) return;
      for (const [threshold, kind, pan] of sceneCues[name] || []) {
        const crossed = previous < threshold && progress >= threshold;
        const rewound = name === 'bounty' && previous > threshold && progress <= threshold;
        if (!crossed && !rewound) continue;
        const key = `${name}:${threshold}`, now = performance.now();
        if (now - (cueTimes.get(key) ?? -Infinity) < 1800) continue;
        cueTimes.set(key, now); effect(rewound ? 'lock' : kind, pan, rewound ? .35 : .65);
      }
    }
  });
  function videoState() {
    videoPlaying = !!revealVideo && !revealVideo.paused && !revealVideo.ended;
    mix();
  }
  revealVideo?.addEventListener('play', videoState);
  revealVideo?.addEventListener('pause', videoState);
  revealVideo?.addEventListener('ended', videoState);
  document.addEventListener('visibilitychange', async () => {
    clearTimeout(roomTimer);
    if (!context || !state.enabled) return;
    if (document.hidden) { mix(); await context.suspend().catch(() => {}); }
    else {
      try { await context.resume(); mix(); scheduleRoom(); }
      catch { state.enabled = false; render(); }
    }
  });
  window.addEventListener('pagehide', () => { clearTimeout(roomTimer); context?.suspend().catch(() => {}); });
  window.addEventListener('pageshow', () => { if (state.enabled && !document.hidden) context?.resume().then(() => { mix(); scheduleRoom(); }).catch(() => {}); });
  render();
})();
