const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const axios = require("axios");
const fs = require("fs");

const {
  TranscribeStreamingClient,
  StartStreamTranscriptionCommand,
} = require("@aws-sdk/client-transcribe-streaming");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const rawData = fs.readFileSync("prompt.json", "utf8");
const data = JSON.parse(rawData);
const interviewPrompt = data.interviewPrompt;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const transcribeClient = new TranscribeStreamingClient({
  region: process.env.AWS_TRANSCRIBE_REGION,
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  let isTranscribing = false;
  let audioStream = null;

  socket.on("startTranscription", async () => {
    console.log("Starting transcription for", socket.id);
    isTranscribing = true;
    let buffer = Buffer.from("");

    audioStream = async function* () {
      while (isTranscribing) {
        const chunk = await new Promise((resolve) =>
          socket.once("audioData", resolve)
        );
        if (chunk === null) break;
        buffer = Buffer.concat([buffer, Buffer.from(chunk)]);

        while (buffer.length >= 1024) {
          yield { AudioEvent: { AudioChunk: buffer.slice(0, 1024) } };
          buffer = buffer.slice(1024);
        }
      }
    };

    const command = new StartStreamTranscriptionCommand({
      LanguageCode: "en-US",
      MediaSampleRateHertz: 44100,
      MediaEncoding: "pcm",
      AudioStream: audioStream(),
    });

    try {
      const response = await transcribeClient.send(command);

      for await (const event of response.TranscriptResultStream) {
        if (!isTranscribing) break;
        if (event.TranscriptEvent) {
          const results = event.TranscriptEvent.Transcript.Results;
          if (results.length > 0 && results[0].Alternatives.length > 0) {
            const transcript = results[0].Alternatives[0].Transcript;
            socket.emit("transcription", { text: transcript });
          }
        }
      }
    } catch (error) {
      console.error("Transcription error:", error);
      socket.emit("error", "Transcription error: " + error.message);
    }
  });

  socket.on("stopTranscription", () => {
    console.log("Stopping transcription for", socket.id);
    isTranscribing = false;
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    isTranscribing = false;
  });
});

// ChatGPT integration
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  console.log("******** checking message:", req.body);
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "user", content: message },
          {
            role: "system",
            content: interviewPrompt,
          },
        ],
        max_tokens: 2000, // adjust this value to suit your needs
        temperature: 0.5,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    // Forward the ChatGPT response to the frontend
    res.json(response.data);
  } catch (error) {
    console.error(
      "Error calling ChatGPT API:",
      error.response ? error.response.data : error.message
    );
    res.status(500).json({ error: "Error processing the request" });
  }
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`Server is running on port :${PORT}`);
});
