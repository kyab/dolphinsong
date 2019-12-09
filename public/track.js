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

	var that = this;
	
	this.isPlaying = function(){
		return this._playing;
	}

	this.stop = function(){
		this._playing = false;
	}

	this.togglePlay = function(){
		if (this._playing){
			this._playing = false;
		}else{
			this._playing = true;
		}
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


    // function loadedFromFile(length, name){
	// 	that._currentFrame =0;
	// 	that._length = length;
	// 	that._name = name;
	// 	that._playing = false;
	// 	that._loaded = true;
	// }
	
    // this.loadSampleFromFile = function(file, name, si){

	// 	return new Promise(function(resolve, reject){
	// 		tryLoadSampleFromFileStandard(file, si)
	// 		.then(function(length){
	// 			loadedFromFile(length, name);
	// 			resolve();
	// 		},function(e){
	// 			tryLoadSampleFromFileAAC(file, si)
	// 			.then(function(length){
	// 				loadedFromFile(length, name);
	// 				resolve();
	// 			},function(e){
	// 				reject(e);
	// 			});
	// 		});;
	// 	});
    // }

    // function tryLoadSampleFromFileStandard(blob, si){
    //     return new Promise(function(resolve, reject){
    //         const fileReader = new FileReader();
    //         fileReader.onload = function(e){
    //             const fileContents = e.target.result;
    //             const audioContextForDecode = new AudioContext();
	// 			audioContextForDecode.decodeAudioData(fileContents)
	// 			.then(function(buf){
	// 				that._bufferLeft[si] = buf.getChannelData(0);
	// 				if (buf.numberOfChannels == 1){
	// 					that._bufferRight[si] = buf.getChannelData(0);
	// 				}else{
	// 					that._bufferRight[si] = buf.getChannelData(1);
	// 				}
	// 				audioContextForDecode.close();
	// 				resolve(buf.length);
	// 			},function(e){
	// 				reject(e);
	// 			});				
    //         }
	// 		fileReader.readAsArrayBuffer(blob);
    //     });
	// }
	
	// function tryLoadSampleFromFileAAC(blob, si){
	// 	return new Promise(function(resolve, reject){
	// 		let asset = AV.Asset.fromFile(blob);
	// 		asset.on("error", function(e){
	// 			reject(e);
	// 		});

	// 		asset.get("duration", function(duration){
	// 			console.log("duration = " + duration);

	// 			const fileReader = new FileReader();
	// 			fileReader.onload = function (e) {

	// 				asset.decodeToBuffer(function(buffer){
	// 					that._bufferLeft[si]= new Float32Array(buffer.length / 2);
	// 					that._bufferRight[si] =  new Float32Array(buffer.length / 2);
	// 					for (let i = 0; i < buffer.length / 2; i++) {
	// 						that._bufferLeft[si][i] = buffer[i * 2];
	// 						that._bufferRight[si][i] = buffer[i * 2 + 1];
	// 					}
	// 					console.log("samples = " + buffer.length / 2);
	// 					resolve(buffer.length / 2);
	// 				});
	// 			}
	// 			fileReader.readAsArrayBuffer(blob);	//somehow this required

	// 		});
	// 	});
	// }

}
