import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Users, Copy, Settings, Play, Pause, RotateCcw, Volume2, VolumeX, Video } from 'lucide-react';
import VideoChat from './VideoChat';
import './WatchParty.css';

const WatchParty = ({ contentId, contentType, season, episode, currentPlayer, onClose, initialPartyId }) => {
  // URL parametrelerini kontrol et
  const urlParams = new URLSearchParams(window.location.search);
  const autoJoin = urlParams.get('autoJoin') === 'true';
  
  console.log('🎬 WatchParty bileşeni mount edildi:', { contentId, contentType, season, episode, initialPartyId, autoJoin });
  const [partyId, setPartyId] = useState(null);
  const [partyCode, setPartyCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [partyStatus, setPartyStatus] = useState('waiting');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [joinPartyId, setJoinPartyId] = useState('');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [playerEvents, setPlayerEvents] = useState([]);
  const [showVideoChat, setShowVideoChat] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  // WebSocket bağlantısı - Improved version
  const connectWebSocket = useCallback(() => {
    // Mevcut bağlantı varsa ve açıksa yeni bağlantı kurma
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log('⚠️ WebSocket zaten mevcut, yeni bağlantı kurulmayacak');
      return;
    }

    try {
      console.log('🔌 WebSocket bağlantısı kuruluyor...');
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://src-movie.onrender.com'
        : 'ws://localhost:8080';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket bağlantısı başarıyla kuruldu');
        setIsConnected(true);
        
        // Send heartbeat to maintain connection
        heartbeatIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'HEARTBEAT' }));
          } else {
            clearInterval(heartbeatIntervalRef.current);
          }
        }, 30000); // Every 30 seconds
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('❌ WebSocket mesaj parse hatası:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log(`🔌 WebSocket bağlantısı kapandı: ${event.code} - ${event.reason}`);
        setIsConnected(false);
        
        // Heartbeat interval'ını temizle
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
          heartbeatIntervalRef.current = null;
        }
        
        // Sadece beklenmeyen kapanmalarda yeniden bağlan
        if (event.code !== 1000) { // 1000 = normal closure
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Yeniden bağlanmaya çalışılıyor...');
            connectWebSocket();
          }, 3000);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket hatası:', error);
      };
    } catch (error) {
      console.error('❌ WebSocket bağlantı hatası:', error);
    }
  }, []);

  // WebSocket mesajlarını işle - Improved version
  const handleWebSocketMessage = (data) => {
    console.log('📨 WebSocket mesajı alındı:', data.type);
    
    switch (data.type) {
      case 'connected':
        console.log('🔗 Server bağlantısı onaylandı:', data.clientId);
        break;
        
      case 'PARTY_CREATED':
        console.log('🎉 Party oluşturuldu:', data.partyId);
        setPartyId(data.partyId);
        setPartyCode(data.partyId);
        setIsHost(true);
        if (data.party) {
          setParticipants(data.party.participants);
          setChatMessages(data.party.chatMessages || []);
        }
        break;
        
      case 'PARTY_JOINED':
        console.log('✅ Party\'ye katıldı:', data.partyId);
        setPartyId(data.partyId);
        if (data.party) {
          setParticipants(data.party.participants);
          setPartyStatus(data.party.status);
          setCurrentTime(data.party.currentTime);
          setDuration(data.party.duration);
          setChatMessages(data.party.chatMessages || []);
        }
        break;
        
      case 'PARTICIPANT_JOINED':
        console.log('👤 Yeni katılımcı:', data.participant.name);
        setParticipants(prev => [...prev, data.participant]);
        break;
        
      case 'PARTICIPANT_LEFT':
        console.log('👋 Katılımcı ayrıldı:', data.displayName);
        setParticipants(prev => prev.filter(p => p.id !== data.userId));
        break;
        
      case 'HOST_ASSIGNED':
        console.log('👑 Host olarak atandınız');
        setIsHost(true);
        break;
        
      case 'NEW_HOST':
        console.log('👑 Yeni host:', data.hostName);
        setParticipants(prev => prev.map(p => ({
          ...p,
          isHost: p.id === data.hostId
        })));
        break;
        
      case 'SYNC_STATE':
        console.log('🔄 Player state senkronize edildi');
        setPartyStatus(data.status);
        setCurrentTime(data.currentTime);
        setDuration(data.duration);
        syncPlayerState(data);
        break;
        
      case 'CHAT_MESSAGE':
        console.log('💬 Yeni chat mesajı:', data.message.sender);
        setChatMessages(prev => [...prev, data.message]);
        break;
        
      case 'PLAYER_EVENT':
        console.log('🎬 Player event alındı:', data.event.eventType);
        handleRemotePlayerEvent(data.event);
        break;
        
      case 'HEARTBEAT_ACK':
        // Heartbeat acknowledgment - no action needed
        break;
        
      case 'ERROR':
        console.error('❌ Server hatası:', data.message);
        alert(`Hata: ${data.message}`);
        break;
        
      default:
        console.warn('⚠️ Bilinmeyen mesaj tipi:', data.type);
    }
  };

  // Player state'ini senkronize et
  const syncPlayerState = (data) => {
    const iframe = document.querySelector('iframe[src*="vidrock.net"]');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'SYNC_COMMAND',
        action: data.status,
        currentTime: data.currentTime
      }, 'https://vidrock.net');
    }
  };

  // Uzaktan gelen player event'lerini işle
  const handleRemotePlayerEvent = (eventData) => {
    setPlayerEvents(prev => [...prev, eventData]);
    
    if (!isHost) {
      syncPlayerState(eventData);
    }
  };

  // VidRock player event'lerini dinle
  useEffect(() => {
    const handlePlayerMessage = (event) => {
      if (event.origin !== 'https://vidrock.net') return;
      
      // Player event'lerini işle (play, pause, seeked, ended, timeupdate)
      if (event.data?.type === 'PLAYER_EVENT') {
        const { event: eventType, currentTime, duration, tmdbId, mediaType, season, episode } = event.data.data;
        
        // UI state'ini güncelle
        setCurrentTime(currentTime);
        setDuration(duration);
        
        // Event'i konsola log et
        console.log(`Player ${eventType} at ${currentTime}s of ${duration}s`);
        
        // Host ise diğer katılımcılara gönder - Improved version
        if (isHost && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const message = {
            type: 'PLAYER_EVENT',
            partyId: partyId,
            event: {
              eventType: eventType,
              currentTime: currentTime,
              duration: duration,
              tmdbId: tmdbId,
              mediaType: mediaType,
              season: season || null,
              episode: episode || null,
              timestamp: new Date().toISOString()
            }
          };
          console.log('🎬 Player event gönderiliyor:', message);
          wsRef.current.send(JSON.stringify(message));
        }
      }
      
      // Media data'yı localStorage'a kaydet
      if (event.data?.type === 'MEDIA_DATA') {
        const mediaData = event.data.data;
        localStorage.setItem('vidRockProgress', JSON.stringify(mediaData));
        console.log('VidRock progress saved:', mediaData);
      }
    };

    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [isHost, partyId]);

  // Component mount edildiğinde WebSocket'e bağlan
  useEffect(() => {
    console.log('🔌 WebSocket bağlantısı başlatılıyor...');
    // Sadece ilk mount'ta bağlan
    if (!wsRef.current) {
      connectWebSocket();
    }
    
    return () => {
      console.log('🔌 WebSocket bağlantısı kapatılıyor...');
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []); // Boş dependency array ile sadece mount/unmount'ta çalış

  // URL'den gelen party ID'si varsa otomatik katıl - Improved Logic
  useEffect(() => {
    console.log('🔍 Party ID kontrolü:', { initialPartyId, isConnected, partyId, autoJoin, displayName });
    
    if (initialPartyId && isConnected && !partyId) {
      console.log('📋 Party ID bulundu:', initialPartyId);
      setJoinPartyId(initialPartyId);
      
      // AutoJoin durumunda otomatik isim ata ve hemen katıl
      if (autoJoin) {
        let finalDisplayName = displayName;
        if (!displayName || !displayName.trim()) {
          finalDisplayName = `Kullanıcı${Math.floor(Math.random() * 1000)}`;
          console.log('🎯 Otomatik displayName atanıyor:', finalDisplayName);
          setDisplayName(finalDisplayName);
        }
        
        // Kısa bir delay ile katılımı başlat
         setTimeout(() => {
           console.log('🚀 Otomatik party katılımı başlatılıyor:', initialPartyId, 'displayName:', finalDisplayName);
           joinExistingParty(initialPartyId, finalDisplayName);
         }, 100);
      }
    }
  }, [initialPartyId, isConnected, partyId, autoJoin]);

  // Rastgele party kodu oluştur
  const generatePartyCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Paylaşılabilir link oluştur
  const generateShareableLink = (partyId) => {
    const baseUrl = window.location.origin;
    const playerPath = contentType === 'tv' 
      ? `/player/${contentType}/${contentId}/${season}/${episode}`
      : `/player/${contentType}/${contentId}`;
    return `${baseUrl}${playerPath}?party=${partyId}&autoJoin=true`;
  };

  // Yeni party oluştur - Improved version
  const createParty = () => {
    console.log('🎉 createParty çağrıldı, displayName:', displayName);
    
    // DisplayName boşsa otomatik isim ata
    let finalDisplayName = displayName;
    if (!displayName.trim()) {
      finalDisplayName = `Kullanıcı${Math.floor(Math.random() * 1000)}`;
      setDisplayName(finalDisplayName);
      console.log('🎯 Otomatik displayName atandı:', finalDisplayName);
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log('📤 WebSocket açık, party oluşturma mesajı gönderiliyor');
      const message = {
        type: 'CREATE_PARTY',
        displayName: finalDisplayName,
        contentId: contentId,
        contentType: contentType,
        season: season || null,
        episode: episode || null
      };
      console.log('📤 Gönderilen mesaj:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.log('❌ WebSocket bağlantısı yok veya kapalı');
      alert('WebSocket bağlantısı yok. Lütfen sayfayı yenileyin.');
    }
  };

  // Mevcut party'ye katıl - Improved version
  const joinExistingParty = (partyIdToJoin, customDisplayName = null) => {
    console.log('🚪 joinExistingParty çağrıldı, partyId:', partyIdToJoin, 'displayName:', displayName, 'customDisplayName:', customDisplayName);
    
    // DisplayName boşsa otomatik isim ata
    let finalDisplayName = customDisplayName || displayName;
    if (!finalDisplayName || !finalDisplayName.trim()) {
      finalDisplayName = `Kullanıcı${Math.floor(Math.random() * 1000)}`;
      setDisplayName(finalDisplayName);
      console.log('🎯 Otomatik displayName atandı:', finalDisplayName);
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'JOIN_PARTY',
        partyId: partyIdToJoin,
        displayName: finalDisplayName
      };
      console.log('📤 Party katılma mesajı gönderiliyor:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.log('❌ WebSocket bağlantısı yok veya kapalı');
      alert('WebSocket bağlantısı yok. Lütfen sayfayı yenileyin.');
    }
  };

  // Party'den ayrıl - Improved version
  const leaveParty = () => {
    console.log('👋 leaveParty çağrıldı, partyId:', partyId);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'LEAVE_PARTY',
        partyId: partyId
      };
      console.log('📤 Party ayrılma mesajı gönderiliyor:', message);
      wsRef.current.send(JSON.stringify(message));
    }
    
    // State'i temizle
    setPartyId(null);
    setIsHost(false);
    setParticipants([]);
    setPartyStatus('waiting');
    setChatMessages([]);
    setCurrentTime(0);
    setDuration(0);
  };

  // Chat mesajı gönder - Improved version
  const sendChatMessage = () => {
    if (!newMessage.trim() || !partyId) {
      console.log('❌ Chat mesajı boş veya party ID yok');
      return;
    }
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'CHAT_MESSAGE',
        partyId: partyId,
        message: {
          id: Date.now().toString(),
          text: newMessage.trim(),
          sender: displayName,
          timestamp: new Date().toISOString()
        }
      };
      console.log('💬 Chat mesajı gönderiliyor:', message);
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.log('❌ WebSocket bağlantısı yok, chat mesajı gönderilemedi');
    }
    
    setNewMessage('');
  };

  // Party ID'yi kopyala
  const copyPartyId = () => {
    navigator.clipboard.writeText(partyId);
    alert('Party ID kopyalandı!');
  };

  // Paylaşılabilir linki kopyala
  const copyShareableLink = () => {
    navigator.clipboard.writeText(generateShareableLink(partyId));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Display name ayarla
  const setDisplayNameHandler = () => {
    if (displayName.trim()) {
      setShowNameInput(false);
    }
  };

  return (
    <div className="watch-party-overlay">
      <div className="watch-party-modal">
        <div className="watch-party-header">
          <h2>🎬 Birlikte İzle</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="watch-party-content">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <div className="status-indicator"></div>
            {isConnected ? 'Bağlı' : 'Bağlantı kuruluyor...'}
          </div>
          
          {showNameInput && (
            <div className="name-input-section">
              <h3>Görünen Adınızı Belirleyin</h3>
              <p>Bu isim diğer katılımcılar tarafından görülecektir.</p>
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Görünen adınızı girin"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={20}
                  onKeyPress={(e) => e.key === 'Enter' && setDisplayNameHandler()}
                />
                <button onClick={setDisplayNameHandler} disabled={!displayName.trim()}>
                  Devam Et
                </button>
              </div>
            </div>
          )}
          
          {!partyId && !showNameInput && (
            <div className="party-actions">
              <div className="action-section">
                <button className="create-party-btn" onClick={createParty}>
                  Yeni Party Oluştur
                </button>
                <p>Arkadaşlarınızla birlikte film/dizi izlemek için yeni bir party oluşturun.</p>
              </div>
              
              <div className="divider">VEYA</div>
              
              <div className="action-section">
                <h3>Mevcut Party'ye Katıl</h3>
                <div className="input-group">
                  <input
                    type="text"
                    placeholder="Party ID'sini girin"
                    value={joinPartyId}
                    onChange={(e) => setJoinPartyId(e.target.value)}
                  />
                  <button 
                    onClick={() => joinExistingParty(joinPartyId)}
                    disabled={!joinPartyId.trim()}
                  >
                    Katıl
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {partyId && (
            <div className="party-created">
              <h2>Party Created!</h2>
              <p>Share this ID with friends so they can join your watch party:</p>
              
              <div className="party-code-display">
                <span className="party-code">{partyCode}</span>
                <button className="copy-btn" onClick={() => {
                  navigator.clipboard.writeText(partyCode);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}>
                  <Copy size={16} />
                </button>
              </div>
              
              <div className="party-stats">
                <p>Connected users: {participants.length}/5</p>
                <p>Status: {isHost ? 'Host' : 'Guest'}</p>
              </div>
              
              <div className="room-link-section">
                <h4>Odaya Girme Linki:</h4>
                <div className="room-link-display">
                  <input 
                    type="text" 
                    value={`${window.location.origin}/player/${contentType}/${contentId}${season && episode ? `/${season}/${episode}` : ''}?party=${partyId}&autoJoin=true`}
                    readOnly 
                    className="room-link-input"
                  />
                  <button 
                    className="copy-btn" 
                    onClick={() => {
                      const roomLink = `${window.location.origin}/player/${contentType}/${contentId}${season && episode ? `/${season}/${episode}` : ''}?party=${partyId}&autoJoin=true`;
                      navigator.clipboard.writeText(roomLink);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                  >
                    <Copy size={16} />
                    {copySuccess && <span> Kopyalandı!</span>}
                  </button>
                </div>
                <p className="room-link-info">Bu linke tıklayan arkadaşlarınız otomatik olarak odaya katılacak ve VidRock player ile video açılacak.</p>
              </div>
              
              <div className="connected-users">
                <h4>Connected Users:</h4>
                <div className="users-list">
                  {participants.map((participant) => (
                    <div key={participant.id} className="user-item">
                      <span className="user-name">{participant.name}</span>
                      {participant.isHost && <span className="host-indicator">● Host</span>}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="party-actions">
                <button className="manage-party-btn">
                  <Settings size={16} /> Manage Party
                </button>
                <button 
                  className="video-chat-btn"
                  onClick={() => setShowVideoChat(true)}
                  title="Video Chat"
                >
                  <Video size={16} /> Video Chat
                </button>
                <button className="close-party-btn" onClick={onClose}>
                  Close
                </button>
                {isHost && (
                  <button className="end-party-btn" onClick={() => {
                    // Party sonlandırma işlemi - Improved version
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                      const message = {
                        type: 'END_PARTY',
                        partyId: partyId
                      };
                      console.log('🔚 Party sonlandırma mesajı gönderiliyor:', message);
                      wsRef.current.send(JSON.stringify(message));
                    }
                    onClose();
                  }}>
                    End Party
                  </button>
                )}
              </div>
              
              {isHost && (
                <div className="host-controls">
                  <h4>Host Kontrolleri</h4>
                  <div className="control-buttons">
                    <button className="control-btn play">
                      <Play size={16} /> Oynat
                    </button>
                    <button className="control-btn pause">
                      <Pause size={16} /> Duraklat
                    </button>
                    <button className="control-btn sync">
                      <RotateCcw size={16} /> Senkronize Et
                    </button>
                  </div>
                </div>
              )}
              
              <div className="chat-section">
                <h4>Sohbet</h4>
                <div className="chat-messages">
                  {chatMessages.map((message) => (
                    <div key={message.id} className="chat-message">
                      <span className="sender">{message.sender}:</span>
                      <span className="text">{message.text}</span>
                    </div>
                  ))}
                </div>
                <div className="chat-input">
                  <input
                    type="text"
                    placeholder="Mesaj yazın..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  />
                  <button onClick={sendChatMessage} disabled={!newMessage.trim()}>
                    Gönder
                  </button>
                </div>
              </div>
              
              <button className="leave-party-btn" onClick={leaveParty}>
                Party'den Ayrıl
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Video Chat */}
      {showVideoChat && (
        <VideoChat 
          partyId={partyId}
          displayName={displayName}
          onClose={() => setShowVideoChat(false)}
        />
      )}
    </div>
  );
};

export default WatchParty;