'use strict';
function MyTrack() {
    this._bufferLeft = null;
    this._bufferRight = null;
    this._loaded = false;
    this._playing = false;
    this._ratio = 1;
    this._currentFrame = 0;
    this._length = 0;
    this._master = false;
    this._volume = 1;
    this._pan = 0;
    this._offset = 0;
    this._quantize = true;
    this._waitCount = 0;
	this._name = "";
	this.onStateChanged = null;

	const grain_size = 6000;

	this._calcState = {
		stretchedLX : new Float32Array(44100*60),
		stretchedRX : new Float32Array(44100*60),
		current_grain_start : 0,
		current_x : 0,
		current_grain_start2 : grain_size / 2,
		current_x2: -1.0 * Math.round(grain_size / 2 * this._ratio)
	}

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
		this._calcState.current_grain_start =  0;
		this._calcState.current_x = 0;
		this._calcState.current_grain_start2 = grain_size / 2;
		this._calcState.current_x2 = -1.0 * Math.round(grain_size / 2 * this._ratio);
		this._playing = true;
		triggerStateChanged();
	}

	this.pause = function(){
		if (!this._loaded) return;
		this._playing = false;
		triggerStateChanged();
	}

	function triggerStateChanged(){
		if (that.onStateChanged) that.onStateChanged(this);
	}

	this.setQuantize = function(val){
		this._quantize = val;
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
		this._name = "editor";
     
    } 


    function loadedFromFile(length, name){
		that._currentFrame =0;
		that._length = length;
		that._name = name;
		that._playing = false;
		that._loaded = true;
	}
	
    this.loadSampleFromFile = function(file,name){
		return new Promise(function(resolve, reject){
			tryLoadSampleFromFileStandard(file)
			.then(function(length){
				loadedFromFile(length, name);
				resolve();
			},function(e){
				tryLoadSampleFromFileAAC(file)
				.then(function(length){
					loadedFromFile(length, name);
					resolve();
				},function(e){
					reject(e);
				});
			});;
		});
    }

    function tryLoadSampleFromFileStandard(blob){
        return new Promise(function(resolve, reject){
            const fileReader = new FileReader();
            fileReader.onload = function(e){
                const fileContents = e.target.result;
                const audioContextForDecode = new AudioContext();
				audioContextForDecode.decodeAudioData(fileContents)
				.then(function(buf){
					that._bufferLeft = buf.getChannelData(0);
					if (buf.numberOfChannels == 1){
						that._bufferRight = buf.getChannelData(0);
					}else{
						that._bufferRight = buf.getChannelData(1);
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
	
	function tryLoadSampleFromFileAAC(blob){
		return new Promise(function(resolve, reject){
			let asset = AV.Asset.fromFile(blob);
			asset.on("error", function(e){
				reject(e);
			});

			asset.get("duration", function(duration){

				asset.decodeToBuffer(function(buffer){
					that._bufferLeft= new Float32Array(buffer.length / 2);
					that._bufferRight =  new Float32Array(buffer.length / 2);
					for (let i = 0; i < buffer.length / 2; i++) {
						that._bufferLeft[i] = buffer[i * 2];
						that._bufferRight[i] = buffer[i * 2 + 1];
					}
					resolve(buffer.length / 2);
				});

			});
		});
	}



	this.process = function(inBufL, inBufR, len){
		let calcState = this._calcState;
		let ratio = this._ratio;

		console.log("process");

		if (ratio >= 1) {
			for (let iX = 0; iX < len; iX++) {

				//wait for time to come.
				if (this._waitCount > 0) {
					this._waitCount--;
					continue;
				}

				const fadeStartRate = -1 / 2 * ratio + 1;

				if (calcState.current_x > grain_size * (1 + (ratio - 1) / 2)) {
					calcState.current_grain_start += grain_size;
					calcState.current_x = Math.round((grain_size * (1 + (ratio - 1) / 2) - grain_size) * (-1))
				}
				if (calcState.current_x2 > grain_size * (1 + (ratio - 1) / 2)) {
					calcState.current_grain_start2 += grain_size;
					calcState.current_x2 = Math.round((grain_size * (1 + (ratio - 1) / 2) - grain_size) * (-1));
				}


				{
					let x = calcState.current_grain_start + calcState.current_x;

					let valL = this._bufferLeft[x];
					let valR = this._bufferRight[x];
					if (calcState.current_x2 < 0) {
						//no windowing for some beggining frames
					} else {
						valL = sinFadeWindow(fadeStartRate, calcState.current_x / grain_size, valL);
						valR = sinFadeWindow(fadeStartRate, calcState.current_x / grain_size, valR);
					}
					calcState.stretchedLX[iX] = valL;
					calcState.stretchedRX[iX] = valR;
				}

				{
					let x2 = calcState.current_grain_start2 + calcState.current_x2;
					let valL2 = this._bufferLeft[x2];
					let valR2 = this._bufferRight[x2];

					valL2 = sinFadeWindow(fadeStartRate, calcState.current_x2 / grain_size, valL2);
					valR2 = sinFadeWindow(fadeStartRate, calcState.current_x2 / grain_size, valR2);
					calcState.stretchedLX[iX] += valL2;
					calcState.stretchedRX[iX] += valR2;
				}
				calcState.current_x++;
				calcState.current_x2++;

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

				inBufL[iX] += calcState.stretchedLX[iX]
					* vol * volLeft;
				inBufR[iX] += calcState.stretchedRX[iX]
					* vol * volRight;


				this._currentFrame += 1 * 1 / ratio;
				if (this._currentFrame > this._length) {
					this._currentFrame = 0;
					calcState.current_grain_start = 0;
					calcState.current_x = 0;
					calcState.current_grain_start2 = grain_size / 2;
					calcState.current_x2 = -1.0 * Math.round(grain_size / 2 * ratio);
				}

			}
		} else {
			for (let iX = 0; iX < len; iX++) {

				//wait for time to come.
				if (this._waitCount > 0) {
					this._waitCount--;
					continue;
				}

				const fadeStartRate = 1 - ratio;
				// const fadeStartRate = 0;
				if (calcState.current_x > grain_size * (1 + ratio - 1 / 2)) {
					calcState.current_grain_start += grain_size * 2;
					calcState.current_x = Math.round(grain_size * (ratio - 1 / 2) * (-1));
				}
				if (calcState.current_x2 > grain_size * (1 + ratio - 1 / 2)) {
					calcState.current_grain_start2 += grain_size * 2;
					calcState.current_x2 = Math.round(grain_size * (ratio - 1 / 2) * (-1));
				}
				{
					let x = calcState.current_grain_start + calcState.current_x;
					let valL = this._bufferLeft[x];
					let valR = this._bufferRight[x];
					if (calcState.current_x2 < 0) {
						//no windowing for some beggining frames
					} else {
						valL = sinFadeWindow(fadeStartRate, calcState.current_x / grain_size, valL);
						valR = sinFadeWindow(fadeStartRate, calcState.current_x / grain_size, valR);
					}
					calcState.stretchedLX[iX] = valL;
					calcState.stretchedRX[iX] = valR;
				}
				{
					let x2 = calcState.current_grain_start2 + calcState.current_x2;
					let valL2 = this._bufferLeft[x2];
					let valR2 = this._bufferRight[x2];

					valL2 = sinFadeWindow(fadeStartRate, calcState.current_x2 / grain_size, valL2);
					valR2 = sinFadeWindow(fadeStartRate, calcState.current_x2 / grain_size, valR2);
					calcState.stretchedLX[iX] += valL2;
					calcState.stretchedRX[iX] += valR2;
				}

				calcState.current_x++;
				calcState.current_x2++;

				let vol = this._volume;
				let pan = this._pan;;
				let volLeft = 0;
				let volRight = 0;
				if (pan < 0) {
					volLeft = 1.0;
					volRight = pan + 1;
				} else {
					volLeft = -1 * pan + 1;
					volRight = 1.0;
				}

				inBufL[iX] += calcState.stretchedLX[iX]
					* vol * volLeft;
				inBufR[iX] += calcState.stretchedRX[iX]
					* vol * volRight;

				this._currentFrame += 1 * 1 / ratio;
				if (this._currentFrame > this.length) {
					this._currentFrame = 0;
					calcState.current_grain_start = 0;
					calcState.current_x = 0;
					calcState.current_grain_start2 = grain_size;
					calcState.current_x2 = Math.round(grain_size * (ratio) * (-1));
				}

			}
		}	
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





