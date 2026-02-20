/**
 * Manages voice connection state and synchronization
 */
class Connection {
  /**
   * @param {Object} player - Player instance
   */
  constructor(player) {
    this.player = player;
    this.sessionId = null;
    this.voice = {
      sessionId: null,
      token: null,
      endpoint: null,
    };
    this.region = null;
    this.selfDeaf = false;
    this.selfMute = false;
    this.voiceChannel = player.voiceChannel;

    // Connection state management
    this._deferred = null;
    this._pendingUpdate = null;
    this.establishing = false;
  }

  /**
   * Check if voice credentials are ready
   * @returns {boolean}
   */
  get isReady() {
    return !!(this.voice.sessionId && this.voice.endpoint && this.voice.token);
  }

  /**
   * Wait for connection to be ready
   * @returns {Promise<void>}
   */
  async resolve() {
    // Already ready and no pending updates
    if (this.isReady && !this._pendingUpdate) return;

    const timeout = this.player.connectionTimeout || 15000;

    const waitFor = (promise, label) => {
      let timer;
      return Promise.race([
        promise,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`Connection timeout (${timeout}ms) waiting for ${label}`)), timeout);
        }),
      ]).finally(() => clearTimeout(timer));
    };

    // Waiting for node acknowledgment
    if (this._pendingUpdate) {
      await waitFor(this._pendingUpdate, 'node acknowledgment');
      return;
    }

    // Waiting for Discord credentials
    if (!this._deferred) {
      let resolveFn;
      const promise = new Promise((resolve) => { resolveFn = resolve; });
      this._deferred = { promise, resolve: resolveFn };
    }

    return waitFor(this._deferred.promise, 'Discord voice credentials');
  }

  /**
   * Handle voice server update from Discord
   * @param {Object} data
   */
  setServerUpdate(data) {
    const { endpoint, token } = data;
    
    if (!endpoint) {
      throw new Error('Missing endpoint in VOICE_SERVER_UPDATE. Try reconnecting to voice channel.');
    }

    const previousRegion = this.region;
    this.voice.endpoint = endpoint;
    this.voice.token = token;
    this.region = endpoint.split('.').shift()?.replace(/[0-9]/g, '') || null;

    this.player.oneplayer.emit('debug', 
      `[Connection ${this.player.guildId}] Voice server received. Region: ${previousRegion || 'none'} -> ${this.region}`
    );

    // Unpause if was paused during channel move
    if (this.player.paused && this.player._pausedForMove) {
      this.player._pausedForMove = false;
      this.player.pause(false);
    }

    this._checkAndSend();
  }

  /**
   * Handle voice state update from Discord
   * @param {Object} data
   */
  setStateUpdate(data) {
    const { session_id, channel_id, self_deaf, self_mute } = data;

    this.player.oneplayer.emit('debug',
      `[Connection ${this.player.guildId}] Voice state update. Channel: ${channel_id || 'disconnected'}`
    );

    // Bot was disconnected from voice
    if (channel_id === null) {
      this.player.destroy();
      this.player.oneplayer.emit('playerDisconnect', this.player);
      return;
    }

    // Bot moved to different channel
    if (this.player.voiceChannel && channel_id && this.player.voiceChannel !== channel_id) {
      this.player.oneplayer.emit('playerMove', this.player.voiceChannel, channel_id);
      this.player.voiceChannel = channel_id;
      this.voiceChannel = channel_id;
    }

    this.selfDeaf = self_deaf;
    this.selfMute = self_mute;
    this.voice.sessionId = session_id || null;

    this._checkAndSend();
  }

  /**
   * Check credentials and send to node
   * @private
   */
  async _checkAndSend() {
    if (!this.isReady) return;

    this._pendingUpdate = this._updatePlayerVoice();

    try {
      await this._pendingUpdate;
    } catch (error) {
      this.player.oneplayer.emit('debug', `[Connection ${this.player.guildId}] Voice update failed: ${error.message}`);
      this.establishing = false;
    } finally {
      this._pendingUpdate = null;

      if (this._deferred) {
        this._deferred.resolve();
        this._deferred = null;
      }
    }
  }

  /**
   * Send voice update to Lavalink
   * @private
   */
  _updatePlayerVoice() {
    this.establishing = true;

    this.player.oneplayer.emit('debug', 
      `[Connection ${this.player.guildId}] Sending voice update to node`
    );

    return this.player.node.rest.updatePlayer({
      guildId: this.player.guildId,
      data: {
        voice: this.voice,
        volume: this.player.volume,
      },
    });
  }
}

module.exports = { Connection };
