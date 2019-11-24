'user strict';

const TRACK_NUM = 5;

var g_mode = "none";
var g_droppingObject = {};
var g_droppingTrackNo = -1;

var g_movingObject = null;
var g_movingXOffset = 0;
var g_movingYOffset = 0;
var g_movingTrackNo = 0;

var g_tracks = new Array(TRACK_NUM);
for(let i = 0; i < TRACK_NUM ; i++){
    g_tracks[i] = {};
    g_tracks[i].objects = [];
}


window.addEventListener("load", function(){
    let can = document.querySelector("#canvas");
    can.addEventListener("dragenter", onDragEnter, false);
    can.addEventListener("dragover", onDragOver, false);
    can.addEventListener("dragleave", onDragLeave, false);
    can.addEventListener("drop", onDrop, false);

    can.addEventListener("mousedown", onMousedown, false);
    can.addEventListener("mousemove", onMousemove, false);
    can.addEventListener("mouseup", onMouseup, false);
    onResize();

    redraw();

});

function onResize(){
    let canvas = document.querySelector("#canvas");
    let w = canvas.clientWidth;
    let h = canvas.clientHeight;
    canvas.width = w;
    canvas.height = h;

    redraw();
}

function redraw(){
    let can = document.querySelector("#canvas");
    let c  = can.getContext("2d");

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    c.clearRect(0,0,w,h);
    c.beginPath();
    c.fillStyle = "black";
    c.rect(0,0,w,h);
    c.fill();

    for (let i = 0; i < g_tracks.length; i++){
        let yOffset = i * (h/TRACK_NUM);
        drawTrack(c, g_tracks[i], yOffset);
    }

    if(g_mode == "moving"){
        c.beginPath();
        c.fillStyle = "lightcyan";
        c.rect(g_movingObject.x,
                h/TRACK_NUM*g_movingTrackNo,
                g_movingObject.width,
                g_movingObject.height);
        c.fill();
        c.fillStyle = "gray";
        c.font = "12px serif";
        c.fillText(g_movingObject.text, g_movingObject.x + 5, h/TRACK_NUM*g_movingTrackNo + 12 + 5);
    }

}


function drawTrack(c, track, yOffset){
    track.objects.forEach(function(obj){
        drawObject(c, obj, yOffset);
    });

    if(g_mode == "dropping"){
        if(track == g_tracks[g_droppingTrackNo]){
            drawDroppingObject(c, yOffset)
        }
    }
}



function drawObject(c, obj, yOffset){
    if (obj.isMoving) {
        c.globalAlpha = 0.5;
    }

    c.beginPath();

    c.fillStyle = "orange";
    c.rect(obj.x, yOffset,
        obj.width, obj.height);
    c.fill();
    c.fillStyle = "gray";
    c.font = "12px serif";
    c.fillText(obj.text, obj.x + 5, yOffset + 12 + 5);

    c.strokeStyle = "blue";
    c.rect(obj.x, yOffset,
        obj.width, obj.height);
    c.stroke();

    c.globalAlpha = 1.0;
}

function drawDroppingObject(c, yOffset){
    c.beginPath();
    c.fillStyle = "yellow";
    c.rect(g_droppingObject.x, yOffset,
        g_droppingObject.width, g_droppingObject.height);
    c.fill();
}

function calcDroppingObj(e){
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let obj = {};
    obj.x = x - 50;
    if (obj.x < 0) {
        obj.x = 0;
    }

    //calc track
    let can = document.querySelector("#canvas");
    let hPerTrack = can.height / TRACK_NUM;
    let trackNo = Math.floor(y / hPerTrack);
    // obj.y = hPerTrack * trackNo;
    // obj.y = 0;

    obj.width = 200;
    obj.height = hPerTrack;

    obj.trackNo = trackNo;

    return obj;

}

function onDragEnter(e){

    g_mode = "dropping";
    e.dataTransfer.dropEffect = "copy";     //somehow does not work
    g_droppingObject =  calcDroppingObj(e);

    g_droppingTrackNo = g_droppingObject.trackNo;

    e.preventDefault();
    redraw();

}

function onDragOver(e){
    e.dataTransfer.dropEffect = "copy";   
    g_droppingObject = calcDroppingObj(e);

    g_droppingTrackNo = g_droppingObject.trackNo;
    
    e.preventDefault();

    redraw();
}

function onDragLeave(e) {
    g_mode = "none";
    redraw();

}

function onDrop(e){
    e.preventDefault();

    g_mode = "none";

    let obj = calcDroppingObj(e, false);
    obj.text = e.dataTransfer.files[0].name;
    g_tracks[obj.trackNo].objects.push(obj);
    redraw();
    
}

function onMousedown(e){
    console.log("onMouseDown");

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let can = document.querySelector("#canvas");
    const h = canvas.clientHeight;
    

    g_tracks.forEach(function(track, i){
        let yOffset = i* (h/TRACK_NUM);
        track.objects.forEach(function(obj){
            if (hittest(obj, x, y, yOffset)){
                g_mode = "moving";
                obj.isMoving = true;
                g_movingTrackNo = i;
                g_movingObject = {};
                g_movingObject.x = obj.x;
                // g_movingObject.y = obj.y;
                g_movingObject.width = obj.width;
                g_movingObject.height = obj.height;
                g_movingObject.text = obj.text;

                g_movingXOffset = x - obj.x;
                g_movingYOffset = y - yOffset;
            }
        });
    });
    redraw();
}

function hittest(obj, x, y, yOffset){
    let ret = false;
    if(obj.x < x && x < obj.x + obj.width){
        if (yOffset < y && y <  yOffset + obj.height){
            ret = true;
        }
    }
    return ret;
}

function onMousemove(e){
    if(g_mode == "moving"){
        console.log("onMousemove");
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let can = document.querySelector("#canvas");
        const h = canvas.clientHeight;

        let hPerTrack = can.height / TRACK_NUM;
        let trackNo = Math.floor(y / hPerTrack);
        // g_movingObject.y = hPerTrack * trackNo;
        g_movingObject.x = x - g_movingXOffset;
        g_movingTrackNo = trackNo;
        redraw();
    }
}

function onMouseup(e){
    if (g_mode == "moving"){
        g_mode = "none";
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let can = document.querySelector("#canvas");
        const h = canvas.clientHeight;

        let hPerTrack = can.height / TRACK_NUM;
        let trackNo = Math.floor(y / hPerTrack);
        g_movingObject.x = x - g_movingXOffset;

        let movedObject = null;
        let movedTrackNo = -1;

        g_tracks.forEach(function(t,i){
            t.objects.forEach(function(obj){
                if (obj.isMoving){
                    movedObject = obj;
                    movedTrackNo = i;
                    obj.isMoving = false;
                    obj.x = g_movingObject.x;
                }
            });
        });

        //pop out
        let track = g_tracks[movedTrackNo];
        let index = track.objects.findIndex(function(obj){
            return obj == movedObject
        });
        track.objects.splice(index, 1);
        g_tracks[trackNo].objects.push(movedObject);

        redraw();
    }
    console.log("onMouseup");
}

