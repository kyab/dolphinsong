'use strict';

class MyUtility{

    constructor(){
        ;
    }


    static loadFromBlob(blob){
        return new Promise(function (resolve, reject) {
            MyUtility._tryLoadFromBlobStandard(blob)
            .then(function (b) {
                resolve(b);
            }, function (e) {
                MyUtility._tryLoadFromBlobAAC(blob)
                .then(function (b) {
                    resolve(b);
                }, function (e) {
                    reject(e);
                });
            });
        });
    }

    static _tryLoadFromBlobStandard(blob) {
        return new Promise(function (resolve, reject) {
            const fileReader = new FileReader();
            fileReader.onload = function (e) {
                const fileContents = e.target.result;
                const audioContextForDecode = new AudioContext();
                audioContextForDecode.decodeAudioData(fileContents)
                    .then(function (buf) {
                        let left = [];
                        let right = [];
                        left = buf.getChannelData(0);
                        if (buf.numberOfChannels == 1) {
                            right = buf.getChannelData(0);
                        } else {
                            right = buf.getChannelData(1);
                        }
                        audioContextForDecode.close();
                        let b ={};
                        b.left = left;
                        b.right = right;
                        resolve(b);
                    }, function (e) {
                        reject(e);
                    });
            }
            fileReader.readAsArrayBuffer(blob);
        });
    }

	static _tryLoadFromBlobAAC(blob) {
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
                        let left = new Float32Array(buffer.length / 2);
                        let right = new Float32Array(buffer.length / 2);
                        for (let i = 0; i < buffer.length / 2; i++) {
                            left[i] = buffer[i * 2];
                            right[i] = buffer[i * 2 + 1];
                        }
                        console.log("samples = " + buffer.length / 2);
                        let b = {};
                        b.left = left;
                        b.right = right;
                        resolve(b);
                    });
                }
                fileReader.readAsArrayBuffer(blob);	//somehow this required

            });
        });
    }

}