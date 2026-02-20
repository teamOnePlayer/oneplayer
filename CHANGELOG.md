# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1-beta] - 2026-02-20

### Fixed
- **Event Handling**: Fixed `trackStart`, `trackEnd`, `trackError`, `trackStuck`, and `socketClosed` events not firing on the OnePlayer instance
  - These events are now emitted on both the individual player instance AND the global OnePlayer instance
  - Maintains backward compatibility for existing code
  - Allows for both global event handling (across all guilds) and player-specific event handling
  - Resolves issue where `client.oneplayer.on("trackStart")` would not fire

### Added
- Enhanced event handling documentation in README.md
- Example file demonstrating both global and player-specific event handling
- Comprehensive event compatibility section in documentation

### Technical Details
- Updated `Player.js` `_onEvent()` method to emit events on both player and OnePlayer instances
- Updated `Player.js` `_handleTrackEnd()` method to emit trackEnd events on both instances
- No breaking changes - existing code will continue to work as expected

## [1.0.0-beta] - 2026-02-20

### Added
- Initial beta release
- High-performance Lavalink client implementation
- Support for multiple audio sources (YouTube, Spotify, SoundCloud, Apple Music)
- Advanced audio filters (Equalizer, Karaoke, Timescale, Bass Boost, etc.)
- Queue management with shuffle, loop modes, and advanced operations
- Multi-node support with load balancing
- Ultra-low latency optimizations
- Minimal dependency footprint
- Discord.js 14+ compatibility
- Node.js 18+ support