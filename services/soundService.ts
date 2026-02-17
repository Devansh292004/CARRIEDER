
// Synthesized Sound Engine using Web Audio API
// No external assets required.

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let isMuted = localStorage.getItem('carrieder_muted') === 'true';

const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);
        masterGain.gain.value = isMuted ? 0 : 0.3; // Default volume
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
};

export const toggleMute = () => {
    isMuted = !isMuted;
    localStorage.setItem('carrieder_muted', isMuted.toString());
    if (masterGain) {
        masterGain.gain.value = isMuted ? 0 : 0.3;
    }
    return isMuted;
};

export const getMuteStatus = () => isMuted;

// Helper to create oscillators
const playTone = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1, delay: number = 0) => {
    if (isMuted || !audioCtx) {
        initAudio(); // Try to init if missing
        if (isMuted) return;
    }
    if (!audioCtx || !masterGain) return;

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
    
    gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(vol, audioCtx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(masterGain);

    osc.start(audioCtx.currentTime + delay);
    osc.stop(audioCtx.currentTime + delay + duration);
};

export const playHover = () => {
    // High tech chirp
    playTone(800, 'sine', 0.03, 0.05);
};

export const playClick = () => {
    // Mechanical thud
    playTone(150, 'square', 0.05, 0.1);
    playTone(100, 'sawtooth', 0.05, 0.05);
};

export const playSuccess = () => {
    // Ascending chime
    playTone(440, 'sine', 0.1, 0.1, 0);
    playTone(554, 'sine', 0.1, 0.1, 0.1); // C#
    playTone(659, 'sine', 0.2, 0.1, 0.2); // E
};

export const playError = () => {
    // Error buzz
    playTone(150, 'sawtooth', 0.1, 0.1);
    playTone(100, 'sawtooth', 0.2, 0.1, 0.05);
};

export const playScan = () => {
    // Sci-fi data scan trill
    if (isMuted || !audioCtx || !masterGain) return;
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.3);
    
    // LFO for flutter
    const lfo = audioCtx.createOscillator();
    lfo.type = 'sawtooth';
    lfo.frequency.value = 20;
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.value = 500;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();

    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
    lfo.stop(audioCtx.currentTime + 0.3);
};

export const playType = () => {
    // Soft key click
    playTone(300 + Math.random() * 200, 'triangle', 0.03, 0.02);
};
