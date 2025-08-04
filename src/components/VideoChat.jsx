import React, { useState, useEffect, useRef } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { useRTCClient, useJoin, useLocalCameraTrack, useLocalMicrophoneTrack, usePublish, useRemoteAudioTracks, useRemoteUsers } from 'agora-rtc-react';
import { Video, VideoOff, Mic, MicOff, PhoneOff } from 'lucide-react';
import './VideoChat.css';

// Agora App ID - .env dosyasından alın
const APP_ID = import.meta.env.VITE_AGORA_APP_ID || 'demo_app_id';

const VideoChat = ({ partyId, displayName, onClose }) => {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  
  // Agora RTC hooks
  const agoraEngine = useRTCClient(AgoraRTC.createClient({ codec: 'vp8', mode: 'rtc' }));
  const { localCameraTrack } = useLocalCameraTrack(isVideoEnabled);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isAudioEnabled);
  const { isLoading: isJoining, isConnected } = useJoin({
    appid: APP_ID,
    channel: `party_${partyId}`,
    token: null, // Production'da token kullanın
    uid: null,
  }, isJoined);
  
  usePublish([localMicrophoneTrack, localCameraTrack]);
  const remoteUsers = useRemoteUsers();
  const { audioTracks } = useRemoteAudioTracks(remoteUsers);
  
  // Remote audio tracks'i otomatik oynat
  useEffect(() => {
    audioTracks.map((track) => track.play());
  }, [audioTracks]);
  
  // Video chat'e katıl
  const joinVideoChat = () => {
    setIsJoined(true);
  };
  
  // Video chat'ten ayrıl
  const leaveVideoChat = () => {
    setIsJoined(false);
    onClose();
  };
  
  // Video toggle
  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };
  
  // Audio toggle
  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };
  
  // Remote user video component
  const RemoteUser = ({ user }) => {
    const videoTrack = user.videoTrack;
    const audioTrack = user.audioTrack;
    
    useEffect(() => {
      if (audioTrack) {
        audioTrack.play();
      }
      return () => {
        if (audioTrack) {
          audioTrack.stop();
        }
      };
    }, [audioTrack]);
    
    return (
      <div className="remote-user">
        <div 
          className="video-container"
          ref={(ref) => {
            if (ref && videoTrack) {
              videoTrack.play(ref);
            }
          }}
        >
          {!videoTrack && (
            <div className="no-video">
              <div className="avatar">
                {user.uid.toString().charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
        <div className="user-info">
          <span>Kullanıcı {user.uid}</span>
        </div>
      </div>
    );
  };
  
  if (!isJoined) {
    return (
      <div className="video-chat-overlay">
        <div className="video-chat-modal">
          <div className="video-chat-header">
            <h3>Video Chat'e Katıl</h3>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
          <div className="video-chat-content">
            <p>Party'deki diğer kişilerle video chat yapmak ister misiniz?</p>
            <div className="video-chat-actions">
              <button className="join-video-btn" onClick={joinVideoChat}>
                Video Chat'e Katıl
              </button>
              <button className="skip-btn" onClick={onClose}>
                Şimdilik Geç
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="video-chat-container">
      <div className="video-grid">
        {/* Local video */}
        <div className="local-user">
          <div 
            className="video-container local-video"
            ref={(ref) => {
              if (ref && localCameraTrack) {
                localCameraTrack.play(ref);
              }
            }}
          >
            {!isVideoEnabled && (
              <div className="no-video">
                <div className="avatar">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
          <div className="user-info">
            <span>{displayName} (Sen)</span>
          </div>
        </div>
        
        {/* Remote users */}
        {remoteUsers.map((user) => (
          <RemoteUser key={user.uid} user={user} />
        ))}
      </div>
      
      {/* Video controls */}
      <div className="video-controls">
        <button 
          className={`control-btn ${!isAudioEnabled ? 'disabled' : ''}`}
          onClick={toggleAudio}
          title={isAudioEnabled ? 'Mikrofonu Kapat' : 'Mikrofonu Aç'}
        >
          {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        
        <button 
          className={`control-btn ${!isVideoEnabled ? 'disabled' : ''}`}
          onClick={toggleVideo}
          title={isVideoEnabled ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
        >
          {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        
        <button 
          className="control-btn leave-btn"
          onClick={leaveVideoChat}
          title="Video Chat'ten Ayrıl"
        >
          <PhoneOff size={20} />
        </button>
      </div>
      
      {isJoining && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Video chat'e bağlanıyor...</p>
        </div>
      )}
    </div>
  );
};

export default VideoChat;