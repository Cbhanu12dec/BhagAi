import React, { useState, useEffect, useRef, useContext } from "react";
import { motion } from "framer-motion";
import io from "socket.io-client";
import { AppContext } from "./AppContext";

const socket = io(`${import.meta.env.VITE_SOCKET_URL}`, {
  transports: ["websocket", "polling"],
});

const Microphone = () => {
  const [status, setStatus] = useState("Not recording");
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const audioContextRef = useRef(null);
  const audioInputRef = useRef(null);
  const processorRef = useRef(null);
  const { setSpeechText } = useContext(AppContext);

  useEffect(() => {
    socket.on("transcription", (data) => {
      setTranscript(data?.text);
      console.log("Transcription:", data?.text);
      setSpeechText(data?.text);
    });
    socket.on("error", (errorMessage) => {
      console.error("Server error:", errorMessage);
      setTranscript((prev) => prev + "\nError: " + errorMessage);
    });

    return () => {
      socket.off("transcription");
      socket.off("error");
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      audioInputRef.current =
        audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(
        1024,
        1,
        1
      );

      audioInputRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      processorRef.current.onaudioprocess = (e) => {
        const float32Array = e.inputBuffer.getChannelData(0);
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
          int16Array[i] = Math.max(
            -32768,
            Math.min(32767, Math.floor(float32Array[i] * 32768))
          );
        }
        socket.emit("audioData", int16Array.buffer);
      };

      socket.emit("startTranscription");
      setStatus("Recording");
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setStatus("Error: " + error.message);
    }
  };

  const stopRecording = () => {
    if (audioContextRef.current) {
      audioInputRef.current.disconnect();
      processorRef.current.disconnect();
      audioContextRef.current.close();
      socket.emit("stopTranscription");
      setStatus("Not recording");
      setIsRecording(false);
    }
  };

  const clearTranscript = () => {
    setTranscript("");
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white p-6">
      <motion.h1
        className="text-3xl font-bold mb-4"
        animate={{ opacity: [0, 1], y: [-20, 0] }}
        transition={{ duration: 0.5 }}
      >
        Real-time Audio Transcription
      </motion.h1>
      <motion.div
        className="mb-4 text-lg flex items-center"
        animate={{ scale: [0.9, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
      >
        Status: <span className="ml-2 font-semibold">{status}</span>{" "}
        {isRecording ? "🔴" : "⚪"}
      </motion.div>
      <div className="flex gap-4 mb-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={startRecording}
          disabled={isRecording}
          className="px-6 py-2 bg-green-600 rounded-lg shadow-lg hover:bg-green-500 disabled:opacity-50"
        >
          Start Transcription
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={stopRecording}
          disabled={!isRecording}
          className="px-6 py-2 bg-red-600 rounded-lg shadow-lg hover:bg-red-500 disabled:opacity-50"
        >
          Stop Transcription
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={clearTranscript}
          className="px-6 py-2 bg-yellow-500 rounded-lg shadow-lg hover:bg-yellow-400"
        >
          Clear Transcript
        </motion.button>
      </div>
      <motion.div
        className="w-full max-w-2xl p-4 bg-gray-800 rounded-lg shadow-md min-h-[150px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {transcript || "Your transcriptions will appear here..."}
      </motion.div>
      <div className="mt-6 text-sm text-gray-400">
        <h2 className="text-lg font-semibold mb-2">How to use:</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Click "Start Transcription" to begin recording.</li>
          <li>Speak clearly into your microphone.</li>
          <li>Watch as your speech is transcribed in real-time.</li>
          <li>Click "Stop Transcription" when you're done.</li>
          <li>Use "Clear Transcript" to remove all transcribed text.</li>
        </ul>
      </div>
    </div>
  );
};

export default Microphone;
