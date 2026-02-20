const { EventEmitter } = require('events');
const { Connection } = require('./Connection');
const { Queue } = require('./Queue');
const { Filters } = require('../audio/Filters');

/**
 * High-quality optimized audio player - Engine only
 * Ultra-low latency, minimal resource usage
 * @extends EventEmitter
 */
class Player extends EventEmitter {
  /**
   * @param {Object} oneplayer - OnePlayer instance
   * @param {Object} node - Node instance
   * @param {Object} options - Player options
   */
  constructor(oneplayer, node, options) {
    super();
    
    this.oneplayer = oneplayer;
    this.node = node;
    this.guildId = options.guildId;
    this.textChannel = options.textChannel || null;
    this.voiceChannel = options.voiceChannel;
    
    // Core components - optimized for performance
    this.connection = new Connection(this);
    this.queue = new Queue();
    this.filters = new Filters(this);
    
    // State - minimal memory footprint
    this.volume = Math.min(Math.max(options.defaultVolume ?? 100, 0), 200);
    this.loop = 'none'; // none, track, queue
    this.current = null;
    this.previous = null;
    this.position = 0;
    this.timestamp = 0;
    this.ping = 0;
    
    // Flags - single bits for memory efficiency
    this.playing = false;
    this.paused = false;
    this.connected = false;
    this._skipping = false; // Flag to prevent race conditions during skip
    
    // Voice options
    this.deaf = options.deaf ?? true;
    this.mute = options.mute ?? false;
    
    // Performance optimization - pre-bind methods
    this._onPlayerUpdate = this._onPlayerUpdate.bind(this);
    this._onEvent = this._onEvent.bind(this);
    
    this._setupEventHandlers();
  }

  /**
   * Setup optimized event handlers
   * @private
   */
  _setupEventHandlers() {
    this.on('playerUpdate', this._onPlayerUpdate);
    this.on('event', this._onEvent);
  }

  /**
   * Optimized player update handler
   * @private
   */
  _onPlayerUpdate(packet) {
    const state = packet.state;
    this.connected = state.connected;
    this.position = state.position || 0;
    this.ping = state.ping || 0;
    this.timestamp = state.time || Date.now();
  }

  /**
   * Connect to voice channel with optimized payload
   * @param {Object} options - Connection options
   */
  connect(options = {}) {
    const voiceChannel = options.voiceChannel || this.voiceChannel;
    
    if (!voiceChannel) {
      throw new Error('Voice channel is required');
    }

    // Optimized voice state payload
    this.oneplayer.send(this.guildId, {
      op: 4,
      d: {
        guild_id: this.guildId,
        channel_id: voiceChannel,
        self_mute: options.mute ?? this.mute,
        self_deaf: options.deaf ?? this.deaf,
      },
    });

    // Update state efficiently
    this.voiceChannel = voiceChannel;
    if (options.textChannel) this.textChannel = options.textChannel;
    if (options.deaf !== undefined) this.deaf = options.deaf;
    if (options.mute !== undefined) this.mute = options.mute;
  }

  /**
   * Disconnect with cleanup
   */
  disconnect() {
    this.oneplayer.send(this.guildId, {
      op: 4,
      d: {
        guild_id: this.guildId,
        channel_id: null,
        self_mute: false,
        self_deaf: false,
      },
    });
    
    this.connected = false;
    this.voiceChannel = null;
  }

  /**
   * High-performance play method
   * @param {Track} track - Track to play (optional)
   */
  async play(track) {
    // If a track is provided, either play it immediately or add to queue
    if (track) {
      if (!this.playing && !this.current) {
        // Play immediately if nothing is playing
        this.current = track;
      } else {
        // Add to queue if something is already playing
        this.queue.add(track);
        return;
      }
    } else {
      // No track provided, play next from queue
      if (!this.queue.size) {
        throw new Error('No tracks available to play');
      }
      this.current = this.queue.shift();
    }

    if (!this.current) {
      throw new Error('No track to play');
    }
    
    // Optimized REST payload
    const payload = {
      guildId: this.guildId,
      data: {
        track: { encoded: this.current.encoded },
        volume: this.volume,
        paused: false,
      },
    };

    await this.node.rest.updatePlayer(payload);
    
    this.playing = true;
    this.paused = false;
    this.position = 0;
  }

  /**
   * Optimized stop method
   */
  async stop() {
    const payload = {
      guildId: this.guildId,
      data: { track: { encoded: null } },
    };

    await this.node.rest.updatePlayer(payload);
    
    this.playing = false;
    this.current = null;
    this.position = 0;
  }

  /**
   * Efficient pause/resume
   * @param {boolean} paused - Pause state
   */
  async pause(paused = true) {
    const payload = {
      guildId: this.guildId,
      data: { paused },
    };

    await this.node.rest.updatePlayer(payload);
    this.paused = paused;
  }

  /**
   * Optimized seek with validation
   * @param {number} position - Position in milliseconds
   */
  async seek(position) {
    if (!this.current) {
      throw new Error('No track is currently playing');
    }
    
    if (position < 0 || position > this.current.info.length) {
      throw new RangeError('Seek position out of bounds');
    }
    
    const payload = {
      guildId: this.guildId,
      data: { position },
    };

    await this.node.rest.updatePlayer(payload);
    this.position = position;
  }

  /**
   * Optimized volume control with validation
   * @param {number} volume - Volume (0-200)
   */
  async setVolume(volume) {
    if (volume < 0 || volume > 200) {
      throw new RangeError('Volume must be between 0 and 200');
    }

    const payload = {
      guildId: this.guildId,
      data: { volume },
    };

    await this.node.rest.updatePlayer(payload);
    this.volume = volume;
  }

  /**
   * Efficient skip with queue management
   */
  async skip() {
    if (!this.current && !this.playing) {
      throw new Error('No track is currently playing');
    }
    
    // Set skipping flag to prevent race conditions
    this._skipping = true;
    
    // Store current track as previous
    this.previous = this.current;
    
    // Check if we have next tracks
    if (this.queue.size > 0) {
      // Get next track
      const nextTrack = this.queue.shift();
      this.current = nextTrack;
      
      // Update player with new track
      const payload = {
        guildId: this.guildId,
        data: {
          track: { encoded: nextTrack.encoded },
          volume: this.volume,
          paused: false,
        },
      };
      
      await this.node.rest.updatePlayer(payload);
      this.playing = true;
      this.paused = false;
      this.position = 0;
    } else {
      // No more tracks, stop playback
      this.current = null;
      this.playing = false;
      await this.stop();
    }
    
    // Clear skipping flag
    this._skipping = false;
  }

  /**
   * Set loop mode efficiently
   * @param {string} mode - Loop mode: 'none', 'track', 'queue'
   */
  setLoop(mode) {
    if (!['none', 'track', 'queue'].includes(mode)) {
      throw new Error('Invalid loop mode. Use: none, track, queue');
    }
    this.loop = mode;
  }

  /**
   * Optimized destroy with cleanup
   */
  destroy() {
    // Stop playback
    if (this.playing) {
      this.node.rest.updatePlayer({
        guildId: this.guildId,
        data: { track: { encoded: null } },
      }).catch(() => {}); // Ignore errors during cleanup
    }

    // Disconnect voice
    this.disconnect();
    
    // Cleanup REST
    this.node.rest.destroyPlayer(this.guildId).catch(() => {});
    
    // Remove from manager
    this.oneplayer.players.delete(this.guildId);
    
    // Clear state
    this.queue.clear();
    this.current = null;
    this.previous = null;
    
    // Remove all listeners
    this.removeAllListeners();
  }

  /**
   * Optimized event handler
   * @private
   */
  _onEvent(payload) {
    switch (payload.type) {
      case 'TrackStartEvent':
        this.playing = true;
        this.emit('trackStart', this, payload.track, payload);
        // Also emit on OnePlayer instance for backward compatibility
        this.oneplayer.emit('trackStart', this, payload.track, payload);
        break;
        
      case 'TrackEndEvent':
        this._handleTrackEnd(payload);
        break;
        
      case 'TrackExceptionEvent':
        this.emit('trackError', this, payload.track, payload);
        // Also emit on OnePlayer instance
        this.oneplayer.emit('trackError', this, payload.track, payload);
        break;
        
      case 'TrackStuckEvent':
        this.emit('trackStuck', this, payload.track, payload);
        // Also emit on OnePlayer instance
        this.oneplayer.emit('trackStuck', this, payload.track, payload);
        break;
        
      case 'WebSocketClosedEvent':
        this.emit('socketClosed', this, payload);
        // Also emit on OnePlayer instance
        this.oneplayer.emit('socketClosed', this, payload);
        break;
    }
  }

  /**
   * Optimized track end handling with loop support
   * @private
   */
  _handleTrackEnd(payload) {
    // If we're manually skipping, don't handle track end automatically
    if (this._skipping) {
      return;
    }
    
    const shouldContinue = payload.reason === 'finished' || payload.reason === 'loadFailed';
    
    if (shouldContinue) {
      // Handle loop modes efficiently
      if (this.loop === 'track' && this.current) {
        // For track loop, immediately restart the same track
        this.previous = this.current;
        const trackToLoop = this.current;
        
        // Restart the same track
        const payload = {
          guildId: this.guildId,
          data: {
            track: { encoded: trackToLoop.encoded },
            volume: this.volume,
            paused: false,
          },
        };
        
        this.node.rest.updatePlayer(payload).then(() => {
          this.position = 0;
          // Keep current track and playing state
        }).catch(error => {
          this.emit('error', error);
        });
        
        this.emit('trackEnd', this, payload.track, payload);
        // Also emit on OnePlayer instance for backward compatibility
        this.oneplayer.emit('trackEnd', this, payload.track, payload);
        return;
      } else if (this.loop === 'queue' && this.current) {
        // For queue loop, add current track to end of queue
        this.queue.add(this.current);
      }
    }
    
    // Update state for non-looping tracks or queue loop
    this.previous = this.current;
    this.current = null;
    this.playing = false;
    
    if (shouldContinue) {
      // Auto-play next track
      if (this.queue.size > 0) {
        this.play().catch(error => {
          this.emit('error', error);
        });
      }
    }
    
    this.emit('trackEnd', this, payload.track, payload);
    // Also emit on OnePlayer instance for backward compatibility
    this.oneplayer.emit('trackEnd', this, payload.track, payload);
  }

  /**
   * Get current playback position with interpolation
   * @returns {number} Current position in milliseconds
   */
  get currentPosition() {
    if (!this.playing || this.paused) return this.position;
    
    const elapsed = Date.now() - this.timestamp;
    return Math.min(this.position + elapsed, this.current?.info?.length || 0);
  }

  /**
   * Check if player is idle (not playing and no queue)
   * @returns {boolean}
   */
  get isIdle() {
    return !this.playing && this.queue.size === 0;
  }

  /**
   * Get player state for debugging
   * @returns {Object}
   */
  get state() {
    return {
      guildId: this.guildId,
      voiceChannel: this.voiceChannel,
      textChannel: this.textChannel,
      playing: this.playing,
      paused: this.paused,
      connected: this.connected,
      volume: this.volume,
      loop: this.loop,
      position: this.currentPosition,
      queueSize: this.queue.size,
      current: this.current?.info?.title || null,
      filters: this.filters.active
    };
  }
}

module.exports = { Player };