'use strict';

const GRAIN_SIZE = 6000;

const STEM_INDEX_BASS = 0;
const STEM_INDEX_DRUMS = 1;
const STEM_INDEX_OTHER = 2;
const STEM_INDEX_PIANO = 3;
const STEM_INDEX_VOCALS = 4;

function MyTrack() {
	this._bufferLeft = new Array(5);
    this._bufferRight = new Array(5);
    this._loaded = false;
    this._playing = false;
    this._ratio = 1;
	this._currentFrame = 0;
	this._currentFrame_scratch  = 0;
    this._length = 0;
    this._master = false;
    this._volume = 1;
    this._pan = 0;
    this._offset = 0;
    this._quantize = true;
    this._waitCount = 0;
	this._name = "";
	this._loop = true;
	this._abSwitch = null;
	this.onStateChanged = null;

	// const grain_size = GRAIN_SIZE;
	
	// this._calcState = {
	// 	stretchedLX : new Float32Array(44100*60),
	// 	stretchedRX : new Float32Array(44100*60),
	// 	current_grain_start : 0,
	// 	current_x : 0,
	// 	current_grain_start2 : grain_size / 2,
	// 	current_x2: -1.0 * Math.round(grain_size / 2 * this._ratio),
	// 	current_grain_start_scratch : 0,
	// 	current_x_scratch : 0,
	// 	current_grain_start2_scratch: 0,
	// 	current_x2_scratch: 0,
	
	// }

	var that = this;
	
	this.isPlaying = function(){
		return this._playing;
	}

	this.playPause = function(){
		if (!this._loaded) return;
		if (this._playing){
			this.pause();
		}else{
			this.play();
		}
	}

	this.play = function(){
		if (!this._loaded) return;
		this._currentFrame = 0;
		// this._calcState.current_grain_start =  0;
		// this._calcState.current_x = 0;
		// this._calcState.current_grain_start2 = grain_size / 2;
		// this._calcState.current_x2 = -1.0 * Math.round(grain_size / 2 * this._ratio);
		this._playing = true;
		triggerStateChanged();
	}

	this.pause = function(){
		if (!this._loaded) return;
		this._playing = false;
		triggerStateChanged();
	}

	function triggerStateChanged(){
		if (that.onStateChanged) that.onStateChanged(that);
	}

	this.setVolume = function(val){
		this._volume = val;
	}

	this.setPan = function(val){
		this._pan = val;
	}

	this.setQuantize = function(val){
		this._quantize = val;
	}

	this.setOffset = function(val){
		this._offset = val;
	}

	this.setLoop = function(val){
		this._loop = val;
	}

	this.setRatio = function(ratio){
		this._ratio = ratio;

		// let cs = this._calcState;

		// cs.current_grain_start = Math.round(this._currentFrame);
		// cs.current_x = 0;
		// if (ratio >= 1) {
		// 	cs.current_grain_start2 = cs.current_grain_start + GRAIN_SIZE / 2;
		// 	cs.current_x2 = -1.0 * Math.round(GRAIN_SIZE / 2 * ratio);
		// } else {
		// 	cs.current_grain_start2 = cs.current_grain_start + GRAIN_SIZE;
		// 	cs.current_x2 = Math.round(GRAIN_SIZE * (ratio) * (-1));
		// }	
	}

	this.setMaster = function(isMaster){
		this._master = isMaster;
	}
	
	this.isMaster = function(){
		return this._master; 
	}

	this.setABSwitch = function(AorB){
		this._abSwitch = AorB;
	}

	this.getABSwitch = function(){
		return this._abSwitch;
	}
	
	this.clear = function(){
		this._length = 0;
		this._currentFrame = 0;
		this._playing = false;
		this._loaded = false;
	}

    this.loadSampleFromBuffer = function(leftBuf, rightBuf, startFrame, endFrame){
        this._length = endFrame - startFrame;

        this._bufferLeft = new Float32Array(this._length);
        this._bufferRight = new Float32Array(this._length);
        for (let i = 0; i < this._length; i++) {
            this._bufferLeft[i] =
                leftBuf[startFrame + i];
            this._bufferRight[i] =
                rightBuf[startFrame + i];
        }
        this._currentFrame = 0;
        this._playing = false;
		this._loaded = true;
		this._name = "__editor__";

    } 


    function loadedFromFile(length, name){
		that._currentFrame =0;
		that._length = length;
		that._name = name;
		that._playing = false;
		that._loaded = true;
	}
	
    this.loadSampleFromFile = function(file, name, si){

		return new Promise(function(resolve, reject){
			tryLoadSampleFromFileStandard(file, si)
			.then(function(length){
				loadedFromFile(length, name);
				resolve();
			},function(e){
				tryLoadSampleFromFileAAC(file, si)
				.then(function(length){
					loadedFromFile(length, name);
					resolve();
				},function(e){
					reject(e);
				});
			});;
		});
    }

    function tryLoadSampleFromFileStandard(blob, si){
        return new Promise(function(resolve, reject){
            const fileReader = new FileReader();
            fileReader.onload = function(e){
                const fileContents = e.target.result;
                const audioContextForDecode = new AudioContext();
				audioContextForDecode.decodeAudioData(fileContents)
				.then(function(buf){
					that._bufferLeft[si] = buf.getChannelData(0);
					if (buf.numberOfChannels == 1){
						that._bufferRight[si] = buf.getChannelData(0);
					}else{
						that._bufferRight[si] = buf.getChannelData(1);
					}
					audioContextForDecode.close();
					resolve(buf.length);
				},function(e){
					reject(e);
				});				
            }
			fileReader.readAsArrayBuffer(blob);
        });
	}
	
	function tryLoadSampleFromFileAAC(blob, si){
		return new Promise(function(resolve, reject){
			let asset = AV.Asset.fromFile(blob);
			asset.on("error", function(e){
				reject(e);
			});

			asset.get("duration", function(duration){
				console.log("duration = " + duration);

				const fileReader = new FileReader();
				fileReader.onload = function (e) {

					asset.decodeToBuffer(function(buffer){
						that._bufferLeft[si]= new Float32Array(buffer.length / 2);
						that._bufferRight[si] =  new Float32Array(buffer.length / 2);
						for (let i = 0; i < buffer.length / 2; i++) {
							that._bufferLeft[si][i] = buffer[i * 2];
							that._bufferRight[si][i] = buffer[i * 2 + 1];
						}
						console.log("samples = " + buffer.length / 2);
						resolve(buffer.length / 2);
					});
				}
				fileReader.readAsArrayBuffer(blob);	//somehow this required

			});
		});
	}



	// this.process = function(inBufL, inBufR, len){
	// 	let calcState = this._calcState;
	// 	let ratio = this._ratio;


	// 	if (ratio >= 1) {
	// 		for (let iX = 0; iX < len; iX++) {

	// 			//wait for time to come.
	// 			if (this._waitCount > 0) {
	// 				this._waitCount--;
	// 				continue;
	// 			}

	// 			const fadeStartRate = -1 / 2 * ratio + 1;

	// 			if (calcState.current_x > grain_size * (1 + (ratio - 1) / 2)) {
	// 				calcState.current_grain_start += grain_size;
	// 				calcState.current_x = Math.round((grain_size * (1 + (ratio - 1) / 2) - grain_size) * (-1))
	// 			}
	// 			if (calcState.current_x2 > grain_size * (1 + (ratio - 1) / 2)) {
	// 				calcState.current_grain_start2 += grain_size;
	// 				calcState.current_x2 = Math.round((grain_size * (1 + (ratio - 1) / 2) - grain_size) * (-1));
	// 			}


	// 			{
	// 				let x = calcState.current_grain_start + calcState.current_x;

	// 				let valL = this._bufferLeft[x];
	// 				let valR = this._bufferRight[x];
	// 				if (calcState.current_x2 < 0) {
	// 					//no windowing for some beggining frames
	// 				} else {
	// 					valL = sinFadeWindow(fadeStartRate, calcState.current_x / grain_size, valL);
	// 					valR = sinFadeWindow(fadeStartRate, calcState.current_x / grain_size, valR);
	// 				}
	// 				calcState.stretchedLX[iX] = valL;
	// 				calcState.stretchedRX[iX] = valR;
	// 			}

	// 			{
	// 				let x2 = calcState.current_grain_start2 + calcState.current_x2;
	// 				let valL2 = this._bufferLeft[x2];
	// 				let valR2 = this._bufferRight[x2];

	// 				valL2 = sinFadeWindow(fadeStartRate, calcState.current_x2 / grain_size, valL2);
	// 				valR2 = sinFadeWindow(fadeStartRate, calcState.current_x2 / grain_size, valR2);
	// 				calcState.stretchedLX[iX] += valL2;
	// 				calcState.stretchedRX[iX] += valR2;
	// 			}
	// 			calcState.current_x++;
	// 			calcState.current_x2++;

	// 			let vol = this._volume;
	// 			let pan = this._pan;
	// 			let volLeft = 0;
	// 			let volRight = 0;
	// 			if (pan < 0) {
	// 				volLeft = 1.0;
	// 				volRight = pan + 1;
	// 			} else {
	// 				volLeft = -1 * pan + 1;
	// 				volRight = 1.0;
	// 			}

	// 			inBufL[iX] += calcState.stretchedLX[iX]
	// 				* vol * volLeft;
	// 			inBufR[iX] += calcState.stretchedRX[iX]
	// 				* vol * volRight;


	// 			this._currentFrame += 1 * 1 / ratio;
	// 			if (this._currentFrame > this._length) {
	// 				this._currentFrame = 0;
	// 				calcState.current_grain_start = 0;
	// 				calcState.current_x = 0;
	// 				calcState.current_grain_start2 = grain_size / 2;
	// 				calcState.current_x2 = -1.0 * Math.round(grain_size / 2 * ratio);
	// 				if (!this._loop){
	// 					this._playing = false;
	// 					triggerStateChanged();
	// 					break;
	// 				}
	// 			}

	// 		}
	// 	} else {
	// 		for (let iX = 0; iX < len; iX++) {

	// 			//wait for time to come.
	// 			if (this._waitCount > 0) {
	// 				this._waitCount--;
	// 				continue;
	// 			}

	// 			const fadeStartRate = 1 - ratio;
	// 			// const fadeStartRate = 0;
	// 			if (calcState.current_x > grain_size * (1 + ratio - 1 / 2)) {
	// 				calcState.current_grain_start += grain_size * 2;
	// 				calcState.current_x = Math.round(grain_size * (ratio - 1 / 2) * (-1));
	// 			}
	// 			if (calcState.current_x2 > grain_size * (1 + ratio - 1 / 2)) {
	// 				calcState.current_grain_start2 += grain_size * 2;
	// 				calcState.current_x2 = Math.round(grain_size * (ratio - 1 / 2) * (-1));
	// 			}
	// 			{
	// 				let x = calcState.current_grain_start + calcState.current_x;
	// 				let valL = this._bufferLeft[x];
	// 				let valR = this._bufferRight[x];
	// 				if (calcState.current_x2 < 0) {
	// 					//no windowing for some beggining frames
	// 				} else {
	// 					valL = sinFadeWindow(fadeStartRate, calcState.current_x / grain_size, valL);
	// 					valR = sinFadeWindow(fadeStartRate, calcState.current_x / grain_size, valR);
	// 				}
	// 				calcState.stretchedLX[iX] = valL;
	// 				calcState.stretchedRX[iX] = valR;
	// 			}
	// 			{
	// 				let x2 = calcState.current_grain_start2 + calcState.current_x2;
	// 				let valL2 = this._bufferLeft[x2];
	// 				let valR2 = this._bufferRight[x2];

	// 				valL2 = sinFadeWindow(fadeStartRate, calcState.current_x2 / grain_size, valL2);
	// 				valR2 = sinFadeWindow(fadeStartRate, calcState.current_x2 / grain_size, valR2);
	// 				calcState.stretchedLX[iX] += valL2;
	// 				calcState.stretchedRX[iX] += valR2;
	// 			}

	// 			calcState.current_x++;
	// 			calcState.current_x2++;

	// 			let vol = this._volume;
	// 			let pan = this._pan;;
	// 			let volLeft = 0;
	// 			let volRight = 0;
	// 			if (pan < 0) {
	// 				volLeft = 1.0;
	// 				volRight = pan + 1;
	// 			} else {
	// 				volLeft = -1 * pan + 1;
	// 				volRight = 1.0;
	// 			}

	// 			inBufL[iX] += calcState.stretchedLX[iX]
	// 				* vol * volLeft;
	// 			inBufR[iX] += calcState.stretchedRX[iX]
	// 				* vol * volRight;

	// 			this._currentFrame += 1 * 1 / ratio;
	// 			if (this._currentFrame > this.length) {
	// 				this._currentFrame = 0;
	// 				calcState.current_grain_start = 0;
	// 				calcState.current_x = 0;
	// 				calcState.current_grain_start2 = grain_size;
	// 				calcState.current_x2 = Math.round(grain_size * (ratio) * (-1));

	// 				if (!this._loop) {
	// 					this._playing = false;
	// 					triggerStateChanged();
	// 					break;
	// 				}
	// 			}

	// 		}
	// 	}	
	// }



	// function sinFadeWindow(fadeStartRate, x, val) {
	// 	let y = 0;

	// 	if (x < 0 || x > 1) { return 0; }
	// 	if (x < fadeStartRate) {
	// 		y = 1.0 / 2.0 * Math.sin(Math.PI / fadeStartRate * x + 3.0 / 2 * Math.PI) + 1 / 2;
	// 	} else if (x < 1.0 - fadeStartRate) {
	// 		y = 1.0;
	// 	} else {
	// 		y = 1.0 / 2.0 * Math.sin(Math.PI / fadeStartRate * x + 3.0 / 2.0 * Math.PI
	// 			- 1.0 / fadeStartRate * Math.PI) + 1.0 / 2.0;
	// 	}
	// 	return val * y;
	// }

	// function crossfadeWindow(fadeStartRate, x, val) {

	// 	if (x < 0 || x > 1) { return 0; }

	// 	if (x < fadeStartRate) {
	// 		return val * (1.0 / fadeStartRate * x);
	// 	} else if (x < 1.0 - fadeStartRate) {
	// 		return val * 1.0;
	// 	} else {
	// 		return val * ((-1.0 / fadeStartRate * x + 1 / fadeStartRate));
	// 	}
	// }

	// function noFadeWindow(fadeStartRate, x, val) {
	// 	if (x < 0 || x > 1) { return 0; }
	// 	return val;
	// }

}

// MyTrack.prototype.consume_backyard = function (offset) {

// 	const ratio = this._ratio;
// 	let cs = this._calcState;

// 	if (ratio >= 1) {
// 		for (let c = 0; c < offset; c++) {
// 			if (cs.current_x > GRAIN_SIZE * (1 + (ratio - 1) / 2)) {
// 				cs.current_grain_start += GRAIN_SIZE;
// 				cs.current_x = Math.round((GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1))
// 			}
// 			if (cs.current_x2 > GRAIN_SIZE * (1 + (ratio - 1) / 2)) {
// 				cs.current_grain_start2 += GRAIN_SIZE;
// 				cs.current_x2 = Math.round((GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1));
// 			}

// 			cs.current_x++;
// 			cs.current_x2++;

// 			this._currentFrame += 1 * 1 / ratio;
// 			if (this._currentFrame > this._length) {
// 				this._currentFrame = 0;
// 				cs.current_grain_start = 0;
// 				cs.current_x = 0;
// 				cs.current_grain_start2 = GRAIN_SIZE / 2;
// 				cs.current_x2 = -1.0 * Math.round(GRAIN_SIZE / 2 * ratio);
// 			}
// 		}
// 	} else {
// 		for (let c = 0; c < offset; c++) {
// 			if (cs.current_x > GRAIN_SIZE * (1 + ratio - 1 / 2)) {
// 				cs.current_grain_start += GRAIN_SIZE * 2;
// 				cs.current_x = Math.round(GRAIN_SIZE * (ratio - 1 / 2) * (-1));
// 			}
// 			if (cs.current_x2 > GRAIN_SIZE * (1 + ratio - 1 / 2)) {
// 				cs.current_grain_start2 += GRAIN_SIZE * 2;
// 				cs.current_x2 = Math.round(GRAIN_SIZE * (ratio - 1 / 2) * (-1));
// 			}
// 			cs.current_x++;
// 			cs.current_x2++;

// 			this._currentFrame += 1 * 1 / ratio;
// 			if (this._currentFrame > this._length) {
// 				this._currentFrame = 0;
// 				cs.current_grain_start = 0;
// 				cs.current_x = 0;
// 				cs.current_grain_start2 = GRAIN_SIZE;
// 				cs.current_x2 = Math.round(GRAIN_SIZE * (ratio) * (-1));
// 			}
// 		}
// 	}
// }

// MyTrack.prototype.consume_scratch = function(offset) {

// 	let ratio = this._ratio;
// 	let cs = this._calcState;

// 	if (ratio >= 1) {
// 		if (offset >= 0) {
// 			for (let c = 0; c < offset; c++) {

// 				if (cs.current_x_scratch > GRAIN_SIZE * (1 + (ratio - 1) / 2)) {
// 					cs.current_grain_start_scratch += GRAIN_SIZE;
// 					cs.current_x_scratch = Math.round((GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1));
// 				}
// 				if (cs.current_x2_scratch > GRAIN_SIZE * (1 + (ratio - 1) / 2)) {
// 					cs.current_grain_start2_scratch += GRAIN_SIZE;
// 					cs.current_x2_scratch = Math.round((GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1));
// 				}
// 				cs.current_x_scratch++;
// 				cs.current_x2_scratch++;

// 				this._currentFrame_scratch += 1 * 1 / ratio;
// 				if (this._currentFrame_scratch > this._length) {
// 					this._currentFrame_scratch = 0;
// 					cs.current_grain_start_scratch = 0;
// 					cs.current_x_scratch = 0;
// 					cs.current_grain_start2_scratch = GRAIN_SIZE / 2;
// 					cs.current_x2_scratch = -1.0 * Math.round(GRAIN_SIZE / 2 * ratio);
// 				}
// 			}
// 		} else {
// 			for (let c = 0; c < -offset; c++) {

// 				if (cs.current_x_scratch < (GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1)) {
// 					cs.current_grain_start_scratch -= GRAIN_SIZE;
// 					cs.current_x_scratch = Math.round(GRAIN_SIZE * (1 + (ratio - 1) / 2));
// 				}
// 				if (cs.current_x2_scratch < (GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1)) {
// 					cs.current_grain_start2_scratch -= GRAIN_SIZE;
// 					cs.current_x2_scratch = Math.round(GRAIN_SIZE * (1 + (ratio - 1) / 2));
// 				}

// 				cs.current_x_scratch--;
// 				cs.current_x2_scratch--;


// 				this._currentFrame_scratch -= 1 * 1 / ratio;
// 				if (this._currentFrame_scratch < 0) {
// 					this._currentFrame_scratch = this._length;
// 					cs.current_grain_start_scratch = this._length;
// 					cs.current_x_scratch = this._length;
// 					cs.current_grain_start2_scratch = this._length - GRAIN_SIZE / 2;
// 					cs.current_x2_scratch = GRAIN_SIZE + Math.round(GRAIN_SIZE * ratio / 2);
// 				}
// 			}
// 		}
// 	} else {
// 		if (offset >= 0) {
// 			for (let c = 0; c < offset; c++) {

// 				if (cs.current_x_scratch > GRAIN_SIZE * (1 + ratio - 1 / 2)) {
// 					cs.current_grain_start_scratch += GRAIN_SIZE * 2;
// 					cs.current_x_scratch = Math.round(GRAIN_SIZE * (ratio - 1 / 2) * (-1));
// 				}
// 				if (cs.current_x2_scratch > GRAIN_SIZE * (1 + ratio - 1 / 2)) {
// 					cs.current_grain_start2_scratch += GRAIN_SIZE * 2;
// 					cs.current_x2_scratch = Math.round(GRAIN_SIZE * (ratio - 1 / 2) * (-1));
// 				}

// 				cs.current_x_scratch++;
// 				cs.current_x2_scratch++;

// 				this._currentFrame_scratch += 1 * 1 / ratio;
// 				if (this._currentFrame_scratch > this._length) {
// 					this._currentFrame_scratch = 0;
// 					cs.current_grain_start_scratch = 0;
// 					cs.current_x_scratch = 0;
// 					cs.current_grain_start2_scratch = GRAIN_SIZE;
// 					cs.current_x2_scratch = Math.round(GRAIN_SIZE * (ratio) * (-1));
// 				}
// 			}
// 		} else {	//reverse

// 			for (let c = 0; c < -offset; c++) {

// 				cs.current_x_scratch--;
// 				cs.current_x2_scratch--;

// 				if (cs.current_x_scratch < GRAIN_SIZE * (ratio - 1 / 2) * (-1)) {
// 					cs.current_grain_start_scratch -= GRAIN_SIZE * 2;
// 					cs.current_x_scratch = Math.round(GRAIN_SIZE * (1 + ratio - 1 / 2));
// 				}
// 				if (cs.current_x2_scratch < GRAIN_SIZE * (ratio - 1 / 2) * (-1)) {
// 					cs.current_grain_start2_scratch -= GRAIN_SIZE * 2;
// 					cs.current_x2_scratch = Math.round(GRAIN_SIZE * (1 + ratio - 1 / 2));
// 				}

// 				this._currentFrame_scratch -= 1 * 1 / ratio;
// 				if (this._currentFrame_scratch < 0) {
// 					this._currentFrame_scratch = this._length;
// 					cs.current_grain_start_scratch = this._length;
// 					cs.current_x_scratch = this._length;
// 					cs.current_grain_start2_scratch = this._length - GRAIN_SIZE;
// 					cs.current_x_scratch = GRAIN_SIZE + Math.round(GRAIN_SIZE * ratio);
// 				}
// 			}
// 		}
// 	}
// }


// MyTrack.prototype.follow = function(){
// 	let cs = this._calcState;

// 	cs.current_x_scratch = cs.current_x;
// 	cs.current_grain_start_scratch = cs.current_grain_start;
// 	cs.current_x2_scratch = cs.current_x2;
// 	cs.current_grain_start2_scratch = cs.current_grain_start2;

// 	this._currentFrame_scratch = this._currentFrame;
// }

// MyTrack.prototype.getAt = function(offset){

// 	let ratio = this._ratio;
// 	let cs = this._calcState;

// 	let ret = new Array();
// 	let retL = 0;
// 	let retR = 0;

// 	let current_x = cs.current_x_scratch;
// 	let current_grain_start = cs.current_grain_start_scratch;
// 	let current_x2 = cs.current_x2_scratch;
// 	let current_grain_start2 = cs.current_grain_start2_scratch;
// 	// let current_scratch = mydata.trackCurrentFrame_scratch;
// 	let current_scratch = this._currentFrame_scratch;


// 	if (ratio >= 1) {
// 		const fadeStartRate = -1 / 2 * ratio + 1;

// 		if (offset >= 0) {

// 			for (let c = 0; c < offset; c++) {

// 				if (current_x > GRAIN_SIZE * (1 + (ratio - 1) / 2)) {
// 					current_grain_start += GRAIN_SIZE;
// 					current_x = Math.round((GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1))
// 				}
// 				if (current_x2 > GRAIN_SIZE * (1 + (ratio - 1) / 2)) {
// 					current_grain_start2 += GRAIN_SIZE;
// 					current_x2 = Math.round((GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1));
// 				}

// 				current_x++;
// 				current_x2++;

// 				current_scratch += 1 * 1 / ratio;
// 				if (current_scratch > this._length) {
// 					current_scratch = 0;
// 					current_grain_start = 0;
// 					current_x = 0;
// 					current_grain_start2 = GRAIN_SIZE / 2;
// 					current_x2 = -1.0 * Math.round(GRAIN_SIZE / 2 * ratio);
// 				}
// 			}
// 		} else {	//reverse

// 			for (let c = 0; c < -offset; c++) {
// 				current_x--;
// 				current_x2--;
// 				if (current_x < (GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1)) {
// 					current_grain_start -= GRAIN_SIZE;
// 					current_x = Math.round(GRAIN_SIZE * (1 + (ratio - 1) / 2));
// 				}
// 				if (current_x2 < (GRAIN_SIZE * (1 + (ratio - 1) / 2) - GRAIN_SIZE) * (-1)) {
// 					current_grain_start2 -= GRAIN_SIZE;
// 					current_x2 = Math.round(GRAIN_SIZE * (1 + (ratio - 1) / 2));
// 				}
// 				current_scratch -= 1 * 1 / ratio;
// 				if (current_scratch < 0) {

// 					current_scratch = this._length;
// 					current_grain_start = this._length;
// 					current_x = this._length;
// 					current_grain_start2 = this._length - GRAIN_SIZE / 2;
// 					current_x2 = GRAIN_SIZE + Math.round(GRAIN_SIZE * ratio / 2);
// 				}
// 			}

// 		}
// 		{
// 			let x = current_grain_start + current_x;

// 			let valL = this._bufferLeft[x];
// 			let valR = this._bufferRight[x];
// 			if (current_x2 < 0) {
// 				//no windowing for some beggining frames
// 			} else {
// 				valL = sinFadeWindow(fadeStartRate, current_x / GRAIN_SIZE, valL);
// 				valR = sinFadeWindow(fadeStartRate, current_x / GRAIN_SIZE, valR);
// 			}
// 			retL = valL;
// 			retR = valR;
// 		}

// 		{
// 			let x2 = current_grain_start2 + current_x2;
// 			let valL2 = this._bufferLeft[x2];
// 			let valR2 = this._bufferRight[x2];

// 			valL2 = sinFadeWindow(fadeStartRate, current_x2 / GRAIN_SIZE, valL2);
// 			valR2 = sinFadeWindow(fadeStartRate, current_x2 / GRAIN_SIZE, valR2);
// 			retL += valL2;
// 			retR += valR2;
// 		}

// 	} else {
// 		const fadeStartRate = 1 - ratio;

// 		if (offset >= 0) {
// 			for (let c = 0; c < offset; c++) {

// 				if (current_x > GRAIN_SIZE * (1 + ratio - 1 / 2)) {
// 					current_grain_start += GRAIN_SIZE * 2;
// 					current_x = Math.round(GRAIN_SIZE * (ratio - 1 / 2) * (-1));
// 				}
// 				if (current_x2 > GRAIN_SIZE * (1 + ratio - 1 / 2)) {
// 					current_grain_start2 += GRAIN_SIZE * 2;
// 					current_x2 = Math.round(GRAIN_SIZE * (ratio - 1 / 2) * (-1));
// 				}

// 				current_x++;
// 				current_x2++;

// 				current_scratch += 1 * 1 / ratio;
// 				if (current_scratch > this._length) {
// 					current_scratch = 0;
// 					current_grain_start = 0;
// 					current_x = 0;
// 					current_grain_start2 = GRAIN_SIZE;
// 					current_x2 = Math.round(GRAIN_SIZE * (ratio) * (-1));
// 				}
// 			}
// 		} else {	//reverse

// 			for (let c = 0; c < -offset; c++) {

// 				if (current_x < GRAIN_SIZE * (ratio - 1 / 2) * (-1)) {
// 					current_grain_start -= GRAIN_SIZE * 2;
// 					current_x = Math.round(GRAIN_SIZE * (1 + ratio - 1 / 2));
// 				}
// 				if (current_x2 < GRAIN_SIZE * (ratio - 1 / 2) * (-1)) {
// 					current_grain_start2 -= GRAIN_SIZE * 2;
// 					current_x2 = Math.round(GRAIN_SIZE * (1 + ratio - 1 / 2));
// 				}

// 				current_x--;
// 				current_x2--;

// 				current_scratch -= 1 * 1 / ratio;
// 				if (current_scratch < 0) {
// 					current_scratch = this._length;
// 					current_grain_start = this._length;
// 					current_x = this._length;
// 					current_grain_start2 = this._length - GRAIN_SIZE;
// 					current_x2 = GRAIN_SIZE + Math.round(GRAIN_SIZE * ratio);
// 				}
// 			}

// 		}
// 		{
// 			let x = current_grain_start + current_x;

// 			let valL = this._bufferLeft[x];
// 			let valR = this._bufferRight[x];
// 			if (current_x2 < 0) {
// 				//no windowing for some beggining frames
// 			} else {
// 				valL = sinFadeWindow(fadeStartRate, current_x / GRAIN_SIZE, valL);
// 				valR = sinFadeWindow(fadeStartRate, current_x / GRAIN_SIZE, valR);
// 			}
// 			retL = valL;
// 			retR = valR;
// 		}

// 		{
// 			let x2 = current_grain_start2 + current_x2;

// 			let valL2 = this._bufferLeft[x2];
// 			let valR2 = this._bufferRight[x2];

// 			valL2 = sinFadeWindow(fadeStartRate, current_x2 / GRAIN_SIZE, valL2);
// 			valR2 = sinFadeWindow(fadeStartRate, current_x2 / GRAIN_SIZE, valR2);
// 			retL += valL2;
// 			retR += valR2;
// 		}
// 	}

// 	//pan and volume
// 	let vol = this._volume;
// 	let pan = this._pan;
// 	let volLeft = 0;
// 	let volRight = 0;
// 	if (pan < 0) {
// 		volLeft = 1.0;
// 		volRight = pan + 1;
// 	} else {
// 		volLeft = -1 * pan + 1;
// 		volRight = 1.0;
// 	}

// 	ret[0] = retL * vol * volLeft;
// 	ret[1] = retR * vol * volRight;
// 	return ret;
// }

// function stretch_continue3(index, inBufL, inBufR, len) {

// 	let grain_size = GRAIN_SIZE;
// 	let ratio = mydata.trackRatio[index];

// 	if (ratio >= 1) {
// 		for (let iX = 0; iX < len; iX++) {

// 			//wait for time to come.
// 			if (mydata.trackWaitCount[index] > 0) {
// 				mydata.trackWaitCount[index]--;
// 				continue;
// 			}

// 			const fadeStartRate = -1 / 2 * ratio + 1;

// 			if (calcState.current_x[index] > grain_size * (1 + (ratio - 1) / 2)) {
// 				calcState.current_grain_start[index] += grain_size;
// 				calcState.current_x[index] = Math.round((grain_size * (1 + (ratio - 1) / 2) - grain_size) * (-1))
// 			}
// 			if (calcState.current_x2[index] > grain_size * (1 + (ratio - 1) / 2)) {
// 				calcState.current_grain_start2[index] += grain_size;
// 				calcState.current_x2[index] = Math.round((grain_size * (1 + (ratio - 1) / 2) - grain_size) * (-1));
// 			}


// 			{
// 				let x = calcState.current_grain_start[index] + calcState.current_x[index];

// 				let valL = mydata.trackBufferLeft[index][x];
// 				let valR = mydata.trackBufferRight[index][x];
// 				if (calcState.current_x2[index] < 0) {
// 					//no windowing for some beggining frames
// 				} else {
// 					valL = sinFadeWindow(fadeStartRate, calcState.current_x[index] / grain_size, valL);
// 					valR = sinFadeWindow(fadeStartRate, calcState.current_x[index] / grain_size, valR);
// 				}
// 				calcState.stretchedLX[index][iX] = valL;
// 				calcState.stretchedRX[index][iX] = valR;
// 			}

// 			{
// 				let x2 = calcState.current_grain_start2[index] + calcState.current_x2[index];
// 				let valL2 = mydata.trackBufferLeft[index][x2];
// 				let valR2 = mydata.trackBufferRight[index][x2];

// 				valL2 = sinFadeWindow(fadeStartRate, calcState.current_x2[index] / grain_size, valL2);
// 				valR2 = sinFadeWindow(fadeStartRate, calcState.current_x2[index] / grain_size, valR2);
// 				calcState.stretchedLX[index][iX] += valL2;
// 				calcState.stretchedRX[index][iX] += valR2;
// 			}
// 			calcState.current_x[index]++;
// 			calcState.current_x2[index]++;

// 			let vol = mydata.trackVolume[index];
// 			let pan = mydata.trackPan[index];
// 			let volLeft = 0;
// 			let volRight = 0;
// 			if (pan < 0) {
// 				volLeft = 1.0;
// 				volRight = pan + 1;
// 			} else {
// 				volLeft = -1 * pan + 1;
// 				volRight = 1.0;
// 			}

// 			inBufL[iX] += calcState.stretchedLX[index][iX]
// 				* vol * volLeft;
// 			inBufR[iX] += calcState.stretchedRX[index][iX]
// 				* vol * volRight;


// 			mydata.trackCurrentFrame[index] += 1 * 1 / ratio;
// 			if (mydata.trackCurrentFrame[index] > mydata.trackLength[index]) {
// 				mydata.trackCurrentFrame[index] = 0;
// 				calcState.current_grain_start[index] = 0;
// 				calcState.current_x[index] = 0;
// 				calcState.current_grain_start2[index] = mydata.grain_size / 2;
// 				calcState.current_x2[index] = -1.0 * Math.round(mydata.grain_size / 2 * mydata.trackRatio[index]);
// 			}

// 		}
// 	} else {
// 		for (let iX = 0; iX < len; iX++) {

// 			//wait for time to come.
// 			if (mydata.trackWaitCount[index] > 0) {
// 				mydata.trackWaitCount[index]--;
// 				continue;
// 			}

// 			const fadeStartRate = 1 - ratio;
// 			// const fadeStartRate = 0;
// 			if (calcState.current_x[index] > grain_size * (1 + ratio - 1 / 2)) {
// 				calcState.current_grain_start[index] += grain_size * 2;
// 				calcState.current_x[index] = Math.round(grain_size * (ratio - 1 / 2) * (-1));
// 			}
// 			if (calcState.current_x2[index] > grain_size * (1 + ratio - 1 / 2)) {
// 				calcState.current_grain_start2[index] += grain_size * 2;
// 				calcState.current_x2[index] = Math.round(grain_size * (ratio - 1 / 2) * (-1));
// 			}
// 			{
// 				let x = calcState.current_grain_start[index] + calcState.current_x[index];
// 				let valL = mydata.trackBufferLeft[index][x];
// 				let valR = mydata.trackBufferRight[index][x];
// 				if (calcState.current_x2[index] < 0) {
// 					//no windowing for some beggining frames
// 				} else {
// 					valL = sinFadeWindow(fadeStartRate, calcState.current_x[index] / grain_size, valL);
// 					valR = sinFadeWindow(fadeStartRate, calcState.current_x[index] / grain_size, valR);
// 				}
// 				calcState.stretchedLX[index][iX] = valL;
// 				calcState.stretchedRX[index][iX] = valR;
// 			}
// 			{
// 				let x2 = calcState.current_grain_start2[index] + calcState.current_x2[index];
// 				let valL2 = mydata.trackBufferLeft[index][x2];
// 				let valR2 = mydata.trackBufferRight[index][x2];

// 				valL2 = sinFadeWindow(fadeStartRate, calcState.current_x2[index] / grain_size, valL2);
// 				valR2 = sinFadeWindow(fadeStartRate, calcState.current_x2[index] / grain_size, valR2);
// 				calcState.stretchedLX[index][iX] += valL2;
// 				calcState.stretchedRX[index][iX] += valR2;
// 			}

// 			calcState.current_x[index]++;
// 			calcState.current_x2[index]++;

// 			let vol = mydata.trackVolume[index];
// 			let pan = mydata.trackPan[index];
// 			let volLeft = 0;
// 			let volRight = 0;
// 			if (pan < 0) {
// 				volLeft = 1.0;
// 				volRight = pan + 1;
// 			} else {
// 				volLeft = -1 * pan + 1;
// 				volRight = 1.0;
// 			}

// 			inBufL[iX] += calcState.stretchedLX[index][iX]
// 				* vol * volLeft;
// 			inBufR[iX] += calcState.stretchedRX[index][iX]
// 				* vol * volRight;

// 			mydata.trackCurrentFrame[index] += 1 * 1 / ratio;
// 			if (mydata.trackCurrentFrame[index] > mydata.trackLength[index]) {
// 				mydata.trackCurrentFrame[index] = 0;
// 				calcState.current_grain_start[index] = 0;
// 				calcState.current_x[index] = 0;
// 				calcState.current_grain_start2[index] = grain_size;
// 				calcState.current_x2[index] = Math.round(grain_size * (ratio) * (-1));
// 			}

// 		}
// 	}
// }


// function sinFadeWindow(fadeStartRate, x, val) {
// 	let y = 0;

// 	if (x < 0 || x > 1) { return 0; }
// 	if (x < fadeStartRate) {
// 		y = 1.0 / 2.0 * Math.sin(Math.PI / fadeStartRate * x + 3.0 / 2 * Math.PI) + 1 / 2;
// 	} else if (x < 1.0 - fadeStartRate) {
// 		y = 1.0;
// 	} else {
// 		y = 1.0 / 2.0 * Math.sin(Math.PI / fadeStartRate * x + 3.0 / 2.0 * Math.PI
// 			- 1.0 / fadeStartRate * Math.PI) + 1.0 / 2.0;
// 	}
// 	return val * y;
// }

// function crossfadeWindow(fadeStartRate, x, val) {

// 	if (x < 0 || x > 1) { return 0; }

// 	if (x < fadeStartRate) {
// 		return val * (1.0 / fadeStartRate * x);
// 	} else if (x < 1.0 - fadeStartRate) {
// 		return val * 1.0;
// 	} else {
// 		return val * ((-1.0 / fadeStartRate * x + 1 / fadeStartRate));
// 	}
// }

// function noFadeWindow(fadeStartRate, x, val) {
// 	if (x < 0 || x > 1) { return 0; }
// 	return val;
// }


// MyTrack.prototype.playStop = function(masterTrack) {
// 	let ratio = this._ratio;
// 	let cs = this._calcState;

// 	if (this._loaded) {
// 		if (!this._playing) {
// 			this._currentFrame = 0;
// 			cs.current_grain_start = 0;
// 			cs.current_x = 0;

// 			if (ratio >= 1) {
// 				cs.current_grain_start2= GRAIN_SIZE / 2;
// 				cs.current_x2= -1.0 * Math.round(GRAIN_SIZE / 2 * ratio);
// 			} else {
// 				cs.current_grain_start2= GRAIN_SIZE;
// 				cs.current_x2= Math.round(GRAIN_SIZE * (ratio) * (-1));
// 			}

// 			//quantize test [TODO:think offset]
// 			if (this._quantize) {
// 				console.log("quantized start");

// 				//get master
// 				// let masterIndex = getMasterIndex();

// 				if (this != masterTrack && null != masterTrack  && masterTrack._playing) {
// 					let rm = masterTrack._ratio;
// 					let cfm = masterTrack._currentFrame;
// 					let lenm = masterTrack._length

// 					let lag = cfm * rm - Math.floor(32 * cfm / lenm) * (lenm * rm / 32);
// 					if (lag < lenm * rm / 64) {
// 						//late comming

// 						this._currentFrame = Math.round(lag / ratio);

// 						//offset
// 						if (this._offset >= 0) {
// 							this._currentFrame += Math.round(this._offset * ratio);
// 						} else {
// 							this._currentFrame -= Math.round(-1 * this._offset * ratio);
// 							if (this._currentFrame < 0) {
// 								this._waitCount = -1 * this._currentFrame;
// 								this._currentFrame = 0;
// 							}
// 						}
// 						cs.current_grain_start = this._currentFrame;
// 						if (ratio >= 1) {
// 							cs.current_grain_start2 = this._currentFrame + GRAIN_SIZE / 2;
// 						} else {
// 							cs.current_grain_start2 = this._currentFrame + GRAIN_SIZE;
// 						}

// 					} else {
// 						//wait required
// 						this._waitCount = Math.round(lenm * rm / 32 - lag);

// 						//offset
// 						if (this._offset >= 0) {
// 							this._waitCount -= Math.round(this._offset * ratio);
// 							if (this._waitCount < 0) {
// 								this._currentFrame = -1.0 * this._waitCount;
// 								this._waitCount = 0;
// 							}
// 						} else {
// 							this._waitCount += Math.round(-1 * this._offset * ratio);
// 						}
// 						cs.current_grain_start = this._currentFrame;
// 						if (ratio >= 1) {
// 							cs.current_grain_start2 = this._currentFrame + GRAIN_SIZE / 2;
// 						} else {
// 							cs.current_grain_start2 = this._currentFrame + GRAIN_SIZE;
// 						}
// 					}
// 				}
// 			} else {

// 				//calc offset
// 				if (this._offset >= 0) {
// 					this._currentFrame = Math.round(this._offset * ratio);
// 					cs.current_grain_start = this._currentFrame;
// 					if (ratio >= 1) {
// 						cs.current_grain_start2 = this._currentFrame + GRAIN_SIZE / 2;
// 					} else {
// 						cs.current_grain_start2 = this._currentFrame + GRAIN_SIZE;
// 					}
// 				} else {
// 					this._waitCount = Math.round(-1 * this._offset * ratio);
// 				}
// 			}
// 			this.follow();
// 			this._playing = true;

// 		} else {
// 			this._playing = false;
// 		}
// 	}

	// playStateChanged();
// }

