import React, { useState, useRef } from "react";

const MicRecorder = () => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const webSocketRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const sourceRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current = source;
      const processor = audioContextRef.current.createScriptProcessor(
        4096,
        1,
        1
      );
      processorRef.current = processor;

      webSocketRef.current = new WebSocket("ws://localhost:5002");

      webSocketRef.current.onopen = () => {
        console.log("WebSocket connected");
      };

      webSocketRef.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      webSocketRef.current.onclose = (event) => {
        console.log("WebSocket closed:", event);
      };

      processor.onaudioprocess = (event) => {
        if (webSocketRef.current.readyState === WebSocket.OPEN) {
          const inputData = event.inputBuffer.getChannelData(0);
          const int16Array = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            int16Array[i] = inputData[i] * 32767;
          }
          webSocketRef.current.send(int16Array.buffer);
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);
      setRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (recording) {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
      setRecording(false);
      if (webSocketRef.current) {
        webSocketRef.current.close();
        console.log("WebSocket disconnected");
      }
    }
  };

  return (
    <div className="p-4 border rounded-lg text-center">
      <h2 className="text-xl font-bold">Mic Recorder</h2>
      <button
        onClick={recording ? stopRecording : startRecording}
        className={`px-4 py-2 mt-4 rounded-lg text-white ${
          recording ? "bg-red-600" : "bg-blue-600"
        }`}
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {recording && <p className="text-red-500 mt-2">Recording...</p>}
    </div>
  );
};

export default MicRecorder;
