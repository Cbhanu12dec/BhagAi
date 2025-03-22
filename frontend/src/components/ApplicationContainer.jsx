import React from "react";
import Microphone from "./Microphone";
import ScreenShare from "./ScreenShare";
import ChatComponent from "./ChatComponent";
const ApplicationContainer = () => {
  return (
    <div className="flex flex-row h-screen">
      <div className="w-1/2 flex items-center justify-center">
        <Microphone />
      </div>
      <div className="w-1/2 flex items-center justify-center">
        <ChatComponent />
      </div>
    </div>
  );
};

export default ApplicationContainer;
