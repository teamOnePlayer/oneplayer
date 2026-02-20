/**
 * High-performance audio filters for OnePlayer
 * Optimized for low latency and minimal resource usage
 */
class Filters {
  /**
   * @param {Object} player - Player instance
   * @param {Object} options - Filter options
   */
  constructor(player, options = {}) {
    this.player = player;
    this.volume = 1.0;
    this.equalizer = [];
    this.karaoke = null;
    this.timescale = null;
    this.tremolo = null;
    this.vibrato = null;
    this.rotation = null;
    this.distortion = null;
    this.channelMix = null;
    this.lowPass = null;
  }

  /**
   * Set equalizer bands (optimized)
   * @param {Array} bands - Array of {band: number, gain: number}
   */
  async setEqualizer(bands) {
    if (!Array.isArray(bands)) {
      throw new TypeError('Equalizer bands must be an array');
    }

    // Validate and optimize bands
    this.equalizer = bands
      .filter(band => typeof band.band === 'number' && typeof band.gain === 'number')
      .map(band => ({
        band: Math.max(0, Math.min(14, Math.floor(band.band))),
        gain: Math.max(-0.25, Math.min(1.0, band.gain))
      }));

    return this._updateFilters();
  }

  /**
   * Set karaoke filter (vocal removal)
   * @param {boolean} enabled - Enable karaoke
   * @param {Object} options - Karaoke options
   */
  async setKaraoke(enabled, options = {}) {
    if (!enabled) {
      this.karaoke = null;
    } else {
      this.karaoke = {
        level: Math.max(0, Math.min(1.0, options.level || 1.0)),
        monoLevel: Math.max(0, Math.min(1.0, options.monoLevel || 1.0)),
        filterBand: Math.max(0, options.filterBand || 220.0),
        filterWidth: Math.max(0, options.filterWidth || 100.0)
      };
    }

    return this._updateFilters();
  }

  /**
   * Set timescale filter (speed/pitch)
   * @param {boolean} enabled - Enable timescale
   * @param {Object} options - Timescale options
   */
  async setTimescale(enabled, options = {}) {
    if (!enabled) {
      this.timescale = null;
    } else {
      this.timescale = {
        speed: Math.max(0.1, Math.min(3.0, options.speed || 1.0)),
        pitch: Math.max(0.1, Math.min(3.0, options.pitch || 1.0)),
        rate: Math.max(0.1, Math.min(3.0, options.rate || 1.0))
      };
    }

    return this._updateFilters();
  }

  /**
   * Set tremolo filter (amplitude modulation)
   * @param {boolean} enabled - Enable tremolo
   * @param {Object} options - Tremolo options
   */
  async setTremolo(enabled, options = {}) {
    if (!enabled) {
      this.tremolo = null;
    } else {
      this.tremolo = {
        frequency: Math.max(0.1, Math.min(20.0, options.frequency || 2.0)),
        depth: Math.max(0.0, Math.min(1.0, options.depth || 0.5))
      };
    }

    return this._updateFilters();
  }

  /**
   * Set vibrato filter (frequency modulation)
   * @param {boolean} enabled - Enable vibrato
   * @param {Object} options - Vibrato options
   */
  async setVibrato(enabled, options = {}) {
    if (!enabled) {
      this.vibrato = null;
    } else {
      this.vibrato = {
        frequency: Math.max(0.1, Math.min(14.0, options.frequency || 2.0)),
        depth: Math.max(0.0, Math.min(1.0, options.depth || 0.5))
      };
    }

    return this._updateFilters();
  }

  /**
   * Set rotation filter (8D audio effect)
   * @param {boolean} enabled - Enable rotation
   * @param {Object} options - Rotation options
   */
  async setRotation(enabled, options = {}) {
    if (!enabled) {
      this.rotation = null;
    } else {
      this.rotation = {
        rotationHz: Math.max(0.0, Math.min(1.0, options.rotationHz || 0.2))
      };
    }

    return this._updateFilters();
  }

  /**
   * Set distortion filter
   * @param {boolean} enabled - Enable distortion
   * @param {Object} options - Distortion options
   */
  async setDistortion(enabled, options = {}) {
    if (!enabled) {
      this.distortion = null;
    } else {
      this.distortion = {
        sinOffset: options.sinOffset || 0.0,
        sinScale: options.sinScale || 1.0,
        cosOffset: options.cosOffset || 0.0,
        cosScale: options.cosScale || 1.0,
        tanOffset: options.tanOffset || 0.0,
        tanScale: options.tanScale || 1.0,
        offset: options.offset || 0.0,
        scale: options.scale || 1.0
      };
    }

    return this._updateFilters();
  }

  /**
   * Set channel mix filter (stereo manipulation)
   * @param {boolean} enabled - Enable channel mix
   * @param {Object} options - Channel mix options
   */
  async setChannelMix(enabled, options = {}) {
    if (!enabled) {
      this.channelMix = null;
    } else {
      this.channelMix = {
        leftToLeft: Math.max(0.0, Math.min(1.0, options.leftToLeft || 1.0)),
        leftToRight: Math.max(0.0, Math.min(1.0, options.leftToRight || 0.0)),
        rightToLeft: Math.max(0.0, Math.min(1.0, options.rightToLeft || 0.0)),
        rightToRight: Math.max(0.0, Math.min(1.0, options.rightToRight || 1.0))
      };
    }

    return this._updateFilters();
  }

  /**
   * Set low pass filter
   * @param {boolean} enabled - Enable low pass
   * @param {Object} options - Low pass options
   */
  async setLowPass(enabled, options = {}) {
    if (!enabled) {
      this.lowPass = null;
    } else {
      this.lowPass = {
        smoothing: Math.max(1.0, Math.min(100.0, options.smoothing || 20.0))
      };
    }

    return this._updateFilters();
  }

  /**
   * Clear all filters
   */
  async clearFilters() {
    this.equalizer = [];
    this.karaoke = null;
    this.timescale = null;
    this.tremolo = null;
    this.vibrato = null;
    this.rotation = null;
    this.distortion = null;
    this.channelMix = null;
    this.lowPass = null;

    return this._updateFilters();
  }

  /**
   * Preset: Bass boost
   * @param {number} level - Boost level (0.0 - 1.0)
   */
  async setBassBoost(level) {
    const gain = Math.max(0.0, Math.min(1.0, level || 0.25));
    return this.setEqualizer([
      { band: 0, gain: gain },
      { band: 1, gain: gain },
      { band: 2, gain: gain * 0.8 },
      { band: 3, gain: gain * 0.6 }
    ]);
  }

  /**
   * Preset: Nightcore (higher pitch and speed)
   */
  async setNightcore() {
    return this.setTimescale(true, {
      speed: 1.3,
      pitch: 1.3,
      rate: 1.0
    });
  }

  /**
   * Preset: Vaporwave (slower speed, lower pitch)
   */
  async setVaporwave() {
    return this.setTimescale(true, {
      speed: 0.8,
      pitch: 0.8,
      rate: 1.0
    });
  }

  /**
   * Preset: 8D audio effect
   */
  async set8D() {
    return this.setRotation(true, { rotationHz: 0.2 });
  }

  /**
   * Get current filter state
   * @returns {Array}
   */
  get active() {
    const filters = [];
    
    if (this.equalizer.length > 0) filters.push('equalizer');
    if (this.karaoke) filters.push('karaoke');
    if (this.timescale) filters.push('timescale');
    if (this.tremolo) filters.push('tremolo');
    if (this.vibrato) filters.push('vibrato');
    if (this.rotation) filters.push('rotation');
    if (this.distortion) filters.push('distortion');
    if (this.channelMix) filters.push('channelMix');
    if (this.lowPass) filters.push('lowPass');
    
    return filters;
  }

  /**
   * Check if any filters are active
   * @returns {boolean}
   */
  get hasFilters() {
    return this.active.length > 0;
  }

  /**
   * Update filters on Lavalink (optimized)
   * @private
   */
  async _updateFilters() {
    const filters = {};

    // Only include active filters to minimize payload
    if (this.equalizer.length > 0) filters.equalizer = this.equalizer;
    if (this.karaoke) filters.karaoke = this.karaoke;
    if (this.timescale) filters.timescale = this.timescale;
    if (this.tremolo) filters.tremolo = this.tremolo;
    if (this.vibrato) filters.vibrato = this.vibrato;
    if (this.rotation) filters.rotation = this.rotation;
    if (this.distortion) filters.distortion = this.distortion;
    if (this.channelMix) filters.channelMix = this.channelMix;
    if (this.lowPass) filters.lowPass = this.lowPass;

    const payload = {
      guildId: this.player.guildId,
      data: { filters: filters }
    };

    return this.player.node.rest.updatePlayer(payload);
  }

  /**
   * Get filter configuration for debugging
   * @returns {Object}
   */
  toJSON() {
    return {
      equalizer: this.equalizer,
      karaoke: this.karaoke,
      timescale: this.timescale,
      tremolo: this.tremolo,
      vibrato: this.vibrato,
      rotation: this.rotation,
      distortion: this.distortion,
      channelMix: this.channelMix,
      lowPass: this.lowPass,
      active: this.active,
      hasFilters: this.hasFilters
    };
  }
}

module.exports = { Filters };