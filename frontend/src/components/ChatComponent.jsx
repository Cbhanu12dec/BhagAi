import React, { useState } from "react";
import axios from "axios";

function ChatComponent() {
  const [message, setMessage] = useState("");
  const [chatResponse, setChatResponse] = useState("");

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
    <div style={{ margin: "20px" }}>
      <h2>Chat with GPT</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={{ width: "300px", padding: "8px" }}
        />
        <button type="submit" style={{ marginLeft: "10px", padding: "8px" }}>
          Send
        </button>
      </form>
      {chatResponse && (
        <div style={{ marginTop: "20px" }}>
          <h3>Response:</h3>
          <p>{chatResponse}</p>
        </div>
      )}
    </div>
  );
}

export default ChatComponent;
