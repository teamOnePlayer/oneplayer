/**
 * OnePlayer - Minimal Lavalink client
 * Engine and Player only - Ultra-low latency
 * 
 * @author Pappu100
 * @version 2.1.0
 * @license MIT
 */

'use strict';

// Core - Engine only
const { OnePlayer } = require('./core/OnePlayer');

// Network - Core networking
const { Node } = require('./network/Node');
const { Rest } = require('./network/Rest');

// Player - Essential player functionality + Filters
const { Player } = require('./player/Player');
const { Track } = require('./player/Track');
const { Queue } = require('./player/Queue');
const { Connection } = require('./player/Connection');

// Audio - High-performance filters
const { Filters } = require('./audio/Filters');

// Version
const { version } = require('../package.json');

module.exports = {
  // Core Engine
  OnePlayer,
  
  // Network
  Node,
  Rest,
  
  // Player
  Player,
  Track,
  Queue,
  Connection,
  
  // Audio
  Filters,
  
  // Meta
  version,
  default: OnePlayer,
};