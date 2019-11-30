'use strict';


class LongWave{
    constructor(canvas){
        this.bufferLeft = [];
        this.bufferRight = [];
        this.elem = canvas;

        this.viewStartFrame = 0;
        this.viewEndFrame = 0;
        this.viewRate = 1.0;

        this.currentPlayFrame = 0;
        this.playing = false;
        this.looping = false;

        let that = this;
        this.elem.addEventListener("dragover", function(e){
            that.onDragover(e);
        });
        this.elem.addEventListener("drop",function(e){
            that.onDrop(e);
        });
        this.elem.addEventListener("mousedown", function(e){
            that.onMousedown(e);
        });
        this.elem.addEventListener("mousemove", function(e){
            that.onMousemove(e);
        })
        this.elem.addEventListener("mouseup",function(e){
            that.onMouseup(e);
        })
        this.elem.addEventListener("wheel", function(e){
            that.onWheel(e);
        });

        this.redraw();

    }

    onMousedown(e){
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const w = this.elem.width;
        const framePerPixel = (this.viewEndFrame - this.viewStartFrame) / w;

        if(!e.shiftKey){
            this.selectStartFrame = Math.round(this.viewStartFrame + framePerPixel*x);
            this.selectEndFrame = this.selectStartFrame;
            this.selectDragStartFrame = this.selectStartFrame;
            this.selected = false;
            this.playStartFrame = this.selectDragStartFrame;

            this.dragging = true;
            this.redraw();
        } else {
            const pointedFrame = Math.round(this.viewStartFrame + framePerPixel * x);
            if (this.selected) {
                if (pointedFrame < this.selectStartFrame) {
                    this.shiftDraggingForLeft = true;
                    this.selectStartFrame = pointedFrame;
                    // this.playStartFrame = pointedFrame;
                } else if (this.selectEndFrame < pointedFrame) {
                    this.shiftDraggingForLeft = false;
                    this.selectEndFrame = pointedFrame;
                } else {
                    //between start and end. move nearest
                    if ((pointedFrame - this.selectStartFrame) < (this.selectEndFrame - pointedFrame)) {
                        this.shiftDraggingForLeft = true;
                        this.selectStartFrame = pointedFrame;
                        // this.playStartFrame = pointedFrame;
                    } else {
                        this.shiftDraggingForLeft = false;
                        this.selectEndFrame = pointedFrame;
                        // this.shiftDragStartFromLeft = false;
                    }
                }
            } else {
                if (this.playStartFrame < pointedFrame) {
                    this.selectStartFrame = this.playStartFrame;
                    this.selectEndFrame = pointedFrame;
                    this.shiftDraggingForLeft = false;
                } else {
                    this.selectStartFrame = pointedFrame;
                    this.selectEndFrame = this.playStartFrame;
                    this.playStartFrame = this.selectStartFrame;
                    this.shiftDraggingForLeft = true;
                }
                this.selected = true;
            }
            this.shiftDragging = true;
            this.redraw();
        }
    }

    onMousemove(e){
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const w = this.elem.width;
        const framePerPixel = (this.viewEndFrame - this.viewStartFrame) / w;
        const pointedFrame = Math.round(this.viewStartFrame + framePerPixel*x);
        
        if (!e.shiftKey){
            if(!this.dragging) return;
            if (pointedFrame < this.selectDragStartFrame) {
                this.selectStartFrame = pointedFrame;
                this.selectEndFrame = this.selectDragStartFrame;
                this.playStartFrame = pointedFrame;
            } else {
                this.selectStartFrame = this.selectDragStartFrame;
                this.selectEndFrame = pointedFrame;
                this.playStartFrame = this.selectStartFrame;
            }

            if (this.selectEndFrame - this.selectStartFrame > 1) {
                this.selected = true;
            } else {
                this.selected = false;
                this.playStartFrame = this.selectStartFrame;
            }
            this.redraw();            
        }else{
            if(!this.shiftDragging) return;
            if (this.selected){
                if (this.shiftDraggingForLeft){
                    this.selectStartFrame = pointedFrame;
                }else{
                    this.selectEndFrame = pointedFrame;
                }
            }
        }
        this.redraw();
    }

    onMouseup(e){
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const w = this.elem.width;
        const framePerPixel = (this.viewEndFrame - this.viewStartFrame) / w;
        const pointedFrame = Math.round(this.viewStartFrame + framePerPixel * x);

        if (!e.shiftKey) {
            if (!this.dragging) return;
            this.dragging = false;
            if (pointedFrame < this.selectDragStartFrame) {
                this.selectStartFrame = pointedFrame;
                this.selectEndFrame = this.selectDragStartFrame;
                this.playStartFrame = pointedFrame;
            } else {
                this.selectStartFrame = this.selectDragStartFrame;
                this.selectEndFrame = pointedFrame;
                this.playStartFrame = this.selectStartFrame;
            }

            if (this.selectEndFrame - this.selectStartFrame > 1) {
                this.selected = true;
            } else {
                this.selected = false;
                this.playStartFrame = this.selectStartFrame;
            }
            this.redraw();
        }else{
            if (this.selected){
                if(this.shiftDraggingForLeft){
                    this.selectStartFrame = pointedFrame;
                }else{
                    this.selectEndFrame = pointedFrame;
                }
            }
            this.shiftDragging = false;
            this.redraw();
        }
    }

    onWheel(e) {

        if (Math.abs(e.wheelDeltaY) > Math.abs(e.wheelDeltaX)){
            e.preventDefault();

            const deltaY = e.wheelDeltaY;
            this.viewRate += 0.0025 * deltaY;

            const w = this.elem.clientWidth;

            const viewGravcenterRatio = (e.clientX - e.currentTarget.getBoundingClientRect().left)/w;
            let viewGravcenterFrame = Math.round(this.viewStartFrame
                + viewGravcenterRatio * (this.viewEndFrame - this.viewStartFrame));

            if (this.viewRate < 1.0) this.viewRate = 1.0;
            if (this.viewRate == 1.0){
                this.viewStartFrame = 0;
                this.viewEndFrame = this.bufferLeft.length;
            }else{
                const framePerPixel = this.bufferLeft.length/w/this.viewRate;
                this.viewStartFrame = Math.round(viewGravcenterFrame - framePerPixel * viewGravcenterRatio * w);
                this.viewEndFrame = Math.round(viewGravcenterFrame + framePerPixel * (1 - viewGravcenterRatio) * w);
            }

            this.redraw();
        }else{
            e.preventDefault();

            const deltaX = -e.wheelDeltaX;
            const prevStart = this.viewStartFrame;
            const prevEnd = this.viewEndFrame;

            this.viewStartFrame += Math.round(deltaX/this.viewRate * 120);
            this.viewEndFrame += Math.round(deltaX/this.viewRate * 120);

            if (this.viewStartFrame < 0){
                this.viewStartFrame = 0;
                this.viewEndFrame = this.viewStartFrame + (prevEnd - prevStart);
            }
            if (this.viewEndFrame > this.bufferLeft.length){
                this.viewEndFrame = this.bufferLeft.length;
                this.viewStartFrame = this.viewEndFrame - (prevEnd - prevStart);
            }

            this.redraw();
        }
    }

    onDragover(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
    }

    onDrop(e){
        e.preventDefault();

        const file = e.dataTransfer.files[0];
        this.loadSampleFromFile(file);
    }
    
    loadSampleFromFile(blob) {
        this.bufferLeft = [];
        this.bufferRight = [];
        this.playStartFrame = 0;
        let that = this;
        this.tryLongLoadSampleFromFileStandard(blob)
        .then(function (length) {
            console.log("success Standard");
            that.onLoaded(length);
        }, function (e) {
            console.log("decode error(Standard) : " + e);
            that.tryLongLoadSampleFromFileAAC(blob)
                .then(function (length) {
                    console.log("success AAC");
                    that.onLoaded(length);
                }, function (e) {
                    console.log("decode error(AAC) : " + e);
                });
        });
    }


    onLoaded(len) {
        this.viewStartFrame = 0;
        this.viewEndFrame = len;
        this.viewRate = 1.0;
        this.redraw();
    }

    tryLongLoadSampleFromFileStandard(blob) {
        let that = this;
        return new Promise(function (resolve, reject) {
            const fileReader = new FileReader();
            fileReader.onload = function (e) {
                const fileContents = e.target.result;
                let audioContextForDecode = new AudioContext();
                audioContextForDecode.decodeAudioData(fileContents)
                    .then(function (buf) {
                        for (let i = 0; i < buf.length; i++) {
                            that.bufferLeft[i] = buf.getChannelData(0)[i];
                            if (buf.numberOfChannels == 1) {
                                that.bufferRight[i] = buf.getChannelData(0)[i];
                            } else {
                                that.bufferRight[i] = buf.getChannelData(1)[i];
                            }
                        }
                        audioContextForDecode.close();
                        resolve(buf.length);

                    }, function (e) {
                        reject(e);
                    });

            }
            fileReader.readAsArrayBuffer(blob);
        });
    }

    tryLongLoadSampleFromFileAAC(blob) {

        let that = this;
    //use aac.js/aurora.js to decode caf(AAC compressed Apple Loops)
        return new Promise(function (resolve, reject) {
            let asset = AV.Asset.fromFile(blob);
            asset.on("error", function (e) {
                reject(e);
            });
            asset.get("duration", function (duration) {
                console.log("duration = " + duration);

                const fileReader = new FileReader();
                fileReader.onload = function (e) {

                    asset.decodeToBuffer(function (buffer) {

                        for (let i = 0; i < buffer.length / 2; i++) {
                            that.bufferLeft[i] = buffer[i * 2];
                            that.bufferRight[i] = buffer[i * 2 + 1];
                        }
                        console.log("samples = " + buffer.length / 2);
                        resolve(buffer.length / 2);
                    });
                }

                fileReader.readAsArrayBuffer(blob);	//somehow this required
            });
        });
    }


    redraw(){
        const w = this.elem.clientWidth;
        const h = this.elem.clientHeight;

        let c = this.elem.getContext('2d');

        c.clearRect(0,0,w,h);

        c.beginPath();
        c.fillStyle = "black";
        c.rect(0,0,w,h);
        c.fill();

        //draw Wave
        const framePerPixel = (this.viewEndFrame - this.viewStartFrame)/w;

        for (let i = 0; i < w; i++){
            let from = Math.floor(i * framePerPixel);
            let to = Math.floor(from + framePerPixel);
            if (to > this.viewEndFrame) to = this.viewEndFrame;
            
            let max = 0;
            for (let j = from; j < to; j += Math.ceil((framePerPixel) / 100)) {
                let val = Math.abs(this.bufferLeft[j + this.viewStartFrame]);
                val += Math.abs(this.bufferRight[j + this.viewStartFrame]);
                val /= 2;
                if (val > max) max = val;
            }
            if (max <= 0) max = 0.002;

            c.beginPath();
            c.strokeStyle = "lightgreen";
            c.moveTo(i, h/2 - max*h/2);
            c.lineTo(i, h/2 + max*h/2);
            c.stroke();
        }

        //selection
        if(this.selected){
            c.beginPath();
            c.fillStyle = "rgb(123,123,123,0.6)";

            let from = (this.selectStartFrame - this.viewStartFrame) / framePerPixel;
            let to = (this.selectEndFrame - this.viewStartFrame) / framePerPixel;
            c.rect(from, 0, to-from, h);
            c.fill();
        }

        //draw Scrollbar
        {
            let from = w * this.viewStartFrame / this.bufferLeft.length;
            let to = w * this.viewEndFrame / this.bufferLeft.length;

            c.beginPath();
            c.fillStyle = "gray";
            c.rect(from , 180, to-from , 20);
            c.fill();
        }


        //draw play start cursor
        {
            let x = (this.playStartFrame - this.viewStartFrame) / framePerPixel;

            c.beginPath();
            c.strokeStyle = "blue";
            c.moveTo(x, 0);
            c.lineTo(x, 180);
            c.stroke();           
        }
        
        //draw current position cursor
        {
            let x = (this.currentPlayFrame - this.viewStartFrame) / framePerPixel;

            c.beginPath();
            c.strokeStyle="yellow";
            c.moveTo( x, 0);
            c.lineTo( x, 180);
            c.stroke();
        }
    }

    togglePlay(){
        if (!this.playing){
            this.playing = true;
            if(this.looping){
                this.currentPlayFrame = this.playStartFrame;
            }
        }else{
            this.playing = false;
        }
    }

    toggleLoop(){
        if (!this.looping){
            this.looping = true;
        }else{
            this.looping = false;
        }
    }

    processAudio(left, right, length){
        if (!this.playing) return;
        
        for(let i = 0; i < length; i++){
            left[i] += this.bufferLeft[this.currentPlayFrame];
            right[i] += this.bufferRight[this.currentPlayFrame];
            this.currentPlayFrame++;
            if(this.looping){
                if(this.selected){
                    if (this.currentPlayFrame >= this.selectEndFrame) {
                        this.currentPlayFrame = this.selectStartFrame;
                    }         
                }else{
                    if (this.currentPlayFrame >= this.bufferLeft.length) {
                        this.currentPlayFrame = this.playStartFrame;
                    }                     
                }
            }else{

                if (this.currentPlayFrame >= this.bufferLeft.length) {
                    this.currentPlayFrame = 0;
                }     
            }
        }

        this.redraw();
    
    }


}