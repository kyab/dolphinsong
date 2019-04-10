class MyBypassProcessor extends AudioWorkletProcessor {
    constructor(){
        super();
        this.port.onmessage = onMessage;
    }

    onMessage(event){
        console.log("reveived : ");
        console.log(event.data);
    }

    process(inputs, outputs, parameters) {
        let input = inputs[0];
        let output = outputs[0];

        let inputChannel0 = input[0];
        let outputChannel0 = output[0];

        for (let i = 0; i < input[0].length; i++){
            output[0][i] = input[0][i];
            output[1][i] = input[1][i];
        }

        return true;
    }
}

registerProcessor("my-bypass-processor", MyBypassProcessor);