const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class ImprovedWatchPartyServer {
  constructor(port = 8080) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    this.port = port;
    
    // Data storage
    this.parties = new Map(); // partyId -> party data
    this.clients = new Map(); // ws -> client data
    this.rooms = new Map(); // roomId -> room data
    
    this.setupExpress();
    this.setupWebSocketServer();
    this.startServer();
  }

  setupExpress() {
    // Middleware
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        stats: this.getStats()
      });
    });
    
    // Get party info endpoint
    this.app.get('/api/party/:partyId', (req, res) => {
      const { partyId } = req.params;
      const party = this.parties.get(partyId);
      
      if (!party) {
        return res.status(404).json({ error: 'Party not found' });
      }
      
      res.json({
        partyId: party.id,
        participants: party.participants.length,
        status: party.status,
        createdAt: party.createdAt
      });
    });
    
    // Create party endpoint
    this.app.post('/api/party/create', (req, res) => {
      const { displayName, contentId, contentType } = req.body;
      
      if (!displayName || !contentId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const partyId = this.generatePartyId();
      const party = {
        id: partyId,
        hostId: null, // Will be set when WebSocket connects
        participants: [],
        status: 'waiting',
        contentId,
        contentType,
        currentTime: 0,
        duration: 0,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      };
      
      this.parties.set(partyId, party);
      
      res.json({ 
        partyId,
        message: 'Party created successfully'
      });
    });
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      console.log('New client connected from:', req.socket.remoteAddress);
      
      // Initialize client with better error handling
      const clientId = uuidv4();
      const clientData = {
        id: clientId,
        partyId: null,
        displayName: null,
        isHost: false,
        connectedAt: new Date().toISOString(),
        lastPing: Date.now()
      };
      
      this.clients.set(ws, clientData);
      
      // Send connection confirmation
      this.sendMessage(ws, {
        type: 'connected',
        clientId: clientId,
        timestamp: new Date().toISOString()
      });
      
      // Setup ping/pong for connection health
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
          clientData.lastPing = Date.now();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000); // Ping every 30 seconds
      
      ws.on('pong', () => {
        clientData.lastPing = Date.now();
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

      ws.on('close', (code, reason) => {
        console.log(`Client disconnected: ${code} - ${reason}`);
        clearInterval(pingInterval);
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        clearInterval(pingInterval);
      });
    });
  }

  handleMessage(ws, data) {
    const client = this.clients.get(ws);
    if (!client) {
      this.sendError(ws, 'Client not found');
      return;
    }

    console.log(`Handling message type: ${data.type} from client: ${client.id}`);

    switch (data.type) {
      case 'CREATE_PARTY':
        this.createParty(ws, data);
        break;
      case 'JOIN_PARTY':
        this.joinParty(ws, data);
        break;
      case 'LEAVE_PARTY':
        this.leaveParty(ws);
        break;
      case 'PLAYER_EVENT':
        this.handlePlayerEvent(ws, data);
        break;
      case 'CHAT_MESSAGE':
        this.handleChatMessage(ws, data);
        break;
      case 'SYNC_REQUEST':
        this.handleSyncRequest(ws, data);
        break;
      case 'HEARTBEAT':
        this.sendMessage(ws, { type: 'HEARTBEAT_ACK', timestamp: Date.now() });
        break;
      default:
        this.sendError(ws, `Unknown message type: ${data.type}`);
    }
  }

  createParty(ws, data) {
    const client = this.clients.get(ws);
    const { displayName, contentId, contentType, season, episode } = data;
    
    console.log('🎉 CREATE_PARTY request received:', { displayName, contentId, contentType, season, episode });

    if (!displayName || !contentId) {
      console.log('❌ Missing required fields:', { displayName: !!displayName, contentId: !!contentId });
      this.sendError(ws, 'Missing required fields for party creation');
      return;
    }

    // Check if client is already in a party
    if (client.partyId) {
      this.sendError(ws, 'Already in a party');
      return;
    }

    const partyId = this.generatePartyId();
    const party = {
      id: partyId,
      hostId: client.id,
      participants: [{
        id: client.id,
        name: displayName,
        isHost: true,
        joinedAt: new Date().toISOString()
      }],
      status: 'waiting',
      contentId,
      contentType,
      season: season || null,
      episode: episode || null,
      currentTime: 0,
      duration: 0,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      chatMessages: []
    };

    this.parties.set(partyId, party);
    client.partyId = partyId;
    client.displayName = displayName;
    client.isHost = true;

    this.sendMessage(ws, {
      type: 'PARTY_CREATED',
      partyId: partyId,
      userId: client.id,
      party: this.getPartyInfo(party)
    });

    console.log(`✅ Party successfully created: ${partyId} by ${displayName}`);
    console.log(`🎊 Party details:`, this.getPartyInfo(party));
  }

  joinParty(ws, data) {
    const client = this.clients.get(ws);
    const { partyId, displayName } = data;

    if (!partyId || !displayName) {
      this.sendError(ws, 'Missing party ID or display name');
      return;
    }

    const party = this.parties.get(partyId);
    if (!party) {
      this.sendError(ws, 'Party not found');
      return;
    }

    // Check if client is already in a party
    if (client.partyId) {
      this.sendError(ws, 'Already in a party');
      return;
    }

    // Check if display name is already taken
    const nameExists = party.participants.some(p => p.name === displayName);
    if (nameExists) {
      this.sendError(ws, 'Display name already taken');
      return;
    }

    // Add participant to party
    const participant = {
      id: client.id,
      name: displayName,
      isHost: false,
      joinedAt: new Date().toISOString()
    };

    party.participants.push(participant);
    party.lastActivity = new Date().toISOString();
    client.partyId = partyId;
    client.displayName = displayName;

    // Send join confirmation to new participant
    this.sendMessage(ws, {
      type: 'PARTY_JOINED',
      partyId: partyId,
      userId: client.id,
      party: this.getPartyInfo(party)
    });

    // Notify other participants
    this.broadcastToParty(party, {
      type: 'PARTICIPANT_JOINED',
      participant: participant
    }, ws);

    console.log(`${displayName} joined party: ${partyId}`);
  }

  leaveParty(ws) {
    const client = this.clients.get(ws);
    if (!client || !client.partyId) {
      return;
    }

    const party = this.parties.get(client.partyId);
    if (!party) {
      return;
    }

    // Remove participant from party
    party.participants = party.participants.filter(p => p.id !== client.id);
    party.lastActivity = new Date().toISOString();

    // Notify other participants
    this.broadcastToParty(party, {
      type: 'PARTICIPANT_LEFT',
      userId: client.id,
      displayName: client.displayName
    });

    // If host left, assign new host or delete party
    if (client.isHost) {
      if (party.participants.length > 0) {
        // Assign new host
        const newHost = party.participants[0];
        newHost.isHost = true;
        party.hostId = newHost.id;
        
        // Find new host's WebSocket connection
        for (const [clientWs, clientData] of this.clients.entries()) {
          if (clientData.id === newHost.id) {
            clientData.isHost = true;
            this.sendMessage(clientWs, {
              type: 'HOST_ASSIGNED',
              message: 'You are now the host'
            });
            break;
          }
        }
        
        this.broadcastToParty(party, {
          type: 'NEW_HOST',
          hostId: newHost.id,
          hostName: newHost.name
        });
      } else {
        // Delete empty party
        this.parties.delete(client.partyId);
        console.log(`Party deleted: ${client.partyId}`);
      }
    }

    // Clear client data
    client.partyId = null;
    client.displayName = null;
    client.isHost = false;

    console.log(`Client left party: ${client.id}`);
  }

  handlePlayerEvent(ws, data) {
    const client = this.clients.get(ws);
    if (!client || !client.partyId || !client.isHost) {
      return; // Only host can send player events
    }

    const party = this.parties.get(client.partyId);
    if (!party) {
      return;
    }

    // Update party state
    if (data.event) {
      party.currentTime = data.event.currentTime || party.currentTime;
      party.duration = data.event.duration || party.duration;
      party.status = data.event.eventType === 'play' ? 'playing' : 
                    data.event.eventType === 'pause' ? 'paused' : party.status;
      party.lastActivity = new Date().toISOString();
    }

    // Broadcast to all participants except sender
    this.broadcastToParty(party, {
      type: 'PLAYER_EVENT',
      event: data.event,
      timestamp: new Date().toISOString()
    }, ws);
  }

  handleChatMessage(ws, data) {
    const client = this.clients.get(ws);
    if (!client || !client.partyId) {
      return;
    }

    const party = this.parties.get(client.partyId);
    if (!party) {
      return;
    }

    const message = {
      id: uuidv4(),
      sender: client.displayName,
      text: data.message,
      timestamp: new Date().toISOString()
    };

    party.chatMessages.push(message);
    party.lastActivity = new Date().toISOString();

    // Broadcast to all participants
    this.broadcastToParty(party, {
      type: 'CHAT_MESSAGE',
      message: message
    });
  }

  handleSyncRequest(ws, data) {
    const client = this.clients.get(ws);
    if (!client || !client.partyId) {
      return;
    }

    const party = this.parties.get(client.partyId);
    if (!party) {
      return;
    }

    this.sendMessage(ws, {
      type: 'SYNC_STATE',
      status: party.status,
      currentTime: party.currentTime,
      duration: party.duration,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnect(ws) {
    const client = this.clients.get(ws);
    if (client) {
      console.log(`Client disconnecting: ${client.id}`);
      this.leaveParty(ws);
      this.clients.delete(ws);
    }
  }

  sendMessage(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  sendError(ws, message) {
    this.sendMessage(ws, {
      type: 'ERROR',
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  broadcastToParty(party, data, excludeWs = null) {
    for (const [ws, client] of this.clients.entries()) {
      if (client.partyId === party.id && ws !== excludeWs) {
        this.sendMessage(ws, data);
      }
    }
  }

  getPartyInfo(party) {
    return {
      id: party.id,
      participants: party.participants,
      status: party.status,
      contentId: party.contentId,
      contentType: party.contentType,
      season: party.season,
      episode: party.episode,
      currentTime: party.currentTime,
      duration: party.duration,
      chatMessages: party.chatMessages.slice(-50) // Last 50 messages
    };
  }

  generatePartyId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  cleanupOldParties() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [partyId, party] of this.parties.entries()) {
      const lastActivity = new Date(party.lastActivity);
      if (now - lastActivity > maxAge) {
        this.parties.delete(partyId);
        console.log(`Cleaned up old party: ${partyId}`);
      }
    }
  }

  getStats() {
    const activeParties = Array.from(this.parties.values()).filter(
      party => party.participants.length > 0
    ).length;

    return {
      totalParties: this.parties.size,
      activeParties: activeParties,
      totalClients: this.clients.size,
      uptime: process.uptime()
    };
  }

  startServer() {
    this.server.listen(this.port, () => {
      console.log(`Improved Watch Party Server running on port ${this.port}`);
      console.log(`HTTP endpoints available at http://localhost:${this.port}`);
      console.log(`WebSocket server ready for connections`);
    });

    // Cleanup old parties every hour
    setInterval(() => {
      this.cleanupOldParties();
    }, 60 * 60 * 1000);

    // Log stats every 5 minutes
    setInterval(() => {
      const stats = this.getStats();
      console.log('Watch Party Server stats:', stats);
    }, 5 * 60 * 1000);
  }
}

module.exports = ImprovedWatchPartyServer;

// If this file is run directly, start the server
if (require.main === module) {
  const server = new ImprovedWatchPartyServer(8080);
}