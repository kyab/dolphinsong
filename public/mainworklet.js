// import ShadowTrack from "./shadowtrack.js";
import {ShadowTrack} from "./shadowtrack.js";

const TRACK_NUM = 5;

class MainProcessor extends AudioWorkletProcessor {

    constructor() {
        super();
        this._vTrack = new ShadowTrack();
        this._tracks = new Array(TRACK_NUM);
        for (let i = 0 ; i < TRACK_NUM; i++){
            this._tracks[i] = new ShadowTrack();
        }

        this._speeds = new Array(TRACK_NUM);
        for (let i = 0; i < TRACK_NUM; i++){
            this._speeds[i] = 1.0;
        }
        this._speedA = 1.0;
        this._speedB = 1.0;
        this._abSwitchValue = 0.0;

        let that = this;
        this.port.onmessage =  function (e){
            that.onMessage(e);
        }
    }

    onMessage(event) {
        let m = event.data;

        switch (m.cmd) {
            case "setBufferV":
                this._vTrack.setBuffer(m.left, m.right);
                break;

            case "setBuffer":
                {
                    let index = m.index;
                    this._tracks[index].setBuffer(m.left, m.right);
                }
                break;

            case "setBufferStems":
                {
                    let index = m.index;
                    let si = m.stemIndex;
                    if (index == -1){
                        this._vTrack.setBuffer(si, m.left, m.right)
                    }else{
                        this._tracks[index].setBuffer(si, m.left, m.right);
                    }
                }
                break;

            case "setRatio":
                this._tracks[m.index].setRatio(m.ratio);
                break;

            case "setVolume":
                this._tracks[m.index].setVolume(m.volume);
                break;

            case "setStemVolume":
                this._tracks[m.index].setStemVolume(m.stemIndex, m.volume);
                break;

            case "setPan":
                this._tracks[m.index].setPan(m.pan);
                break;

            case "setQuantize":
                this._tracks[m.index].setQuantize(m.quantize);
                break;

            case "setOffset":
                this._tracks[m.index].setOffset(m.offset);
                break;

            case "playV":
                this._vTrack.playStop();
                break;

            // case "play":
            //     this._tracks[m.index].play();
            //     break;

            case "stopV":
                this._vTrack.stop();
                break;

            // case "stop":
            //     this._tracks[m.index].pause();
            //     break;

            case "playStop":
                this._tracks[m.index].playStop();
                break;

            case "setSpeed":
                // console.log("setSpeed for index : " + m.index + " = " + m.speed);
                this._speeds[m.index] = m.speed;
                break;

            case "setSpeedA":
                // console.log("setSpeedA = " + m.speed);
                this._speedA = m.speed;
                break;
            
            case "setSpeedB":
                // console.log("setSpeedB = " + m.speed);
                this._speedB = m.speed;
                break;
            
            case "setABSwitch":
                // console.log("setABSwitch for index : " + m.index + " = " + m.AorB);
                this._tracks[m.index].setABSwitch(m.AorB);
                break;

            case "setABSwitchValue":
                // console.log("setABSwitchValue = " + m.value);
                this._abSwitchValue = m.value;
                break;

            case "follow":
                this._tracks[m.index].follow();
                break;

            default:
                console.log("unknown cmd : " + m.cmd);
                break;
        }
    }

    process(inputs, outputs, parameters) {
        let output = outputs[0];

        let outLeft = output[0];
        let outRight = output[1];

        for (let i = 0; i < outLeft.length; i++) {
            outLeft[i] = 0;//inLeft[i];
            outRight[i] = 0;//inRight[i];
        }

        if (this._vTrack.isPlaying()){
            for (let i = 0; i < outLeft.length; i++){
                let y0 = this._vTrack.getAt(i);
                outLeft[i] += y0[0];
                outRight[i] += y0[1];
            }
            this._vTrack.consume_scratch(outLeft.length);
            this._vTrack.consume_backyard(outLeft.length);
        }


        for (let i = 0; i < TRACK_NUM; i++) {

            let speed = this._speeds[i];
            let speedA = this._speedA;
            let speedB = this._speedB;

            if (this._tracks[i].isPlaying()) {

                let s = 1.0;
                let gain = 1.0;

                let AorB = this._tracks[i].getABSwitch();
                if (AorB == "A"){
                    s = speedA;
                    if (this._abSwitchValue >= 0){
                        gain = -this._abSwitchValue + 1.0;
                    }else{
                        gain = 1.0;
                    }
                }else if (AorB == "B"){
                    s = speedB;
                    if (this._abSwitchValue <= 0){
                        gain = this._abSwitchValue + 1.0;
                    }else{
                        gain = 1.0;
                    }
                }else{
                    s = speed;
                    gain = 1.0;
                }

                for (let j = 0; j < outLeft.length; j++) {
                    let x0 = Math.floor(j * s);
                    let x1 = Math.ceil(j * s);
                    let y0 = this._tracks[i].getAt(x0);
                    let y1 = this._tracks[i].getAt(x1);

                    let y_l = linearInterporation(x0, y0[0], x1, y1[0], j * s);
                    let y_r = linearInterporation(x0, y0[1], x1, y1[1], j * s);

                    let valL = y_l * gain;
                    let valR = y_r * gain;
                    if (isNaN(valL)) {
                        console.log("warning NaNL");
                    }else{
                        outLeft[j] += valL;
                    }

                    if (isNaN(valR)) {
                        console.log("warning NaNR");
                    }else{
                        outRight[j] += valR;
                    }

                }
                this._tracks[i].consume_scratch(Math.round(outLeft.length * s));
                this._tracks[i].consume_backyard(outLeft.length);
            }
        }


        return true;
    }
}

function linearInterporation(x0, y0, x1, y1, x) {
    if (x0 == x1) { return y0; }

    let a = (y1 - y0) / (x1 - x0);
    let y = y0 + a * (x - x0);
    return y;
}

registerProcessor("main-processor", MainProcessor);
