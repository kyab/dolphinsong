'user strict';


var g_mode = "none";
var g_droppingObject = {};
var g_objects =[];

const TRACK_NUM = 5;

window.addEventListener("load", function(){
    let can = document.querySelector("#canvas");
    can.addEventListener("dragenter", onDragEnter, false);
    can.addEventListener("dragover", onDragOver, false);
    can.addEventListener("dragleave", onDragLeave, false);
    can.addEventListener("drop", onDrop, false);
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

    for (let i = 0; i < g_objects.length; i++){
        drawObject(c, g_objects[i]);
    }

    if (g_mode == "dropping") {
        c.beginPath();
        c.fillStyle = "yellow";
        c.rect(g_droppingObject.x, g_droppingObject.y,
            g_droppingObject.width, g_droppingObject.height);
        c.fill();
    }

}

function drawObject(c, obj){
    c.beginPath();
    c.fillStyle = "orange";
    c.rect(obj.x, obj.y,
        obj.width, obj.height);
    c.fill();
    c.fillStyle = "gray";
    c.font = "12px serif";
    c.fillText(obj.text, obj.x + 5, obj.y + 12 + 5);

    c.strokeStyle = "blue";
    c.rect(obj.x, obj.y,
        obj.width, obj.height);
    c.stroke();
}

function calcDroppingObj(e){
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let obj = {};
    obj.x = x - 30;
    if (obj.x < 0) {
        obj.x = 0;
    }

    //calc track
    let can = document.querySelector("#canvas");
    let hPerTrack = can.height / TRACK_NUM;
    let trackNo = Math.floor(y / hPerTrack);
    obj.y = hPerTrack * trackNo;

    obj.width = 200;
    obj.height = hPerTrack;

    return obj;

}

function onDragEnter(e){

    g_mode = "dropping";
    e.dataTransfer.dropEffect = "copy";     //somehow does not work
    g_droppingObject =  calcDroppingObj(e);

    e.preventDefault();
    redraw();

}

function onDragOver(e){
    e.dataTransfer.dropEffect = "copy";   
    g_droppingObject = calcDroppingObj(e);
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
    g_objects.push(obj);
    redraw();
    
}

