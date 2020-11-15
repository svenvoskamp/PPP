const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const audioElement = document.querySelector('audio');
const sound = audioContext.createMediaElementSource(audioElement);

const gainNode = new GainNode(audioContext);

const lowpassNode = new BiquadFilterNode(audioContext);

const highpassNode = new BiquadFilterNode(audioContext);
highpassNode.type = "highpass";

const pannerOptions = {
    pan: 0
};

const panner = new StereoPannerNode(audioContext, pannerOptions);

const makeDistortionCurve = amount => {
    let k = typeof amount === 'number' ? amount : 50,
      n_samples = 44100,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      i = 0,
      x;
    for ( ; i < n_samples; ++i ) {
      x = i * 2 / n_samples - 1;
      curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
    }
    return curve;
  };

const waveShaperNode = new WaveShaperNode(audioContext);
waveShaperNode.curve = makeDistortionCurve(100);
waveShaperNode.oversample = '4x';

sound.connect(gainNode).connect(panner).connect(audioContext.destination);

const playButton = document.querySelector('button');

let playing = false;

playButton.addEventListener('click', () => {

    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if (playing == false) {
        audioElement.play();
        playing = true;
    } else if (playing == true) {
        audioElement.pause();
        playing = false;
    }
});

audioElement.addEventListener('ended', () => {
    playing = false;
});

const volumeControl = document.querySelector('#volume');

volumeControl.addEventListener('input', () => {
    gainNode.gain.value = volumeControl.value;
});

const pannerControl = document.querySelector('#panner');

pannerControl.addEventListener('input', () => {
    panner.pan.value = pannerControl.value;
});

const lowpassControl = document.querySelector('#lowpass');

lowpassControl.addEventListener('change', () => {
    if (lowpassControl.checked) {
     
        sound.connect(gainNode).connect(panner).connect(lowpassNode).connect(audioContext.destination);
    } else {
        sound.connect(gainNode).connect(panner).disconnect(lowpassNode).connect(audioContext.destination);
    }
});

const highpassControl = document.querySelector('#highpass');

highpassControl.addEventListener('change', () => {
    if (highpassControl.checked) {
        sound.connect(gainNode).connect(panner).connect(highpassNode).connect(audioContext.destination);
    } else {
        sound.connect(gainNode).connect(panner).disconnect(highpassNode).connect(audioContext.destination);
    }
});

const distortionControl = document.querySelector('#distortion');

distortionControl.addEventListener('change', () => {
    if (distortionControl.checked) {
        sound.connect(gainNode).connect(panner).connect(waveShaperNode).connect(audioContext.destination);
    } else {
        sound.connect(gainNode).connect(panner).disconnect(waveShaperNode).connect(audioContext.destination);
    }
});