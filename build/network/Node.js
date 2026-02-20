const WebSocket = require('ws');
const { Rest } = require('./Rest');

/**
 * Minimal Lavalink node connection - Engine only
 */
class Node {
  constructor(oneplayer, node, options) {
    this.oneplayer = oneplayer;
    this.name = node.name || node.host;
    this.host = node.host || 'localhost';
    this.port = node.port || 2333;
    this.password = node.password || 'youshallnotpass';
    this.secure = node.secure || false;
    this.restVersion = options.restVersion || 'v4';
    this.sessionId = node.sessionId || null;
    this.reconnectTimeout = options.reconnectTimeout || 3000;
    this.reconnectTries = options.reconnectTries || 3;
    this.reconnectAttempt = null;
    this.reconnectAttempted = 0;
    this.connected = false;
    this.info = null;
    this.ws = null;
    this.stats = {
      players: 0, 
      playingPlayers: 0, 
      uptime: 0,
      memory: { free: 0, used: 0, allocated: 0, reservable: 0 },
      cpu: { cores: 0, systemLoad: 0, lavalinkLoad: 0 },
      frameStats: { sent: 0, nulled: 0, deficit: 0 },
    };
    this.rest = new Rest(oneplayer, {
      host: this.host, 
      port: this.port, 
      password: this.password,
      secure: this.secure, 
      restVersion: this.restVersion, 
      sessionId: this.sessionId,
    });
    
    this.wsUrl = this.restVersion === 'v4'
      ? `ws${this.secure ? 's' : ''}://${this.host}:${this.port}/v4/websocket`
      : `ws${this.secure ? 's' : ''}://${this.host}:${this.port}`;
  }

  get penalties() {
    let penalties = 0;
    if (!this.connected) return penalties;
    if (this.stats.players) penalties += this.stats.players;
    if (this.stats.cpu?.systemLoad) penalties += Math.round(Math.pow(1.05, 100 * this.stats.cpu.systemLoad) * 10 - 10);
    if (this.stats.frameStats) {
      penalties += this.stats.frameStats.deficit || 0;
      penalties += (this.stats.frameStats.nulled || 0) * 2;
    }
    return penalties;
  }

  async connect() {
    if (this.ws) this.ws.close();
    
    const headers = {
      'Authorization': this.password,
      'User-Id': this.oneplayer.clientId,
      'Client-Name': `OnePlayer/${this.oneplayer.version}`,
    };
    
    if (this.restVersion === 'v4' && this.sessionId) {
      headers['Session-Id'] = this.sessionId;
    }
    
    this.ws = new WebSocket(this.wsUrl, { headers });
    this.ws.on('open', this._onOpen.bind(this));
    this.ws.on('message', this._onMessage.bind(this));
    this.ws.on('close', this._onClose.bind(this));
    this.ws.on('error', this._onError.bind(this));
  }

  async _onOpen() {
    if (this.reconnectAttempt) {
      clearTimeout(this.reconnectAttempt);
      this.reconnectAttempted = 0;
      this.reconnectAttempt = null;
    }
    this.connected = true;
    
    try { 
      this.info = await this.rest.getInfo(); 
    } catch (e) {
      // Ignore info fetch errors
    }
  }

  _onMessage(data) {
    if (Array.isArray(data)) data = Buffer.concat(data);
    else if (data instanceof ArrayBuffer) data = Buffer.from(data);
    
    let payload;
    try { 
      payload = JSON.parse(data.toString()); 
    } catch { 
      return; 
    }
    
    if (!payload.op) return;
    
    switch (payload.op) {
      case 'ready': 
        this._handleReady(payload); 
        break;
      case 'stats': 
        this._handleStats(payload); 
        break;
      case 'playerUpdate':
      case 'event': 
        this._handlePlayerEvent(payload); 
        break;
    }
  }

  _handleReady(payload) {
    if (this.sessionId !== payload.sessionId) {
      this.rest.setSessionId(payload.sessionId);
      this.sessionId = payload.sessionId;
    }
    this.oneplayer.emit('nodeConnect', this);
  }

  _handleStats(payload) {
    this.stats = {
      players: payload.players, 
      playingPlayers: payload.playingPlayers, 
      uptime: payload.uptime,
      memory: payload.memory, 
      cpu: payload.cpu, 
      frameStats: payload.frameStats,
    };
  }

  _handlePlayerEvent(payload) {
    const player = this.oneplayer.players.get(payload.guildId);
    if (player) player.emit(payload.op, payload);
  }

  _onClose(code, reason) {
    this.connected = false;
    this.oneplayer.emit('nodeDisconnect', this, { code, reason: reason?.toString() });
    this._reconnect();
  }

  _onError(error) {
    this.oneplayer.emit('nodeError', this, error);
  }

  _reconnect() {
    this.reconnectAttempt = setTimeout(() => {
      if (this.reconnectAttempted >= this.reconnectTries) {
        this.oneplayer.emit('nodeError', this, new Error(`Failed to reconnect after ${this.reconnectTries} attempts`));
        return this.destroy();
      }
      this.reconnectAttempted++;
      this.oneplayer.emit('nodeReconnect', this);
      this.ws?.removeAllListeners();
      this.ws = null;
      this.connect();
    }, this.reconnectTimeout);
  }

  disconnect() {
    if (!this.connected) return;
    this.ws?.close(1000, 'disconnect');
    this.ws?.removeAllListeners();
    this.ws = null;
    this.connected = false;
    this.oneplayer.emit('nodeDisconnect', this, { code: 1000, reason: 'disconnect' });
  }

  destroy() {
    if (!this.connected) return;
    
    for (const player of this.oneplayer.players.values()) {
      if (player.node === this) player.destroy();
    }
    
    this.ws?.close(1000, 'destroy');
    this.ws?.removeAllListeners();
    this.ws = null;
    
    if (this.reconnectAttempt) clearTimeout(this.reconnectAttempt);
    
    this.oneplayer.emit('nodeDestroy', this);
    this.oneplayer.nodeMap.delete(this.name);
    this.connected = false;
  }
}

module.exports = { Node };