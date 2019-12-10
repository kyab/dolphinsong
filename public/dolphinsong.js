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
// mydata.outAudio = null;

mydata.needsRedrawWave = false;

// mydata.dragging = false;
// mydata.shiftDragging = false;

// mydata.viewStartFrame = 0;
// mydata.viewEndFrame = 0;
// mydata.viewCenterFrame = 0;
// mydata.viewRate = 1.0;
mydata.selectStartFrame = 0;
mydata.selectEndFrame = 0 ;
mydata.selected = false;
mydata.selectDragStartFrame = 0;
mydata.shiftDraggingForLeft = false;

// mydata.trackLoaded = new Array(TRACK_NUM);

// mydata.trackBufferLeft = new Array(TRACK_NUM);
// mydata.trackBufferRight = new Array(TRACK_NUM);
// mydata.trackPlaying = new Array(TRACK_NUM);
// mydata.trackCurrentFrame = new Array(TRACK_NUM);
// mydata.trackCurrentFrame_scratch = new Array(TRACK_NUM);
// mydata.trackLength = new Array(TRACK_NUM);
// mydata.trackRatio = new Array(TRACK_NUM);
// mydata.trackMaster = new Array(TRACK_NUM);
// mydata.trackVolume = new Array(TRACK_NUM);
// mydata.trackPan = new Array(TRACK_NUM);
// mydata.trackOffset = new Array(TRACK_NUM);
// mydata.trackQuantize = new Array(TRACK_NUM);
// mydata.trackWaitCount = new Array(TRACK_NUM);
// for (let i=0;i<TRACK_NUM;i++){
// 	mydata.trackLoaded[i] = false;
// 	mydata.trackPlaying[i] = false;
// 	mydata.trackRatio[i] = 1;
// 	mydata.trackCurrentFrame[i] = 0;
// 	mydata.trackCurrentFrame_scratch[i] = 0;
// 	mydata.trackLength[i] = 0;
// 	mydata.trackMaster[i] = false;
// 	mydata.trackVolume[i] = 1;
// 	mydata.trackPan[i] = 0;
// 	mydata.trackOffset[i] = 0;
// 	mydata.trackQuantize[i] = true;
// 	mydata.trackWaitCount[i] = 0;
// }


mydata.isEditorActive = false;
// mydata.isPlayerActive = false;
mydata.timer = null;

// mydata.grain_size = 6000;

mydata.tracks = new Array(TRACK_NUM);
for (let i=0;i<TRACK_NUM;i++){
	mydata.tracks[i] = new MyTrack();
}
mydata.vTrack = new MyTrack();

mydata.tapTimes = new Array(8);
mydata.bpm = 120.0;
mydata.tapMaster = false;
mydata.autoBPM = false;

mydata.editorMaster = false;

mydata.effectBypass = true;

mydata.abSwitchValue = 0.0;

var audioContext;
var audioContext2 = null;

var audioElem;
var audioElem2;


var audioBufferLeft = new Float32Array(44100*60*10);
var audioBufferRight = new Float32Array(44100*60*10);


// var calcState = {};
// calcState.start = 0;
// calcState.end = 3000;
// calcState.i = 0;
// calcState.currentFrame = 0;

// calcState.stretchedLX = new Array(TRACK_NUM);
// calcState.stretchedRX = new Array(TRACK_NUM);
// calcState.current_grain_start = new Array(TRACK_NUM);
// calcState.current_x = new Array(TRACK_NUM);
// calcState.current_grain_start2 = new Array(TRACK_NUM);
// calcState.current_x2 = new Array(TRACK_NUM);
// calcState.current_grain_start_scratch = new Array(TRACK_NUM);
// calcState.current_x_scratch = new Array(TRACK_NUM);
// calcState.current_grain_start2_scratch = new Array(TRACK_NUM);
// calcState.current_x2_scratch = new Array(TRACK_NUM);
// for (let i = 0; i < TRACK_NUM; i++){
// 	calcState.stretchedLX[i] = new Float32Array(44100*60);
// 	calcState.stretchedRX[i] = new Float32Array(44100*60);
// 	calcState.current_grain_start[i] = 0;
// 	calcState.current_x[i] = 0;
// 	calcState.current_grain_start2[i] = mydata.grain_size / 2;
// 	calcState.current_x2[i] = -1.0 * Math.round(mydata.grain_size/2*mydata.trackRatio[i]);
// }

const RPS = -33.3 / 60 * (Math.PI * 2);
let turnTable = {
	rad: Math.PI / 3,
	timer: null,
	speed: 1.0,
	//internal state
	_processing: false,
	_startOffsetRad: 0,
	_prevSec: 0	
}

var turnTables = new Array(TRACK_NUM);
for (let i = 0 ; i < TRACK_NUM; i++){
	turnTables[i] = {};
	turnTables[i].rad = Math.PI / 3;
	turnTables[i].timer = null;
	turnTables[i].speed = 1.0;

	//internal state
	turnTables[i]._processing = false;
	turnTables[i]._startOffsetRad = 0;
	turnTables[i]._prevSec = 0;
}

var turnTableA = {};
var turnTableB = {};
([turnTableA, turnTableB]).forEach(function(t){
	t.rad = Math.PI / 3;
	t.timer = null;
	t.speed = 1.0;

	t._processing = false;
	t._startOffsetRad = 0;
	t._prevSec = 0;
})

window.addEventListener("resize", function(e){
	mydata.editor.onResize();
});


window.addEventListener("load", function(){

	mydata.editor = new Editor(document.querySelector("#canvas2"));
	mydata.editor.onResize();

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

	const playModeSelect = document.querySelectorAll(".playModeSelect");
	playModeSelect.forEach(function(s){
		s.addEventListener("change", onPlayModeChanged, false);
	});

	const ttButtons = document.querySelectorAll(".ttButton");
	ttButtons.forEach(function(b){
		b.addEventListener("click", onTTButtonClicked, false);
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

	$(".stemVolumeButton").get().forEach(function(b){
		b.addEventListener("click", onStemVolumeClicked, false);
	});

	const drumVolumeSliders = document.querySelectorAll(".stemVolSliderDrams");
	drumVolumeSliders.forEach(function(s){
		s.addEventListener("input", onDrumVolumeSliderChanged, false);
	});

	const drumVolumeResetButtons = document.querySelectorAll(".stemVolResetButtonDrams");
	drumVolumeResetButtons.forEach(function(b){
		b.addEventListener("click", onDrumVolumeResetClicked, false);
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


	// canvas2.addEventListener("dragover", function(e){
	// 	e.preventDefault();
	// 	e.dataTransfer.dropEffect = "copy";
	// });
	// canvas2.addEventListener("drop", onEditorDrop, false);

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

	// mydata.vTrack.onStateChanged = playStateChanged;

	const tapButton = document.querySelector("#tapButton");
	tapButton.addEventListener("click", onTapClicked, false);

	const autoBPMChk = document.querySelector("#autoBPMChk");
	autoBPMChk.addEventListener("change", onAutoBPMChanged, false);

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

	$("#effectBypassChk").on("change", onEffectBypassChanged);

	$("#aBtn").on("click", onAButtonClicked);
	$("#bBtn").on("click", onBButtonClicked);
	$("#abSlider").on("input", onABSliderChanged);

	$(".Achk").on("change", onAChkChanged);
	$(".Bchk").on("change", onBChkChanged);

	$("#filterSlider").on("input", onFilterSliderChanged);

	$("#chkEditorMaster").on("change", onMasterChanged);


	initMedia();
	initMIDI();

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

function onStemVolumeClicked(e){
	let index = getIndexFromEvent(e, ".stemVolumeButton");
	onStemVolume(index);
}

function onDrumVolumeSliderChanged(e){
	let index = getIndexFromEvent(e, ".stemVolSliderDrams");
	onDrumVolumeChanged(index);
}

function onDrumVolumeResetClicked(e) {
	let index = getIndexFromEvent(e, ".stemVolResetButtonDrams");
	document.querySelectorAll(".stemVolSliderDrams")[index].value = 100;
	onDrumVolumeChanged(index);
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
	let quantize = false;
	if (document.querySelectorAll(".quantizeChk")[index].checked){
		quantize = true;
	}else{
		quantize = false;
	}

	mydata.tracks[index].setQuantize(quantize);
	mydata.mainNode.port.postMessage({
		"cmd" : "setQuantize",
		"index" : index,
		"quantize" : quantize
	});
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

function onPlayModeChanged(e){
	let index = getIndexFromEvent(e, ".playModeSelect");
	let select = document.querySelectorAll(".playModeSelect")[index];
	let mode = select.options[select.selectedIndex].text;
	mydata.tracks[index].playMode = mode;
	console.log(mode);
}

function onTTButtonClicked(e){
	let index = getIndexFromEvent(e, ".ttButton");
	onTT(index);
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
		loadSample2(mydata.tracks[index], index,  e.dataTransfer.getData("text"))
		.then(function(){
			let titles = document.querySelectorAll(".title");
			titles[index].innerText = mydata.soundList.selectedText();			
		});
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

// function onEditorDrop(e){
// 	e.preventDefault();

// 	const file = e.dataTransfer.files[0];
// 	onEditorLoadSampleFromFile(file);
// }

function onSyncClick(e){

	let index = getIndexFromEvent(e, ".syncButton");
	sync(index);
}

function sync(index){
	let masterIndex = getMasterIndex();

	if (masterIndex == -1) return;	//no master
	if (masterIndex != 99 && masterIndex != 98){
		if (!mydata.tracks[masterIndex]._loaded) return;
	}
	if (!mydata.tracks[index]._loaded) return;

	let c = 1;
	let masterRatio = 0;
	let masterLength = 0;
	if (masterIndex == 99){
		masterRatio = 1.0;
		masterLength = 60 / mydata.bpm * 44100;
	}else if (masterIndex == 98){
		masterRatio = 1.0;
		if(mydata.editor.selected){
			masterLength = mydata.editor.selectEndFrame - mydata.editor.selectStartFrame;
		}else{
			masterLength = mydata.editor.currentFrame;
		}
	}else{
		masterRatio = mydata.tracks[masterIndex]._ratio;
		masterLength = mydata.tracks[masterIndex]._length;
	}

	while(true){
		mydata.tracks[index]._ratio = masterRatio * masterLength / mydata.tracks[index]._length / c;

		if (1/mydata.tracks[index]._ratio < 0.75){
			c*=2;
			continue;
		}else if (1/mydata.tracks[index]._ratio > 1.5){
			c/=2;
			continue;
		}
		break;
	}

	// console.log("trackRatio for " + (index+1) + " = " + mydata.tracks[index]._ratio);

	mydata.mainNode.port.postMessage({
		"cmd" : "setRatio",
		"index" : index,
		"ratio" : mydata.tracks[index]._ratio
	});

	updateSpeedLabel(index);

}

function updateSpeedLabel(index){
	let speedSlider = document.querySelectorAll(".speedSlider");
	let value = 0;
	if (1/mydata.tracks[index]._ratio * 100 >= 100){
		value = 1/mydata.tracks[index]._ratio*100;
	}else{
		value = 2*(1/mydata.tracks[index]._ratio*100 - 50);
	}
	speedSlider[index].value = value; 

	let speedLabel = document.querySelectorAll(".speedLabel");
	let roundedSpeed = 1/mydata.tracks[index]._ratio * 100;
	roundedSpeed = Math.round(roundedSpeed *1000) / 1000;
	speedLabel[index].innerText = roundedSpeed.toString() + "%";
}

function onHalfSpeedClick(e){

	let index = getIndexFromEvent(e, ".halfSpeedButton");
	mydata.tracks[index]._ratio *= 2;

	mydata.mainNode.port.postMessage({
		"cmd" : "setRatio",
		"index" : index,
		"ratio" : mydata.tracks[index]._ratio
	});

	updateSpeedLabel(index);
}

function onDoubleSpeedClick(e){

	let index = getIndexFromEvent(e, ".doubleSpeedButton");
	mydata.tracks[index]._ratio /= 2;

	mydata.mainNode.port.postMessage({
		"cmd": "setRatio",
		"index": index,
		"ratio": mydata.tracks[index]._ratio
	});

	updateSpeedLabel(index);
}


//return 99 if tap is master
//return 98 if editor is master
function getMasterIndex(){
	let index = -1;
	
	if (mydata.tapMaster) return 99;
	if (mydata.editorMaster) return 98;
	

	for (let i = 0; i < mydata.tracks.length; i++){
		if (mydata.tracks[i].isMaster()){
			index = i;
			break;
		}
	}
	return index;

}

function onAutoBPMChanged(e){

	const autoBPMChk = document.querySelector("#autoBPMChk");
	mydata.autoBPM = autoBPMChk.checked;
}

function onMasterChanged(e){

	const tapMasterChk = document.querySelector("#tapMasterChk");
	const editorMasterChk = document.querySelector("#chkEditorMaster");
	const masterChks = document.querySelectorAll(".masterChk");

	let checkBox = e.currentTarget;
	let index = getIndexFromEvent(e, ".masterChk");

	if (checkBox.checked){
		for (let i = 0; i < masterChks.length; i++){
			if (i != index){
				masterChks[i].checked = false;
				mydata.tracks[i].setMaster(false);
			}
		}

		if (checkBox == tapMasterChk){
			mydata.tapMaster = true;
			mydata.editorMaster = false;
			editorMasterChk.checked = false;
		} else if (checkBox == editorMasterChk){
			mydata.editorMaster = true;
			mydata.tapMaster = false;
			tapMasterChk.checked = false;
		}else{
			tapMasterChk.checked = false;
			mydata.tapMaster = false;
			editorMasterChk.checked = false;
			mydata.editorMaster = false;
			mydata.tracks[index].setMaster(true);
		}
	}else{
		if (checkBox == tapMasterChk){
			mydata.tapMaster = false;
		} else if (checkBox == editorMasterChk){
			mydata.editorMaster = false;
		}else{
			mydata.tracks[index].setMaster(false);
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

	mydata.tracks[index].setRatio(1/(speed/100));

	mydata.mainNode.port.postMessage({
		"cmd" : "setRatio",
		"index" : index,
		"ratio" : (1/(speed/100))
	});

	speedLabel.innerText = speed.toString() + "%";
}

function onVolumeChanged(index){
	const volumeSlider = document.querySelectorAll(".volumeSlider")[index];
	const volumeLabel = document.querySelectorAll(".volumeLabel")[index];

	let val = volumeSlider.value;

	let db = 20*Math.log10(val/100);
	let roundedDb = Math.round(db *100) / 100;

	mydata.tracks[index].setVolume(val/100);
	mydata.mainNode.port.postMessage({
		"cmd" : "setVolume",
		"index" : index,
		"volume": mydata.tracks[index]._volume
	});

	volumeLabel.innerText = roundedDb.toString() + "dB";
}

function onBassVolumeChanged(index) {
	let s = $("#volumeSliderBass" + index.toString()).get(0);

	let val = s.value;

	let db = 20 * Math.log10(val / 100);
	let roundedDb = Math.round(db * 100) / 100;

	let si = STEM_INDEX_BASS;

	mydata.mainNode.port.postMessage({
		"cmd": "setStemVolume",
		"index": index,
		"stemIndex": si,
		"volume": val / 100
	});
}


function onDrumsVolumeChanged(index){
	let s = $("#volumeSliderDrums" + index.toString()).get(0);

	let val = s.value;

	let db = 20 * Math.log10(val / 100);
	let roundedDb = Math.round(db * 100) / 100;

	let si = STEM_INDEX_DRUMS;

	mydata.mainNode.port.postMessage({
		"cmd": "setStemVolume",
		"index": index,
		"stemIndex": si,
		"volume": val / 100
	});
}

function onOtherVolumeChanged(index) {
	let s = $("#volumeSliderOther" + index.toString()).get(0);

	let val = s.value;

	let db = 20 * Math.log10(val / 100);
	let roundedDb = Math.round(db * 100) / 100;

	let si = STEM_INDEX_OTHER;

	mydata.mainNode.port.postMessage({
		"cmd": "setStemVolume",
		"index": index,
		"stemIndex": si,
		"volume": val / 100
	});
}

function onPianoVolumeChanged(index) {
	let s = $("#volumeSliderPiano" + index.toString()).get(0);

	let val = s.value;

	let db = 20 * Math.log10(val / 100);
	let roundedDb = Math.round(db * 100) / 100;

	let si = STEM_INDEX_PIANO;

	mydata.mainNode.port.postMessage({
		"cmd": "setStemVolume",
		"index": index,
		"stemIndex": si,
		"volume": val / 100
	});
}

function onVocalsVolumeChanged(index) {
	let s = $("#volumeSliderVocals" + index.toString()).get(0);

	let val = s.value;

	let db = 20 * Math.log10(val / 100);
	let roundedDb = Math.round(db * 100) / 100;

	let si = STEM_INDEX_VOCALS;

	mydata.mainNode.port.postMessage({
		"cmd": "setStemVolume",
		"index": index,
		"stemIndex": si,
		"volume": val / 100
	});
}


function onPanChanged(index){
	const panSlider = document.querySelectorAll(".panSlider")[index];
	const panLabel = document.querySelectorAll(".panLabel")[index];

	let val = panSlider.value;

	mydata.tracks[index].setPan(val/100);

	mydata.mainNode.port.postMessage({
		"cmd": "setPan",
		"index": index,
		"pan": mydata.tracks[index]._pan
	});

	panLabel.innerText = val.toString();
}

function onOffsetChanged(index){
	const offsetSlider = document.querySelectorAll(".offsetSlider")[index];
	const offsetLabel = document.querySelectorAll(".offsetLabel")[index];

	let val = offsetSlider.valueAsNumber;
	mydata.tracks[index].setOffset(val);

	mydata.mainNode.port.postMessage({
		"cmd": "setOffset",
		"index": index,
		"offset" : val
	});

	offsetLabel.innerText = val.toString();
}


function onLoadSample(index){
	console.log("loading sample from editor to track:" + (index+1));

	mydata.tracks[index].loadSampleFromBuffer(
		audioBufferLeft, audioBufferRight, mydata.selectStartFrame, mydata.selectEndFrame);

	let titles = document.querySelectorAll(".title");
	titles[index].innerText = "sample" + (index+1);

	{
		if (!mydata.mainNode) return;

		let m = {
			"cmd": "setBuffer",
			"index": index,
			"left": mydata.tracks[index]._bufferLeft,
			"right": mydata.tracks[index]._bufferRight
		};
		let t = [
			mydata.tracks[index]._bufferLeft.buffer,
			mydata.tracks[index]._bufferRight.buffer
		];

		mydata.mainNode.port.postMessage(m, t);
	}
}

function onLoadSampleFromFile(index, file){
	// mydata.tracks[index].loadSampleFromFile(file, file.name)
	MyUtility.loadFromBlob(file)
	.then(function(b){
		mydata.tracks[index]._bufferLeft = b.left;
		mydata.tracks[index]._bufferRight = b.right;

		let titles = document.querySelectorAll(".title");
		titles[index].innerText = file.name;
		{
			if (!mydata.mainNode) return;

			let m = {
				"cmd": "setBuffer",
				"index": index,
				"left": mydata.tracks[index]._bufferLeft,
				"right": mydata.tracks[index]._bufferRight
			};
			let t = [
				mydata.tracks[index]._bufferLeft.buffer,
				mydata.tracks[index]._bufferRight.buffer
			];

			mydata.mainNode.port.postMessage(m, t);
		}
	});
}

function onLoadSampleFromList(index){
	loadSample2(mydata.tracks[index], index, mydata.soundList.selectedText())
	.then(function(){
		let titles = document.querySelectorAll(".title");
		titles[index].innerText = mydata.soundList.selectedText();
	});
}

// https://teratail.com/questions/75149
function createLoaderPromise(soundName, stemName){
	let p = new Promise(function(resolve, reject){
		let xhr = new XMLHttpRequest();
		xhr.open("GET", "/sound/" + soundName + "/" + stemName);
		xhr.responseType = "blob";
		xhr.onreadystatechange = function(){
			if (this.readyState == 4 && this.status == 200) {
				resolve(this.response);
			}			
		};
		xhr.send();
	});
	return p;
}

function loadSample2(track, index, soundName, isVirtual){
	let promises = [];
	promises[0] = createLoaderPromise(soundName, "bass");
	promises[1] = createLoaderPromise(soundName, "drums");
	promises[2] = createLoaderPromise(soundName, "other");
	promises[3] = createLoaderPromise(soundName, "piano");
	promises[4] = createLoaderPromise(soundName, "vocals");

	return new Promise(function(resolve, reject){
		Promise.all(promises).then(function(responses){
			console.log("all stems downloaded");
			console.log(responses);
			promises[0] = onSampleDownloaded(track, index, responses[0], soundName, "bass");
			promises[1] = onSampleDownloaded(track, index, responses[1], soundName, "drums");
			promises[2] = onSampleDownloaded(track, index, responses[2], soundName, "other");
			promises[3] = onSampleDownloaded(track, index, responses[3], soundName, "piano");
			promises[4] = onSampleDownloaded(track, index, responses[4], soundName, "vocals");
			Promise.all(promises).then(function(){
				resolve();
			});
		});
	});
}

function onSampleDownloaded(track, index, blob, soundName, stemName){

	let si = 0;
	switch (stemName) {
		case "bass":
			si = STEM_INDEX_BASS;
			break;
		case "drums":
			si = STEM_INDEX_DRUMS;
			break;
		case "other":
			si = STEM_INDEX_OTHER;
			break;
		case "piano":
			si = STEM_INDEX_PIANO;
			break;
		case "vocals":
			si = STEM_INDEX_VOCALS;
			break;
	}

	console.log("onSampleDownloaded, " + si.toString());

	return new Promise(function(resolve, reject){
		
		// track.loadSampleFromFile(blob, soundName, si)
		MyUtility.loadFromBlob(blob)
		.then(function(b){
			track._bufferLeft[si] = b.left;
			track._bufferRight[si] = b.right;
			track._currentFrame = 0;
			track._length = b.left.length;
			track._plaing = false;
			track._loaded = true;

			if (!mydata.mainNode) return;

			let m = {
				"cmd": "setBufferStems",
				"index": index,
				"stemIndex": si,
				"left": track._bufferLeft[si],
				"right": track._bufferRight[si]
			};

			let t = [
				track._bufferLeft[si].buffer,
				track._bufferRight[si].buffer
			];

			mydata.mainNode.port.postMessage(m, t);
			resolve();
		});
	});
}



function clearTrack(index){
	mydata.tracks[index].clear();

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


function onPlayStopTrack(index){

	let masterIndex = getMasterIndex();

	let masterTrack = null;
	
	if (masterIndex == 99 || masterIndex ==98){
		masterTrack = null;
	}else if(masterIndex == -1){
		masterTrack = null;
	}else{
		masterTrack = mydata.tracks[masterIndex];
	}

	mydata.tracks[index].togglePlay();
	onMainEngineStateChanged();

	{
		if (!mydata.mainNode) return;
		let m = {
			"cmd": "playStop",
			"index" : index,
		}

		mydata.mainNode.port.postMessage(m);
	}

}

function onMainEngineStateChanged(){
	let shouldStop = true;

	if (mydata.vTrack.isPlaying()){
		shouldStop = false;
	}

	for (let i = 0 ; i < TRACK_NUM ; i++){
		if (mydata.tracks[i].isPlaying()){
			shouldStop = false;
		}
	}
	if (shouldStop){
		// audioContext2.suspend();
		// audioElem2.pause();
		
		console.log("AudioEngine(main) paused");
	}else{
		
		
		// audioElem2.play();
		// audioContext2.resume();
		console.log("AudioEngine(main) resumed");
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
			audioContext.suspend();
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
		},100);
	}
}


function initMIDI(){
	navigator.requestMIDIAccess()
	.then(function (midiAccess) {
		// console.log(midiAccess);
		midiAccess.inputs.forEach(function (input) {
			input.addEventListener("midimessage", onMIDIMessage, false);
			console.log("[MIDI input]" + input.name);
		});
	}, function (e) {
		console.log("requestMIDIAccess error");
		console.log(e);
	});
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
		editorStateChanged();
		createMainEngine();
		// startBeatDetectEngine();
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
	// mydata.isPlayerActive = false;

	let list = document.querySelector("#selectOutputDevices");
	mydata.outDevId = list.options[list.selectedIndex].value;

	if (mydata.outDevId == "default") {
		//user wants default
		$.removeCookie("outDevice");
	} else {
		$.cookie("outDevice", mydata.outDevId,
			{ expires: 365 * 10 });
	}


	// playStateChanged();
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
		audioContext = new AudioContext({latencyHint:"balanced"});

		let mediastreamsource = audioContext.createMediaStreamSource(stream);
		let scriptProcessor = audioContext.createScriptProcessor(0, 2, 2);
		scriptProcessor.onaudioprocess = onAudioProcess;

		let dest = audioContext.createMediaStreamDestination();

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
			console.log("EditorEngine created. with baseLatency:" + audioContext.baseLatency.toString());
		});
	});
}

function createMainEngine(){
	audioContext2 = new AudioContext({latencyHint:0});

	mydata.dest = audioContext2.createMediaStreamDestination();
	
	audioContext2.audioWorklet.addModule("mainworklet.js")
	.then(function(){
		mydata.mainNode = new AudioWorkletNode(audioContext2, "main-processor", {
			outputChannelCount:[2]
		});
		let mainNode = mydata.mainNode;

		mydata.filterNodeLow = audioContext2.createBiquadFilter();
		mydata.filterNodeLow.type = "lowpass";
		mydata.filterNodeLow.gain.value = -40;
		mydata.filterNodeLow.frequency.value = 22050;

		mydata.filterNodeHigh = audioContext2.createBiquadFilter();
		mydata.filterNodeHigh.type = "highpass";
		mydata.filterNodeHigh.gain.value = -40;
		mydata.filterNodeHigh.frequency.value = 0;

		mainNode.connect(mydata.filterNodeLow);
		mydata.filterNodeLow.connect(mydata.filterNodeHigh);
		mydata.filterNodeHigh.connect(mydata.dest);


		audioElem2 = new Audio();
		audioElem2.srcObject = mydata.dest.stream;
		audioElem2.setSinkId(mydata.outDevId);
		audioElem2.play();

		console.log("MainEngine created. with baseLatency:" + audioContext2.baseLatency.toString());
	});
}

function onAudioProcess(e) {
	// console.log("onAudioProcess");

	let inbuf = e.inputBuffer;
	let outbuf = e.outputBuffer;

	const len = inbuf.getChannelData(0).length;
	const outLeft = outbuf.getChannelData(0);
	const outRight = outbuf.getChannelData(1);
	const inLeft = inbuf.getChannelData(0);
	const inRight = inbuf.getChannelData(1);

	//monitor
	if (mydata.monitor){
		outbuf.copyToChannel(inLeft, 0);
		outbuf.copyToChannel(inRight, 1);

    } else {

    	for (let i=0; i < len; i++){
    		outLeft[i] = 0;
    		outRight[i] = 0;
    	}
	}
	
	//loop editor
	// if (mydata.playing) {
	// 	for (let i = 0; i < outLeft.length; i++) {
	// 		outLeft[i] += audioBufferLeft[mydata.currentFramePlay];
	// 		outRight[i] += audioBufferRight[mydata.currentFramePlay];
	// 		mydata.currentFramePlay++;

	// 		if (mydata.selected) {
	// 			if (mydata.currentFramePlay > mydata.selectEndFrame) {
	// 				mydata.currentFramePlay = mydata.selectStartFrame;
	// 			}
	// 		} else {
	// 			if (mydata.currentFramePlay > mydata.currentFrame) {
	// 				mydata.playing = false;
	// 				redrawCanvas();
	// 				// playStateChanged();
	// 				break;
	// 			}
	// 		}

	// 	}
	// }

	//level monitor
	if (mydata.level){
		//input level calc
		let level = 0.0;
		for (let i = 0; i < len; i++){
			let valL = Math.abs(inLeft[i]);
			if (valL > level) level = valL;
			let valR = Math.abs(inRight[i]);
			if (valR > level) level = valR;
		}
		mydata.inputLevel = level;
	}

	//recording 
    // if (mydata.recording){
    // 	for (let i=0; i < inbuf.getChannelData(0).length; i++){
	//     	audioBufferLeft[mydata.currentFrame] = inbuf.getChannelData(0)[i];
	// 		audioBufferRight[mydata.currentFrame] = inbuf.getChannelData(1)[i];
	// 		mydata.currentFrame++;
	// 		mydata.viewEndFrame++;
	// 		mydata.viewRate = 1.0;
	// 		mydata.needsRedrawWave = true;

	// 	}
	// }

	mydata.editor.processAudio(inLeft, inRight, outLeft, outRight, outLeft.length);
	
};

let preInLeft = new Float32Array(1024);
let preInRight = new Float32Array(1024);
let preOutLeft = new Float32Array(1024);
let preOutRight = new Float32Array(1024);

function onFilterProcess(e){
	let outLeft = e.outputBuffer.getChannelData(0);
	let outRight = e.outputBuffer.getChannelData(1);

	let inLeft = e.inputBuffer.getChannelData(0);
	let inRight = e.inputBuffer.getChannelData(1);

	for (let i = 0; i < outLeft.length; i++) {
		outLeft[i] = 0;//inLeft[i];
		outRight[i] = 0;//inRight[i];
	}

	let fs = 44100;
	let fc = 500.0/fs;
	let Q = 1.0/Math.sqrt(2.0);
	let I = 2;
	let J = 2;

	let a = new Float32Array(3);
	let b = new Float32Array(3);
	IIR_HPF(fc, Q, a, b);

	for (let n = 0; n < outLeft.length; n++) {
		for (let m = 0; m <= J; m++) {
			if (n - m >= 0) {
				outLeft[n] += b[m] * inLeft[n - m];
				outRight[n] += b[m] * inRight[n - m];
			}else{
				outLeft[n] += b[m] * preInLeft[inLeft.length + (n - m)];
				outRight[n] += b[m] * preInRight[inRight.length + (n - m)];
			}
		}

		for (let m = 1; m <= I; m++){
			if (n - m >=0){
				outLeft[n] += -a[m]*outLeft[n-m];
				outRight[n] += -a[m]*outRight[n-m];
			}else{
				outLeft[n] += -a[m] * preOutLeft[inLeft.length + (n-m)];
				outRight[n] += -a[m] * preOutRight[inRight.length + (n - m)];
			}
		}
	}

	for (let i = 0; i < outLeft.length; i++) {
		preInLeft[i] = inLeft[i];
		preInRight[i] = inRight[i];
		preOutLeft[i] = outLeft[i];
		preOutRight[i] = outRight[i];
	}
}



function onFilterProcess_FIR(e){
	// console.log("onFilterProcess");
	let outLeft = e.outputBuffer.getChannelData(0);
	let outRight = e.outputBuffer.getChannelData(1);

	let inLeft = e.inputBuffer.getChannelData(0);
	let inRight = e.inputBuffer.getChannelData(1);

	for (let i = 0; i < outLeft.length; i++) {
		outLeft[i] = 0;//inLeft[i];
		outRight[i] = 0;//inRight[i];
	}

	let fs = 44100;
	let fe = 2000.0 / fs;
	let fe1 = 500.0 / fs;
	let fe2 = 10000.0 / fs;
	let delta = 500.0 / fs;

	// let J = Math.round(3.1/delta) - 1;
	let J = Math.floor(3.1/delta + 0.5) - 1;

	if (J % 2 == 1) J++;
	// console.log("J = " + J);

	let b = new Float32Array(J + 1);
	let w = new Float32Array(J + 1);

	hanning_window(w, J+1);
	// FIR_HPF(fe, J, b, w);
	FIR_BPF(fe1, fe2, J, b, w);

	for (let n = 0; n < outLeft.length; n++){
		for (let m = 0; m <= J; m++){
			if(n - m >= 0){
				outLeft[n] += b[m] * inLeft[n-m];
				outRight[n] += b[m] * inRight[n-m];
			}else{
				outLeft[n] += b[m] * preLeft[inLeft.length + (n-m)];
				outRight[n] += b[m] * preRight[inRight.length + (n-m)];
			}
		}
	}

	for (let i = 0; i < outLeft.length; i++){
		preLeft[i] = inLeft[i];
		preRight[i] = inRight[i];
	}

}

function IIR_LPF(fc, Q, a, b){
	fc = Math.tan(Math.PI*fc)/(2.0*Math.PI);

	a[0] = 1.0 + 2.0*Math.PI*fc/Q + 4.0*Math.PI*Math.PI*fc*fc;
	a[1] = (8.0*Math.PI*Math.PI*fc*fc-2.0) / a[0];
	a[2] = (1.0 - 2.0*Math.PI*fc/Q + 4.0*Math.PI*Math.PI*fc*fc)/a[0];
	b[0] = 4.0*Math.PI*Math.PI*fc*fc/a[0];
	b[1] = 8.0*Math.PI*Math.PI*fc*fc/a[0];
	b[2] = 4.0*Math.PI*Math.PI*fc*fc/a[0];

	a[0] = 1.0;
}

function IIR_HPF(fc, Q, a, b){
	fc = Math.tan(Math.PI * fc) / (2.0 * Math.PI);

	a[0] = 1.0 + 2.0 * Math.PI * fc / Q + 4.0 * Math.PI * Math.PI * fc * fc;
	a[1] = (8.0 * Math.PI * Math.PI * fc * fc - 2.0) / a[0];
	a[2] = (1.0 - 2.0 * Math.PI * fc / Q + 4.0 * Math.PI * Math.PI * fc * fc) / a[0];
	b[0] = 1.0 / a[0];
	b[1] = -2.0 / a[0];
	b[2] = 1.0 / a[0];

	a[0] = 1.0;
}

function FIR_LPF(fe , J, b, w){
	let m = 0;
	let offset = 0;

	offset = J / 2;
	for (m = -J/2; m <= J; m++){
		b[offset + m] = 2.0 * fe * sinc(2.0 * Math.PI * fe * m);
	}

	for (m = 0; m < J+1; m++){
		b[m] *= w[m];
	}
}

function FIR_HPF(fe, J, b, w){
	let m = 0;
	let offset = 0;

	offset = J / 2;
	for (m = -J/2; m <= J; m++){
		b[offset + m] = sinc(Math.PI * m) - 2.0*fe*sinc(2.0*Math.PI * fe * m);
	}

	for (m = 0; m < J + 1 ; m++){
		b[m] *= w[m];
	}
}

function FIR_BPF(fe1, fe2, J, b, w){
	let m = 0;
	let offset = 0;

	offset = J / 2;
	for (m = -J / 2; m <= J; m++) {
		b[offset + m] = 2.0 * fe2 * sinc(2.0*Math.PI * fe2 * m)
					  - 2.0 * fe1 * sinc(2.0*Math.PI * fe1 * m);
	}
	for (m = 0; m < J + 1; m++) {
		b[m] *= w[m];
	}
}

function sinc(x){
	if (x == 0.0){
		return 1.0;
	}else{
		return Math.sin(x) / x;
	}
}

function hanning_window(w, N){
	if (N % 2 == 0){
		for (let n = 0; n < N; n++){
			w[n] = 0.5 - 0.5 * Math.cos(2.0 * Math.PI * n / N);
		}
	}else{
		for (let n = 0; n < N; n++){
			w[n] = 0.5 - 0.5 * Math.cos(2.0 * Math.PI * (n+0.5) / N);
		}
	}


}


function linearInterporation(x0, y0, x1, y1, x){
	if (x0 == x1){return y0;}

	let a = (y1-y0)/(x1-x0);
	let y = y0 + a * (x -x0);
	return y;
}



function startRecord(){
	mydata.editor.startRecord();
	// mydata.currentFrame = 0;
	// mydata.viewStartFrame = 0;
	// mydata.viewEndFrame = 0;
	// mydata.playStartFrame = 0;
	// mydata.viewRate = 1.0;
	// mydata.recording = true;

	// mydata.selectStartFrame = 0;
	// mydata.selectEndFrame = 0;
	// mydata.playStartFrame = 0;

	// mydata.needsRedrawWave = true;
	// redrawCanvas();

	// editorStateChanged();
}

function stopRecord(){
	mydata.editor.stopRecord();
	// mydata.recording = false;
	// mydata.needsRedrawWave = true;
	// redrawCanvas();
	// editorStateChanged();

}

function startPlay(){
	mydata.editor.startPlay();
	// mydata.editor.startPlay();
	// if(mydata.selected){
	// 	mydata.currentFramePlay = mydata.selectStartFrame;
	// }else{

	// 	mydata.currentFramePlay = mydata.playStartFrame;
	// }
	// //playStateChanged();
	// mydata.playing = true;	
	// // playStateChanged();
}

function stopPlay(){
	mydata.editor.stopPlay();
	// mydata.playing = false;ty
	// playStateCh	anged();
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

	// const canvas = document.querySelector("#canvas");

	// const w = canvas.clientWidth;
	// const h = canvas.clientHeight;

	// let c = canvas.getContext('2d');
	
	// if (mydata.needsRedrawWave){

	// 	c.clearRect(0,0,w,h);

	// 	c.beginPath();
	// 	c.fillStyle = "black";
	// 	c.rect(0,0,w,h);
	// 	c.fill();

	// 	//optimization 2
	// 	const framePerPixel = (mydata.viewEndFrame - mydata.viewStartFrame) / w ;
		
	// 	for (let i = 0; i < w; i++){
	// 		let from = Math.floor(i * framePerPixel);
	// 		let to = Math.floor(from + framePerPixel);
	// 		if (to > mydata.viewEndFrame) to = mydata.viewEndFrame;
	// 		let max = 0;

	// 		for(let j = from; j < to; j += Math.ceil((framePerPixel)/100)){
	// 			let s = Math.abs(audioBufferLeft[j + mydata.viewStartFrame]);
	// 			s += Math.abs(audioBufferRight[j + mydata.viewStartFrame]);
	// 			s /= 2;
	// 			if (s > max) max = s;
	// 		}

	// 		if (max <= 0) { //no sound
	// 			max = 0.002;
	// 		}

	// 		c.beginPath();
	// 		c.strokeStyle = "lightgreen";
	// 		c.moveTo(i, h/2 - max*h/2);
	// 		c.lineTo(i, h/2 + max*h/2);
	// 		c.stroke();
	// 	}	
	// }
	// mydata.needsRedrawWave = false;


	// c = document.querySelector("#canvas2").getContext('2d');
	// c.clearRect(0,0,w,h);
	// const framePerPixel = mydata.currentFrame / w/mydata.viewRate;

	// //selection
	// if (mydata.selected){
	// 	c.beginPath();
	// 	c.fillStyle ="rgb(123,123,123,0.6)";

		
	// 	let from = (mydata.selectStartFrame - mydata.viewStartFrame) / framePerPixel;
	// 	let to = (mydata.selectEndFrame - mydata.viewStartFrame) / framePerPixel;
	// 	c.rect(from, 0, to - from, h);
	// 	c.fill();
	// }


	// //start cursor
	// c.beginPath();
	// c.strokeStype = "blue";
	// c.setLineDash([2, 1]);
	// let x = (mydata.playStartFrame - mydata.viewStartFrame) / framePerPixel;
	// c.moveTo(x,0);
	// c.lineTo(x, h);
	// c.stroke();

	// //play cursor
	// c.beginPath();
	// c.strokeStyle = "white";
	// c.setLineDash([]);
	// x = (mydata.currentFramePlay - mydata.viewStartFrame) / framePerPixel;
	// c.moveTo(x ,0);
	// c.lineTo(x, h);
	// c.stroke();

	// {
	// 	let rulerCanvas = document.querySelector("#rulerCanvas");
	// 	let w = rulerCanvas.width;
	// 	let h = rulerCanvas.height;
	// 	c = rulerCanvas.getContext("2d");
	// 	c.clearRect(0,0,w,h);

	// 	c.beginPath();
	// 	c.fillStyle = "lightgray";
	// 	c.rect(0, 0, w, h);
	// 	c.fill();

	// 	c.font = "1em 'ＭＳ Ｐゴシック'"
	// 	c.fillStyle = "black";
	// 	// c.fillText("123456789", w/2,h);
	// }
	
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

	if (e.target == $("#upfilename").get(0)) {
		// console.log("break");
		return;
	}


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
			mydata.editor.togglePlay();
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

	case 50:/*2*/
		e.stopPropagation();
		e.preventDefault();
		{
			onSwitchToA();
		}
		break;
	case 51:/*3*/
		e.stopPropagation();
		e.preventDefault();
		{
			onSwitchToCenter();
		}
		break;
	case 52:/*4*/
		e.stopPropagation();
		e.preventDefault();
		{
			onSwitchToB();
		}
		break;

	case 80: /*p*/
		e.stopPropagation();
		e.preventDefault();
		mydata.long.togglePlay();
		
	}


}

document.onkeyup = function (e){
	if (e.target == $("#upfilename").get(0)) {
		// console.log("break");
		return;
	}


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
	mydata.editor.right();

	// const w = document.querySelector("#canvas2").width;
	// const framePerPixel = mydata.currentFrame/w/mydata.viewRate;

	// if(mydata.selected){
	// 	//move start to right
	// 	mydata.selectStartFrame += Math.round(framePerPixel*2);
	// 	mydata.playStartFrame = mydata.selectStartFrame;
	// }else{
	// 	//move playStart to right
	// 	mydata.playStartFrame += Math.round(framePerPixel*2);
	// }
	// redrawCanvas();
}
function onLeft(){
	mydata.editor.left();
	// const w = document.querySelector("#canvas2").width;
	// const framePerPixel = mydata.currentFrame/w/mydata.viewRate;	

	// if(mydata.selected){
	// 	//move start to left
	// 	mydata.selectStartFrame -= Math.round(framePerPixel*2);
	// 	mydata.playStartFrame = mydata.selectStartFrame;
	// }else{
	// 	mydata.playStartFrame -= Math.round(framePerPixel*2);
	// }
	// redrawCanvas();

}
function onRightWithShift(){
	mydata.editor.rightWithShift();
	// const w = document.querySelector("#canvas2").width;
	// const framePerPixel = mydata.currentFrame/w/mydata.viewRate;	

	// if (mydata.selected){
	// 	//move end to right
	// 	mydata.selectEndFrame += Math.round(framePerPixel*2);
	// }else{
	// 	//starting select to right
	// 	mydata.selected = true;
	// 	mydata.selectStartFrame = mydata.playStartFrame;
	// 	mydata.selectEndFrame = mydata.selectStartFrame + Math.round(framePerPixel*2);
	// }	
	// redrawCanvas();
}

function onLeftWithShift(){
	mydata.editor.leftWithShift();
	// const w = document.querySelector("#canvas2").width;
	// const framePerPixel = mydata.currentFrame/w/mydata.viewRate;	

	// if (mydata.selected){
	// 	//move end to left
	// 	mydata.selectEndFrame -= Math.round(framePerPixel*2);
	// }else{
	// 	//starting select to left
	// 	mydata.selected = true;
	// 	mydata.selectEndFrame = mydata.playStartFrame;
	// 	mydata.selectStartFrame = mydata.selectEndFrame - Math.round(framePerPixel*2);
	// }	
	// redrawCanvas();
}


// function onCanvasMousedown(e){

//     const rect = e.target.getBoundingClientRect();
//     const x = e.clientX - rect.left;
//     const canvas = document.querySelector("#canvas2");
//     const w = canvas.width;
// 	const framePerPixel = (mydata.currentFrame)/w/mydata.viewRate;

// 	if (!e.shiftKey){
//     	mydata.selectStartFrame = Math.round(mydata.viewStartFrame + framePerPixel*x);
//     	mydata.selectEndFrame = mydata.selectStartFrame;
//     	mydata.selectDragStartFrame = mydata.selectStartFrame;
//     	mydata.selected = false;
//     	mydata.playStartFrame = mydata.selectDragStartFrame;

// 		mydata.dragging = true;		
// 		redrawCanvas();
// 	}else{
// 		const pointedFrame = Math.round(mydata.viewStartFrame + framePerPixel*x);
// 		if(mydata.selected){
// 			if (pointedFrame < mydata.selectStartFrame){
// 				mydata.shiftDraggingForLeft = true;
// 				mydata.selectStartFrame = pointedFrame;
// 				mydata.playStartFrame = pointedFrame;
// 			}else if (mydata.selectEndFrame < pointedFrame){
// 				mydata.shiftDraggingForLeft = false;
// 				mydata.selectEndFrame = pointedFrame;
// 			}else{
// 				//between start and end. move nearest
// 				if((pointedFrame - mydata.selectStartFrame) < (mydata.selectEndFrame - pointedFrame)){
// 					mydata.shiftDraggingForLeft = true;
// 					mydata.selectStartFrame = pointedFrame;
// 					mydata.playStartFrame = pointedFrame;
					
// 				}else{
// 					mydata.shiftDraggingForLeft = false;
// 					mydata.selectEndFrame = pointedFrame;
// 					mydata.shiftDragStartFromLeft = false;
// 				}
// 			}
// 		}else{
// 			if (mydata.playStartFrame < pointedFrame){
// 				mydata.selectStartFrame = mydata.playStartFrame;
// 				mydata.selectEndFrame = pointedFrame;
// 				mydata.shiftDraggingForLeft = false;
// 			}else{
// 				mydata.selectStartFrame = pointedFrame;
// 				mydata.selectEndFrame = mydata.playStartFrame;
// 				mydata.playStartFrame = mydata.selectStartFrame;
// 				mydata.shiftDraggingForLeft = true;
// 			}
// 			mydata.selected = true;
// 		}
// 		mydata.shiftDragging = true;
// 		redrawCanvas();
// 	}
// }

// function onCanvasMousemove(e){

// 	const rect = e.target.getBoundingClientRect();
// 	const x = e.clientX - rect.left;
// 	const canvas = document.querySelector("#canvas2");
// 	const w = canvas.width;
// 	const framePerPixel = (mydata.currentFrame)/w/mydata.viewRate;
// 	const pointedFrame = Math.round(mydata.viewStartFrame + framePerPixel*x);

// 	if (!e.shiftKey){
// 		if (!mydata.dragging) return;
// 		if (pointedFrame < mydata.selectDragStartFrame){
// 			mydata.selectStartFrame = pointedFrame;
// 			mydata.selectEndFrame = mydata.selectDragStartFrame;
// 			mydata.playStartFrame = pointedFrame;
// 		}else{
// 			mydata.selectStartFrame = mydata.selectDragStartFrame;
// 			mydata.selectEndFrame = pointedFrame;
// 			mydata.playStartFrame = mydata.selectStartFrame;
// 		}

// 		if (mydata.selectEndFrame - mydata.selectStartFrame > 1){
// 			mydata.selected = true;
// 		}else{
// 			mydata.selected = false;
// 			mydata.playStartFrame = mydata.selectStartFrame;
// 		}
// 		redrawCanvas();
// 	}else{
// 		if (!mydata.shiftDragging) return;
// 		if(mydata.selected){
// 			if(mydata.shiftDraggingForLeft){
// 				mydata.selectStartFrame = pointedFrame;
// 				mydata.playStartFrame = pointedFrame;
// 			}else{
// 				mydata.selectEndFrame = pointedFrame;
// 			}
			
// 		}else{
// 			//not come here
// 			console.log("something wrong");
// 		}
// 		redrawCanvas();
// 	}

	
// }
// // 

// function onCanvasMouseup(e){

// 	const rect = e.target.getBoundingClientRect();
// 	const x = e.clientX - rect.left;
// 	const canvas = document.querySelector("#canvas2");
// 	const w = canvas.width;
// 	const framePerPixel = (mydata.currentFrame)/w/mydata.viewRate;
// 	const pointedFrame = Math.round(mydata.viewStartFrame + framePerPixel*x);

// 	if(!e.shiftKey){
// 		if (pointedFrame < mydata.selectDragStartFrame){
// 			mydata.selectStartFrame = pointedFrame;
// 			mydata.selectEndFrame = mydata.selectDragStartFrame;
// 			mydata.playStartFrame = pointedFrame;
// 		}else{
// 			mydata.selectStartFrame = mydata.selectDragStartFrame;
// 			mydata.selectEndFrame = pointedFrame;
// 			mydata.playStartFrame = mydata.selectStartFrame;
// 		}

// 		if (mydata.selectEndFrame - mydata.selectStartFrame > 1){
// 			mydata.selected = true;
// 		}else{
// 			mydata.selected = false;
// 			mydata.playStartFrame = mydata.selectStartFrame;
// 		}

// 		mydata.dragging = false;
// 		redrawCanvas();
// 	}else{
// 		if(mydata.selected){
// 			if(mydata.shiftDraggingForLeft){
// 				mydata.selectStartFrame = pointedFrame;
// 				mydata.playStartFrame = pointedFrame;
// 			}else{
// 				mydata.selectEndFrame = pointedFrame;
// 			}
			
// 		}else{
// 			//not come here
// 			console.log("something wrong");
// 		}
// 		mydata.shiftDragging = false;
// 		redrawCanvas();
// 	}	
// }

// function onCanvasScroll(e){
// 	e.preventDefault();
// 	// console.log(e);

// 	if (Math.abs(e.wheelDeltaY) > Math.abs(e.wheelDeltaX)){

// 		//zoon in/out
// 		const deltaY = e.wheelDeltaY;
//     	const canvas = document.querySelector("#canvas2");
//       	const w = canvas.width
// 		const viewGravcenterRatio = /*e.offsetX*/(e.clientX-e.currentTarget.getBoundingClientRect().left) / w;
// 		let viewGravcenterFrame = Math.round(mydata.viewStartFrame
// 									+ viewGravcenterRatio * (mydata.viewEndFrame - mydata.viewStartFrame));

// 		mydata.viewRate += 0.005 * deltaY;
// 		if (mydata.viewRate < 1.0) mydata.viewRate = 1.0;

// 		if (mydata.viewRate == 1.0){
// 			mydata.viewStartFrame = 0;
// 			mydata.viewEndFrame = mydata.currentFrame;
// 		}else{
// 			const framePerPixel = (mydata.currentFrame)/w/mydata.viewRate;
// 			mydata.viewStartFrame = Math.round(viewGravcenterFrame - framePerPixel * viewGravcenterRatio * w);
// 			mydata.viewEndFrame = Math.round(viewGravcenterFrame + framePerPixel * (1 - viewGravcenterRatio) * w);
// 		}

// 		mydata.needsRedrawWave = true;
// 		redrawCanvas();
// 	}else{

// 		//horizontal scroll
// 		const deltaX = -e.wheelDeltaX;
// 		const prevStart = mydata.viewStartFrame;
// 		const prevEnd = mydata.viewEndFrame;
// 		mydata.viewStartFrame += Math.round(deltaX/mydata.viewRate*120);
// 		mydata.viewEndFrame += Math.round(deltaX/mydata.viewRate*120);

// 		if(mydata.viewStartFrame < 0){
// 			mydata.viewStartFrame = 0;
// 			mydata.viewEndFrame = mydata.viewStartFrame + (prevEnd - prevStart);
// 		}
// 		if(mydata.viewEndFrame > mydata.currentFrame){
// 			mydata.viewEndFrame = mydata.currentFrame;
// 			mydata.viewStartFrame = mydata.viewEndFrame - (prevEnd - prevStart);
// 		}
// 		mydata.needsRedrawWave = true;
// 		redrawCanvas();
// 	}

// }

//https://qiita.com/HirokiTanaka/items/56f80844f9a32020ee3b
//https://github.com/mattdiamond/Recorderjs/blob/master/lib/recorder.js
function createWAVBlob(){

	let sampleNum = mydata.editor.selectEndFrame - mydata.editor.selectStartFrame;

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
				var sL = Math.max(-1, Math.min(1, mydata.editor.bufferLeft[mydata.editor.selectStartFrame+i]));
				output.setInt16(offset, sL < 0 ? sL*0x8000: sL*0x7FFF, true);
			
				var sR = Math.max(-1, Math.min(1, mydata.editor.bufferRight[mydata.editor.selectStartFrame+i]));
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
	a.download = "editor.wav";
	a.href = window.URL.createObjectURL(blob);
	a.click();
}

function uploadWAV(){
	var blob = createWAVBlob();
	var formData = new FormData();
	formData.append("upfile", blob);
	let fileName = null;

	//ask user for filename
	$("#uploadDialog").dialog({
		modal:true,
		title:"Input file name",
		buttons : { 
			"Upload" : function(){
				fileName = $("#upfilename").val();
				$(this).dialog("close");
				formData.append("fname", fileName);
				uploadWAV_upload(formData);
			},
			"Cancel" : function(){
				$(this).dialog("close");
			}
		}
	});
}

function uploadWAV_upload(formData){
	$.ajax("./uploadblob", {
		method:"POST",
		data:formData,
		contentType : false,
		processData : false,
		complete : function(data) {
			console.log("upload done(blob)");
			mydata.soundList.reload();
			console.log(data);
		}
	});
}

function onSoundListClick(){
	$("#soundDeleteButton").get(0).disabled = false;
	
	if (mydata.vTrack.isPlaying()){
		mydata.vTrack.stop();
		let port = mydata.mainNode.port;
		let m = {
			"cmd": "stopV"
		};
		port.postMessage(m);
		onMainEngineStateChanged();
	}
}

function onSoundListDblClick(){

	if (mydata.vTrack.isPlaying()) {
		mydata.vTrack.stop();
		let port = mydata.mainNode.port;
		let m = {
			"cmd": "stopV"
		};
		port.postMessage(m);
		onMainEngineStateChanged();
	}

	$("#soundDeleteButton").get(0).disabled = false;
	loadSample2(mydata.vTrack, -1, mydata.soundList.selectedText())
	.then(function(){
		mydata.vTrack.setQuantize(false);
		mydata.vTrack.setLoop(false);
		mydata.vTrack.togglePlay();
		onMainEngineStateChanged();
		let m = {
			"cmd": "playV"
		};
		let port = mydata.mainNode.port;
		port.postMessage(m);	
	});

}

// function toShadow(){
// 	if (!mydata.mainNode) return ;
// 	let port = mydata.mainNode.port;
	
// 	let m = {
// 		"cmd": "setBufferV",
// 		"left" : mydata.vTrack._bufferLeft,
// 		"right" : mydata.vTrack._bufferRight
// 	};
// 	let t = [mydata.vTrack._bufferLeft.buffer, mydata.vTrack._bufferRight.buffer];
// 	port.postMessage(m,t);

// 	m = {
// 		"cmd" : "playV"
// 	};
// 	port.postMessage(m);
// 	// port.postMessage(m, t);
// }

function toShadow2(){
	if (!mydata.mainNode) return;

	let port = mydata.mainNode.port;

	let m = {
		"cmd":"stopV"
	};
	port.postMessage(m);

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
	mydata.tapTimes[7] = window.performance.now();
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
			loadSample2(i, tracks[i].name);
		}else{
			clearTrack(i);
		}
		if(tracks[i].speed != null){
			mydata.tracks[i]._ratio = tracks[i].speed;
			updateSpeedLabel(i);
			mydata.mainNode.port.postMessage({
				"cmd": "setRatio",
				"index": i,
				"ratio": mydata.tracks[i]._ratio
			});
		}

		if(tracks[i].master != null){
			$(".masterChk").get(i).checked = tracks[i].master;
			mydata.tracks[i].setMaster(tracks[i].master);
			
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
			$(".quantizeChk").get(i).checked = tracks[i].quantize;
			mydata.tracks[i].setQuantize(tracks[i].quantize);
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

mydata.lastClockSec= 0;

// http://www2.odn.ne.jp/~cbu69490/MIDI/MIDIlect/MIDIlect3.html
function onMIDIMessage(e){
	// console.log(e);
	let first = e.data[0] >> 4;
	let second = e.data[1];
	let third = e.data[2];
	switch (first) {
	case 8: //note off
		{
			let noteNumber = second;
			// console.log("note off : " + noteNumber.toString());
			onNoteOff(noteNumber, e.timeStamp/1000.0);
		}
		break;
	case 9: //note on
		{
			let noteNumber = second;
			// console.log("note on : " + noteNumber.toString());
			onNoteOn(noteNumber, e.timeStamp/1000.0);
		}
		break;
	case 0x0b: // CC
		{
			let controlNumber = second;
			let value = third;
			// console.log("CC : " + controlNumber.toString(), "," + value.toString());
			onControlChange(controlNumber, value, e.timeStamp/1000.0);
		}
		break;

	case 0x0f:
		if (e.data[0] == 0xf8){	//MIDI clock
			if (mydata.lastClockSec == 0){
				mydata.lastClockSec = e.timeStamp;
			}else{
				let duration = e.timeStamp - mydata.lastClockSec;
				mydata.lastClockSec = e.timeStamp;
				duration *= 24;
				let bps = 1 / duration;
				let bpm = bps * 60 * 1000;
				
				console.log("bpm(by MIDI clock) = " + bpm.toString());

				//test
				mydata.bpm = bpm;
				sync(0);

			}
			//console.log("MIDI clock received : " + e.timeStamp.toString());
		}
		break;

	default:
		console.log(e);
	}
}

function onNoteOn(noteNumber, receivedSec){
	switch(noteNumber){
	case 36:
		onPlayStopTrack(0);
		break;
	case 37:
		onPlayStopTrack(1);
		break;
	case 38:
		onPlayStopTrack(2);
		break;
	case 39:
		onPlayStopTrack(3);
		break;
	case 40:
		onPlayStopTrack(4);
		break;

	case 54:	//DDJ-400 jog touch
		onStartStopJog(receivedSec);

	}

}

function onNoteOff(noteNumber, receivedSec){
	switch (noteNumber) {
	case 36:
		onPlayStopTrack(0);
		break;
	case 37:
		onPlayStopTrack(1);
		break;
	case 38:
		onPlayStopTrack(2);
		break;
	case 39:
		onPlayStopTrack(3);
		break;
	case 40:
		onPlayStopTrack(4);
		break;
	}
}

function onControlChange(number, value, receivedSec){
	
	//console.log("cc : " + number + " value : " + value);
	switch(number){
	case 1:	//rate
		{
			let rate = 0.01 + (8-0.01) * value/127.0;
			console.log("rate = " + rate);
			if (mydata.phaser){
				mydata.phaser.rate = rate;
			}
		}
		break;
	case 2:	//depth
		{
			let depth = value/127.0;
			console.log("depth = " + depth);
			if (mydata.phaser){
				mydata.phaser.depth = depth;
			}
		}
		break;
	case 3: //feedback
		{
			let feedback = value/127.0;
			console.log("feedback = " + feedback);
			if (mydata.phaser){
				mydata.phaser.feedback = feedback;
			}
		}
		break;
	case 4: //stereoPhase
		{
			let stereoPhase = 180 * value/127.0;
			console.log("stereoPhase = ", + stereoPhase);
			if (mydata.phaser){
				mydata.phaser.stereoPhase = stereoPhase;
			}
		}
		break;
	case 5: //baseModulationFrequency
		{
			let baseModulationFrequency = 500 + (1500-500) * value/127.0;
			console.log("baseModulationFrequency = " + baseModulationFrequency);
			if (mydata.phaser){
				mydata.phaser.baseModulationFrequency = baseModulationFrequency;
			}
		}
		break;
	case 34: //MIDI scratch 
		{
			onMIDIScratch(value, receivedSec);
		}
		break;

	case 33:
		{
			onMIDIScratch(value, receivedSec);
		}
		break;

	case 31: //cross fader
		{
			onMIDICrossfader(value, receivedSec);
		}

	}
}


let prevSec = 0;
let prevRad = 0;
let jogTouching = false;
let timer__ = null;
let zeroCount = 0;

function onStartStopJog(receivedSec){
	if (!jogTouching){
		jogTouching = true;
		turnTableA._processing = true;
		prevSec = window.performance.now() / 1000;;
		prevRad = turnTableA.rad;

		zeroCount = 0;

		turnTableA.speed = 0;
		{
			// console.log("A-1");
			mydata.mainNode.port.postMessage({
				"cmd": "setSpeedA",
				"speed": 0
			});
		}
		
		if (timer__) return;
		// console.log("start timer");
		timer__ = setInterval(function(){
			let nowS = window.performance.now() / 1000;
			let deltaRad = turnTableA.rad - prevRad;

			if (nowS == prevSec) return;

			let radS = deltaRad / (nowS - prevSec);
			let speed = -radS / RPS;

			turnTableA.speed = speed;
			{
				// console.log("A-1");
				mydata.mainNode.port.postMessage({
					"cmd":"setSpeedA",
					"speed":speed
				});
			}

			prevRad = turnTableA.rad;
			prevSec = nowS;
			
			if (speed == 0){
				if (zeroCount >= 0){
					if (!jogTouching){
						turnTableA.speed = 1.0;
						{
							// console.log("A-2");
							mydata.mainNode.port.postMessage({
								"cmd":"setSpeedA",
								"speed":1.0
							});
						}

						for (let i = 0; i < mydata.tracks.length ; i++){
							if (mydata.tracks[i].getABSwitch() == "A"){
								mydata.mainNode.port.postMessage({
									"cmd":"follow",
									"index":i
								});
							}
						}

						// mydata.tracks.forEach(function (t) {
						// 	if (t.getABSwitch() == "A") {
						// 		t.follow();
						// 	}
						// });
						// console.log("timer cleared");
						clearInterval(timer__);
						timer__ = null;
						turnTableA._processing = false;
					}else{
						zeroCount = 0;
					}
				}else{
					zeroCount++;
				}
			}else{
				zeroCount = 0;
			}
			
		},10);
	}else{
		jogTouching = false;
		turnTableA.speed = 1.0;
		// turnTableA._processing = false;
		mydata.mainNode.port.postMessage({
			"cmd": "setSpeedA",
			"speed": 1.0
		});


		// for (let i = 0; i < mydata.tracks.length; i++) {
		// 	if (mydata.tracks[i].getABSwitch() == "A") {
		// 		mydata.mainNode.port.postMessage({
		// 			"cmd": "follow",
		// 			"index": i
		// 		});
		// 	}
		// }

	}
}

function onMIDIScratch(value, receivedSec){

	let delta = value - 64;
	let deltaRad = 2 * Math.PI / 720 * delta; 	//720 for 1 cycle.

	turnTableA.rad += deltaRad;

	ttDraw(turnTableA);

}

function onMIDICrossfader(value, receivedSec){
	let v = (value-63.5) /63.5;
	$("#abSlider").get(0).valueAsNumber = v;
	mydata.abSwitchValue = v;

	{
		if (!mydata.mainNode) return;
		let m = {
			"cmd" : "setABSwitchValue",
			"value" : v
		};
		mydata.mainNode.port.postMessage(m);
	}
}


function onEffectBypassChanged(e){
	let chk = $("#effectBypassChk").get(0);
	mydata.effectBypass = chk.checked;
	if (mydata.phaser){
		mydata.phaser.bypass = mydata.effectBypass; 
	}
}

function onStemVolume(index){

	const elem = $(".stemVolDrams").get(index);
	const h = 200;
	const w = elem.clientWidth;

	let iframeLink = '<iframe src="./stemControl" ';
	iframeLink += 'width=' + w.toString() + ' ';
	iframeLink += 'height=' + h.toString() + ' ';
	iframeLink += '/>';

	let content = '<div>';
	content += '<input type="range" class="volumeSliderBass" id="volumeSliderBass'+index.toString() + '"min="0" max="200" value="100" step="1" />'
	content += '<input type="range" class="volumeSliderDrums" id="volumeSliderDrums' + index.toString() + '"min="0" max="200" value="100" step="1" />'
	content += '<input type="range" class="volumeSliderOther" id="volumeSliderOther' + index.toString() + '"min="0" max="200" value="100" step="1" />'
	content += '<input type="range" class="volumeSliderPiano" id="volumeSliderPiano' + index.toString() + '"min="0" max="200" value="100" step="1" />'
	content += '<input type="range" class="volumeSliderVocals" id="volumeSliderVocals'+index.toString() + '"min="0" max="200" value="100" step="1" />'
	content += '</div>';


	$.jsPanel({
		position : {
			my : "center-top",
			at : "center-bottom",
			of :elem,
			offsetY : 1
		},
		panelSize : {width : w, height:h},
		headerControls: {
			controls : "closeonly"
		},
		headerTitle : "",
		resizable : false,
		content: content,
		callback : function () { stemPanelLoaded(index);}
	});
}

function stemPanelLoaded(index){
	let elem = null;
	elem = $("#volumeSliderBass"+index.toString()).get(0);
	elem.addEventListener("input", function(e){
		onBassVolumeChanged(index);
	});

	elem = $("#volumeSliderDrums" + index.toString()).get(0);
	elem.addEventListener("input", function(e){
		onDrumsVolumeChanged(index);
	});

	elem = $("#volumeSliderOther" + index.toString()).get(0);
	elem.addEventListener("input", function (e) {
		onOtherVolumeChanged(index);
	});

	elem = $("#volumeSliderPiano" + index.toString()).get(0);
	elem.addEventListener("input", function (e) {
		onPianoVolumeChanged(index);
	});

	elem = $("#volumeSliderVocals" + index.toString()).get(0);
	elem.addEventListener("input", function (e) {
		onVocalsVolumeChanged(index);
	});

}


function onTT(index){
	console.log("onTT index = " + index.toString());

	$.jsPanel({
		headerTitle : "track" + (index+1).toString(),
		content : "<div class=\"ttContents\" id=\"ttContents" + index.toString() + "\"+ ></div>",
		callback : function() {ttLoaded(index);},
		contentSize : {width : 300, height : 300},
		resizable : {
			resize : function(){ ttResized(turnTables[index]);}
		},
		onclosed: function() {ttClosed(turnTables[index]);}
	});
}

function onABTT(AorB){

	let turnTable = "";
	if(AorB == "A"){
		turnTable = turnTableA;
	}else if (AorB == "B"){
		turnTable = turnTableB;
	}

	$.jsPanel({
		headerTitle: AorB,
		content : "<div class=\"ttContents\" id=\"ttContents" + AorB + "\" + ><div>",
		callback : function() {ttLoaded(-1, AorB);},
		contentSize : {width : 200, height : 200},
		resizable : {
			resize : function(){ ttResized(turnTable);}
		},
		onclosed: function() {ttClosed(turnTable);}
	});
}

function ttLoaded(index, AorB){

	let postFix = "";
	if (AorB != null){
		postFix = AorB;
	}else{
		postFix = index.toString();
	}

	let turnTable = null;
	if (AorB == "A") {
		turnTable = turnTableA;
	} else if (AorB == "B") {
		turnTable = turnTableB;
	}else{
		turnTable = turnTables[index];
	}

	let con = document.querySelector("#ttContents" + postFix);
	let canvas = document.createElement("canvas");
	canvas.classList.add("tt");
	canvas.id = "tt" + postFix;
	con.appendChild(canvas);

	turnTable._canvas = canvas;
	if (AorB == null){
		turnTable._track = mydata.tracks[index];
	}

	canvas.addEventListener("mousedown", function(e){
		onTTMousedown(e, turnTable, index, AorB);
	} , false);
	canvas.addEventListener("mousemove", function(e){
		onTTMousemove(e, turnTable, index, AorB);
	 }, false);
	canvas.addEventListener("mouseup", function(e){
		onTTMouseup(e, turnTable, index, AorB);
	}, false);

	ttResized(turnTable);

	turnTable.timer = setInterval(function () {
		if (!turnTable._processing) {
			turnTable.rad -= RPS / 100;
		}
		ttDraw(turnTable);
	}, 10);

}

function ttResized(tt) {
	let canvas = tt._canvas;

	if(tt._canvas){
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;

		ttDraw(tt);
	}
}

function ttDraw(tt){
	let canvas = tt._canvas;
	if (!canvas) return;

	let c = canvas.getContext("2d");
	let w = canvas.width;
	let h = canvas.height;
	c.clearRect(0, 0, w, h);

	c.beginPath();
	c.fillStyle = "black";
	c.rect(0, 0, w, h);
	c.fill();

	let r = w;
	if (h < w) r = h;
	r /= 2;

	c.beginPath();
	c.fillStyle = "gray";
	c.arc(w / 2, h / 2, r, Math.PI * 2, false);
	c.fill();

	c.beginPath();
	c.strokeStyle = "orange";
	c.lineWidth = 5;
	c.moveTo(w / 2, h / 2);
	c.lineTo(w / 2 + r * Math.cos(tt.rad), h / 2 + r * Math.sin(tt.rad));
	c.stroke();
}

function ttClosed(tt){
	clearInterval(tt.timer);
}

function onTTMousedown(e, tt, index, AorB) {
	let canvas = tt._canvas;
	const rect = e.target.getBoundingClientRect();
	let x = e.clientX - rect.left;
	x -= canvas.clientWidth / 2;
	let y = e.clientY - rect.top;
	y -= canvas.clientHeight / 2;
	y *= -1;

	let rad = Math.acos(x / Math.sqrt(x * x + y * y));
	// turnTable.rad = rad;

	tt._processing = true;
	tt._startOffsetRad = rad;
	tt._prevSec = window.performance.now() / 1000;
	tt.speed = 0;

	if (tt._track) {

		mydata.mainNode.port.postMessage({
			"cmd":"setSpeed",
			"index": index,
			"speed":tt.speed
		});

		mydata.mainNode.port.postMessage({
			"cmd": "follow",
			"index": index
		});
	} else {
		let AorB = null;

		if (tt == turnTableA) {
			AorB = "A";
			mydata.mainNode.port.postMessage({
				"cmd":"setSpeedA",
				"speed":tt.speed
			});
		} else if (tt == turnTableB) {
			AorB = "B";
			mydata.mainNode.port.postMessage({
				"cmd": "setSpeedB",
				"speed": tt.speed
			});
		}

		for (let i = 0; i < mydata.tracks.length; i++){
			if (mydata.tracks[i].getABSwitch() == AorB){
				mydata.mainNode.port.postMessage({
					"cmd":"follow",
					"index":i
				});
			}
		}

		// mydata.tracks.forEach(function (t) {
		// 	if (t.getABSwitch() == AorB) {
		// 		t.follow();
		// 	}
		// });
	}

	ttDraw(tt);
}

function onTTMousemove(e, tt, index, AorB) {
	if (!tt._processing) return;

	let canvas = tt._canvas;
	const rect = e.target.getBoundingClientRect();
	let x = e.clientX - rect.left;
	x -= canvas.clientWidth / 2;
	let y = e.clientY - rect.top;
	y -= canvas.clientHeight / 2;
	y *= -1;

	let rad = Math.acos(x / Math.sqrt(x * x + y * y));

	if (y < 0) {
		rad = 2 * Math.PI - rad;
	}

	let delta = rad - tt._startOffsetRad;
	if (rad2deg(delta) > 340){
		delta = -1 * (2*Math.PI - delta);
	}
	if (rad2deg(delta) < -340){
		delta = 2*Math.PI - (-1*delta);
	}

	tt.rad -= delta;

	let nowS = window.performance.now() / 1000;
	// nowS = e.timeStamp/1000;
	let radS = -delta / (tt._prevSec - nowS);
	tt.speed = radS / RPS;
	if (tt.speed > 100){
		tt.speed = 100;
	}
	if (tt.speed < -100){
		tt.speed = -100;
	}

	if (AorB == "A"){
		mydata.mainNode.port.postMessage({
			"cmd": "setSpeedA",
			"speed": tt.speed
		});
	}else if (AorB == "B"){
		mydata.mainNode.port.postMessage({
			"cmd": "setSpeedB",
			"speed": tt.speed
		});
	}else{
		mydata.mainNode.port.postMessage({
			"cmd":"setSpeed",
			"index":index,
			"speed": tt.speed
		});
	}

	// console.log("speed =" + tt.speed);

	tt._prevSec = nowS;
	tt._startOffsetRad = rad;

	ttDraw(tt);
}

function rad2deg(rad){
	return rad / Math.PI * 180;
}

function onTTMouseup(e, tt, index, AorB) {
	if (tt._processing) {
		tt._processing = false;
	}
	tt.speed = 1;

	if (tt._track){
		mydata.mainNode.port.postMessage({
			"cmd": "setSpeed",
			"index": index,
			"speed": tt.speed
		});

		mydata.mainNode.port.postMessage({
			"cmd": "follow",
			"index": index
		});		
		//tt._track.follow();
	}else{
		let AorB = null;

		if (tt == turnTableA) {
			AorB = "A";
			mydata.mainNode.port.postMessage({
				"cmd": "setSpeedA",
				"speed": tt.speed
			});
		} else if (tt == turnTableB) {
			AorB = "B";
			mydata.mainNode.port.postMessage({
				"cmd": "setSpeedB",
				"speed": tt.speed
			});
		}

		for (let i = 0; i < mydata.tracks.length; i++) {
			if (mydata.tracks[i].getABSwitch() == AorB) {
				mydata.mainNode.port.postMessage({
					"cmd": "follow",
					"index": i
				});
			}
		}
	}
}

function onAButtonClicked(e){
	onABTT("A");
}
function onBButtonClicked(e){
	onABTT("B");
}

function onABSliderChanged(e){
	mydata.abSwitchValue = $("#abSlider").get(0).valueAsNumber;
	mydata.mainNode.port.postMessage({
		"cmd":"setABSwitchValue",
		"value": mydata.abSwitchValue
	});
}

function onAChkChanged(e){
	onABSwitchChanged(e, "A");
}
function onBChkChanged(e){
	onABSwitchChanged(e, "B");
}

function onABSwitchChanged(e, AorB){
	let index = -1;

	let checks = null;
	let anotherChecks = null;
	if (AorB == "A"){
		checks = document.querySelectorAll(".Achk");
		anotherChecks = document.querySelectorAll(".Bchk");
	}else{
		checks = document.querySelectorAll(".Bchk");
		anotherChecks = document.querySelectorAll(".Achk");
	}
	for (let i = 0 ; i < checks.length; i++){
		if (e.target == checks[i]) {
			index = i;
			break;
		} 
	}

	if (e.target.checked){
		mydata.tracks[index].setABSwitch(AorB);
		anotherChecks[index].checked = false;

		mydata.mainNode.port.postMessage({
			"cmd": "setABSwitch",
			"index":index,
			"AorB":AorB
		});

	}else{
		mydata.tracks[index].setABSwitch(null);

		mydata.mainNode.port.postMessage({
			"cmd":"setABSwitch",
			"index":index,
			"AorB":null
		});
	}
	
	console.log("AB switch for index:" + index.toString() + " = " 
			+ mydata.tracks[index].getABSwitch() );
}

function onSwitchToA(){
	mydata.abSwitchValue = -1.0;
	$("#abSlider").get(0).valueAsNumber = -1.0;

	mydata.mainNode.port.postMessage({
		"cmd": "setABSwitchValue",
		"value": mydata.abSwitchValue
	});	
}

function onSwitchToB(){
	mydata.abSwitchValue = 1.0;
	$("#abSlider").get(0).valueAsNumber = 1.0;

	mydata.mainNode.port.postMessage({
		"cmd": "setABSwitchValue",
		"value": mydata.abSwitchValue
	});
}

function onSwitchToCenter() {
	mydata.abSwitchValue = 0.0;
	$("#abSlider").get(0).valueAsNumber = 0.0;

	mydata.mainNode.port.postMessage({
		"cmd": "setABSwitchValue",
		"value": mydata.abSwitchValue
	});
}

function onFilterSliderChanged(e){
	let val = $("#filterSlider").get(0).valueAsNumber;

	if (val <= 0){
		val += 1.0;	
		let a = 100;
		let b = Math.log2(22050/100.0);
		let freq = a * Math.pow(2,b*val);
		if (mydata.filterNodeLow){
			mydata.filterNodeLow.frequency.value = freq;
			mydata.filterNodeHigh.frequency.value = 0;
			console.log("filter freq(low) = " + freq);
		}
	}else{
		let a = 50;
		let b = Math.log2(22050/2/50.0);
		let freq = a * Math.pow(2,b*val);
		if (mydata.filterNodeHigh) {
			mydata.filterNodeHigh.frequency.value = freq;
			mydata.filterNodeLow.frequency.value = 22050;
			console.log("filter freq(high) = " + freq);
		}		
	}
}





