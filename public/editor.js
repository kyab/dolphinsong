'use strict';


class Editor{
    constructor(canvas){
        this.bufferLeft = [];
        this.bufferRight = [];
        this.elem = canvas;

        this.viewStartFrame = 0;
        this.viewEndFrame = 0;
        this.viewRate = 1.0;

        this.currentPlayFrame = 0;
        this.recording = false;
        this.playing = false;
        this.looping = true;

        let that = this;


        this.elem.addEventListener("mousedown", function (e) {
            that.onMousedown(e);
        });
        this.elem.addEventListener("mousemove", function (e) {
            that.onMousemove(e);
        })
        this.elem.addEventListener("mouseup", function (e) {
            that.onMouseup(e);
        })
        this.elem.addEventListener("wheel", function (e) {
            that.onWheel(e);
        });



        this.elem.addEventListener("dragover", function(e){
            that.onDragover(e);
        });
        this.elem.addEventListener("drop",function(e){
            that.onDrop(e);
        });



        this.redraw();
    }

    onResize(){
        let w = this.elem.clientWidth;
        let h = this.elem.clientHeight;

        this.elem.width = w;
        this.elem.height = h;
        this.redraw();

    }

    startRecord(){
        this.bufferLeft = [];
        this.bufferRight = [];
        this.currentFrame = 0;
        this.viewStartFrame = 0;
        this.viewEndFrame = 0;
        this.playStartFrame = 0;
        this.viewRate = 1.0;
        this.recording = true;

        this.selectStartFrame = 0;
        this.selectEndFrame = 0;
        this.selected = false;
        this.redraw();
        let that = this;
        this.timer = setInterval(function () {
            that.redraw();
        }, 50);
    }

    stopRecord(){
        this.recording = false;
        clearInterval(this.timer);
        this.redraw();
    }

    startPlay(){
        if(this.selected){
            this.currentPlayFrame = this.selectStartFrame;
        }else{
            this.currentPlayFrame = this.playStartFrame;
        }
        this.playing = true;
        let that = this;
        this.timer = setInterval(function () {
            that.redraw();
        }, 50);
        this.redraw();
    }

    stopPlay(){
        this.playing = false;
        this.currentPlayFrame = this.playStartFrame;
        clearInterval(this.timer);
    }

    togglePlay() {
        if (!this.playing) {
            this.startPlay();
        } else {
            this.stopPlay();
        }
    }


    right(){
        const w = this.elem.width;
        const framePerPixel = this.currentFrame / w / this.viewRate;
        if (this.selected) {
            //move start to right
            this.selectStartFrame += Math.round(framePerPixel * 2);
            this.playStartFrame = this.selectStartFrame;
        } else {
            //move playStart to right
            this.playStartFrame += Math.round(framePerPixel * 2);
        }
        this.redraw();
    }

    left(){
        const w = this.elem.width;
        const framePerPixel = this.currentFrame / w / this.viewRate;       
        
        if (this.selected) {
            //move start to left
            this.selectStartFrame -= Math.round(framePerPixel * 2);
            this.playStartFrame = this.selectStartFrame;
        } else {
            this.playStartFrame -= Math.round(framePerPixel * 2);
        }
        this.redraw();
    }

    rightWithShift(){
        const w = this.elem.width;
        const framePerPixel = this.currentFrame / w / this.viewRate;    

        if (this.selected) {
            //move end to right
            this.selectEndFrame += Math.round(framePerPixel * 2);
        } else {
            //starting select to right
            this.selected = true;
            this.selectStartFrame = this.playStartFrame;
            this.selectEndFrame = this.selectStartFrame + Math.round(framePerPixel * 2);
        }
        this.redraw();       
    }

    leftWithShift(){
        const w = this.elem.width;
        const framePerPixel = this.currentFrame / w / this.viewRate;        
        
        if (this.selected) {
            //move end to left
            this.selectEndFrame -= Math.round(framePerPixel * 2);
        } else {
            //starting select to left
            this.selected = true;
            this.selectEndFrame = this.playStartFrame;
            this.selectStartFrame = this.selectEndFrame - Math.round(framePerPixel * 2);
        }
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
        e.preventDefault();

        if (Math.abs(e.wheelDeltaY) > Math.abs(e.wheelDeltaX)){

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

        let that = this;
        MyUtility.loadFromBlob(file)
        .then(function(b){
            that.bufferLeft = b.left;
            that.bufferRight = b.right;
            that.currentFrame = b.left.length;
            that.currentPlayFrame = 0;
            that.playStartFrame = 0;
            that.selected = false;
            that.viewStartFrame = 0;
            that.viewEndFrame  = that.currentFrame;
            that.viewRate = 1.0;
            that.redraw();
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



    processAudio(inLeft, inRight, outLeft, outRight, length){

        if(this.recording){
            for(let i = 0; i < length; i++){
                this.bufferLeft[this.currentFrame] = inLeft[i];
                this.bufferRight[this.currentFrame] = inRight[i];
                this.currentFrame++;
                this.viewEndFrame++;
                this.viewRate = 1.0;
            }
        }

        if(this.playing){
            for(let i = 0; i < length; i++){
                outLeft[i] += this.bufferLeft[this.currentPlayFrame];
                outRight[i] += this.bufferRight[this.currentPlayFrame];
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
        }
        // this.redraw();    
    }

}