import React, { useState, useRef, useEffect } from "react";

function ScreenShare() {
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);

  // Whenever stream changes, set it as the video element's srcObject.
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startScreenShare = async () => {
    try {
      // Request the display media (screen/window/tab share)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false, // Set true if you need audio from the shared screen.
      });
      setStream(displayStream);
    } catch (err) {
      console.error("Error starting screen share:", err);
    }
  };

  const stopScreenShare = () => {
    if (stream) {
      // Stop all tracks in the stream
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  return (
    <div className="p-4">
      <div className="space-x-4">
        <button
          onClick={startScreenShare}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Start Screen Share
        </button>
        <button
          onClick={stopScreenShare}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Stop Screen Share
        </button>
      </div>
      {/* Optionally display the shared screen */}
      {stream && (
        <div className="mt-4">
          <video ref={videoRef} autoPlay className="w-full border rounded" />
        </div>
      )}
    </div>
  );
}

export default ScreenShare;
