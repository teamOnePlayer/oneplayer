/**
 * Optimized queue management extending Array
 * @extends Array
 */
class Queue extends Array {
  constructor() {
    super();
    this._totalDuration = 0;
    this._dirty = true;
  }

  /** @returns {number} */
  get size() { return this.length; }

  /** @returns {Object|null} */
  get first() { return this[0] ?? null; }

  /** @returns {Object|null} */
  get last() { return this[this.length - 1] ?? null; }

  /** @returns {boolean} */
  get isEmpty() { return this.length === 0; }

  /**
   * Get total duration (cached)
   * @returns {number}
   */
  get totalDuration() {
    if (this._dirty) {
      this._totalDuration = this.reduce((acc, t) => acc + (t.info?.length || 0), 0);
      this._dirty = false;
    }
    return this._totalDuration;
  }

  /**
   * Add track(s)
   * @param {Object|Object[]} track
   * @returns {Queue}
   */
  add(track) {
    if (Array.isArray(track)) {
      this.push(...track);
    } else {
      this.push(track);
    }
    this._dirty = true;
    return this;
  }

  /**
   * Remove track at index
   * @param {number} index
   * @returns {Object}
   */
  remove(index) {
    if (index < 0 || index >= this.length) {
      throw new RangeError(`Index ${index} out of range`);
    }
    this._dirty = true;
    return this.splice(index, 1)[0];
  }

  /**
   * Remove multiple tracks
   * @param {number} start
   * @param {number} count
   * @returns {Object[]}
   */
  removeRange(start, count) {
    if (start < 0 || start >= this.length) {
      throw new RangeError(`Start index out of range`);
    }
    this._dirty = true;
    return this.splice(start, count);
  }

  /**
   * Clear queue
   */
  clear() {
    this.length = 0;
    this._totalDuration = 0;
    this._dirty = false;
  }

  /**
   * Fisher-Yates shuffle
   * @returns {Queue}
   */
  shuffle() {
    for (let i = this.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [this[i], this[j]] = [this[j], this[i]];
    }
    return this;
  }

  /**
   * Move track
   * @param {number} from
   * @param {number} to
   * @returns {Queue}
   */
  move(from, to) {
    if (from < 0 || from >= this.length || to < 0 || to >= this.length) {
      throw new RangeError('Index out of range');
    }
    const [track] = this.splice(from, 1);
    this.splice(to, 0, track);
    return this;
  }

  /**
   * Swap two tracks
   * @param {number} i1
   * @param {number} i2
   * @returns {Queue}
   */
  swap(i1, i2) {
    if (i1 < 0 || i1 >= this.length || i2 < 0 || i2 >= this.length) {
      throw new RangeError('Index out of range');
    }
    [this[i1], this[i2]] = [this[i2], this[i1]];
    return this;
  }

  /**
   * Get tracks by requester
   * @param {*} requester
   * @returns {Object[]}
   */
  getByRequester(requester) {
    return this.filter(t => t.info?.requester === requester);
  }

  /**
   * Remove tracks by requester
   * @param {*} requester
   * @returns {Object[]}
   */
  removeByRequester(requester) {
    const removed = [];
    for (let i = this.length - 1; i >= 0; i--) {
      if (this[i].info?.requester === requester) {
        removed.unshift(this.splice(i, 1)[0]);
      }
    }
    this._dirty = true;
    return removed;
  }

  /**
   * Remove duplicates by identifier
   * @returns {Queue}
   */
  removeDuplicates() {
    const seen = new Set();
    for (let i = this.length - 1; i >= 0; i--) {
      const id = this[i].info?.identifier;
      if (id && seen.has(id)) {
        this.splice(i, 1);
      } else if (id) {
        seen.add(id);
      }
    }
    this._dirty = true;
    return this;
  }

  /**
   * Reverse queue order
   * @returns {Queue}
   */
  reverse() {
    super.reverse();
    return this;
  }

  /**
   * Get slice without modifying
   * @param {number} start
   * @param {number} end
   * @returns {Object[]}
   */
  peek(start = 0, end = this.length) {
    return this.slice(start, end);
  }

  /**
   * Skip to specific index
   * @param {number} index
   * @returns {Object[]}
   */
  skipTo(index) {
    if (index < 0 || index >= this.length) {
      throw new RangeError('Index out of range');
    }
    this._dirty = true;
    return this.splice(0, index);
  }

  /**
   * Get formatted duration string
   * @returns {string}
   */
  get formattedDuration() {
    const ms = this.totalDuration;
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}

module.exports = { Queue };
