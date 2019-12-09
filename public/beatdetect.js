'use strict';


const RING_LENGTH = 44100 * 10;
let _ringLeft = new Float32Array(RING_LENGTH);
let _ringRight = new Float32Array(RING_LENGTH);
let _ringIndex = 0;
let _ringLen = 0;

function startBeatDetectEngine(){
    let constrains = {
        audio: {
            deviceId: { exact: mydata.inDevId },
            sampleSize: 16,
            sampleRate: 44100,
            channelCount: 2,
            echoCancellation: false,
            autoGainControl: false,
            noiseSuppression: false
        },
        video: false
    };

    navigator.mediaDevices.getUserMedia(constrains)
    .then(function (stream) {
        let audioContext = new AudioContext();
        let source = audioContext.createMediaStreamSource(stream);
        let script = audioContext.createScriptProcessor(0, 2, 2);
        script.onaudioprocess = onAudioProcessBeatDetect;

        let dest = audioContext.createMediaStreamDestination();

        source.connect(script);
        script.connect(dest);

        let audio = new Audio();
        audio.srcObject = dest.stream;
        audio.setSinkId(mydata.outDevId)
        .then(function () {
            audio.play();
            setInterval(detectBPM, 1000);
        });
    });
}

function onAudioProcessBeatDetect(e){

    if (!mydata.autoBPM) return;

    let inLeft = e.inputBuffer.getChannelData(0);
    let inRight = e.inputBuffer.getChannelData(1);

    for (let i = 0; i < inLeft.length; i++) {
        _ringLeft[_ringIndex] = inLeft[i];
        _ringRight[_ringIndex] = inRight[i];

        _ringIndex++;
        if (_ringLen < RING_LENGTH) {
            _ringLen++;
        } else {
            if (_ringIndex < RING_LENGTH) {

            } else {
                _ringIndex = 0;
            }
        }
    }

    let outLeft = e.outputBuffer.getChannelData(0);
    let outRight = e.outputBuffer.getChannelData(1);

    for (let i = 0; i < outLeft.length; i++) {
        outLeft[i] = 0;
        outRight[i] = 0;
    }
}

function detectBPM(){

    if (!mydata.autoBPM) return;
    let offlineContext = new OfflineAudioContext(2, _ringLen, 44100);
    let buffer = offlineContext.createBuffer(2, _ringLen, 44100);

    let left = buffer.getChannelData(0);
    let right = buffer.getChannelData(1);

    if (_ringLen == RING_LENGTH) {
        for (let i = 0; i < (RING_LENGTH - _ringIndex); i++) {
            left[i] = _ringLeft[_ringIndex + i];
            right[i] = _ringRight[_ringIndex + i];
        }
        for (let i = 0; i < _ringIndex; i++) {
            left[(RING_LENGTH - _ringIndex) + i] = _ringLeft[i];
            right[(RING_LENGTH - _ringIndex) + i] = _ringRight[i];
        }
    } else {
        for (let i = 0; i < _ringLen; i++) {
            left[i] = _ringLeft[i];
            right[i] = _ringRight[i];
        }
    }


    let source = offlineContext.createBufferSource();
    source.buffer = buffer;

    let lowpass = offlineContext.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 150;

    let highpass = offlineContext.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 100;

    source.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(offlineContext.destination);

    source.start(0);
    offlineContext.startRendering();

    offlineContext.oncomplete = offlineCompletedBeatDetect;
}

function offlineCompletedBeatDetect(e){
    let filterdBuffer = e.renderedBuffer;

    let peaks = getPeaks(filterdBuffer.getChannelData(0));
    let result = countIntervalsBetweenPeaks(peaks);
    result = calcBPM(result);

    if(result.length == 0 ) return;

    if(mydata.autoBPM){
        mydata.bpm = result[0].center;
        let bpmLabel = document.querySelector("#bpmLabel");
        bpmLabel.innerText = mydata.bpm.toFixed(1);
    }

}

function getPeaks(data) {
    let peaksArray = [];
    for (let i = 0; i < data.length; i += 11025) {
        let maxI = 0;
        let maxV = 0;
        for (let j = 0; j < 11025; j++) {
            let vol = Math.abs(data[i + j]);
            if (vol > maxV) {
                maxV = vol;
                maxI = i + j;
            }
        }
        peaksArray.push(maxI);
    }
    return peaksArray;
}

function countIntervalsBetweenPeaks(peaks) {
    let intervalCounts = [];
    peaks.forEach(function (peak, index) {
        for (let i = 0; i < 20; i++) {
            if (index + i + 1 >= peaks.length) continue;

            let interval = peaks[index + i + 1] - peak;
            let roundInterval = 100 * Math.round(interval / 100);

            if (roundInterval < 0.01) {
                continue;
            }
            while ((60 / (roundInterval / 44100) * 4) >= 180) {
                roundInterval *= 2;
            }
            while ((60 / (roundInterval / 44100) * 4) <= 90) {
                roundInterval /= 2;
            }

            let foundInterval = intervalCounts.some(function (intervalCount) {
                if (intervalCount.interval === roundInterval) {
                    intervalCount.count++;
                    return true;
                }
            });
            if (!foundInterval) {
                intervalCounts.push({
                    interval: roundInterval,
                    count: 1
                });
            }
        }
    });
    intervalCounts.sort(function (a, b) {
        return b.count - a.count;
    });
    return intervalCounts;
}

function calcBPM(intervalCounts) {
    let bpmCounts = [];

    for (let i = 0; i < intervalCounts.length; i++) {

        let interval = intervalCounts[i].interval;
        let bpm = 60 / (interval / 44100) * 4;
        let roundBPM = Math.round(bpm / 5) * 5;
        // let roundBPM = Math.round((60 / (interval/44100)*4));

        let foundBPM = bpmCounts.some(function (bpmCount) {
            if (bpmCount.bpm == roundBPM) {
                bpmCounts.count += intervalCounts[i].count;
                bpmCount.intervals.push(intervalCounts[i]);
                return true;
            }
            return false;
        });

        if (!foundBPM) {
            bpmCounts.push({
                bpm: roundBPM,
                count: intervalCounts[i].count,
                intervals: [intervalCounts[i]]
            });
        }
    }

    bpmCounts.sort(function (a, b) {
        a.count - b.count;
    });

    for (let i = 0; i < bpmCounts.length; i++) {

        let sum = 0;
        let count = 0;
        let intervals = bpmCounts[i].intervals;
        for (let j = 0; j < intervals.length; j++) {
            let bpm = 60 / (intervals[j].interval / 44100) * 4;
            sum += bpm * intervals[j].count;
            count += intervals[j].count;
        }
        bpmCounts[i].center = sum / count;
    }
    return bpmCounts;
}