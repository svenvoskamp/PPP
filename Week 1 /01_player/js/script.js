const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const audioElement = document.querySelector('audio');
const sound = audioContext.createMediaElementSource(audioElement);
const gainNode = audioContext.createGain();
sound.connect(gainNode).connect(audioContext.destination);

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