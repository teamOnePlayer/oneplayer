const { fetch, Agent } = require('undici');

// Reusable HTTP agent for connection pooling
const agent = new Agent({
  keepAliveTimeout: 30000,
  keepAliveMaxTimeout: 60000,
  connections: 10,
  pipelining: 1,
});

/**
 * Optimized REST API handler for Lavalink
 * Features: Connection pooling, request queuing, rate limiting
 */
class Rest {
  /**
   * @param {Object} oneplayer - OnePlayer instance
   * @param {Object} node - Node configuration
   */
  constructor(oneplayer, node) {
    this.oneplayer = oneplayer;
    this.url = `http${node.secure ? 's' : ''}://${node.host}:${node.port}`;
    this.password = node.password;
    this.version = node.restVersion || 'v4';
    this.sessionId = node.sessionId || null;
    this.calls = 0;
    
    // Rate limiting
    this._queue = [];
    this._processing = false;
    this._lastRequest = 0;
    this._minInterval = 50; // Min ms between requests
  }

  /**
   * Set session ID
   * @param {string} sessionId
   */
  setSessionId(sessionId) {
    this.sessionId = sessionId;
  }

  /**
   * Process request queue
   * @private
   */
  async _processQueue() {
    if (this._processing || !this._queue.length) return;
    
    this._processing = true;
    
    while (this._queue.length) {
      const { method, endpoint, body, includeHeaders, resolve, reject } = this._queue.shift();
      
      // Rate limiting
      const now = Date.now();
      const elapsed = now - this._lastRequest;
      if (elapsed < this._minInterval) {
        await new Promise(r => setTimeout(r, this._minInterval - elapsed));
      }
      
      try {
        const result = await this._executeRequest(method, endpoint, body, includeHeaders);
        this._lastRequest = Date.now();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }
    
    this._processing = false;
  }

  /**
   * Execute HTTP request
   * @private
   */
  async _executeRequest(method, endpoint, body, includeHeaders) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': this.password,
    };

    const options = {
      method,
      headers,
      dispatcher: agent,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.url}${endpoint}`, options);
    this.calls++;

    const data = await this._parseResponse(response);

    if (!response.ok && response.status !== 404) {
      const error = new Error(`REST Error: ${response.status} ${response.statusText}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    this.oneplayer.emit('apiResponse', endpoint, response);

    return includeHeaders ? { data, headers: response.headers } : data;
  }

  /**
   * Make HTTP request (queued)
   * @param {string} method
   * @param {string} endpoint
   * @param {Object} body
   * @param {boolean} includeHeaders
   * @returns {Promise<Object>}
   */
  makeRequest(method, endpoint, body = null, includeHeaders = false) {
    return new Promise((resolve, reject) => {
      this._queue.push({ method, endpoint, body, includeHeaders, resolve, reject });
      this._processQueue();
    });
  }

  /**
   * Parse response based on content type
   * @private
   */
  async _parseResponse(response) {
    if (response.status === 204) return null;

    const contentType = response.headers.get('content-type') || '';
    try {
      return contentType.includes('application/json') 
        ? await response.json() 
        : await response.text();
    } catch {
      return null;
    }
  }

  // Player endpoints
  async getPlayers() {
    return this.makeRequest('GET', `/${this.version}/sessions/${this.sessionId}/players`);
  }

  async getPlayer(guildId) {
    return this.makeRequest('GET', `/${this.version}/sessions/${this.sessionId}/players/${guildId}`);
  }

  async updatePlayer(options) {
    if (!options.guildId) {
      throw new Error('guildId is required for updatePlayer');
    }

    let { data } = options;

    if (this.version === 'v3' && data?.track) {
      const { track, ...rest } = data;
      data = { ...rest, ...(track.encoded !== undefined ? { encodedTrack: track.encoded } : { identifier: track.identifier }) };
    }

    return this.makeRequest(
      'PATCH',
      `/${this.version}/sessions/${this.sessionId}/players/${options.guildId}?noReplace=${options.noReplace ?? false}`,
      data
    );
  }

  async destroyPlayer(guildId) {
    return this.makeRequest('DELETE', `/${this.version}/sessions/${this.sessionId}/players/${guildId}`);
  }

  // Track endpoints
  async loadTracks(identifier) {
    return this.makeRequest('GET', `/${this.version}/loadtracks?identifier=${encodeURIComponent(identifier)}`);
  }

  async decodeTrack(track) {
    return this.makeRequest('GET', `/${this.version}/decodetrack?encodedTrack=${encodeURIComponent(track)}`);
  }

  async decodeTracks(tracks) {
    return this.makeRequest('POST', `/${this.version}/decodetracks`, tracks);
  }

  // Info endpoints
  async getStats() {
    return this.makeRequest('GET', `/${this.version}/stats`);
  }

  async getInfo() {
    return this.makeRequest('GET', `/${this.version}/info`);
  }

  async getVersion() {
    return this.makeRequest('GET', '/version');
  }

  // Session endpoints
  async updateSession(resuming, timeout) {
    const body = this.version === 'v4' ? { resuming, timeout } : { resumingKey: this.sessionId, timeout };
    return this.makeRequest('PATCH', `/${this.version}/sessions/${this.sessionId}`, body);
  }

  // Route planner endpoints
  async getRoutePlannerStatus() {
    return this.makeRequest('GET', `/${this.version}/routeplanner/status`);
  }

  async freeRoutePlannerAddress(address) {
    return this.makeRequest('POST', `/${this.version}/routeplanner/free/address`, { address });
  }

  async freeAllRoutePlannerAddresses() {
    return this.makeRequest('POST', `/${this.version}/routeplanner/free/all`);
  }
}

module.exports = { Rest };
