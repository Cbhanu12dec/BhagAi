import React, { useState, useContext, useEffect, useRef } from "react";
import axios from "axios";
import { AppContext } from "./AppContext";
import { FiSend } from "react-icons/fi";
import ReactMarkdown from "react-markdown";
function ChatComponent() {
  const [message, setMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const { speechText } = useContext(AppContext);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
    setMessage(speechText);
  }, [speechText]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.key === "Enter") {
        if (document.activeElement !== inputRef.current) {
          inputRef.current.focus();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await axios.post("http://localhost:8080/api/chat", {
        message,
      });
      // Assuming response structure follows the API response from ChatGPT
      setChatResponse(result.data.choices[0].message.content);
    } catch (error) {
      console.error("Error sending message:", error);
      setChatResponse("Error fetching response.");
    }
  };

  return (
    <div className="w-full min-h-screen p-3">
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-6xl p-2 border border-gray-200 rounded focus:ring-1 focus:ring-gray-200 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              console.log("Enter key pressed");
              e.stopPropagation();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="submit"
          className="px-4 py-3 bg-green-500 text-white rounded hover:bg-green-500 focus:outline-none"
        >
          <FiSend size={20} />{" "}
        </button>
      </form>
      {chatResponse && (
        <div className="mt-5">
          <p className="font-bold">Question: {message}</p>
          <div className="mt-2 p-4 bg-gray-100 rounded">
            {/* <p>{chatResponse}</p> */}
            <ReactMarkdown>{chatResponse}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatComponent;
