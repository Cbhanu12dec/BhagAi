import React from "react";
import Microphone from "./Microphone";
import ScreenShare from "./ScreenShare";
import ChatComponent from "./ChatComponent";
import { AppProvider } from "./AppContext";

const ApplicationContainer = () => {
  return (
    <AppProvider>
      <div className="flex flex-row h-screen">
        <div className="w-1/2 flex items-center justify-center">
          <Microphone />
        </div>
        <div className="w-1/2 flex items-center justify-center">
          <ChatComponent />
        </div>
      </div>
    </AppProvider>
  );
};

export default ApplicationContainer;
