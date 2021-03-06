'use strict';

const GRAIN_SIZE = 6000;

export function ShadowTrack() {

    this._bufferLeft = new Array(5);
    this._bufferRight = new Array(5);
    this._loaded = false;
    this._playing = false;
    this._ratio = 1;
    this._currentFrame = 0;
    this._currentFrame_scratch = 0;
    this._length = 0;
    this._master = false;
    this._volume = 1;
    this._stemVolume = new Array(5);
    for (let i = 0; i < 5; i++){
        this._stemVolume[i] = 1.0;
    }
    this._pan = 0;
    this._offset = 0;
    this._quantize = true;
    this._waitCount = 0;
    this._name = "";
    this._loop = true;
    this._abSwitch = null;
    this.onStateChanged = null;

    const grain_size = GRAIN_SIZE;

    this._calcState = {
        stretchedLX: new Float32Array(44100 * 60),
        stretchedRX: new Float32Array(44100 * 60),
        current_grain_start: 0,
        current_x: 0,
        current_grain_start2: grain_size / 2,
        current_x2: -1.0 * Math.round(grain_size / 2 * this._ratio),
        current_grain_start_scratch: 0,
        current_x_scratch: 0,
        current_grain_start2_scratch: 0,
        current_x2_scratch: 0,


    }

    var that = this;

    this.isPlaying = function () {
        return this._playing;
    }


    this.setBuffer = function(si, left, right){
        console.log("shadow::setBuffer for stemIndex : " , + si.toString());
        this._length = left.length;
        this._bufferLeft[si] = left;
        this._bufferRight[si] = right;

        this._loaded = true;
    }

    // this.play = function () {
    //     if (!this._loaded) return;
    //     // this._currentFrame = 0;
    //     // this._calcState.current_grain_start = 0;
    //     // this._calcState.current_x = 0;
    //     // this._calcState.current_grain_start2 = grain_size / 2;
    //     // this._calcState.current_x2 = -1.0 * Math.round(grain_size / 2 * this._ratio);
    //     this._currentFrame = 0;
    //     let cs = this._calcState;
    //     let ratio = this._ratio;
    //     cs.current_grain_start = 0;
    //     cs.current_x = 0;

    //     if (ratio >= 1) {
    //         cs.current_grain_start2 = GRAIN_SIZE / 2;
    //         cs.current_x2 = -1.0 * Math.round(GRAIN_SIZE / 2 * ratio);
    //     } else {
    //         cs.current_grain_start2 = GRAIN_SIZE;
    //         cs.current_x2 = Math.round(GRAIN_SIZE * (ratio) * (-1));
    //     }
    //     this._playing = true;
    //     triggerStateChanged();
    // }

    this.stop = function () {
        if (!this._loaded) return;
        this._playing = false;
        triggerStateChanged();
    }

    function triggerStateChanged() {
        if (that.onStateChanged) that.onStateChanged(that);
    }

    this.setVolume = function (val) {
        this._volume = val;
    }

    this.setStemVolume = function (si, val){
        this._stemVolume[si] = val;
    }

    this.setPan = function (val) {
        this._pan = val;
    }

    this.setQuantize = function (val) {
        this._quantize = val;
    }

    this.setOffset = function (val) {
        this._offset = val;
    }

    this.setLoop = function (val) {
        this._loop = val;
    }

    this.setRatio = function (ratio) {
        this._ratio = ratio;

        let cs = this._calcState;

        cs.current_grain_start = Math.round(this._currentFrame);
        cs.current_x = 0;
        if (ratio >= 1) {
            cs.current_grain_start2 = cs.current_grain_start + GRAIN_SIZE / 2;
            cs.current_x2 = -1.0 * Math.round(GRAIN_SIZE / 2 * ratio);
        } else {
            cs.current_grain_start2 = cs.current_grain_start + GRAIN_SIZE;
            cs.current_x2 = Math.round(GRAIN_SIZE * (ratio) * (-1));
        }

        this.follow();
    }

    this.setMaster = function (isMaster) {
        this._master = isMaster;
    }

    this.isMaster = function () {
        return this._master;
    }

    this.setABSwitch = function (AorB) {
        this._abSwitch = AorB;
    }

    this.getABSwitch = function () {
        return this._abSwitch;
    }

    this.clear = function () {
        this._length = 0;
        this._currentFrame = 0;
        this._playing = false;
        this._loaded = false;
    }

    // this.loadSampleFromBuffer = function (leftBuf, rightBuf, startFrame, endFrame) {
    //     this._length = endFrame - startFrame;

    //     this._bufferLeft = new Float32Array(this._length);
    //     this._bufferRight = new Float32Array(this._length);
    //     for (let i = 0; i < this._length; i++) {
    //         this._bufferLeft[i] =
    //             leftBuf[startFrame + i];
    //         this._bufferRight[i] =
    //             rightBuf[startFrame + i];
    //     }
    //     this._currentFrame = 0;
    //     this._playing = false;
    //     this._loaded = true;
    //     this._name = "__editor__";

    // }


    function loadedFromFile(length, name) {
        that._currentFrame = 0;
        that._length = length;
        that._name = name;
        that._playing = false;
        that._loaded = true;
    }




    function sinFadeWindow(fadeStartRate, x, val) {
        let y = 0;

        if (x < 0 || x > 1) { return 0; }
        if (x < fadeStartRate) {
            y = 1.0 / 2.0 * Math.sin(Math.PI / fadeStartRate * x + 3.0 / 2 * Math.PI) + 1 / 2;
        } else if (x < 1.0 - fadeStartRate) {
            y = 1.0;
        } else {
            y = 1.0 / 2.0 * Math.sin(Math.PI / fadeStartRate * x + 3.0 / 2.0 * Math.PI
                - 1.0 / fadeStartRate * Math.PI) + 1.0 / 2.0;
        }
        return val * y;
    }

    function crossfadeWindow(fadeStartRate, x, val) {

        if (x < 0 || x > 1) { return 0; }

        if (x < fadeStartRate) {
            return val * (1.0 / fadeStartRate * x);
        } else if (x < 1.0 - fadeStartRate) {
            return val * 1.0;
        } else {
            return val * ((-1.0 / fadeStartRate * x + 1 / fadeStartRate));
        }
    }

    function noFadeWindow(fadeStartRate, x, val) {
        if (x < 0 || x > 1) { return 0; }
        return val;
    }

}

ShadowTrack.prototype.consume_backyard = function (offset) {

    const ratio = this._ratio;
    let cs = this._calcState;

    if (ratio >= 1) {
        for (let c = 0; c < offset; c++) {
            if (cs.current_x > GRAIN_SIZE * (1 + (ratio - 1) / 2)) {
                cs.current_grain_start += GRAIN_SIZE;
                cs.current_x = Math.round((GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1))
            }
            if (cs.current_x2 > GRAIN_SIZE * (1 + (ratio - 1) / 2)) {
                cs.current_grain_start2 += GRAIN_SIZE;
                cs.current_x2 = Math.round((GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1));
            }

            cs.current_x++;
            cs.current_x2++;

            this._currentFrame += 1 * 1 / ratio;
            if (this._currentFrame > this._length) {
                this._currentFrame = 0;
                cs.current_grain_start = 0;
                cs.current_x = 0;
                cs.current_grain_start2 = GRAIN_SIZE / 2;
                cs.current_x2 = -1.0 * Math.round(GRAIN_SIZE / 2 * ratio);
            }
        }
    } else {
        for (let c = 0; c < offset; c++) {
            if (cs.current_x > GRAIN_SIZE * (1 + ratio - 1 / 2)) {
                cs.current_grain_start += GRAIN_SIZE * 2;
                cs.current_x = Math.round(GRAIN_SIZE * (ratio - 1 / 2) * (-1));
            }
            if (cs.current_x2 > GRAIN_SIZE * (1 + ratio - 1 / 2)) {
                cs.current_grain_start2 += GRAIN_SIZE * 2;
                cs.current_x2 = Math.round(GRAIN_SIZE * (ratio - 1 / 2) * (-1));
            }
            cs.current_x++;
            cs.current_x2++;

            this._currentFrame += 1 * 1 / ratio;
            if (this._currentFrame > this._length) {
                this._currentFrame = 0;
                cs.current_grain_start = 0;
                cs.current_x = 0;
                cs.current_grain_start2 = GRAIN_SIZE;
                cs.current_x2 = Math.round(GRAIN_SIZE * (ratio) * (-1));
            }
        }
    }
}

ShadowTrack.prototype.consume_scratch = function (offset) {

    let ratio = this._ratio;
    let cs = this._calcState;

    if (ratio >= 1) {
        if (offset >= 0) {
            for (let c = 0; c < offset; c++) {

                if (cs.current_x_scratch > GRAIN_SIZE * (1 + (ratio - 1) / 2)) {
                    cs.current_grain_start_scratch += GRAIN_SIZE;
                    cs.current_x_scratch = Math.round((GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1));
                }
                if (cs.current_x2_scratch > GRAIN_SIZE * (1 + (ratio - 1) / 2)) {
                    cs.current_grain_start2_scratch += GRAIN_SIZE;
                    cs.current_x2_scratch = Math.round((GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1));
                }
                cs.current_x_scratch++;
                cs.current_x2_scratch++;

                this._currentFrame_scratch += 1 * 1 / ratio;
                if (this._currentFrame_scratch > this._length) {
                    this._currentFrame_scratch = 0;
                    cs.current_grain_start_scratch = 0;
                    cs.current_x_scratch = 0;
                    cs.current_grain_start2_scratch = GRAIN_SIZE / 2;
                    cs.current_x2_scratch = -1.0 * Math.round(GRAIN_SIZE / 2 * ratio);
                }
            }
        } else {
            for (let c = 0; c < -offset; c++) {

                if (cs.current_x_scratch < (GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1)) {
                    cs.current_grain_start_scratch -= GRAIN_SIZE;
                    cs.current_x_scratch = Math.round(GRAIN_SIZE * (1 + (ratio - 1) / 2));
                }
                if (cs.current_x2_scratch < (GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1)) {
                    cs.current_grain_start2_scratch -= GRAIN_SIZE;
                    cs.current_x2_scratch = Math.round(GRAIN_SIZE * (1 + (ratio - 1) / 2));
                }

                cs.current_x_scratch--;
                cs.current_x2_scratch--;


                this._currentFrame_scratch -= 1 * 1 / ratio;
                if (this._currentFrame_scratch < 0) {
                    this._currentFrame_scratch = this._length;
                    cs.current_grain_start_scratch = this._length;
                    cs.current_x_scratch = this._length;
                    cs.current_grain_start2_scratch = this._length - GRAIN_SIZE / 2;
                    cs.current_x2_scratch = GRAIN_SIZE + Math.round(GRAIN_SIZE * ratio / 2);
                }
            }
        }
    } else {
        if (offset >= 0) {
            for (let c = 0; c < offset; c++) {

                if (cs.current_x_scratch > GRAIN_SIZE * (1 + ratio - 1 / 2)) {
                    cs.current_grain_start_scratch += GRAIN_SIZE * 2;
                    cs.current_x_scratch = Math.round(GRAIN_SIZE * (ratio - 1 / 2) * (-1));
                }
                if (cs.current_x2_scratch > GRAIN_SIZE * (1 + ratio - 1 / 2)) {
                    cs.current_grain_start2_scratch += GRAIN_SIZE * 2;
                    cs.current_x2_scratch = Math.round(GRAIN_SIZE * (ratio - 1 / 2) * (-1));
                }

                cs.current_x_scratch++;
                cs.current_x2_scratch++;

                this._currentFrame_scratch += 1 * 1 / ratio;
                if (this._currentFrame_scratch > this._length) {
                    this._currentFrame_scratch = 0;
                    cs.current_grain_start_scratch = 0;
                    cs.current_x_scratch = 0;
                    cs.current_grain_start2_scratch = GRAIN_SIZE;
                    cs.current_x2_scratch = Math.round(GRAIN_SIZE * (ratio) * (-1));
                }
            }
        } else {	//reverse

            for (let c = 0; c < -offset; c++) {

                cs.current_x_scratch--;
                cs.current_x2_scratch--;

                if (cs.current_x_scratch < GRAIN_SIZE * (ratio - 1 / 2) * (-1)) {
                    cs.current_grain_start_scratch -= GRAIN_SIZE * 2;
                    cs.current_x_scratch = Math.round(GRAIN_SIZE * (1 + ratio - 1 / 2));
                }
                if (cs.current_x2_scratch < GRAIN_SIZE * (ratio - 1 / 2) * (-1)) {
                    cs.current_grain_start2_scratch -= GRAIN_SIZE * 2;
                    cs.current_x2_scratch = Math.round(GRAIN_SIZE * (1 + ratio - 1 / 2));
                }

                this._currentFrame_scratch -= 1 * 1 / ratio;
                if (this._currentFrame_scratch < 0) {
                    this._currentFrame_scratch = this._length;
                    cs.current_grain_start_scratch = this._length;
                    cs.current_x_scratch = this._length;
                    cs.current_grain_start2_scratch = this._length - GRAIN_SIZE;
                    cs.current_x_scratch = GRAIN_SIZE + Math.round(GRAIN_SIZE * ratio);
                }
            }
        }
    }
}


ShadowTrack.prototype.follow = function () {
    let cs = this._calcState;

    cs.current_x_scratch = cs.current_x;
    cs.current_grain_start_scratch = cs.current_grain_start;
    cs.current_x2_scratch = cs.current_x2;
    cs.current_grain_start2_scratch = cs.current_grain_start2;

    this._currentFrame_scratch = this._currentFrame;
}

ShadowTrack.prototype.getAt = function (offset) {

    let ratio = this._ratio;
    let cs = this._calcState;

    let ret = new Array();
    let retL = 0;
    let retR = 0;

    let current_x = cs.current_x_scratch;
    let current_grain_start = cs.current_grain_start_scratch;
    let current_x2 = cs.current_x2_scratch;
    let current_grain_start2 = cs.current_grain_start2_scratch;
    // let current_scratch = mydata.trackCurrentFrame_scratch;
    let current_scratch = this._currentFrame_scratch;


    if (ratio >= 1) {
        const fadeStartRate = -1 / 2 * ratio + 1;

        if (offset >= 0) {

            for (let c = 0; c < offset; c++) {

                if (current_x > GRAIN_SIZE * (1 + (ratio - 1) / 2)) {
                    current_grain_start += GRAIN_SIZE;
                    current_x = Math.round((GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1))
                }
                if (current_x2 > GRAIN_SIZE * (1 + (ratio - 1) / 2)) {
                    current_grain_start2 += GRAIN_SIZE;
                    current_x2 = Math.round((GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1));
                }

                current_x++;
                current_x2++;

                current_scratch += 1 * 1 / ratio;
                if (current_scratch > this._length) {
                    current_scratch = 0;
                    current_grain_start = 0;
                    current_x = 0;
                    current_grain_start2 = GRAIN_SIZE / 2;
                    current_x2 = -1.0 * Math.round(GRAIN_SIZE / 2 * ratio);
                }
            }
        } else {	//reverse

            for (let c = 0; c < -offset; c++) {
                current_x--;
                current_x2--;
                if (current_x < (GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1)) {
                    current_grain_start -= GRAIN_SIZE;
                    current_x = Math.round(GRAIN_SIZE * (1 + (ratio - 1) / 2));
                }
                if (current_x2 < (GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1)) {
                    current_grain_start2 -= GRAIN_SIZE;
                    current_x2 = Math.round(GRAIN_SIZE * (1 + (ratio - 1) / 2));
                }
                current_scratch -= 1 * 1 / ratio;
                if (current_scratch < 0) {

                    current_scratch = this._length;
                    current_grain_start = this._length;
                    current_x = this._length;
                    current_grain_start2 = this._length - GRAIN_SIZE / 2;
                    current_x2 = GRAIN_SIZE + Math.round(GRAIN_SIZE * ratio / 2);
                }
            }

        }
        {
            let x = current_grain_start + current_x;
            let valL = 0;
            let valR = 0;

            if (0 <= x && x < this._length){
                for (let si = 0; si < 5; si++){
                    valL += this._bufferLeft[si][x] * this._stemVolume[si];
                    valR += this._bufferRight[si][x] * this._stemVolume[si];
                }
                // valL = this._bufferLeft[x];
                // valR = this._bufferRight[x];
            }
            if (current_x2 < 0) {
                //no windowing for some beggining frames
            } else {
                valL = sinFadeWindow(fadeStartRate, current_x / GRAIN_SIZE, valL);
                valR = sinFadeWindow(fadeStartRate, current_x / GRAIN_SIZE, valR);
            }
            retL = valL;
            retR = valR;
        }

        {
            let x2 = current_grain_start2 + current_x2;
            let valL2 = 0;
            let valR2 = 0;

            if (0 <= x2 && x2 < this._length ){
                for (let si = 0; si < 5; si++) {
                    valL2 += this._bufferLeft[si][x2] * this._stemVolume[si];
                    valR2 += this._bufferRight[si][x2] * this._stemVolume[si];
                }
            }


            valL2 = sinFadeWindow(fadeStartRate, current_x2 / GRAIN_SIZE, valL2);
            valR2 = sinFadeWindow(fadeStartRate, current_x2 / GRAIN_SIZE, valR2);
            retL += valL2;
            retR += valR2;
        }

    } else {
        const fadeStartRate = 1 - ratio;

        if (offset >= 0) {
            for (let c = 0; c < offset; c++) {

                if (current_x > GRAIN_SIZE * (1 + ratio - 1 / 2)) {
                    current_grain_start += GRAIN_SIZE * 2;
                    current_x = Math.round(GRAIN_SIZE * (ratio - 1 / 2) * (-1));
                }
                if (current_x2 > GRAIN_SIZE * (1 + ratio - 1 / 2)) {
                    current_grain_start2 += GRAIN_SIZE * 2;
                    current_x2 = Math.round(GRAIN_SIZE * (ratio - 1 / 2) * (-1));
                }

                current_x++;
                current_x2++;

                current_scratch += 1 * 1 / ratio;
                if (current_scratch > this._length) {
                    current_scratch = 0;
                    current_grain_start = 0;
                    current_x = 0;
                    current_grain_start2 = GRAIN_SIZE;
                    current_x2 = Math.round(GRAIN_SIZE * (ratio) * (-1));
                }
            }
        } else {	//reverse

            for (let c = 0; c < -offset; c++) {

                if (current_x < GRAIN_SIZE * (ratio - 1 / 2) * (-1)) {
                    current_grain_start -= GRAIN_SIZE * 2;
                    current_x = Math.round(GRAIN_SIZE * (1 + ratio - 1 / 2));
                }
                if (current_x2 < GRAIN_SIZE * (ratio - 1 / 2) * (-1)) {
                    current_grain_start2 -= GRAIN_SIZE * 2;
                    current_x2 = Math.round(GRAIN_SIZE * (1 + ratio - 1 / 2));
                }

                current_x--;
                current_x2--;

                current_scratch -= 1 * 1 / ratio;
                if (current_scratch < 0) {
                    current_scratch = this._length;
                    current_grain_start = this._length;
                    current_x = this._length;
                    current_grain_start2 = this._length - GRAIN_SIZE;
                    current_x2 = GRAIN_SIZE + Math.round(GRAIN_SIZE * ratio);
                }
            }

        }
        {
            let x = current_grain_start + current_x;

            let valL = 0;
            let valR = 0;

            if (0 <= x && x < this._length) {
                for (let si = 0; si < 5; si++) {
                    valL += this._bufferLeft[si][x] * this._stemVolume[si];
                    valR += this._bufferRight[si][x] * this._stemVolume[si];
                }
            }
            if (current_x2 < 0) {
                //no windowing for some beggining frames
            } else {
                valL = sinFadeWindow(fadeStartRate, current_x / GRAIN_SIZE, valL);
                valR = sinFadeWindow(fadeStartRate, current_x / GRAIN_SIZE, valR);
            }
            retL = valL;
            retR = valR;
        }

        {
            let x2 = current_grain_start2 + current_x2;

            let valL2 = 0;
            let valR2 = 0;

            if (0 <= x2 && x2 < this._length) {
                for (let si = 0; si < 5; si++) {
                    valL2 += this._bufferLeft[si][x2] * this._stemVolume[si];
                    valR2 += this._bufferRight[si][x2] * this._stemVolume[si];
                }
            }

            valL2 = sinFadeWindow(fadeStartRate, current_x2 / GRAIN_SIZE, valL2);
            valR2 = sinFadeWindow(fadeStartRate, current_x2 / GRAIN_SIZE, valR2);
            retL += valL2;
            retR += valR2;
        }
    }

    //pan and volume
    let vol = this._volume;
    let pan = this._pan;
    let volLeft = 0;
    let volRight = 0;
    if (pan < 0) {
        volLeft = 1.0;
        volRight = pan + 1;
    } else {
        volLeft = -1 * pan + 1;
        volRight = 1.0;
    }

    ret[0] = retL * vol * volLeft;
    ret[1] = retR * vol * volRight;
    if(isNaN(ret[0]) || isNaN(ret[1])){
        console.log("warning :getAt returns NaN");
    }
    return ret;
}


function sinFadeWindow(fadeStartRate, x, val) {
    let y = 0;

    if (x < 0 || x > 1) { return 0; }
    if (x < fadeStartRate) {
        y = 1.0 / 2.0 * Math.sin(Math.PI / fadeStartRate * x + 3.0 / 2 * Math.PI) + 1 / 2;
    } else if (x < 1.0 - fadeStartRate) {
        y = 1.0;
    } else {
        y = 1.0 / 2.0 * Math.sin(Math.PI / fadeStartRate * x + 3.0 / 2.0 * Math.PI
            - 1.0 / fadeStartRate * Math.PI) + 1.0 / 2.0;
    }
    return val * y;
}

function crossfadeWindow(fadeStartRate, x, val) {

    if (x < 0 || x > 1) { return 0; }

    if (x < fadeStartRate) {
        return val * (1.0 / fadeStartRate * x);
    } else if (x < 1.0 - fadeStartRate) {
        return val * 1.0;
    } else {
        return val * ((-1.0 / fadeStartRate * x + 1 / fadeStartRate));
    }
}

function noFadeWindow(fadeStartRate, x, val) {
    if (x < 0 || x > 1) { return 0; }
    return val;
}


ShadowTrack.prototype.playStop = function (masterTrack) {
    let ratio = this._ratio;
    let cs = this._calcState;

    if (this._loaded) {
        if (!this._playing) {
            this._currentFrame = 0;
            cs.current_grain_start = 0;
            cs.current_x = 0;

            if (ratio >= 1) {
                cs.current_grain_start2 = GRAIN_SIZE / 2;
                cs.current_x2 = -1.0 * Math.round(GRAIN_SIZE / 2 * ratio);
            } else {
                cs.current_grain_start2 = GRAIN_SIZE;
                cs.current_x2 = Math.round(GRAIN_SIZE * (ratio) * (-1));
            }

            //quantize test [TODO:think offset]
            if (this._quantize) {

                //get master
                // let masterIndex = getMasterIndex();

                if (this != masterTrack && null != masterTrack && masterTrack._playing) {
                    let rm = masterTrack._ratio;
                    let cfm = masterTrack._currentFrame;
                    let lenm = masterTrack._length

                    let lag = cfm * rm - Math.floor(32 * cfm / lenm) * (lenm * rm / 32);
                    if (lag < lenm * rm / 64) {
                        //late comming

                        this._currentFrame = Math.round(lag / ratio);

                        //offset
                        if (this._offset >= 0) {
                            this._currentFrame += Math.round(this._offset * ratio);
                        } else {
                            this._currentFrame -= Math.round(-1 * this._offset * ratio);
                            if (this._currentFrame < 0) {
                                this._waitCount = -1 * this._currentFrame;
                                this._currentFrame = 0;
                            }
                        }
                        cs.current_grain_start = this._currentFrame;
                        if (ratio >= 1) {
                            cs.current_grain_start2 = this._currentFrame + GRAIN_SIZE / 2;
                        } else {
                            cs.current_grain_start2 = this._currentFrame + GRAIN_SIZE;
                        }

                    } else {
                        //wait required
                        this._waitCount = Math.round(lenm * rm / 32 - lag);

                        //offset
                        if (this._offset >= 0) {
                            this._waitCount -= Math.round(this._offset * ratio);
                            if (this._waitCount < 0) {
                                this._currentFrame = -1.0 * this._waitCount;
                                this._waitCount = 0;
                            }
                        } else {
                            this._waitCount += Math.round(-1 * this._offset * ratio);
                        }
                        cs.current_grain_start = this._currentFrame;
                        if (ratio >= 1) {
                            cs.current_grain_start2 = this._currentFrame + GRAIN_SIZE / 2;
                        } else {
                            cs.current_grain_start2 = this._currentFrame + GRAIN_SIZE;
                        }
                    }
                }
            } else {

                //calc offset
                if (this._offset >= 0) {
                    this._currentFrame = Math.round(this._offset * ratio);
                    cs.current_grain_start = this._currentFrame;
                    if (ratio >= 1) {
                        cs.current_grain_start2 = this._currentFrame + GRAIN_SIZE / 2;
                    } else {
                        cs.current_grain_start2 = this._currentFrame + GRAIN_SIZE;
                    }
                } else {
                    this._waitCount = Math.round(-1 * this._offset * ratio);
                }
            }
            this.follow();
            this._playing = true;

        } else {
            this._playing = false;
        }
    }

    // playStateChanged();
}

