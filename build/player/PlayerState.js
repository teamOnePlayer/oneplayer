/**
 * Player state serialization for persistence
 * Save and restore player states across restarts
 */
class PlayerState {
  /**
   * Serialize player to JSON
   * @param {Object} player - Player instance
   * @returns {Object}
   */
  static serialize(player) {
    return {
      guildId: player.guildId,
      voiceChannel: player.voiceChannel,
      textChannel: player.textChannel,
      volume: player.volume,
      loop: player.loop,
      position: player.position,
      paused: player.paused,
      deaf: player.deaf,
      mute: player.mute,
      current: player.current ? PlayerState.serializeTrack(player.current) : null,
      queue: player.queue.map(t => PlayerState.serializeTrack(t)),
      previousTracks: player.previousTracks.map(t => PlayerState.serializeTrack(t)),
      filters: player.filters.toJSON(),
      data: player.data,
      timestamp: Date.now(),
    };
  }

  /**
   * Serialize track to JSON
   * @param {Object} track
   * @returns {Object}
   */
  static serializeTrack(track) {
    return {
      encoded: track.encoded || track.track,
      info: {
        identifier: track.info.identifier,
        title: track.info.title,
        author: track.info.author,
        length: track.info.length,
        uri: track.info.uri,
        sourceName: track.info.sourceName,
        artworkUrl: track.info.artworkUrl,
        isrc: track.info.isrc,
        requester: track.info.requester,
      },
      pluginInfo: track.pluginInfo,
    };
  }

  /**
   * Restore player from serialized state
   * @param {Object} oneplayer - OnePlayer instance
   * @param {Object} state - Serialized state
   * @param {Object} options - Restore options
   * @returns {Promise<Object>}
   */
  static async restore(oneplayer, state, options = {}) {
    const { Track } = require('./Track');

    // Create player
    const player = oneplayer.createConnection({
      guildId: state.guildId,
      voiceChannel: state.voiceChannel,
      textChannel: state.textChannel,
      defaultVolume: state.volume,
      loop: state.loop,
      deaf: state.deaf,
      mute: state.mute,
    });

    // Restore custom data
    player.data = state.data || {};

    // Restore queue
    if (state.queue?.length) {
      const tracks = state.queue.map(t => PlayerState.deserializeTrack(t, player.node));
      player.queue.add(tracks);
    }

    // Restore previous tracks
    if (state.previousTracks?.length) {
      player.previousTracks = state.previousTracks.map(t => 
        PlayerState.deserializeTrack(t, player.node)
      );
      player.previous = player.previousTracks[0];
    }

    // Restore filters
    if (state.filters) {
      Object.assign(player.filters, state.filters);
    }

    // Resume playback
    if (state.current && options.resume !== false) {
      const currentTrack = PlayerState.deserializeTrack(state.current, player.node);
      player.queue.unshift(currentTrack);

      // Wait for connection
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        await player.play();
        
        // Seek to position if not too old
        const age = Date.now() - state.timestamp;
        if (age < 300000 && state.position > 0) { // 5 minutes max
          const newPosition = state.position + age;
          if (newPosition < currentTrack.info.length) {
            player.seek(newPosition);
          }
        }

        // Restore pause state
        if (state.paused) {
          player.pause(true);
        }

        // Apply filters
        if (state.filters && Object.keys(state.filters).some(k => state.filters[k])) {
          await player.filters._update();
        }
      } catch (error) {
        oneplayer.emit('debug', `[PlayerState] Failed to resume: ${error.message}`);
      }
    }

    return player;
  }

  /**
   * Deserialize track from JSON
   * @param {Object} data
   * @param {Object} node
   * @returns {Object}
   */
  static deserializeTrack(data, node) {
    const { Track } = require('./Track');
    return new Track({
      encoded: data.encoded,
      info: {
        identifier: data.info.identifier,
        isSeekable: true,
        author: data.info.author,
        length: data.info.length,
        isStream: false,
        position: 0,
        title: data.info.title,
        uri: data.info.uri,
        artworkUrl: data.info.artworkUrl,
        sourceName: data.info.sourceName,
        isrc: data.info.isrc,
      },
      pluginInfo: data.pluginInfo,
    }, data.info.requester, node);
  }

  /**
   * Serialize all players
   * @param {Object} oneplayer
   * @returns {Object[]}
   */
  static serializeAll(oneplayer) {
    return [...oneplayer.players.values()].map(p => PlayerState.serialize(p));
  }

  /**
   * Restore all players
   * @param {Object} oneplayer
   * @param {Object[]} states
   * @param {Object} options
   * @returns {Promise<Object[]>}
   */
  static async restoreAll(oneplayer, states, options = {}) {
    const players = [];
    for (const state of states) {
      try {
        const player = await PlayerState.restore(oneplayer, state, options);
        players.push(player);
      } catch (error) {
        oneplayer.emit('debug', `[PlayerState] Failed to restore ${state.guildId}: ${error.message}`);
      }
    }
    return players;
  }
}

module.exports = { PlayerState };
