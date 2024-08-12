import axios from "axios";
import {
  LocalAudioTrack,
  LocalTrackPublication,
  LocalVideoTrack,
  Participant,
  RemoteParticipant,
  RemoteTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
  VideoPresets,
} from "livekit-client";
import React, {
  createContext,
  ReactNode,
  useContext,
  useRef,
  useState,
} from "react";

interface TestVideoCallContextType {
  room: Room | null;
  localTracks: Map<string, Track>;
  participants: Participant[] | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  videoContainerRef: React.RefObject<HTMLDivElement>;
  connect: (username: string, roomId: string) => void;
  disconnect: () => void;
}

const TestVideoCallContext = createContext<
  TestVideoCallContextType | undefined
>(undefined);

export const useTestVideoCall = () => {
  const context = useContext(TestVideoCallContext);
  if (context === undefined) {
    throw new Error("useVideoCall must be used within a VideoCallProvider");
  }
  return context;
};

export const TestVideoCallProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [localTracks, setLocalTracks] = useState<Map<string, Track>>(new Map());
  const [participants, setParticipants] = useState<Participant[] | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const connect = async (username: string, roomId: string) => {
    const url = "ws://127.0.0.1:7880";

    try {
      const response = await axios.post(
        "http://localhost:3000/api/livekit/token",
        {
          identity: username,
          roomName: roomId,
        }
      );

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: VideoPresets.h720.resolution,
        },
      });

      newRoom.prepareConnection(url, response.data.token);

      newRoom
        .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
        .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
        .on(RoomEvent.TrackPublished, handleTrackPublished)
        .on(RoomEvent.ParticipantConnected, handleParticipationConnectedEvent)
        .on(
          RoomEvent.ParticipantDisconnected,
          handleParticipationDisconnectedEvent
        )
        .on(RoomEvent.Disconnected, handleDisconnect)
        .on(RoomEvent.LocalTrackUnpublished, handleLocalTrackUnpublished);

      await newRoom.connect(url, response.data.token);
      console.log("connected to room", newRoom.name);

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      const localVideoTrack = new LocalVideoTrack(
        mediaStream.getVideoTracks()[0]
      );
      await newRoom.localParticipant.publishTrack(localVideoTrack);
      setLocalTracks((prev) => new Map(prev.set("video", localVideoTrack)));

      const localAudioTrack = new LocalAudioTrack(
        mediaStream.getAudioTracks()[0]
      );
      await newRoom.localParticipant.publishTrack(localAudioTrack);
      setLocalTracks((prev) => new Map(prev.set("audio", localAudioTrack)));

      setRoom(newRoom);

      setParticipants([
        newRoom.localParticipant,
        ...Array.from(newRoom.remoteParticipants.values()),
      ]);

      if (videoRef.current) {
        localVideoTrack.attach(videoRef.current);
      }
    } catch (error) {
      console.error("Error in connect:", error);
    }
  };

  const disconnect = () => {
    console.log("disconnected from room");
    if (room) {
      room.localParticipant.trackPublications.forEach((publication) => {
        if (publication.track) {
          publication.track.stop();
          publication.track.detach();
        }
      });
      room.disconnect();
      setRoom(null);
      setLocalTracks(new Map());
    }
  };

  const handleTrackSubscribed = (track: RemoteTrack) => {
    console.log("Im being called", track);

    if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) {
      const element = track.attach();
      if (videoContainerRef.current) {
        videoContainerRef.current.appendChild(element);
        element.style.width = "100%";
        element.style.height = "auto";
        element.style.objectFit = "cover"; // Cover the container
      }
    }
  };

  const handleTrackUnsubscribed = (track: RemoteTrack) => {
    track.detach();
  };

  const handleTrackPublished = (
    remoteTrackPublication: RemoteTrackPublication,
    remoteParticipant: RemoteParticipant
  ) => {
    console.log({ remoteTrackPublication, remoteParticipant });
  };

  const handleParticipationConnectedEvent = (
    participant: RemoteParticipant
  ) => {
    // console.log("Participant connected", { participant });
    setParticipants((prev) => {
      if (prev === null) {
        return [participant];
      }
      return [...prev, participant];
    });
  };
  const handleParticipationDisconnectedEvent = (participant: Participant) => {
    // console.log("Participant disconnected", { participant });
    setParticipants((prev) => {
      if (prev === null) {
        return null;
      }
      return prev.filter((p) => p.sid !== participant.sid);
    });
  };

  const handleLocalTrackUnpublished = (publication: LocalTrackPublication) => {
    if (publication.track) {
      const trackId: string = publication.track.sid || "";
      setLocalTracks((prev) => {
        prev.delete(trackId);
        return new Map(prev);
      });
      publication.track.detach();
    }
  };

  const handleDisconnect = () => {
    console.log("disconnected from room");
    if (room) {
      room.localParticipant.trackPublications.forEach((publication) => {
        if (publication.track) {
          publication.track.stop();
          publication.track.detach();
        }
      });
      room.disconnect();
      setRoom(null);
      setLocalTracks(new Map());
    }
  };

  return (
    <TestVideoCallContext.Provider
      value={{
        room,
        participants,
        localTracks,
        videoRef,
        videoContainerRef,
        connect,
        disconnect,
      }}
    >
      {children}
    </TestVideoCallContext.Provider>
  );
};
