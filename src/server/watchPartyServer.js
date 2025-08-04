const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class WatchPartyServer {
  constructor(port = 8080) {
    this.wss = new WebSocket.Server({ port });
    this.parties = new Map(); // partyId -> party data
    this.clients = new Map(); // ws -> client data
    
    this.setupWebSocketServer();
    console.log(`Watch Party WebSocket server started on port ${port}`);
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws) => {
      console.log('New client connected');
      
      // Initialize client
      const clientId = uuidv4();
      this.clients.set(ws, {
        id: clientId,
        partyId: null,
        displayName: null,
        isHost: false
      });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error parsing message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Send connection confirmation
      this.sendMessage(ws, {
        type: 'connected',
        clientId: clientId
      });
    });
  }

  handleMessage(ws, data) {
    const client = this.clients.get(ws);
    if (!client) return;

    switch (data.type) {
      case 'create_party':
        this.createParty(ws, data);
        break;
      case 'join_party':
        this.joinParty(ws, data);
        break;
      case 'leave_party':
        this.leaveParty(ws);
        break;
      case 'player_event':
        this.handlePlayerEvent(ws, data);
        break;
      case 'chat_message':
        this.handleChatMessage(ws, data);
        break;
      case 'sync_request':
        this.handleSyncRequest(ws, data);
        break;
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  createParty(ws, data) {
    const client = this.clients.get(ws);
    const partyId = this.generatePartyId();
    
    const party = {
      id: partyId,
      hostId: client.id,
      contentId: data.contentId,
      contentType: data.contentType,
      season: data.season,
      episode: data.episode,
      currentPlayer: data.currentPlayer,
      participants: new Map(),
      playerState: {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        lastUpdate: Date.now()
      },
      chatMessages: [],
      createdAt: Date.now()
    };

    // Add host to party
    party.participants.set(client.id, {
      id: client.id,
      displayName: data.displayName,
      isHost: true,
      ws: ws,
      joinedAt: Date.now()
    });

    // Update client
    client.partyId = partyId;
    client.displayName = data.displayName;
    client.isHost = true;

    // Store party
    this.parties.set(partyId, party);

    // Send success response
    this.sendMessage(ws, {
      type: 'party_created',
      partyId: partyId,
      isHost: true
    });

    // Send party state
    this.sendPartyState(ws, party);

    console.log(`Party created: ${partyId} by ${data.displayName}`);
  }

  joinParty(ws, data) {
    const client = this.clients.get(ws);
    const party = this.parties.get(data.partyId);

    if (!party) {
      this.sendError(ws, 'Party not found');
      return;
    }

    if (party.participants.size >= 5) {
      this.sendError(ws, 'Party is full (maximum 5 participants)');
      return;
    }

    // Add participant to party
    party.participants.set(client.id, {
      id: client.id,
      displayName: data.displayName,
      isHost: false,
      ws: ws,
      joinedAt: Date.now()
    });

    // Update client
    client.partyId = data.partyId;
    client.displayName = data.displayName;
    client.isHost = false;

    // Send success response
    this.sendMessage(ws, {
      type: 'party_joined',
      partyId: data.partyId,
      isHost: false
    });

    // Send party state to new participant
    this.sendPartyState(ws, party);

    // Notify all participants about new member
    this.broadcastToParty(party, {
      type: 'participant_joined',
      participant: {
        id: client.id,
        displayName: data.displayName,
        isHost: false
      }
    });

    // Add system message to chat
    const systemMessage = {
      id: uuidv4(),
      sender: 'System',
      message: `${data.displayName} joined the party`,
      timestamp: Date.now(),
      isSystem: true
    };
    party.chatMessages.push(systemMessage);

    console.log(`${data.displayName} joined party: ${data.partyId}`);
  }

  leaveParty(ws) {
    const client = this.clients.get(ws);
    if (!client || !client.partyId) return;

    const party = this.parties.get(client.partyId);
    if (!party) return;

    const participant = party.participants.get(client.id);
    if (!participant) return;

    // Remove participant from party
    party.participants.delete(client.id);

    // Add system message to chat
    const systemMessage = {
      id: uuidv4(),
      sender: 'System',
      message: `${participant.displayName} left the party`,
      timestamp: Date.now(),
      isSystem: true
    };
    party.chatMessages.push(systemMessage);

    // If host left, assign new host or delete party
    if (client.isHost) {
      if (party.participants.size > 0) {
        // Assign new host
        const newHost = party.participants.values().next().value;
        newHost.isHost = true;
        party.hostId = newHost.id;
        
        // Update client data
        const newHostClient = this.clients.get(newHost.ws);
        if (newHostClient) {
          newHostClient.isHost = true;
        }

        // Notify about new host
        this.broadcastToParty(party, {
          type: 'new_host',
          hostId: newHost.id,
          hostName: newHost.displayName
        });

        console.log(`New host assigned: ${newHost.displayName} in party ${party.id}`);
      } else {
        // Delete empty party
        this.parties.delete(party.id);
        console.log(`Party deleted: ${party.id}`);
        return;
      }
    }

    // Notify remaining participants
    this.broadcastToParty(party, {
      type: 'participant_left',
      participantId: client.id
    });

    // Reset client data
    client.partyId = null;
    client.displayName = null;
    client.isHost = false;

    console.log(`${participant.displayName} left party: ${party.id}`);
  }

  handlePlayerEvent(ws, data) {
    const client = this.clients.get(ws);
    if (!client || !client.partyId || !client.isHost) {
      this.sendError(ws, 'Only host can control playback');
      return;
    }

    const party = this.parties.get(client.partyId);
    if (!party) return;

    // Update party player state
    party.playerState = {
      isPlaying: data.isPlaying,
      currentTime: data.currentTime,
      duration: data.duration || party.playerState.duration,
      lastUpdate: Date.now()
    };

    // Broadcast to all participants except host
    this.broadcastToParty(party, {
      type: 'player_sync',
      playerState: party.playerState,
      event: data.event
    }, ws);

    console.log(`Player event from ${client.displayName}: ${data.event}`);
  }

  handleChatMessage(ws, data) {
    const client = this.clients.get(ws);
    if (!client || !client.partyId) return;

    const party = this.parties.get(client.partyId);
    if (!party) return;

    const message = {
      id: uuidv4(),
      sender: client.displayName,
      message: data.message,
      timestamp: Date.now(),
      isSystem: false
    };

    party.chatMessages.push(message);

    // Keep only last 50 messages
    if (party.chatMessages.length > 50) {
      party.chatMessages = party.chatMessages.slice(-50);
    }

    // Broadcast to all participants
    this.broadcastToParty(party, {
      type: 'chat_message',
      message: message
    });
  }

  handleSyncRequest(ws, data) {
    const client = this.clients.get(ws);
    if (!client || !client.partyId) return;

    const party = this.parties.get(client.partyId);
    if (!party) return;

    // Send current party state
    this.sendPartyState(ws, party);
  }

  handleDisconnect(ws) {
    const client = this.clients.get(ws);
    if (client && client.partyId) {
      this.leaveParty(ws);
    }
    this.clients.delete(ws);
  }

  sendMessage(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  sendError(ws, message) {
    this.sendMessage(ws, {
      type: 'error',
      message: message
    });
  }

  sendPartyState(ws, party) {
    const participants = Array.from(party.participants.values()).map(p => ({
      id: p.id,
      displayName: p.displayName,
      isHost: p.isHost,
      joinedAt: p.joinedAt
    }));

    this.sendMessage(ws, {
      type: 'party_state',
      party: {
        id: party.id,
        hostId: party.hostId,
        contentId: party.contentId,
        contentType: party.contentType,
        season: party.season,
        episode: party.episode,
        currentPlayer: party.currentPlayer,
        participants: participants,
        playerState: party.playerState,
        chatMessages: party.chatMessages.slice(-20) // Send last 20 messages
      }
    });
  }

  broadcastToParty(party, data, excludeWs = null) {
    party.participants.forEach((participant) => {
      if (participant.ws !== excludeWs) {
        this.sendMessage(participant.ws, data);
      }
    });
  }

  generatePartyId() {
    // Generate a 6-character party ID
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure uniqueness
    if (this.parties.has(result)) {
      return this.generatePartyId();
    }
    
    return result;
  }

  // Cleanup old parties (run periodically)
  cleanupOldParties() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    this.parties.forEach((party, partyId) => {
      if (now - party.createdAt > maxAge || party.participants.size === 0) {
        this.parties.delete(partyId);
        console.log(`Cleaned up old party: ${partyId}`);
      }
    });
  }

  // Get server stats
  getStats() {
    return {
      totalParties: this.parties.size,
      totalClients: this.clients.size,
      activeParties: Array.from(this.parties.values()).filter(p => p.participants.size > 0).length
    };
  }
}

module.exports = WatchPartyServer;

// Start server if run directly
if (require.main === module) {
  const server = new WatchPartyServer(8080);
  
  // Cleanup old parties every hour
  setInterval(() => {
    server.cleanupOldParties();
  }, 60 * 60 * 1000);
  
  // Log stats every 5 minutes
  setInterval(() => {
    const stats = server.getStats();
    console.log('Server stats:', stats);
  }, 5 * 60 * 1000);
}