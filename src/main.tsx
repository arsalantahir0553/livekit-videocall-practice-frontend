import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ChakraProvider } from "@chakra-ui/react";
import { VideoCallProvider } from "./context/videoCallContext.tsx";
import { TestVideoCallProvider } from "./context/testVideoCallContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TestVideoCallProvider>
      <VideoCallProvider>
        <ChakraProvider>
          <App />
        </ChakraProvider>
      </VideoCallProvider>
    </TestVideoCallProvider>
  </StrictMode>
);
