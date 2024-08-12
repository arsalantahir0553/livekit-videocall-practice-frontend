import { Box, Button, VStack } from "@chakra-ui/react";
import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTestVideoCall } from "./context/testVideoCallContext";

const TestCall: React.FC = () => {
  const {
    room,
    connect,
    disconnect,
    participants,
    videoRef,
    videoContainerRef,
  } = useTestVideoCall();

  const { roomId, username } = useParams();

  const handleConnect = () => {
    if (username && roomId) {
      connect(username, roomId);
    }
  };

  console.log(
    participants?.map((participant) => {
      console.log(participant.identity);
    })
  );
  return (
    <>
      <Button onClick={handleConnect}>Connect</Button>
      <Button onClick={disconnect}>Disconnect</Button>
      <Box
        w="20%"
        bg="transparent"
        border="2px"
        borderColor="white"
        rounded="md"
        overflow="hidden"
      >
        {participants?.map((participant) => {
          return (
            <Box key={participant.identity} w="100%">
              <p>{participant.identity}</p>
            </Box>
          );
        })}
        <video
          width="100%"
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ borderRadius: "4px" }}
        ></video>
      </Box>
      <Box w="full" bg="transparent" rounded="md" overflow="hidden">
        <VStack
          ref={videoContainerRef}
          id="videoContainer"
          flex={1}
          width="20%"
          p={4}
          spacing={4}
          bg="gray.50"
          align="stretch"
        ></VStack>
      </Box>
    </>
  );
};

export default TestCall;
