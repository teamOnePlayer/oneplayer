const { EventEmitter } = require('events');
const { Node } = require('../network/Node');
const { Player } = require('../player/Player');
const { Track } = require('../player/Track');
const pkg = require('../../package.json');

const SUPPORTED_VERSIONS = ['v3', 'v4'];

/**
 * Minimal OnePlayer client - Engine and Player only
 * @extends EventEmitter
 */
const DEFAULT_CONFIG = {
  // Core settings only
  defaultSearchPlatform: 'ytmsearch',
  restVersion: 'v4',
  
  // Reconnection settings - optimized
  reconnectTimeout: 3000,
  reconnectTries: 3,
  
  // Player settings - minimal
  defaultVolume: 100,
  connectionTimeout: 10000,
  
  // Debug
  debug: false,
};

class OnePlayer extends EventEmitter {
  /**
   * @param {Object} client - Discord client instance
   * @param {Array} nodes - Node configurations
   * @param {Object} options - OnePlayer options
   */
  constructor(client, nodes, options) {
    super();

    if (!client) throw new Error('Discord client is required');
    if (!nodes || !Array.isArray(nodes)) throw new TypeError('Nodes must be an array');
    if (!options?.send || typeof options.send !== 'function') {
      throw new Error('send function is required');
    }

    // Merge options with defaults
    this.config = { ...DEFAULT_CONFIG, ...options };
    
    this.client = client;
    this.nodes = nodes;
    this.options = options;
    this.nodeMap = new Map();
    this.players = new Map();
    this.clientId = null;
    this.initiated = false;
    
    // Core settings
    this.send = options.send;
    this.defaultSearchPlatform = this.config.defaultSearchPlatform;
    this.restVersion = this.config.restVersion;
    
    // Search cache
    this.tracks = [];
    this.loadType = null;
    this.playlistInfo = null;
    
    // Version
    this.version = pkg.version;

    if (!SUPPORTED_VERSIONS.includes(this.restVersion)) {
      throw new RangeError(`${this.restVersion} is not supported. Use: ${SUPPORTED_VERSIONS.join(', ')}`);
    }
  }

  get leastUsedNodes() {
    return [...this.nodeMap.values()]
      .filter(node => node.connected)
      .sort((a, b) => a.rest.calls - b.rest.calls);
  }

  get bestNode() {
    return [...this.nodeMap.values()]
      .filter(node => node.connected)
      .sort((a, b) => a.penalties - b.penalties)[0];
  }

  init(clientId) {
    if (this.initiated) return this;
    this.clientId = clientId;
    this.nodes.forEach(node => this.createNode(node));
    this.initiated = true;
    return this;
  }

  createNode(options) {
    const node = new Node(this, options, this.options);
    this.nodeMap.set(options.name || options.host, node);
    node.connect();
    this.emit('nodeCreate', node);
    return node;
  }

  destroyNode(identifier) {
    const node = this.nodeMap.get(identifier);
    if (!node) return;
    node.disconnect();
    this.nodeMap.delete(identifier);
    this.emit('nodeDestroy', node);
  }

  updateVoiceState(packet) {
    if (!['VOICE_STATE_UPDATE', 'VOICE_SERVER_UPDATE'].includes(packet.t)) return;
    const player = this.players.get(packet.d.guild_id);
    if (!player) return;
    if (packet.t === 'VOICE_SERVER_UPDATE') {
      player.connection.setServerUpdate(packet.d);
    } else if (packet.t === 'VOICE_STATE_UPDATE') {
      if (packet.d.user_id !== this.clientId) return;
      player.connection.setStateUpdate(packet.d);
    }
  }

  createConnection(options) {
    if (!this.initiated) throw new Error('OnePlayer must be initialized first');
    const existing = this.players.get(options.guildId);
    if (existing) return existing;
    if (this.leastUsedNodes.length === 0) throw new Error('No available nodes');
    const node = this.leastUsedNodes[0];
    if (!node) throw new Error('No available nodes');
    return this.createPlayer(node, options);
  }

  createPlayer(node, options) {
    const player = new Player(this, node, options);
    this.players.set(options.guildId, player);
    player.connect(options);
    this.emit('playerCreate', player);
    return player;
  }

  destroyPlayer(guildId) {
    const player = this.players.get(guildId);
    if (!player) return;
    player.destroy();
    this.players.delete(guildId);
    this.emit('playerDestroy', player);
  }

  removeConnection(guildId) {
    const player = this.players.get(guildId);
    if (player) {
      player.destroy();
      this.players.delete(guildId);
    }
  }

  get(guildId) {
    const player = this.players.get(guildId);
    if (!player) throw new Error(`No player found for guild ${guildId}`);
    return player;
  }

  async resolve({ query, source, requester, node }) {
    if (!this.initiated) throw new Error('OnePlayer must be initialized first');
    if (node && typeof node !== 'string' && !(node instanceof Node)) {
      throw new TypeError('node must be a string identifier or Node instance');
    }
    const requestNode = (node && typeof node === 'string' ? this.nodeMap.get(node) : node) || this.leastUsedNodes[0];
    if (!requestNode) throw new Error('No available nodes');
    
    try {
      const searchSource = source || this.defaultSearchPlatform;
      const isUrl = /^https?:\/\//.test(query);
      const identifier = isUrl ? query : `${searchSource}:${query}`;
      
      let response = await requestNode.rest.loadTracks(identifier);
      
      if (requestNode.rest.version === 'v4') {
        this._processV4Response(response, requester, requestNode);
      } else {
        this._processV3Response(response, requester, requestNode);
      }
      
      return {
        loadType: this.loadType,
        exception: this.loadType === 'error' ? response.data : this.loadType === 'LOAD_FAILED' ? response.exception : null,
        playlistInfo: this.playlistInfo,
        tracks: this.tracks,
      };
    } catch (error) {
      throw error;
    }
  }

  _processV4Response(response, requester, node) {
    switch (response.loadType) {
      case 'track':
        this.tracks = response.data ? [new Track(response.data, requester, node)] : [];
        break;
      case 'playlist':
        this.tracks = response.data?.tracks?.map(t => new Track(t, requester, node)) || [];
        this.playlistInfo = response.data?.info || null;
        break;
      case 'search':
        this.tracks = response.data?.map(t => new Track(t, requester, node)) || [];
        break;
      default:
        this.tracks = [];
    }
    this.loadType = response.loadType;
  }

  _processV3Response(response, requester, node) {
    this.tracks = response.tracks?.map(t => new Track(t, requester, node)) || [];
    this.loadType = response.loadType;
    this.playlistInfo = response.playlistInfo || null;
  }

  async decodeTrack(track, node) {
    const requestNode = node || this.leastUsedNodes[0];
    if (!requestNode) throw new Error('No available nodes');
    return requestNode.rest.decodeTrack(track);
  }

  async decodeTracks(tracks, node) {
    const requestNode = node || this.leastUsedNodes[0];
    if (!requestNode) throw new Error('No available nodes');
    return requestNode.rest.decodeTracks(tracks);
  }
}

module.exports = { OnePlayer };