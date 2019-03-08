'use strict';

const TRACK_NUM = 5

var mydata = {};
mydata.monitor = false;
mydata.level = true;
mydata.inputLevel = 0;
mydata.currentFrame = 0;
mydata.currentFramePlay = 0;

mydata.recording = false;
mydata.playing = false;
mydata.outAudio = null;

mydata.needsRedrawWave = false;

mydata.dragging = false;
mydata.shiftDragging = false;

mydata.viewStartFrame = 0;
mydata.viewEndFrame = 0;
mydata.viewCenterFrame = 0;
mydata.viewRate = 1.0;
mydata.selectStartFrame = 0;
mydata.selectEndFrame = 0 ;
mydata.selected = false;
mydata.selectDragStartFrame = 0;
mydata.shiftDraggingForLeft = false;

mydata.trackLoaded = new Array(TRACK_NUM);

mydata.trackBufferLeft = new Array(TRACK_NUM);
mydata.trackBufferRight = new Array(TRACK_NUM);
mydata.trackPlaying = new Array(TRACK_NUM);
mydata.trackCurrentFrame = new Array(TRACK_NUM);
mydata.trackLength = new Array(TRACK_NUM);
mydata.trackRatio = new Array(TRACK_NUM);
mydata.trackMaster = new Array(TRACK_NUM);
mydata.trackVolume = new Array(TRACK_NUM);
mydata.trackPan = new Array(TRACK_NUM);
mydata.trackOffset = new Array(TRACK_NUM);
mydata.trackQuantize = new Array(TRACK_NUM);
mydata.trackWaitCount = new Array(TRACK_NUM);
for (let i=0;i<TRACK_NUM;i++){
	mydata.trackLoaded[i] = false;
	mydata.trackPlaying[i] = false;
	mydata.trackRatio[i] = 1;
	mydata.trackCurrentFrame[i] = 0;
	mydata.trackLength[i] = 0;
	mydata.trackMaster[i] = false;
	mydata.trackVolume[i] = 1;
	mydata.trackPan[i] = 0;
	mydata.trackOffset[i] = 0;
	mydata.trackQuantize[i] = true;
	mydata.trackWaitCount[i] = 0;
}


mydata.isEditorActive = false;
mydata.isPlayerActive = false;
mydata.timer = null;

mydata.grain_size = 6000;

mydata.vTrack = new MyTrack();

mydata.tapTimes = new Array(8);
mydata.bpm = 120.0;
mydata.tapMaster = false;

var audioContext;
var audioContext2;

var audioElem;
var audioElem2;


var audioBufferLeft = new Float32Array(44100*60*10);
var audioBufferRight = new Float32Array(44100*60*10);


var calcState = {};
calcState.start = 0;
calcState.end = 3000;
calcState.i = 0;
calcState.currentFrame = 0;

calcState.stretchedLX = new Array(TRACK_NUM);
calcState.stretchedRX = new Array(TRACK_NUM);
calcState.current_grain_start = new Array(TRACK_NUM);
calcState.current_x = new Array(TRACK_NUM);
calcState.current_grain_start2 = new Array(TRACK_NUM);
calcState.current_x2 = new Array(TRACK_NUM);
for (let i = 0; i < TRACK_NUM; i++){
	calcState.stretchedLX[i] = new Float32Array(44100*60);
	calcState.stretchedRX[i] = new Float32Array(44100*60);
	calcState.current_grain_start[i] = 0;
	calcState.current_x[i] = 0;
	calcState.current_grain_start2[i] = mydata.grain_size / 2;
	calcState.current_x2[i] = -1.0 * Math.round(mydata.grain_size/2*mydata.trackRatio[i]);
}


window.addEventListener("resize", function(e){
	onResize();
});

function onResize(){
	let canvas = document.querySelector("#canvas");
	let canvas2 = document.querySelector("#canvas2");
	let rulerCanvas = document.querySelector("#rulerCanvas");
	let w = canvas.clientWidth;
	let h = canvas.clientHeight;
	canvas.width = w;
	canvas2.width = w;
	canvas.height = h;
	canvas2.height = h;

	w = rulerCanvas.clientWidth;
	h = rulerCanvas.clientHeight;
	rulerCanvas.width = w;
	rulerCanvas.height = h;



	mydata.needsRedrawWave = true;
	redrawCanvas();
}

window.addEventListener("load", function(){


	let canvas2 = document.querySelector("#canvas2");
	canvas2.addEventListener("mousedown", onCanvasMousedown, false);
	canvas2.addEventListener("mousemove", onCanvasMousemove, false);
	canvas2.addEventListener("mouseup", onCanvasMouseup, false);

	canvas2.addEventListener("wheel", onCanvasScroll, false);

	onResize();

	const loadButtons = document.querySelectorAll(".loadButton");
	loadButtons.forEach(function(b){
		b.addEventListener("click", onLoadButtonClicked, false);
		b.addEventListener("dragover", onTrackDragover, false); 
		b.addEventListener("dragleave", onTrackDragleave, false);
		b.addEventListener("drop", onTrackDrop,false);
	});

	const load2Buttons = document.querySelectorAll(".loadButton2");
	load2Buttons.forEach(function(b){
		b.addEventListener("click", onLoadButton2Clicked, false);
		b.addEventListener("dragover", onTrackDragover, false);
		b.addEventListener("dragleave", onTrackDragleave, false);
		b.addEventListener("drop", onTrackDrop, false);
	});

	const titles = document.querySelectorAll(".title");
	titles.forEach(function(t){
		t.addEventListener("dragover", onTrackDragover, false); 
		t.addEventListener("dragleave", onTrackDragleave, false);
		t.addEventListener("drop" , onTrackDrop,false);

	});

	const playButtons = document.querySelectorAll(".playButton");
	playButtons.forEach(function(b){
		b.addEventListener("click", onPlayButtonClicked, false);
		b.addEventListener("dragover", onTrackDragover, false); 
		b.addEventListener("dragleave", onTrackDragleave, false);
		b.addEventListener("drop" , onTrackDrop,false);
	});

	const speeds = document.querySelectorAll(".speed");
	speeds.forEach(function(s){
		s.addEventListener("dragover", onTrackDragover, false); 
		s.addEventListener("dragleave", onTrackDragleave, false);
		s.addEventListener("drop" , onTrackDrop,false);
	});


	const speedSliders = document.querySelectorAll(".speedSlider");
	speedSliders.forEach(function(s){
		s.addEventListener("input", onSpeedSliderChanged, false);
	});

	const speedResetButtons = document.querySelectorAll(".speedResetButton");
	speedResetButtons.forEach(function(b){
		b.addEventListener("click", onSpeedResetClicked, false);
	});		

	const syncs = document.querySelectorAll(".sync");
	syncs.forEach(function(s){
		s.addEventListener("dragover", onTrackDragover, false); 
		s.addEventListener("dragleave", onTrackDragleave, false);
		s.addEventListener("drop" , onTrackDrop,false);
	});


	const syncButtons = document.querySelectorAll(".syncButton");
	syncButtons.forEach(function(b){
		b.addEventListener("click", onSyncClick, false);
	});

	const halfSpeedButtons = document.querySelectorAll(".halfSpeedButton");
	halfSpeedButtons.forEach(function(b){
		b.addEventListener("click", onHalfSpeedClick, false);
	});

	const doubleSpeedButtons = document.querySelectorAll(".doubleSpeedButton");
	doubleSpeedButtons.forEach(function(b){
		b.addEventListener("click", onDoubleSpeedClick, false);
	});

	const masters = document.querySelectorAll(".master");
	masters.forEach(function(m){
		m.addEventListener("dragover", onTrackDragover, false); 
		m.addEventListener("dragleave", onTrackDragleave, false);
		m.addEventListener("drop" , onTrackDrop,false);
	});

	const masterChks = document.querySelectorAll(".masterChk");
	masterChks.forEach(function(c){
		c.addEventListener("change", onMasterChanged, false);
	});

	const volumes = document.querySelectorAll(".volume");
	volumes.forEach(function(v){
		v.addEventListener("dragover", onTrackDragover, false); 
		v.addEventListener("dragleave", onTrackDragleave, false);
		v.addEventListener("drop" , onTrackDrop,false);
	});


	const volumeSliders = document.querySelectorAll(".volumeSlider");
	volumeSliders.forEach(function(s){
		s.addEventListener("input", onVolumeSliderChanged, false);
	});

	const volumeResetButtons = document.querySelectorAll(".volumeResetButton");
	volumeResetButtons.forEach(function(b){
		b.addEventListener("click", onVolumeResetClicked, false);
	});

	const pans = document.querySelectorAll(".pan");
	pans.forEach(function(p){
		p.addEventListener("dragover", onTrackDragover, false); 
		p.addEventListener("dragleave", onTrackDragleave, false);
		p.addEventListener("drop" , onTrackDrop,false);
	});


	const panSliders = document.querySelectorAll(".panSlider");
	panSliders.forEach(function(s){
		s.addEventListener("input", onPanSliderChanged, false);
	});

	const panResetButtons = document.querySelectorAll(".panResetButton");
	panResetButtons.forEach(function(b){
		b.addEventListener("click", onPanResetClicked, false);
	});

	const quantizes = document.querySelectorAll(".quantize");
	quantizes.forEach(function(q){
		q.addEventListener("dragover", onTrackDragover, false); 
		q.addEventListener("dragleave", onTrackDragleave, false);
		q.addEventListener("drop" , onTrackDrop,false);
	});

	const quantizeChks = document.querySelectorAll(".quantizeChk");
	quantizeChks.forEach(function(c){
		c.addEventListener("change", onQuantizeChanged, false);
	});

	const offsets = document.querySelectorAll(".offset");
	offsets.forEach(function(o){
		o.addEventListener("dragover", onTrackDragover, false); 
		o.addEventListener("dragleave", onTrackDragleave, false);
		o.addEventListener("drop" , onTrackDrop,false);
	});

	const offsetSliders = document.querySelectorAll(".offsetSlider");
	offsetSliders.forEach(function(s){
		s.addEventListener("input", onOffsetSliderChanged, false);
	});

	const offsetResetButtons = document.querySelectorAll(".offsetResetButton");
	offsetResetButtons.forEach(function(b){
		b.addEventListener("click", onOffsetResetClicked, false);
	});


	canvas2.addEventListener("dragover", function(e){
		e.preventDefault();
		e.dataTransfer.dropEffect = "copy";
	});
	canvas2.addEventListener("drop", onEditorDrop, false);

	const soundList = document.querySelector("#soundList");
	soundList.addEventListener("dragover", onSoundListDragOver, false);
	soundList.addEventListener("dragleave", onSoundListDragleave, false);
	soundList.addEventListener("drop", onSoundListDrop, false);

	mydata.soundList = new MyListBox(soundList, "soundItem", "./soundlist");
	mydata.soundList.onClick = onSoundListClick;
	mydata.soundList.onDblClick = onSoundListDblClick;
	mydata.soundList.reload();

	const songList = document.querySelector("#songList");
	mydata.songList = new MyListBox(songList, "songItem", "./songlist");
	mydata.songList.reload();

	mydata.vTrack.onStateChanged = playStateChanged;

	const tapButton = document.querySelector("#tapButton");
	tapButton.addEventListener("click", onTapClicked, false);

	const tapMasterChk = document.querySelector("#tapMasterChk");
	tapMasterChk.addEventListener("change", onMasterChanged, false);

	$("#songLoadButton").on("click", loadSong);
	$("#songSaveButton").on("click", saveSong);


	$("#tabButtonSounds").on("click", tabSoundsClicked);
	$("#tabButtonSongs").on("click", tabSongsClicked);
	tabSoundsClicked();


	$("#soundDeleteButton").on("click", soundDeleteClicked);

	$("#selectInputDevices").on("change", inputDeviceChanged);
	$("#selectOutputDevices").on("change", outputDeviceChanged);



	initMedia();

});

function onSpeedSliderChanged(e){

	let index = getIndexFromEvent(e, ".speedSlider");
	onSpeedChanged(index);
}

function onSpeedResetClicked(e){
	let index = getIndexFromEvent(e, ".speedResetButton");
	document.querySelectorAll(".speedSlider")[index].value = 100;
	onSpeedChanged(index);
}

function onVolumeSliderChanged(e){
	let index = getIndexFromEvent(e, ".volumeSlider");
	onVolumeChanged(index);
}

function onVolumeResetClicked(e){
	let index = getIndexFromEvent(e, ".volumeResetButton");
	document.querySelectorAll(".volumeSlider")[index].value = 100;
	onVolumeChanged(index);
}

function onPanSliderChanged(e){
	let index = getIndexFromEvent(e, ".panSlider");
	onPanChanged(index);
}

function onPanResetClicked(e){
	let index = getIndexFromEvent(e, ".panResetButton");
	document.querySelectorAll(".panSlider")[index].value = 0;
	onPanChanged(index);
}

function onQuantizeChanged(e){
	let index = getIndexFromEvent(e, ".quantizeChk");
	if (document.querySelectorAll(".quantizeChk")[index].checked){
		mydata.trackQuantize[index] = true;
	}else{
		mydata.trackQuantize[index] = false;
	}
}

function onOffsetSliderChanged(e){
	let index = getIndexFromEvent(e, ".offsetSlider");
	onOffsetChanged(index);
}

function onOffsetResetClicked(e){
	let index = getIndexFromEvent(e, ".offsetResetButton");
	document.querySelectorAll(".offsetSlider")[index].value = 0;
	onOffsetChanged(index);
}


function onLoadButtonClicked(e){

	let index = getIndexFromEvent(e, ".loadButton");
	onLoadSample(index);
}

function onLoadButton2Clicked(e){
	let index = getIndexFromEvent(e, ".loadButton2");
	onLoadSampleFromList(index);
}


function onPlayButtonClicked(e){

	let index = getIndexFromEvent(e, ".playButton");
	onPlayStopTrack(index);

}

function onTrackDragover(e){
	e.preventDefault();
	e.dataTransfer.dropEffect = "link";

	const elem = e.currentTarget;

	let index = getIndexForElem(elem);
	setDragHighlight(index);

}

function onTrackDragleave(e){
	e.preventDefault();

	const elem = e.currentTarget;

	let index = getIndexForElem(elem);
	unsetDragHighlight(index);
}

function onTrackDrop(e){
	const elem = e.currentTarget;
	e.preventDefault();

	let index = getIndexForElem(elem);
	unsetDragHighlight(index);

	const file = e.dataTransfer.files[0];
	if (file){
		console.log("dropped from file");
		onLoadSampleFromFile(index, file);
	}else{
		console.log("dropped from list");
		loadSample(index, e.dataTransfer.getData("text"));
	}
}

function setDragHighlight(index){
	const loadButton = document.querySelectorAll(".loadButton")[index];
	const loadButton2 = document.querySelectorAll(".loadButton2")[index];
	const title = document.querySelectorAll(".title")[index];
	const playButton = document.querySelectorAll(".playButton")[index];
	const speed = document.querySelectorAll(".speed")[index];
	const sync = document.querySelectorAll(".sync")[index];
	const master = document.querySelectorAll(".master")[index];
	const volume = document.querySelectorAll(".volume")[index];
	const pan = document.querySelectorAll(".pan")[index];
	const quantize = document.querySelectorAll(".quantize")[index];
	const offset = document.querySelectorAll(".offset")[index];

	loadButton.classList.add("dropping");
	loadButton2.classList.add("dropping");
	title.classList.add("dropping");
	playButton.classList.add("dropping");
	speed.classList.add("dropping");
	sync.classList.add("dropping");
	master.classList.add("dropping");
	volume.classList.add("dropping");
	pan.classList.add("dropping");
	quantize.classList.add("dropping");
	offset.classList.add("dropping");
}

function unsetDragHighlight(index){
	const loadButton = document.querySelectorAll(".loadButton")[index];
	const loadButton2 = document.querySelectorAll(".loadButton2")[index];
	const title = document.querySelectorAll(".title")[index];
	const playButton = document.querySelectorAll(".playButton")[index];
	const speed = document.querySelectorAll(".speed")[index];
	const sync = document.querySelectorAll(".sync")[index];
	const master = document.querySelectorAll(".master")[index];
	const volume = document.querySelectorAll(".volume")[index];
	const pan = document.querySelectorAll(".pan")[index];
	const quantize = document.querySelectorAll(".quantize")[index];
	const offset = document.querySelectorAll(".offset")[index];

	loadButton.classList.remove("dropping");
	loadButton2.classList.remove("dropping");
	title.classList.remove("dropping");
	playButton.classList.remove("dropping");
	speed.classList.remove("dropping");
	sync.classList.remove("dropping");
	master.classList.remove("dropping");
	volume.classList.remove("dropping");
	pan.classList.remove("dropping");
	quantize.classList.remove("dropping");
	offset.classList.remove("dropping");
}

function getIndexFromEvent(e, selector){
	let elem = e.currentTarget;
	let index = -1;

	const elems = document.querySelectorAll(selector);
	for (let i=0; i < elems.length; i++){
		if (elem == elems[i]){
			index = i;
		}
	}
	if (index == -1){
		console.log("getIndexFromEvent error for selector:" + selector);
		console.log(e);
	}

	return index;
}

function getIndexForElem(elem){
	let index = -1;
	const loadButtons = document.querySelectorAll(".loadButton");
	const load2Buttons = document.querySelectorAll(".loadButton2");
	const titles = document.querySelectorAll(".title");
	const playButtons = document.querySelectorAll(".playButton");
	const speeds = document.querySelectorAll(".speed");
	const syncs = document.querySelectorAll(".sync");
	const masters = document.querySelectorAll(".master");
	const volumes = document.querySelectorAll(".volume");
	const pans = document.querySelectorAll(".pan");
	const quantizes = document.querySelectorAll(".quantize");
	const offsets = document.querySelectorAll(".offset");
	for(let i = 0; i < loadButtons.length;i++){
		if (elem == loadButtons[i] || 
			elem == load2Buttons[i] ||
			elem == titles[i] || 
			elem == playButtons[i] || 
			elem == speeds[i] ||
			elem == syncs[i] ||
			elem == masters[i] ||
			elem == volumes[i] ||
			elem == pans[i] ||
			elem == quantizes[i] ||
			elem == offsets[i]){
			index = i;
			break;
		}
	}
	if (index == -1){
		console.log("error in getIndexForElem");
	}
	return index;		
}

function onSoundListDragOver(e){
	e.preventDefault();
	e.dataTransfer.dropEffect = "copy";
}

function onSoundListDragleave(e){
	e.preventDefault();
}

function onSoundListDrop(e){
	e.preventDefault();
	var fileName = e.dataTransfer.files[0].name;
	console.log("onSoundListDrop()" + "file:" + fileName);

	var formData = new FormData();
	formData.append("upfile", e.dataTransfer.files[0]);

	$.ajax("./upload", {
		method:"POST",
		data: formData,
		contentType : false,
		processData : false,
		complete : function(e){
			if (e.status == 401){
				alert("Oops! You need login to upload sounds.");
				return;
			}
			if (e.status == 200){
				console.log("upload succeeded");
				mydata.soundList.reload();
				$("#soundDeleteButton").get(0).disabled = true;
				alert(fileName + " Uploaded!")
			}
		}
	});
	
}

function onEditorDrop(e){
	e.preventDefault();

	const file = e.dataTransfer.files[0];
	onEditorLoadSampleFromFile(file);
}

function onSyncClick(e){

	let index = getIndexFromEvent(e, ".syncButton");
	sync(index);
}

function sync(index){
	let masterIndex = getMasterIndex();

	if (masterIndex == -1) return;	//no master
	if (masterIndex != 99){
		if (!mydata.trackLoaded[masterIndex]) return;
	}
	if (!mydata.trackLoaded[index]) return;


	let c = 1;
	let masterRatio = 0;
	let masterLength = 0;
	if (masterIndex == 99){
		masterRatio = 1.0;
		masterLength = 60 / mydata.bpm * 44100;
	}else{
		masterRatio = mydata.trackRatio[masterIndex];
		masterLength = mydata.trackLength[masterIndex];
	}

	while(true){
		mydata.trackRatio[index] = 
			masterRatio * masterLength 
		/ mydata.trackLength[index] / c ;
		if (1/mydata.trackRatio[index] < 0.75){
			c*=2;
			continue;
		}else if (1/mydata.trackRatio[index] > 1.5){
			c/=2;
			continue;
		}
		break;
	}

	console.log("trackRatio for " + (index+1) + " = " + mydata.trackRatio[index]);

	updateSpeedLabel(index);

}

function updateSpeedLabel(index){
	let speedSlider = document.querySelectorAll(".speedSlider");
	let value = 0;
	if (1/mydata.trackRatio[index] * 100 >= 100){
		value = 1/mydata.trackRatio[index]*100;
	}else{
		value = 2*(1/mydata.trackRatio[index]*100 - 50);
	}
	speedSlider[index].value = value; 

	let speedLabel = document.querySelectorAll(".speedLabel");
	let roundedSpeed = 1/mydata.trackRatio[index] * 100;
	roundedSpeed = Math.round(roundedSpeed *1000) / 1000;
	speedLabel[index].innerText = roundedSpeed.toString() + "%";
}

function onHalfSpeedClick(e){

	let index = getIndexFromEvent(e, ".halfSpeedButton");
	mydata.trackRatio[index] *= 2;
	updateSpeedLabel(index);
}

function onDoubleSpeedClick(e){

	let index = getIndexFromEvent(e, ".doubleSpeedButton");
	mydata.trackRatio[index] /= 2;
	updateSpeedLabel(index);
}


//return 99 if tap is master
function getMasterIndex(){
	let index = -1;
	
	if (mydata.tapMaster) return 99;

	for (let i = 0; i < mydata.trackMaster.length; i++){
		if (mydata.trackMaster[i]){
			index = i;
			break;
		}
	}
	return index;

}

function onMasterChanged(e){

	const tapMasterChk = document.querySelector("#tapMasterChk");
	const masterChks = document.querySelectorAll(".masterChk");

	let checkBox = e.currentTarget;
	let index = getIndexFromEvent(e, ".masterChk");
	if (checkBox.checked){
		for (let i = 0; i < masterChks.length; i++){
			if (i != index){
				masterChks[i].checked = false;
				mydata.trackMaster[i] = false;
			}
		}

		if (checkBox == tapMasterChk){
			mydata.tapMaster = true;
		}else{
			tapMasterChk.checked = false;
			mydata.tapMaster = false;
			mydata.trackMaster[index] = true;
		}
	}else{
		if (checkBox == tapMasterChk){
			mydata.tapMaster = false;
		}else{
			mydata.trackMaster[index] = false;
		}
	}

}


function onSpeedChanged(index){
	const speedSlider = document.querySelectorAll(".speedSlider")[index];
	const speedLabel = document.querySelectorAll(".speedLabel")[index];

	let val = speedSlider.value;
	let speed = 100;
	if (val >= 100){
		speed = val;
	}else{
		speed = 1/2 * val + 50;
	}

	mydata.trackRatio[index] = 1/(speed/100);

	calcState.current_grain_start[index] = Math.round(mydata.trackCurrentFrame[index])
	calcState.current_x[index] = 0;
	if (mydata.trackRatio[index] >= 1){
		calcState.current_grain_start2[index] = calcState.current_grain_start[index] + mydata.grain_size / 2;
		calcState.current_x2[index] = -1.0 * Math.round(mydata.grain_size/2*mydata.trackRatio[index]);
	}else{
		calcState.current_grain_start2[index] = calcState.current_grain_start[index] + mydata.grain_size;
		calcState.current_x2[index] = Math.round(mydata.grain_size*(mydata.trackRatio[index])*(-1));
	}

	speedLabel.innerText = speed.toString() + "%";
}

function onVolumeChanged(index){
	const volumeSlider = document.querySelectorAll(".volumeSlider")[index];
	const volumeLabel = document.querySelectorAll(".volumeLabel")[index];

	let val = volumeSlider.value;

	let db = 20*Math.log10(val/100);
	let roundedDb = Math.round(db *100) / 100;

	mydata.trackVolume[index] = val/100;

	volumeLabel.innerText = roundedDb.toString() + "dB";
}

function onPanChanged(index){
	const panSlider = document.querySelectorAll(".panSlider")[index];
	const panLabel = document.querySelectorAll(".panLabel")[index];

	let val = panSlider.value;

	mydata.trackPan[index] = val/100;

	panLabel.innerText = val.toString();
}

function onOffsetChanged(index){
	const offsetSlider = document.querySelectorAll(".offsetSlider")[index];
	const offsetLabel = document.querySelectorAll(".offsetLabel")[index];

	let val = offsetSlider.valueAsNumber;
	mydata.trackOffset[index] = val;
	offsetLabel.innerText = val.toString();
}


function onLoadSample(index){
	console.log("loading sample from editor for track:" + (index+1));

	mydata.trackLength[index] = mydata.selectEndFrame - mydata.selectStartFrame;
	
	mydata.trackBufferLeft[index] = new Float32Array(mydata.trackLength[index]);
	mydata.trackBufferRight[index] = new Float32Array(mydata.trackLength[index]);
	for (let i = 0; i < mydata.trackLength[index]; i++){
		mydata.trackBufferLeft[index][i] = 
					audioBufferLeft[mydata.selectStartFrame + i];
		mydata.trackBufferRight[index][i] = 
					audioBufferRight[mydata.selectStartFrame + i];					
	}
	mydata.trackCurrentFrame[index] = 0;
	mydata.trackPlaying[index] = false;
	mydata.trackLoaded[index] = true;

	let titles = document.querySelectorAll(".title");
	titles[index].innerText = "sample" + (index+1);
}

function onLoadSampleFromFile(index, file){
	tryLoadSampleFromFileStandard(index, file)
	.then(function(length){
		console.log("success standard : " + (index+1).toString());
		trackLoadedFromFile(index, length, file.name);
	}, function(e){
		console.log("decode error(Standard) : " + e);
		tryLoadSampleFromFileAAC(index, file)
		.then(function(length){
			console.log("success AAC");
			trackLoadedFromFile(index, length, file.name);
		}, function(e){
			console.log("decode error(AAC) : " + e);
		});
	});
}

function onLoadSampleFromList(index){


	loadSample(index, mydata.soundList.selectedText());
}

function loadSample(index, soundName){
	//get blob by ajax
	var xhr = new XMLHttpRequest();	
	xhr.open("GET", "/sound/" + soundName);
	xhr.responseType = "blob";
	xhr.onreadystatechange = function(){
		if (this.readyState == 4 && this.status == 200){
			done(this.response);
		}
	}

	//read and done;
	var done = function(blob){
		console.log(blob);
		tryLoadSampleFromFileStandard(index, blob)
		.then(function (length) {
			console.log("success standard : " + (index + 1).toString());
			trackLoadedFromFile(index, length, soundName);
		}, function (e) {
			console.log("decode error(Standard) : " + e);
			tryLoadSampleFromFileAAC(index, blob)
			.then(function (length) {
				console.log("success AAC");
				trackLoadedFromFile(index, length, soundName);
			}, function (e) {
				console.log("decode error(AAC) : " + e);
			});
		});
	}
	xhr.send();
}

function trackLoadedFromFile(index, length, name){
	mydata.trackLength[index] = length;
	mydata.trackCurrentFrame[index] = 0;
	mydata.trackPlaying[index] = false;
	mydata.trackLoaded[index] = true;

	let titles = document.querySelectorAll(".title");
	titles[index].innerText = name
}



function tryLoadSampleFromFileStandard(index, blob){
	return new Promise(function(resolve, reject){
		const fileReader = new FileReader();
		fileReader.onload = function(e){
			const fileContents = e.target.result;
			const audioContextForDecode = new AudioContext();
			audioContextForDecode.decodeAudioData(fileContents)
			.then(function(buf){
				mydata.trackBufferLeft[index] = buf.getChannelData(0);
				if (buf.numberOfChannels == 1){
					mydata.trackBufferRight[index] = buf.getChannelData(0);
				}else{
					mydata.trackBufferRight[index] = buf.getChannelData(1);
				}
				audioContextForDecode.close();
				resolve(buf.length);
			}, function(e){
				reject(e);
			});

		};
		fileReader.readAsArrayBuffer(blob);
	});
}

function clearTrack(index){
	mydata.trackLength[index] = 0;
	mydata.trackCurrentFrame[index] = 0;
	mydata.trackPlaying[index] = false;
	mydata.trackLoaded[index] = false;

	let titles = document.querySelectorAll(".title");
	titles[index].innerText = "----";
}


//results:validFrames, primingFrames, reminderFrames]
function getEncodingDelayForCAF(view){

	let encodingDelay = {};
	encodingDelay.validFrames = 0;
	encodingDelay.primingFrames = 0;
	encodingDelay.reminderFrames = 0;
	
	function getFourCC(_view, offset){
		let ret = "";
		let c = _view.getUint8(offset);
		ret += String.fromCharCode(c);
		c = _view.getUint8(offset+1);
		ret += String.fromCharCode(c);
		c = _view.getUint8(offset+2);
		ret += String.fromCharCode(c);
		c = _view.getUint8(offset+3);
		ret += String.fromCharCode(c);
		return ret;		

	}

	function getInt64(_view, offset){
		let upper = _view.getInt32(offset, false);
		let lower = _view.getUint32(offset+4,false);
		return (upper << 32) + lower;
	}

	let offset = 0;
	let signature = getFourCC(view, offset);
	if (signature != "caff"){
		return null;
	}
	offset += 4;
	//skip file version
	offset += 2;
	//skip file flags
	offset += 2;

	let got = false;

	while(offset < view.byteLength){
		let chunkType = getFourCC(view, offset);
		offset += 4;
		let chunkSize =  getInt64(view, offset);
		offset += 8;
		if (chunkType == "pakt"){
			console.log("pakt chunk found");
			
			//number of packets
			let numberPackets = getInt64(view, offset);
			offset += 8;

			encodingDelay.validFrames = getInt64(view, offset);
			offset += 8;
			encodingDelay.primingFrames = view.getInt32(offset, false);
			offset += 4;
			encodingDelay.reminderFrames = view.getInt32(offset, false);
			offset += 4;
			console.log("Packet Num : " + numberPackets);
			console.log("Encoding Delay : ");
			console.log("  valid frames = " + encodingDelay.validFrames);
			console.log("  priming frames = " + encodingDelay.primingFrames);
			console.log("  reminder frames = " + encodingDelay.reminderFrames);
			got = true;
			break;
		}else{
			//skip to next chunk
			console.log(" chunk : " + chunkType);
			offset += chunkSize;
		}
	}

	if(got){
		return encodingDelay;
	}else{
		return null;
	}
}

function tryLoadSampleFromFileAAC(index, blob){
	//use aac.js/aurora.js to decode caf(AAC compressed Apple Loops)
	return new Promise(function(resolve, reject){
		let asset = AV.Asset.fromFile(blob);
		asset.on("error", function(e){
			reject(e);
		});

		asset.get("duration", function(duration){
			console.log("duration = " + duration);

			//if came here, we assume file is OK.
			//now get priming/reminder frame (if possible)

			const fileReader = new FileReader();
			fileReader.onload = function(e){
				let fileContents = e.target.result;
				let view = new DataView(fileContents);

				let encodingDelay = getEncodingDelayForCAF(view);

				asset.decodeToBuffer(function(buffer){
					// if (encodingDelay){
					// 	let validLen = encodingDelay.validFrames;
					// 	let primingFrames = encodingDelay.primingFrames;
					// 	mydata.trackBufferLeft[index] = new Float32Array(validLen);
					// 	mydata.trackBufferRight[index] = new Float32Array(validLen);
					// 	for(let i = 0; i < validLen; i++){
					// 		mydata.trackBufferLeft[index][i] = 
					// 			buffer[(primingFrames + i)*2];
					// 		mydata.trackBufferRight[index][i] = 
					// 			buffer[(primingFrames + i)*2+1];
					// 	}
					// 	resolve(validLen);

					// }else{
						mydata.trackBufferLeft[index] = new Float32Array(buffer.length/2);
						mydata.trackBufferRight[index] = new Float32Array(buffer.length/2);
						for (let i = 0; i < buffer.length/2; i++){
							mydata.trackBufferLeft[index][i] = buffer[i*2];
							mydata.trackBufferRight[index][i] = buffer[i*2+1];
						}
						resolve(buffer.length/2);
					// }
				});
			}

			fileReader.readAsArrayBuffer(blob);
		});
	});
}

function onEditorLoadSampleFromFile(blob){
	tryEditorLoadSampleFromFileStandard(blob)
	.then(function(length){
		console.log("success Standard");
		editorLoaded(length);
	},function(e){
		console.log("decode error(Standard) : " + e);
		tryEditorLoadSampleFromFileAAC(blob)
		.then(function(length){
			console.log("success AAC");
			editorLoaded(length);
		},function(e){
			console.log("decode error(AAC) : " + e);
		});
	});
}

function editorLoaded(length){
	mydata.currentFrame = length;
	mydata.viewStartFrame = 0;
	mydata.viewEndFrame = mydata.currentFrame;
	mydata.viewRate = 1.0;
	mydata.recording = false;
	mydata.playing = false

	mydata.selectStartFrame = 0;
	mydata.selectEndFrame = mydata.currentFrame;
	mydata.selected = true;
	mydata.playStartFrame = 0;
	mydata.needsRedrawWave = true;

	redrawCanvas();
}

function tryEditorLoadSampleFromFileStandard(blob){

	return new Promise(function(resolve, reject){
		const fileReader = new FileReader();
		fileReader.onload = function(e){
			const fileContents = e.target.result;
			let audioContextForDecode = new AudioContext();
			audioContextForDecode.decodeAudioData(fileContents)
			.then(function(buf){
				for (let i = 0; i < buf.length; i++){
					audioBufferLeft[i] = buf.getChannelData(0)[i];
					if (buf.numberOfChannels == 1){
						audioBufferRight[i] = buf.getChannelData(0)[i];
					}else{
						audioBufferRight[i] = buf.getChannelData(1)[i];
					}
				}
				audioContextForDecode.close();				
				resolve(buf.length);

			}, function(e){
				reject(e);
			});
			
		}
		fileReader.readAsArrayBuffer(blob);
	});
}


function tryEditorLoadSampleFromFileAAC(blob){
	//use aac.js/aurora.js to decode caf(AAC compressed Apple Loops)
	return new Promise(function(resolve, reject){
		let asset = AV.Asset.fromFile(blob);
		asset.on("error", function(e){
			reject(e);
		});
		asset.get("duration", function(duration){
			console.log("duration = " + duration);

			const fileReader = new FileReader();
			fileReader.onload = function(e){
				let fileContents = e.target.result;
				let view = new DataView(fileContents);

				let encodingDelay = getEncodingDelayForCAF(view);

				asset.decodeToBuffer(function(buffer){

					// if(encodingDelay){ 
					// 	let validLen = encodingDelay.validFrames;
					// 	let primingFrames = encodingDelay.primingFrames;
					// 	for(let i = 0; i < validLen; i++){
					// 		audioBufferLeft[i] = buffer[(primingFrames + i)*2];
					// 		audioBufferRight[i] = buffer[(primingFrames + i)*2+1];
					// 	}
					// 	//count silense
					// 	let s = 0;
					// 	let i = 0;
					// 	while(true){
					// 		//silence
					// 		if(buffer[i*2] <= 0.001 && buffer[i*2+1] <= 0.001){
					// 			i++;
					// 			s++;
					// 		}else{
					// 			break;
					// 		}
					// 	}
					// 	console.log("actual silence = " + s);
					// 	console.log("buffer.length/2 = " + buffer.length/2);

					// 	resolve(validLen);


					// }else{
						for (let i = 0; i < buffer.length/2; i++){
							audioBufferLeft[i]  = buffer[i*2];
							audioBufferRight[i] = buffer[i*2+1];
						}
						resolve(buffer.length/2);
					// }
				});
			}

			fileReader.readAsArrayBuffer(blob);
		});
	});
}




function sinFadeWindow(fadeStartRate, x, val){
	let y = 0;

	if (x < 0 || x > 1) {return 0;}
	if (x < fadeStartRate){
		y = 1.0/2.0 * Math.sin(Math.PI/fadeStartRate*x + 3.0/2*Math.PI) + 1/2;
	}else if (x < 1.0 - fadeStartRate){
		y = 1.0;
	}else{
		y = 1.0/2.0 * Math.sin(Math.PI/fadeStartRate*x + 3.0/2.0 * Math.PI 
		- 1.0/fadeStartRate*Math.PI ) + 1.0/2.0;
	}
	return val * y;
}

function crossfadeWindow(fadeStartRate, x, val){
	
	if (x < 0 || x > 1) {return 0;}

	if (x < fadeStartRate){
		return val * (1.0/fadeStartRate  * x); 
	}else if (x < 1.0 - fadeStartRate){
		return val * 1.0;
	}else{
		return val * ( (-1.0/fadeStartRate*x + 1/fadeStartRate));
	}
}

function noFadeWindow(fadeStartRate, x, val){
	if (x < 0 || x > 1) {return 0;}
	return val;
}


function stretch2(index){

	let grain_size = 4000;
	let ratio = 1.5;

	let start = 0;
	let end = grain_size;

	let stretchedL = new Float32Array(44100*60*10);
	let stretchedR = new Float32Array(44100*60*10);
	while(true){
		for (let i = start; i < end; i++){

			let valL = mydata.trackBufferLeft[index][i];
			let valR = mydata.trackBufferRight[index][i];

			let fadeStartRate = -1/2*ratio + 1;
			valL = sinFadeWindow(fadeStartRate, (i-start)/grain_size, valL);
			valR = sinFadeWindow(fadeStartRate, (i-start)/grain_size, valR);

			let iX = Math.round(start * ratio) + (i-start);
			stretchedL[iX] += valL;
			stretchedR[iX] += valR;
		}
		start = start + grain_size/2;
		end = end + grain_size/2;
		if (start > mydata.trackLength[index]){
			break;
		}
	}

	mydata.trackBufferLeft[index] = stretchedL;
	mydata.trackBufferRight[index] = stretchedR;
	mydata.trackLength[index] = Math.round(mydata.trackLength[index] * ratio);
}

function stretch_continue3(index, inBufL, inBufR, len){

	let grain_size = mydata.grain_size;
	let ratio = mydata.trackRatio[index];

	if(ratio >= 1){
	for (let iX = 0; iX < len; iX++){

			//wait for time to come.
			if(mydata.trackWaitCount[index] > 0){
				mydata.trackWaitCount[index]--;
				continue;
			}

			const fadeStartRate = -1/2*ratio + 1;

			if (calcState.current_x[index] > grain_size * (1+ (ratio-1)/2)){
				calcState.current_grain_start[index] += grain_size;
				calcState.current_x[index] = Math.round((grain_size *  (1+(ratio-1)/2) - grain_size)*(-1))
			}
			if (calcState.current_x2[index] > grain_size * (1+(ratio-1)/2)){
				calcState.current_grain_start2[index] += grain_size;
				calcState.current_x2[index] = Math.round((grain_size * (1+(ratio-1)/2) - grain_size)*(-1));
			}


			{
				let x = calcState.current_grain_start[index] + calcState.current_x[index];

				let valL = mydata.trackBufferLeft[index][x];
				let valR = mydata.trackBufferRight[index][x];
				if (calcState.current_x2[index] < 0){
					//no windowing for some beggining frames
				}else{
					valL = sinFadeWindow(fadeStartRate, calcState.current_x[index]/grain_size, valL);
					valR = sinFadeWindow(fadeStartRate, calcState.current_x[index]/grain_size, valR);
				}
				calcState.stretchedLX[index][iX] = valL;
				calcState.stretchedRX[index][iX] = valR;
			}

			{
				let x2 = calcState.current_grain_start2[index] + calcState.current_x2[index];
				let valL2 = mydata.trackBufferLeft[index][x2];
				let valR2 = mydata.trackBufferRight[index][x2];

				valL2 = sinFadeWindow(fadeStartRate, calcState.current_x2[index]/grain_size, valL2);
				valR2 = sinFadeWindow(fadeStartRate, calcState.current_x2[index]/grain_size, valR2);
				calcState.stretchedLX[index][iX] += valL2;
				calcState.stretchedRX[index][iX] += valR2;			
			}
			calcState.current_x[index]++;
			calcState.current_x2[index]++;

			let vol = mydata.trackVolume[index];
			let pan = mydata.trackPan[index];
			let volLeft = 0;
			let volRight = 0;
			if (pan < 0){
				volLeft = 1.0;
				volRight = pan + 1;
			}else{
				volLeft = -1*pan + 1;
				volRight = 1.0;
			}
		
			inBufL[iX] += calcState.stretchedLX[index][iX] 
							* vol*volLeft;
			inBufR[iX] += calcState.stretchedRX[index][iX]
							* vol*volRight;
			

			mydata.trackCurrentFrame[index] += 1 * 1/ratio;
			if (mydata.trackCurrentFrame[index] > mydata.trackLength[index]){
				mydata.trackCurrentFrame[index] = 0;
				calcState.current_grain_start[index] = 0;
				calcState.current_x[index] = 0;
				calcState.current_grain_start2[index] = mydata.grain_size / 2;
				calcState.current_x2[index] = -1.0 * Math.round(mydata.grain_size/2*mydata.trackRatio[index]);
			}
	
		}
	}else{
		for (let iX = 0; iX < len; iX++){
			
			//wait for time to come.
			if(mydata.trackWaitCount[index] > 0){
				mydata.trackWaitCount[index]--;
				continue;
			}	

			const fadeStartRate = 1 - ratio;
			// const fadeStartRate = 0;
			if (calcState.current_x[index] > grain_size*(1 + ratio-1/2)){
				calcState.current_grain_start[index] += grain_size*2;
				calcState.current_x[index] = Math.round(grain_size*(ratio-1/2)*(-1));
			}
			if (calcState.current_x2[index] > grain_size*(1 + ratio-1/2)){
				calcState.current_grain_start2[index] += grain_size*2;
				calcState.current_x2[index] = Math.round(grain_size*(ratio-1/2)*(-1));
			}
			{
				let x = calcState.current_grain_start[index] + calcState.current_x[index];
				let valL = mydata.trackBufferLeft[index][x];
				let valR = mydata.trackBufferRight[index][x];
				if (calcState.current_x2[index] < 0){
					//no windowing for some beggining frames
				}else{
					valL = sinFadeWindow(fadeStartRate, calcState.current_x[index]/grain_size, valL);
					valR = sinFadeWindow(fadeStartRate, calcState.current_x[index]/ grain_size, valR);
				}
				calcState.stretchedLX[index][iX] = valL;
				calcState.stretchedRX[index][iX] = valR;
			}
			{
				let x2 = calcState.current_grain_start2[index] + calcState.current_x2[index];
				let valL2 = mydata.trackBufferLeft[index][x2];
				let valR2 = mydata.trackBufferRight[index][x2];

				valL2 = sinFadeWindow(fadeStartRate, calcState.current_x2[index]/grain_size, valL2);
				valR2 = sinFadeWindow(fadeStartRate, calcState.current_x2[index]/grain_size, valR2);
				calcState.stretchedLX[index][iX] += valL2;
				calcState.stretchedRX[index][iX] += valR2;
			}

			calcState.current_x[index]++;
			calcState.current_x2[index]++;

			let vol = mydata.trackVolume[index];
			let pan = mydata.trackPan[index];
			let volLeft = 0;
			let volRight = 0;
			if (pan < 0){
				volLeft = 1.0;
				volRight = pan + 1;
			}else{
				volLeft = -1*pan + 1;
				volRight = 1.0;
			}
		
			inBufL[iX] += calcState.stretchedLX[index][iX] 
							* vol*volLeft;
			inBufR[iX] += calcState.stretchedRX[index][iX]
							* vol*volRight;

			mydata.trackCurrentFrame[index] += 1 * 1/ratio;
			if (mydata.trackCurrentFrame[index] > mydata.trackLength[index]){
				mydata.trackCurrentFrame[index] = 0;
				calcState.current_grain_start[index] = 0;
				calcState.current_x[index] = 0;
				calcState.current_grain_start2[index] = grain_size;
				calcState.current_x2[index] = Math.round(grain_size*(ratio)*(-1));
			}
			
		}
	}
}


function onPlayStopTrack(index){
	if(mydata.trackLoaded[index]){
		if (!mydata.trackPlaying[index]){
			mydata.trackCurrentFrame[index] = 0;
			calcState.current_grain_start[index] = 0;
			calcState.current_x[index] = 0;

			if(mydata.trackRatio[index] >=1){
				calcState.current_grain_start2[index] = mydata.grain_size / 2;
				calcState.current_x2[index] = -1.0 * Math.round(mydata.grain_size/2*mydata.trackRatio[index]);
			}else{
				calcState.current_grain_start2[index] = mydata.grain_size;
				calcState.current_x2[index] =  Math.round(mydata.grain_size*(mydata.trackRatio[index])*(-1));	
			}

			//quantize test [TODO:think offset]
			if (mydata.trackQuantize[index]){
				console.log("quantized start");
				//get master
				let masterIndex = getMasterIndex();

				if (index != masterIndex && -1 != masterIndex && 99 != masterIndex && mydata.trackPlaying[masterIndex]){
					let rm  = mydata.trackRatio[masterIndex];
					let cfm = mydata.trackCurrentFrame[masterIndex];
					let lenm = mydata.trackLength[masterIndex];

					let lag = cfm * rm - Math.floor(32*cfm/lenm)*(lenm*rm/32);
					if (lag < lenm*rm/64){
						//late comming

						mydata.trackCurrentFrame[index] = Math.round(lag/mydata.trackRatio[index]);

						//offset
						if (mydata.trackOffset[index] >= 0){
							mydata.trackCurrentFrame[index] += Math.round(mydata.trackOffset[index] * mydata.trackRatio[index]);
						}else{
							mydata.trackCurrentFrame[index] -= Math.round(-1*mydata.trackOffset[index] * mydata.trackRatio[index]);
							if (mydata.trackCurrentFrame[index] < 0 ){
								mydata.trackWaitCount[index] = -1 * mydata.trackCurrentFrame[index];
								mydata.trackCurrentFrame[index] = 0;
							}
						}
						calcState.current_grain_start[index] = mydata.trackCurrentFrame[index];
						if(mydata.trackRatio[index] >= 1){
							calcState.current_grain_start2[index] = mydata.trackCurrentFrame[index] + mydata.grain_size/2;
						}else{
							calcState.current_grain_start2[index] = mydata.trackCurrentFrame[index] + mydata.grain_size;
						}

					}else{
						//wait required
						mydata.trackWaitCount[index] = Math.round(lenm*rm/32 - lag);

						//offset
						if (mydata.trackOffset[index] >= 0){
							mydata.trackWaitCount[index] -= Math.round(mydata.trackOffset[index] * mydata.trackRatio[index]);
							if (mydata.trackWaitCount[index] < 0){
								mydata.trackCurrentFrame[index] = -1.0*mydata.trackWaitCount[index];
								mydata.trackWaitCount[index] = 0;
							}
						}else{
							mydata.trackWaitCount[index] += Math.round(-1*mydata.trackOffset[index]*mydata.trackRatio[index]);
						}
						calcState.current_grain_start[index] = mydata.trackCurrentFrame[index];
						if(mydata.trackRatio[index] >= 1){
							calcState.current_grain_start2[index] = mydata.trackCurrentFrame[index] + mydata.grain_size/2;
						}else{
							calcState.current_grain_start2[index] = mydata.trackCurrentFrame[index] + mydata.grain_size;
						}
					}
				}
			}else{

				//calc offset
				if (mydata.trackOffset[index] >= 0){
					mydata.trackCurrentFrame[index] = Math.round(mydata.trackOffset[index] * mydata.trackRatio[index]);
					calcState.current_grain_start[index] = mydata.trackCurrentFrame[index];
					if(mydata.trackRatio[index] >= 1){
						calcState.current_grain_start2[index] = mydata.trackCurrentFrame[index] + mydata.grain_size/2;
					}else{
						calcState.current_grain_start2[index] = mydata.trackCurrentFrame[index] + mydata.grain_size;
					}
				}else{
					mydata.trackWaitCount[index] = Math.round(-1*mydata.trackOffset[index] * mydata.trackRatio[index]);
				}
			}
			mydata.trackPlaying[index] = true;

		}else{
			mydata.trackPlaying[index] = false;
		}
	}

	playStateChanged();
}

function playStateChanged(){

	startStopTimer();

	let shouldStop = true;
	if (mydata.playing){
		shouldStop = false
	}
	for (let i=0; i < TRACK_NUM; i++){
		if (mydata.trackLoaded[i] && mydata.trackPlaying[i]){
			shouldStop = false;
		}
	}

	if (mydata.vTrack.isPlaying()){
		shouldStop = false;
	}

	if (shouldStop && audioContext2){
		if (audioContext2){
			audioContext2.suspend();
			audioContext2.close();
			audioContext2 = null;
			audioElem2.pause();
			audioElem2 = null;
			console.log("audioEngine stopped");
		}
		mydata.isPlayerActive = false;
		return;
	}

	if (!shouldStop && (audioContext2==null)) {
		console.log("now start engine");
		startOutEngine();
	}

}

function editorStateChanged(){
	startStopTimer();

	let shouldStop = true;
	if (mydata.monitor){
		shouldStop = false;
	}
	if (mydata.recording){
		shouldStop = false;
	}
	if (mydata.level){
		shouldStop = false;
	}

	if(shouldStop && mydata.isEditorActive){
		if (audioContext){
			audioContext.close();
			audioContext = null;
			audioElem.pause();
			audioElem = null;
		}
		console.log("EditorEngine stopped");
		mydata.isEditorActive = false;
		return;
	}

	if(!shouldStop && !mydata.isEditorActive){
		startEditorEngine();
	}

}

function startStopTimer(){
	let shouldStop = true;
	if (mydata.recording){
		shouldStop = false;
	}
	if (mydata.playing){
		shouldStop = false;
	}
	if (mydata.level){
		shouldStop = false;
	}

	if (shouldStop && (mydata.timer != null)){
		clearInterval(mydata.timer);
		mydata.timer = null;
		return;
	}

	if (!shouldStop && (mydata.timer==null)){
		mydata.timer = setInterval(function(){
			redrawCanvas();
		},50);
	}
}


function initMedia(){
	navigator.mediaDevices.getUserMedia(
					{audio:true, video:false})
	.then( function(stream){
		console.log("calling getOutputDevice()");
		return getOutputDevice();

	}).then(function(){
		console.log("calling getInputDevice()");
		return getInputDevice();
	
	}).then(function(){
		// console.log("calling startOutEngine()");
		// return startOutEngine();
		editorStateChanged();
	});

}

function getOutputDevice(){
	return getDevice("output");
}
function getInputDevice(){
	return getDevice("input");
}

function getDevice(kind){
	return new Promise(function (resolve, reject) {
		let list = null;
		if (kind == "output"){
			list = document.querySelector("#selectOutputDevices");
		}else{
			list = document.querySelector("#selectInputDevices");
		}
		let devices = null;
		list.innerHTML = "";

		navigator.mediaDevices.enumerateDevices()
		.then(function (devices) {
			let i = 0;
			devices.forEach(function (d) {
				if (d.kind == "audio" + kind) {
					console.log(kind + "[" + i + "] = " + d.label + " : " + d.deviceId);
					let option = new Option();
					option.value = d.deviceId;
					option.text = d.label;
					list.add(option);
					i++;
				}

			});

			let selectedFromCookie = false;
			let cookieKey = null;
			if (kind == "output"){
				cookieKey = "outDevice";
			}else{
				cookieKey = "inDevice";
			}
			if ($.cookie(cookieKey)) {
				for (let i = 0; i < list.options.length; i++) {
					if (list.options[i].value == $.cookie(cookieKey)) {
						if (kind == "output"){
							mydata.outDevId = list.options[i].value;
						}else{
							mydata.inDevId = list.options[i].value;
						}
						list.selectedIndex = i;
						selectedFromCookie = true;
						break;
					}
				}
			}

			if (!selectedFromCookie) {
				list.selectedIndex = 0;
				if (kind == "output") {
					mydata.outDevId = list.options[0].value;
				} else {
					mydata.inDevId = list.options[0].value;
				}
			}
			resolve();
		});
	});
}

// function getOutputBuiltIn(){

// 	return new Promise(function(resolve, reject) {
// 		navigator.mediaDevices.enumerateDevices()
// 		.then(function(devices){
// 			var devId = "";
			
// 			devices.forEach(function(device){
// 				if (device.kind == "audiooutput"){
// 					console.log(device.label + " id = " + device.deviceId);
// 					if (device.label.startsWith("内蔵スピーカー") || 
// 						device.label.startsWith("ヘッドフォン") || 
// 						device.label.startsWith("スピーカー")){
// 						console.log("found!!!(内蔵スピーカー/ヘッドフォン)");
// 						if (devId == ""){
// 							devId = device.deviceId;
// 							mydata.outDevId = devId;
// 						}
// 					}
// 				}
// 			});
// 			if (devId == ""){
// 				console.log("built-in output not found!");
// 			}
// 			resolve();
// 		});
// 	});
// }


// function readyInput(){
// 	return new Promise(function(resolve,reject){
// 		navigator.mediaDevices.enumerateDevices()
// 		.then(function(devices){
// 			var devId = "";
			
// 			devices.forEach(function(device){
// 				if (device.kind == "audioinput"){
// 					console.log(device.label + " id = " + device.deviceId);
// 					if (device.label.startsWith("Background Music") ||
// 						device.label.startsWith("ステレオ ミキサー") || 
// 						device.label.startsWith("CABLE Output")){
// 						console.log("Background Music device found!!!");
// 						if (devId == ""){
// 							devId = device.deviceId;
// 							mydata.inDevId = devId;
// 						}
// 					}
// 				}
// 			});

// 			if (devId == ""){
// 				console.log("Background Music device not found");
// 				return;
// 			}

// 			var constrains = {
// 				audio:{
// 					deviceId : devId,
// 					sampleSize : 16,
// 					sampleRate : 44100,
// 					channelCount : 2,
// 					echoCancellation: false, /*this is the point*/
//       				autoGainControl: false,/*this is the point*/
//       				noiseSuppression: false/*this is the point*/
// 				},
// 				video:false
// 			};
// 			var p = navigator.mediaDevices.getUserMedia(constrains)
// 			p.then(function(stream){
// 				// mydata.stream = stream;
// 				// startEditorEngine(stream);
// 				resolve();
// 			});
// 		});
// 	});
// }

function inputDeviceChanged(){
	if (audioContext){
		audioContext.close();
		audioContext = null;
		audioElem.pause();
		audioElem = null;
		console.log("EditorEngine stopped");
	}
	mydata.isEditorActive = false;

	let list = document.querySelector("#selectInputDevices");
	mydata.inDevId = list.options[list.selectedIndex].value;

	if (mydata.inDevId == "default") {
		//user wants default
		$.removeCookie("inDevice");
	} else {
		$.cookie("inDevice", mydata.inDevId,
			{ expires: 365 * 10 });
	}

	editorStateChanged();
}

function outputDeviceChanged(){
	if (audioContext2){
		audioContext2.suspend();
		audioContext2.close();
		audioContext2 = null;
		audioElem2.pause();
		audioElem2 = null;
		console.log("PlayerEngine stopped");
	}
	mydata.isPlayerActive = false;

	let list = document.querySelector("#selectOutputDevices");
	mydata.outDevId = list.options[list.selectedIndex].value;

	if (mydata.outDevId == "default") {
		//user wants default
		$.removeCookie("outDevice");
	} else {
		$.cookie("outDevice", mydata.outDevId,
			{ expires: 365 * 10 });
	}


	playStateChanged();
	//also input engine should be restarted
	inputDeviceChanged();
	
}

function startEditorEngine() {

	let constrains = {
		audio: {
			deviceId : {exact : mydata.inDevId},		//somehow simple "default" fall into Microphone.
			sampleSize: 16,
			sampleRate: 44100,
			channelCount: 2,
			echoCancellation: false, /*this is the point*/
			autoGainControl: false,/*this is the point*/
			noiseSuppression: false/*this is the point*/
		},
		video: false
	};
	
	// navigator.mediaDevices.getUserMedia({audio:true, video:false})
	navigator.mediaDevices.getUserMedia(constrains)
	.then(function (stream) {
		audioContext = new AudioContext();

		var mediastreamsource = audioContext.createMediaStreamSource(stream);
		var scriptProcessor = audioContext.createScriptProcessor(0, 2, 2);
		scriptProcessor.onaudioprocess = onAudioProcess;

		var dest = audioContext.createMediaStreamDestination();

		mediastreamsource.connect(scriptProcessor);
		scriptProcessor.connect(dest);

		audioElem = new Audio();
		audioElem.srcObject = dest.stream;
		audioElem.setSinkId(mydata.outDevId)
		.then(function(){
			audioElem.play();
		})
		.then(function(){
			mydata.isEditorActive = true;
			console.log("EditoEngine started");
		});
	});
}

function startOutEngine(){
	audioContext2 = new AudioContext();
	var scriptSource = audioContext2.createScriptProcessor(512/*latency*/,2,2);
	scriptSource.onaudioprocess = onAudioProcessOut;
	var dest = audioContext2.createMediaStreamDestination();
	scriptSource.connect(dest);

	audioElem2 = new Audio();
	audioElem2.srcObject = dest.stream;
	audioElem2.setSinkId(mydata.outDevId);
	audioElem2.play();
	mydata.isPlayerActive = true;

	console.log("OutEngine started.")
}

function onAudioProcess(e) {
	// console.log("onAudioProcess");

	let inbuf = e.inputBuffer;
	let outbuf = e.outputBuffer;


	if (mydata.monitor){
    	for (let i=0; i < inbuf.getChannelData(0).length; i++){
    		outbuf.getChannelData(0)[i] = inbuf.getChannelData(0)[i];
    		outbuf.getChannelData(1)[i] = inbuf.getChannelData(1)[i];
    	}
    } else {
    	const len = inbuf.getChannelData(0).length;
    	const outLeft = outbuf.getChannelData(0);
    	const outRight = outbuf.getChannelData(1);
    	for (let i=0; i < len; i++){
    		outLeft[i] = 0;
    		outRight[i] = 0;
    	}
    }

	if (mydata.level){
		//input level calc
		let level = 0.0;
		for (let i = 0; i < inbuf.getChannelData(0).length; i++){
			let valL = Math.abs(inbuf.getChannelData(0)[i]);
			if (valL > level) level = valL;
			let valR = Math.abs(inbuf.getChannelData(1)[i]);
			if (valR > level) level = valR;
		}
		mydata.inputLevel = level;
	}

    if (mydata.recording){
    	for (let i=0; i < inbuf.getChannelData(0).length; i++){
	    	audioBufferLeft[mydata.currentFrame] = inbuf.getChannelData(0)[i];
			audioBufferRight[mydata.currentFrame] = inbuf.getChannelData(1)[i];
			mydata.currentFrame++;
			mydata.viewEndFrame++;
			mydata.viewRate = 1.0;
			mydata.needsRedrawWave = true;

		}
    }
};

function onAudioProcessOut(e){
	// console.log("onAudioProcessOut");
	let outLeft = e.outputBuffer.getChannelData(0);
	let outRight = e.outputBuffer.getChannelData(1);
	
	if (mydata.playing){
		for (let i = 0 ; i < outLeft.length; i++){
			outLeft[i] = audioBufferLeft[mydata.currentFramePlay];
			outRight[i] = audioBufferRight[mydata.currentFramePlay];
			mydata.currentFramePlay++;

			if (mydata.selected){
				if (mydata.currentFramePlay > mydata.selectEndFrame){
					mydata.currentFramePlay = mydata.selectStartFrame;
				}					
			}else{
				if (mydata.currentFramePlay > mydata.currentFrame){
					mydata.playing = false;
					redrawCanvas();
					playStateChanged();

					break;
				}
			}

		}
	}else{
		for (let i = 0 ; i < outLeft.length; i++){
			outLeft[i] = 0;
			outRight[i] = 0;
		}
	}

	//mix track data
	for (let i = 0; i < TRACK_NUM; i++){
		if (mydata.trackPlaying[i]){
			// for(let j = 0; j < outLeft.length;j++){
			// 	outLeft[j] += mydata.trackBufferLeft[i][mydata.trackCurrentFrame[i]];
			// 	outRight[j] += mydata.trackBufferRight[i][mydata.trackCurrentFrame[i]];
			// 	mydata.trackCurrentFrame[i]++;
			// 	if (mydata.trackCurrentFrame[i] > mydata.trackLength[i]){
			// 		mydata.trackCurrentFrame[i] = 0;
				
			// 	}
			// }
			stretch_continue3(i, outLeft, outRight, outLeft.length);
		}
	}

	if (mydata.vTrack.isPlaying()){
		mydata.vTrack.process(outLeft, outRight, outLeft.length);
	}


}

function startRecord(){
	mydata.currentFrame = 0;
	mydata.viewStartFrame = 0;
	mydata.viewEndFrame = 0;
	mydata.playStartFrame = 0;
	mydata.viewRate = 1.0;
	mydata.recording = true;

	mydata.selectStartFrame = 0;
	mydata.selectEndFrame = 0;
	mydata.playStartFrame = 0;

	mydata.needsRedrawWave = true;
	redrawCanvas();

	editorStateChanged();
}

function stopRecord(){
	mydata.recording = false;
	mydata.needsRedrawWave = true;
	redrawCanvas();
	editorStateChanged();

}

function startPlay(){
	if(mydata.selected){
		mydata.currentFramePlay = mydata.selectStartFrame;
	}else{

		mydata.currentFramePlay = mydata.playStartFrame;
	}
	//playStateChanged();
	mydata.playing = true;	
	playStateChanged();
}

function stopPlay(){

	mydata.playing = false;
	playStateChanged();
}

function drawInputLevel(){
	const canvas = document.querySelector("#inputLevelCanvas");
	const w = canvas.clientWidth;
	const h = canvas.clientHeight;

	let c = canvas.getContext("2d");
	c.clearRect(0, 0, w, h);

	c.beginPath();
	c.fillStyle = "black";
	c.rect(0, 0, w, h);
	c.fill();

	c.beginPath();
	c.fillStyle = "gray";
	c.rect(0,0, mydata.inputLevel*w, h);
	c.fill();

}

function redrawCanvas(){
	// console.log("redrawCanvas");

	drawInputLevel();

	const canvas = document.querySelector("#canvas");

	const w = canvas.clientWidth;
	const h = canvas.clientHeight;

	let c = canvas.getContext('2d');
	
	if (mydata.needsRedrawWave){

		c.clearRect(0,0,w,h);

		c.beginPath();
		c.fillStyle = "black";
		c.rect(0,0,w,h);
		c.fill();

		//optimization 2
		const framePerPixel = (mydata.viewEndFrame - mydata.viewStartFrame) / w ;
		
		for (let i = 0; i < w; i++){
			let from = Math.floor(i * framePerPixel);
			let to = Math.floor(from + framePerPixel);
			if (to > mydata.viewEndFrame) to = mydata.viewEndFrame;
			let max = 0;

			for(let j = from; j < to; j += Math.ceil((framePerPixel)/100)){
				let s = Math.abs(audioBufferLeft[j + mydata.viewStartFrame]);
				s += Math.abs(audioBufferRight[j + mydata.viewStartFrame]);
				s /= 2;
				if (s > max) max = s;
			}

			if (max <= 0) { //no sound
				max = 0.002;
			}

			c.beginPath();
			c.strokeStyle = "lightgreen";
			c.moveTo(i, h/2 - max*h/2);
			c.lineTo(i, h/2 + max*h/2);
			c.stroke();
		}	
	}
	mydata.needsRedrawWave = false;


	c = document.querySelector("#canvas2").getContext('2d');
	c.clearRect(0,0,w,h);
	const framePerPixel = mydata.currentFrame / w/mydata.viewRate;

	//selection
	if (mydata.selected){
		c.beginPath();
		c.fillStyle ="rgb(123,123,123,0.6)";

		
		let from = (mydata.selectStartFrame - mydata.viewStartFrame) / framePerPixel;
		let to = (mydata.selectEndFrame - mydata.viewStartFrame) / framePerPixel;
		c.rect(from, 0, to - from, h);
		c.fill();
	}


	//start cursor
	c.beginPath();
	c.strokeStype = "blue";
	c.setLineDash([2, 1]);
	let x = (mydata.playStartFrame - mydata.viewStartFrame) / framePerPixel;
	c.moveTo(x,0);
	c.lineTo(x, h);
	c.stroke();

	//play cursor
	c.beginPath();
	c.strokeStyle = "white";
	c.setLineDash([]);
	x = (mydata.currentFramePlay - mydata.viewStartFrame) / framePerPixel;
	c.moveTo(x ,0);
	c.lineTo(x, h);
	c.stroke();

	{
		let rulerCanvas = document.querySelector("#rulerCanvas");
		let w = rulerCanvas.width;
		let h = rulerCanvas.height;
		c = rulerCanvas.getContext("2d");
		c.clearRect(0,0,w,h);

		c.beginPath();
		c.fillStyle = "lightgray";
		c.rect(0, 0, w, h);
		c.fill();

		c.font = "1em 'ＭＳ Ｐゴシック'"
		c.fillStyle = "black";
		// c.fillText("123456789", w/2,h);
	}
	
}

function onMonitorChanged(){
	const checkBox = document.querySelector("#chkMonitor");
	mydata.monitor = checkBox.checked;
	editorStateChanged();
}

function onLevelChanged(){
	const checkBox = document.querySelector("#chkLevel");
	mydata.level = checkBox.checked;
	mydata.inputLevel = 0;
	redrawCanvas();
	editorStateChanged();
}

document.onkeydown = function (e){
	switch(e.keyCode){
	case 77 /*m*/:
		{
			const checkBox = document.querySelector("#chkMonitor");	
			if (checkBox.checked){
				checkBox.checked = false;
			}else{
				checkBox.checked = true;
			}
			onMonitorChanged();				
		}
		break;

	case 32 /*space*/:
		{
			e.stopPropagation();
			e.preventDefault();
			if (mydata.playing){
				stopPlay();
			}else{
				startPlay();
			}
		}
		break;
	case 39 /*right */:
		if(!e.shiftKey){
			onRight();
		}else{
			onRightWithShift();
		}
		e.stopPropagation();
		e.preventDefault();
		break;
	case 37 /*left */:
		if(!e.shiftKey){
			onLeft();
		}else{
			onLeftWithShift();
		}
		e.stopPropagation();
		e.preventDefault();
		break;
	case 90 /*z*/:
		if (!e.repeat){
			e.stopPropagation();
			e.preventDefault();
			onPlayStopTrack(0);
		}
		break;
	case 88: /*x*/
		if (!e.repeat){
			e.stopPropagation();
			e.preventDefault();
			onPlayStopTrack(1);
		}
		break;
	case 67: /*c*/
		if (!e.repeat){
			e.stopPropagation();
			e.preventDefault();
			onPlayStopTrack(2);
		}
		break;

	case 86: /*v*/
		if (!e.repeat){
			e.stopPropagation();
			e.preventDefault();
			onPlayStopTrack(3);
		}
		break;

	case 66: /*b*/
		if (!e.repeat){
			e.stopPropagation();
			e.preventDefault();
			onPlayStopTrack(4);
		}
		break;	

	case 9: /*TAB*/
		e.stopPropagation();
		e.preventDefault();
		{
			let tapButton = document.querySelector("#tapButton");
			tapButton.click();
		}
		break;

	}


}

document.onkeyup = function (e){
	switch(e.keyCode){
	case 90 /*z*/:
		e.stopPropagation();
		e.preventDefault();
		onPlayStopTrack(0);
		break;
	case 88: /*x*/
		e.stopPropagation();
		e.preventDefault();
		onPlayStopTrack(1);
		break;
	case 67: /*c*/
		e.stopPropagation();
		e.preventDefault();
		onPlayStopTrack(2);
		break;
	case 86: /*v*/
		e.stopPropagation();
		e.preventDefault();
		onPlayStopTrack(3);
		break;
	case 66: /*b*/
		e.stopPropagation();
		e.preventDefault();
		onPlayStopTrack(4);
		break;	
	}
}
function onRight(){
	const w = document.querySelector("#canvas2").width;
	const framePerPixel = mydata.currentFrame/w/mydata.viewRate;

	if(mydata.selected){
		//move start to right
		mydata.selectStartFrame += Math.round(framePerPixel*2);
		mydata.playStartFrame = mydata.selectStartFrame;
	}else{
		//move playStart to right
		mydata.playStartFrame += Math.round(framePerPixel*2);
	}
	redrawCanvas();
}
function onLeft(){
	const w = document.querySelector("#canvas2").width;
	const framePerPixel = mydata.currentFrame/w/mydata.viewRate;	

	if(mydata.selected){
		//move start to left
		mydata.selectStartFrame -= Math.round(framePerPixel*2);
		mydata.playStartFrame = mydata.selectStartFrame;
	}else{
		mydata.playStartFrame -= Math.round(framePerPixel*2);
	}
	redrawCanvas();

}
function onRightWithShift(){
	const w = document.querySelector("#canvas2").width;
	const framePerPixel = mydata.currentFrame/w/mydata.viewRate;	

	if (mydata.selected){
		//move end to right
		mydata.selectEndFrame += Math.round(framePerPixel*2);
	}else{
		//starting select to right
		mydata.selected = true;
		mydata.selectStartFrame = mydata.playStartFrame;
		mydata.selectEndFrame = mydata.selectStartFrame + Math.round(framePerPixel*2);
	}	
	redrawCanvas();
}

function onLeftWithShift(){
	const w = document.querySelector("#canvas2").width;
	const framePerPixel = mydata.currentFrame/w/mydata.viewRate;	

	if (mydata.selected){
		//move end to left
		mydata.selectEndFrame -= Math.round(framePerPixel*2);
	}else{
		//starting select to left
		mydata.selected = true;
		mydata.selectEndFrame = mydata.playStartFrame;
		mydata.selectStartFrame = mydata.selectEndFrame - Math.round(framePerPixel*2);
	}	
	redrawCanvas();


}


function onCanvasMousedown(e){

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const canvas = document.querySelector("#canvas2");
    const w = canvas.width;
	const framePerPixel = (mydata.currentFrame)/w/mydata.viewRate;

	if (!e.shiftKey){
    	mydata.selectStartFrame = Math.round(mydata.viewStartFrame + framePerPixel*x);
    	mydata.selectEndFrame = mydata.selectStartFrame;
    	mydata.selectDragStartFrame = mydata.selectStartFrame;
    	mydata.selected = false;
    	mydata.playStartFrame = mydata.selectDragStartFrame;

		mydata.dragging = true;		
		redrawCanvas();
	}else{
		const pointedFrame = Math.round(mydata.viewStartFrame + framePerPixel*x);
		if(mydata.selected){
			if (pointedFrame < mydata.selectStartFrame){
				mydata.shiftDraggingForLeft = true;
				mydata.selectStartFrame = pointedFrame;
				mydata.playStartFrame = pointedFrame;
			}else if (mydata.selectEndFrame < pointedFrame){
				mydata.shiftDraggingForLeft = false;
				mydata.selectEndFrame = pointedFrame;
			}else{
				//between start and end. move nearest
				if((pointedFrame - mydata.selectStartFrame) < (mydata.selectEndFrame - pointedFrame)){
					mydata.shiftDraggingForLeft = true;
					mydata.selectStartFrame = pointedFrame;
					mydata.playStartFrame = pointedFrame;
					
				}else{
					mydata.shiftDraggingForLeft = false;
					mydata.selectEndFrame = pointedFrame;
					mydata.shiftDragStartFromLeft = false;
				}
			}
		}else{
			if (mydata.playStartFrame < pointedFrame){
				mydata.selectStartFrame = mydata.playStartFrame;
				mydata.selectEndFrame = pointedFrame;
				mydata.shiftDraggingForLeft = false;
			}else{
				mydata.selectStartFrame = pointedFrame;
				mydata.selectEndFrame = mydata.playStartFrame;
				mydata.playStartFrame = mydata.selectStartFrame;
				mydata.shiftDraggingForLeft = true;
			}
			mydata.selected = true;
		}
		mydata.shiftDragging = true;
		redrawCanvas();
	}
}

function onCanvasMousemove(e){

	const rect = e.target.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const canvas = document.querySelector("#canvas2");
	const w = canvas.width;
	const framePerPixel = (mydata.currentFrame)/w/mydata.viewRate;
	const pointedFrame = Math.round(mydata.viewStartFrame + framePerPixel*x);

	if (!e.shiftKey){
		if (!mydata.dragging) return;
		if (pointedFrame < mydata.selectDragStartFrame){
			mydata.selectStartFrame = pointedFrame;
			mydata.selectEndFrame = mydata.selectDragStartFrame;
			mydata.playStartFrame = pointedFrame;
		}else{
			mydata.selectStartFrame = mydata.selectDragStartFrame;
			mydata.selectEndFrame = pointedFrame;
			mydata.playStartFrame = mydata.selectStartFrame;
		}

		if (mydata.selectEndFrame - mydata.selectStartFrame > 1){
			mydata.selected = true;
		}else{
			mydata.selected = false;
			mydata.playStartFrame = mydata.selectStartFrame;
		}
		redrawCanvas();
	}else{
		if (!mydata.shiftDragging) return;
		if(mydata.selected){
			if(mydata.shiftDraggingForLeft){
				mydata.selectStartFrame = pointedFrame;
				mydata.playStartFrame = pointedFrame;
			}else{
				mydata.selectEndFrame = pointedFrame;
			}
			
		}else{
			//not come here
			console.log("something wrong");
		}
		redrawCanvas();
	}

	
}


function onCanvasMouseup(e){

	const rect = e.target.getBoundingClientRect();
	const x = e.clientX - rect.left;
	const canvas = document.querySelector("#canvas2");
	const w = canvas.width;
	const framePerPixel = (mydata.currentFrame)/w/mydata.viewRate;
	const pointedFrame = Math.round(mydata.viewStartFrame + framePerPixel*x);

	if(!e.shiftKey){
		if (pointedFrame < mydata.selectDragStartFrame){
			mydata.selectStartFrame = pointedFrame;
			mydata.selectEndFrame = mydata.selectDragStartFrame;
			mydata.playStartFrame = pointedFrame;
		}else{
			mydata.selectStartFrame = mydata.selectDragStartFrame;
			mydata.selectEndFrame = pointedFrame;
			mydata.playStartFrame = mydata.selectStartFrame;
		}

		if (mydata.selectEndFrame - mydata.selectStartFrame > 1){
			mydata.selected = true;
		}else{
			mydata.selected = false;
			mydata.playStartFrame = mydata.selectStartFrame;
		}

		mydata.dragging = false;
		redrawCanvas();
	}else{
		if(mydata.selected){
			if(mydata.shiftDraggingForLeft){
				mydata.selectStartFrame = pointedFrame;
				mydata.playStartFrame = pointedFrame;
			}else{
				mydata.selectEndFrame = pointedFrame;
			}
			
		}else{
			//not come here
			console.log("something wrong");
		}
		mydata.shiftDragging = false;
		redrawCanvas();
	}	
}

function onCanvasScroll(e){
	e.preventDefault();
	// console.log(e);

	if (Math.abs(e.wheelDeltaY) > Math.abs(e.wheelDeltaX)){

		const deltaY = e.wheelDeltaY;
    	const canvas = document.querySelector("#canvas2");
      	const w = canvas.width
		const viewGravcenterRatio = /*e.offsetX*/(e.clientX-e.currentTarget.getBoundingClientRect().left) / w;
		let viewGravcenterFrame = Math.round(mydata.viewStartFrame
									+ viewGravcenterRatio * (mydata.viewEndFrame - mydata.viewStartFrame));

		mydata.viewRate += 0.005 * deltaY;
		if (mydata.viewRate < 1.0) mydata.viewRate = 1.0;

		if (mydata.viewRate == 1.0){
			mydata.viewStartFrame = 0;
			mydata.viewEndFrame = mydata.currentFrame;
		}else{
			const framePerPixel = (mydata.currentFrame)/w/mydata.viewRate;
			mydata.viewStartFrame = Math.round(viewGravcenterFrame - framePerPixel * viewGravcenterRatio * w);
			mydata.viewEndFrame = Math.round(viewGravcenterFrame + framePerPixel * (1 - viewGravcenterRatio) * w);
		}

		mydata.needsRedrawWave = true;
		redrawCanvas();
	}else{
		const deltaX = -e.wheelDeltaX;
		const prevStart = mydata.viewStartFrame;
		const prevEnd = mydata.viewEndFrame;
		mydata.viewStartFrame += Math.round(deltaX/mydata.viewRate*120);
		mydata.viewEndFrame += Math.round(deltaX/mydata.viewRate*120);

		if(mydata.viewStartFrame < 0){
			mydata.viewStartFrame = 0;
			mydata.viewEndFrame = mydata.viewStartFrame + (prevEnd - prevStart);
		}
		if(mydata.viewEndFrame > mydata.currentFrame){
			mydata.viewEndFrame = mydata.currentFrame;
			mydata.viewStartFrame = mydata.viewEndFrame - (prevEnd - prevStart);
		}
		mydata.needsRedrawWave = true;
		redrawCanvas();
	}

}

//https://qiita.com/HirokiTanaka/items/56f80844f9a32020ee3b
//https://github.com/mattdiamond/Recorderjs/blob/master/lib/recorder.js
function createWAVBlob(){

	let sampleNum = mydata.selectEndFrame - mydata.selectStartFrame;

	function encodeWAV(){
		var buffer = new ArrayBuffer(44 + sampleNum*4 );
		var view = new DataView(buffer);

		function writeString(view, offset, string){
			for (var i = 0; i < string.length; i++){
				view.setUint8(offset+i,string.charCodeAt(i));
			}
		}

		function floatTo16BitPCM(output, offset){
			for (var i = 0; i < sampleNum ;i++,offset+=4){
				var sL = Math.max(-1, Math.min(1, audioBufferLeft[mydata.selectStartFrame+i]));
				output.setInt16(offset, sL < 0 ? sL*0x8000: sL*0x7FFF, true);
			
				var sR = Math.max(-1, Math.min(1, audioBufferRight[mydata.selectStartFrame+i]));
				output.setInt16(offset+2, sR < 0 ? sR*0x8000: sR*0x7FFF, true);
			}
		}

        writeString(view, 0, 'RIFF');  // RIFFヘッダ
        view.setUint32(4, 36 + sampleNum*4, true); // これ以降のファイルサイズ
        writeString(view, 8, 'WAVE'); // WAVEヘッダ
        writeString(view, 12, 'fmt '); // fmtチャンク
        view.setUint32(16, 16, true); // fmtチャンクのバイト数
        view.setUint16(20, 1, true); // フォーマットID
        view.setUint16(22, 2, true); // チャンネル数
        view.setUint32(24, 44100, true); // サンプリングレート
        view.setUint32(28, 44100*4, true); // データ速度
        view.setUint16(32, 4, true); // ブロックサイズ
        view.setUint16(34, 16, true); // サンプルあたりのビット数
        writeString(view, 36, 'data'); // dataチャンク
        view.setUint32(40, sampleNum * 4, true); // 波形データのバイト数
        floatTo16BitPCM(view, 44); // 波形データ

		return view;
	}

	var dataview = encodeWAV();

	var audioBlob = new Blob([dataview], {type:"audio\/wav"});

	return audioBlob;
}

function exportWAV(){
	var blob = createWAVBlob();
	var a = document.createElement("a");
	a.download = "sample.wav";
	a.href = window.URL.createObjectURL(blob);
	a.click();
}

function uploadWAV(){
	var blob = createWAVBlob();
	var formData = new FormData();
	formData.append("upfile", blob);
	formData.append("fname","anything.wav" );

	$.ajax("./uploadblob", {
		method:"POST",
		data:formData,
		contentType : false,
		processData : false,
		complete : function(data) {
			console.log("upload done(blob)");
			console.log(data);
		}
	});
}

function onSoundListClick(){
	console.log("single click");
	$("#soundDeleteButton").get(0).disabled = false;
	mydata.vTrack.pause();
}

function onSoundListDblClick(){

	$("#soundDeleteButton").get(0).disabled = false;
	mydata.vTrack.pause();

	let soundName = mydata.soundList.selectedText();

	console.log("double click for sound name = " + soundName);


	//get blob by ajax
	let xhr = new XMLHttpRequest();
	xhr.open("GET", "/sound/" + soundName);
	xhr.responseType = "blob";
	xhr.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			mydata.vTrack.loadSampleFromFile(this.response, "vTrack")
			.then(function () {
				console.log("vtrack load done");
				mydata.vTrack.setQuantize(false);
				mydata.vTrack.setLoop(false);
				mydata.vTrack.play();
			}, function (e) {
				console.log("vtrack load failed:" + e);
			});
		}
	}

	xhr.send();
}


function onTapClicked(e){
	console.log("TAP");
	mydata.tapTimes[0] = mydata.tapTimes[1];
	mydata.tapTimes[1] = mydata.tapTimes[2];
	mydata.tapTimes[2] = mydata.tapTimes[3];
	mydata.tapTimes[3] = mydata.tapTimes[4];
	mydata.tapTimes[4] = mydata.tapTimes[5];
	mydata.tapTimes[5] = mydata.tapTimes[6];
	mydata.tapTimes[6] = mydata.tapTimes[7];
	mydata.tapTimes[7] = Date.now();
	if (mydata.tapTimes[0] == null){
		// no enough counts
		return;
	}

	//tantative calculation
	let duration = (mydata.tapTimes[7] - mydata.tapTimes[0])/1000/7;
	let bpm = 60 / duration;

	if ((60 < bpm) && (bpm < 240)){
		mydata.bpm = bpm;
		let bpmLabel = document.querySelector("#bpmLabel");
		bpmLabel.innerText = bpm.toFixed(1);
	}
}

function saveSong(){
	console.log($("#songTitle").val());
	let song = {};
	song.title = $("#songTitle").val();
	song.tracks = new Array(5);
	for (let i = 0; i < song.tracks.length; i++){
		song.tracks[i] = {};
		song.tracks[i].name = $(".title").eq(i).text();
		song.tracks[i].speed = mydata.trackRatio[i];
		song.tracks[i].master = mydata.trackMaster[i];
		song.tracks[i].volume = mydata.trackVolume[i];
		song.tracks[i].pan = mydata.trackPan[i];
		song.tracks[i].quantize = mydata.trackQuantize[i];
		song.tracks[i].offset = mydata.trackOffset[i];
	}
	let json = JSON.stringify(song, undefined, 2);
	// console.log(json);

	$.ajax("./uploadsong", {
		method:"POST",
		data:json,
		contentType : "application/json",
		dataType : "json",
		complete : function(data){
			console.log("song update done");
			console.log(data.responseText);
			mydata.songList.reload();
		}
	});
}

function loadSong(){
	let songPath = mydata.songList.selectedText();
	if (!songPath) return;

	console.log("load song : " + songPath);

	//remove .json
	let songTitle = songPath.substr(0, songPath.lastIndexOf(".json"));

	$("#songTitle").get(0).value = songTitle;

	$.ajax("./song/" + songPath,{
		method:"GET",
		dataType : "json",
		complete : function(data){
			console.log("song download done");
			console.log(data.responseJSON);
			loadSongByJSON(data.responseJSON);
		}
	});
}

function loadSongByJSON(songJSON){
	let tracks = songJSON.tracks;
	for (let i = 0; i < tracks.length ; i++){
		if (tracks[i].name != "----"){ 
			loadSample(i, tracks[i].name);
		}else{
			clearTrack(i);
		}
		if(tracks[i].speed != null){
			mydata.trackRatio[i] = tracks[i].speed;
			updateSpeedLabel(i);
		}

		if(tracks[i].master != null){
			$(".masterChk").get(i).checked = tracks[i].master;
			mydata.trackMaster[i] = tracks[i].master;
		}

		if(tracks[i].volume != null){
			$(".volumeSlider").get(i).value = tracks[i].volume * 100;
			onVolumeChanged(i);
		}

		if(tracks[i].pan != null){
			$(".panSlider").get(i).value = tracks[i].pan * 100;
			onPanChanged(i);
		}

		if(tracks[i].quantize != null){
			$(".quantizeChk").get(i).checked = mydata.trackQuantize[i];
			mydata.trackQuantize[i] = mydata.trackQuantize[i];
		}

		if(tracks[i].offset != null){
			$(".offsetSlider").get(i).value = tracks[i].offset;
			onOffsetChanged(i);
		}
	}

}

function tabSoundsClicked(){
	let soundList = $("#soundListContainer").get(0);
	let songList = $("#songListContainer").get(0);

	soundList.style.display = "";
	songList.style.display = "none";

	$("#tabButtonSounds").get(0).style.backgroundColor = "cyan";
	$("#tabButtonSongs").get(0).style.backgroundColor = "";

}

function tabSongsClicked(){
	let soundList = $("#soundListContainer").get(0);
	let songList = $("#songListContainer").get(0);

	soundList.style.display = "none";
	songList.style.display = "";

	$("#tabButtonSounds").get(0).style.backgroundColor = "";
	$("#tabButtonSongs").get(0).style.backgroundColor = "cyan";

}


function soundDeleteClicked(){
	let soundName = mydata.soundList.selectedText();
	if (soundName){
		console.log("deleting sound : " + soundName);
	}else{
		return;
	}


	$.ajax("./delete/sound", {
		method: "POST",
		data : {
			"name" : soundName
		},
		complete: function (e) {
			if (e.status == 403){
				alert("you should log in, and you can delete you have uploaded");
				console.log(e.responseText);
				return;
			}
			if (e.status == 200){
				alert("sound : " + soundName +" deleted.");
				mydata.soundList.reload();
				$("#soundDeleteButton").get(0).disabled = true;
			}
			console.log("sound delete done");
			console.log(e.responseText);

		}
	});

}