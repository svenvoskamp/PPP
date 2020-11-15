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

let feedForward = [0.10020298, 1.0004059599, 0.00020298];
let feedBackward = [1.0126964558, -1.0991880801, 0.9873035442];
const iirFilterNode = new IIRFilterNode(audioContext, {
    feedforward: feedForward,
    feedback: feedBackward
});
console.log(iirFilterNode);

const makeDistortionCurve = amount => {
    let k = typeof amount === 'number' ? amount : 50,
        n_samples = 44100,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180,
        i = 0,
        x;
    for (; i < n_samples; ++i) {
        x = i * 2 / n_samples - 1;
        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
    }
    return curve;
};

const waveShaperNode = new WaveShaperNode(audioContext);
waveShaperNode.curve = makeDistortionCurve(100);
waveShaperNode.oversample = '4x';

const reverbEffect = async () => {
    const createReverb = async () => {
        const convolver = new ConvolverNode(audioContext);
        let response = await fetch("./assets/audio/church.wav");
        let arraybuffer = await response.arrayBuffer();
        convolver.buffer = await audioContext.decodeAudioData(arraybuffer);
        return convolver;
    }
    let reverb = await createReverb();
    const reverbControl = document.querySelector('#reverb');

    reverbControl.addEventListener('change', () => {

        if (reverbControl.checked) {
            sound.connect(reverb).connect(audioContext.destination);
            console.log(sound);
        } else {
            sound.disconnect(reverb).connect(audioContext.destination);
        }
    });
}
reverbEffect();

sound.connect(gainNode).connect(panner).connect(audioContext.destination);

const playButton = document.querySelector('.img__cd');


let playing = false;

playButton.addEventListener('click', () => {
    if(playButton.classList.contains('paused')){
        console.log("hallo");
        playButton.classList.remove('paused')
    }else {
        playButton.classList.add('paused');
    }
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

const iirFilterControl = document.querySelector('#iirfilter');

iirFilterControl.addEventListener('change', () => {
    if (iirFilterControl.checked) {
        console.log("connect");
        sound.connect(gainNode).connect(iirFilterNode).connect(audioContext.destination);
    } else {
        sound.connect(gainNode).disconnect(iirFilterNode).connect(audioContext.destination);
    }
});