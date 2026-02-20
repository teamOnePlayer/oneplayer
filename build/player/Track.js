const { fetch } = require('undici');

/**
 * Escape regex special characters
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Represents a playable track
 */
class Track {
  /**
   * @param {Object} data - Raw track data from Lavalink
   * @param {*} requester - User who requested the track
   * @param {Object} node - Node that resolved the track
   */
  constructor(data, requester, node) {
    this.rawData = data;
    this.encoded = data.encoded;
    this.track = data.encoded; // Alias for compatibility
    
    this.info = {
      identifier: data.info.identifier,
      seekable: data.info.isSeekable,
      author: data.info.author,
      length: data.info.length,
      stream: data.info.isStream,
      position: data.info.position,
      title: data.info.title,
      uri: data.info.uri,
      artworkUrl: data.info.artworkUrl || null,
      sourceName: data.info.sourceName,
      isrc: data.info.isrc || null,
      requester,
      _thumbnailCache: null,
    };

    this.pluginInfo = data.pluginInfo || {};
    this._node = node;
  }

  /**
   * Get thumbnail URL with smart fallback
   * @returns {Promise<string|null>}
   */
  async getThumbnail() {
    if (this.info._thumbnailCache) return this.info._thumbnailCache;
    if (this.info.artworkUrl) {
      this.info._thumbnailCache = this.info.artworkUrl;
      return this.info.artworkUrl;
    }

    const url = await Track.fetchThumbnail(this.info);
    this.info._thumbnailCache = url;
    return url;
  }

  /**
   * Fetch thumbnail from various sources
   * @param {Object} info
   * @returns {Promise<string|null>}
   */
  static async fetchThumbnail(info) {
    try {
      switch (info.sourceName) {
        case 'youtube':
          return await Track._fetchYouTubeThumbnail(info.identifier);
        case 'spotify':
          return await Track._fetchSpotifyThumbnail(info.uri);
        case 'soundcloud':
          return await Track._fetchSoundCloudThumbnail(info.uri);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  /**
   * @private
   */
  static async _fetchYouTubeThumbnail(identifier) {
    const qualities = ['maxresdefault', 'hqdefault', 'mqdefault', 'default'];
    for (const quality of qualities) {
      const url = `https://img.youtube.com/vi/${identifier}/${quality}.jpg`;
      try {
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) return url;
      } catch {
        continue;
      }
    }
    return null;
  }

  /**
   * @private
   */
  static async _fetchSpotifyThumbnail(uri) {
    if (!uri) return null;
    try {
      const res = await fetch(`https://open.spotify.com/oembed?url=${uri}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.thumbnail_url || null;
    } catch {
      return null;
    }
  }

  /**
   * @private
   */
  static async _fetchSoundCloudThumbnail(uri) {
    if (!uri) return null;
    try {
      const res = await fetch(`https://soundcloud.com/oembed?format=json&url=${uri}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.thumbnail_url || null;
    } catch {
      return null;
    }
  }

  /**
   * Resolve unresolved track (e.g., Spotify -> YouTube)
   * @param {Object} oneplayer - OnePlayer instance
   * @returns {Promise<Track>}
   */
  async resolve(oneplayer) {
    if (this.track) return this;

    const query = [this.info.author, this.info.title].filter(Boolean).join(' - ');
    const result = await oneplayer.resolve({
      query,
      source: oneplayer.defaultSearchPlatform,
      requester: this.info.requester,
    });

    if (!result?.tracks?.length) return this;

    // Try to find official audio
    const officialTrack = result.tracks.find((t) => {
      const authors = [this.info.author, `${this.info.author} - Topic`];
      return authors.some((name) => 
        new RegExp(`^${escapeRegex(name)}$`, 'i').test(t.info.author)
      ) || new RegExp(`^${escapeRegex(this.info.title)}$`, 'i').test(t.info.title);
    });

    if (officialTrack) {
      this._applyResolved(officialTrack);
      return this;
    }

    // Try to match by duration (±2 seconds)
    if (this.info.length) {
      const durationMatch = result.tracks.find((t) => 
        Math.abs(t.info.length - this.info.length) <= 2000
      );
      if (durationMatch) {
        this._applyResolved(durationMatch);
        return this;
      }
    }

    // Fallback to first result
    this._applyResolved(result.tracks[0]);
    return this;
  }

  /**
   * @private
   */
  _applyResolved(track) {
    this.info.identifier = track.info.identifier;
    this.track = track.track;
    this.encoded = track.track;
  }

  /**
   * Convert to JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      encoded: this.encoded,
      info: { ...this.info, _thumbnailCache: undefined },
      pluginInfo: this.pluginInfo,
    };
  }
}

module.exports = { Track };
