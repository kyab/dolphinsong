'use strict';

var g_mousedown = false;
var g_startPos = {};        //creating start position
var g_currentPos = {};      //creating current position
var g_objects = [];         //our model
var g_mode = "none";

var g_moveStartPos = {};    //moving start position
var g_movingObject = null;

window.addEventListener("load", function () {
    let c = document.querySelector("#canvas");
    c.addEventListener("mousedown", onCanvasMousedown, false);
    c.addEventListener("mousemove", onCanvasMousemove, false);
    c.addEventListener("mouseup", onCanvasMouseup, false);
    c.addEventListener("wheel", onCanvasScroll, false);

    let info = document.querySelector("#info");
    info.addEventListener("dragenter", function(e){
        console.log("dragenter");
        console.log(e);
    });
    info.addEventListener("dragover", function(e){
        console.log("dragover");
        console.log(e);
        e.preventDefault();
        e.dataTransfer.dropEffec = "copy";
    });
    info.addEventListener("dragleave", function (e) {
        console.log("dragleave");
        console.log(e);
    });
    info.addEventListener("drop", function(e){
        e.preventDefault();
        console.log("drop");
        console.log(e);
    })


    onResize();
    window.addEventListener("resize", function(e){
        onResize();
    });

    redraw();

});

function redraw(){
    let canvas  = document.querySelector("#canvas");
    let c = canvas.getContext("2d");

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    //draw background
    c.clearRect(0,0,w,h);
    c.beginPath();
    c.fillStyle = "black";
    c.rect(0,0,w,h);
    c.fill();

    //draw current creating object
    if (g_mode == "create"){
        c.beginPath();
        c.strokeStyle = "yellow";
        c.rect(g_startPos.x, 
                g_startPos.y, 
                g_currentPos.x - g_startPos.x,
                g_currentPos.y - g_startPos.y);
        c.stroke();
    }

    //draw existing objects includes moving.
    drawObjects(c);

}
function drawObjects(c){
    for (let i = 0; i < g_objects.length; i++) {
        drawObject(c, g_objects[i]);
    }
}
function drawObject(c, obj){

    c.beginPath();
    //select color
    if (obj == g_movingObject) {
        c.fillStyle = "blue";
    } else {
        if (obj.focus) {
            c.fillStyle = "red";
        } else {
            c.fillStyle = "gray";
        }
    }
    c.rect(obj.x, obj.y, obj.width, obj.height);
    c.fill();
}

function onResize(){
    ;
}

function onCanvasMousedown(e){

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    g_mode = "create";
    if (g_objects.length > 0) {
        let obj = g_objects[0];
        if(hittest(obj, x, y)){
            g_mode = "move";
            g_movingObject = obj;
        }
    }

    if (g_mode == "create"){
        g_startPos.x = x;
        g_startPos.y = y;
    }else if (g_mode == "move"){
        g_moveStartPos.x = x;
        g_moveStartPos.y = y;
    }

    g_mousedown = true;
    console.log("mousedown");
    redraw();
}

function onCanvasMousemove(e){
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (g_mousedown){
        console.log("mousemove");

        if(g_mode == "move"){
            let shiftX = x - g_moveStartPos.x;
            let shiftY = y - g_moveStartPos.y;
            g_moveStartPos.x = x;
            g_moveStartPos.y = y;
            g_movingObject.x += shiftX;
            g_movingObject.y += shiftY;


        }else if (g_mode == "create"){
            g_currentPos.x = x;
            g_currentPos.y = y;

        }
        redraw();

    }else{
        console.log("hover");

        //hit test
        if (g_objects.length == 0) return;
        let target = g_objects[0];
        if (hittest(target, x, y)){
            target.focus = true;
        }else{
            target.focus = false;
        }
        redraw();
    }
}

function hittest(obj , x, y){
    let ret = false;
    if (obj.x < x && x < obj.x + obj.width){
        if (obj.y < y && y < obj.y + obj.height){
            ret = true;
        }
    }

    return ret;
}

function onCanvasMouseup(e){
    if (g_mousedown){
        g_mousedown = false;
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (g_mode == "create"){
            let obj = {};
            if (g_startPos.x < x){
                obj.x = g_startPos.x;
                obj.width = x - g_startPos.x;
            }else{
                obj.x = x;
                obj.width = g_startPos.x - x;
            }
            if (g_startPos.y < y){
                obj.y = g_startPos.y;
                obj.height = y - g_startPos.y;
            }else{
                obj.y = y;
                obj.height = g_startPos.y - y;
            }
            obj.focus = false;
            g_objects.push(obj);
            redraw();
        }else if (g_mode == "move"){
            g_movingObject = null;
            redraw();

        }
        g_mode = "none";

    }
    console.log("mouseup");
}

function onCanvasScroll(e){
    console.log("scroll");
}