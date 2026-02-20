<div align="center">
  
<img width="3031" height="588" alt="OnePlayer" src="https://github.com/user-attachments/assets/0ce10631-5480-41ff-a555-442ff7b1371e" />



<br/>

<!-- Badges -->
[![npm version](https://img.shields.io/npm/v/@pappu100/oneplayer.svg?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/@pappu100/oneplayer)
[![Downloads](https://img.shields.io/npm/dt/@pappu100/oneplayer.svg?style=for-the-badge&logo=npm&logoColor=white&color=7C3AED)](https://www.npmjs.com/package/@pappu100/oneplayer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/teamOnePlayer/oneplayer?style=for-the-badge&logo=github&color=gold)](https://github.com/teamOnePlayer/oneplayer)

<!-- Social/Support Links -->
[![Discord](https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/JGGkaXps4b)
[![Documentation](https://img.shields.io/badge/Docs-7C3AED?style=for-the-badge&logo=readthedocs&logoColor=white)](https://oneplayer.js.org)

<br/>

**High-performance, minimal Lavalink client for Discord.js**

```bash
npm install @pappu100/oneplayer
```

</div>

---

## ⚡ Why OnePlayer?

| Feature | Description |
|:-------:|:------------|
| 🚀 | **Ultra-low latency** - Optimized for performance |
| 🎯 | **Minimal footprint** - Only essential dependencies |
| 🎵 | **Multi-source** - YouTube, Spotify, SoundCloud, Apple Music |
| 🎛️ | **Audio filters** - Equalizer, Karaoke, Timescale, and more |
| 🔄 | **Loop modes** - Track, Queue, or None |
| 📦 | **Queue management** - Advanced queue operations |
| 🔌 | **Multiple nodes** - Load balancing support |

---

## 📦 Installation

```bash
npm install @pappu100/oneplayer
```

**Requirements:**
- Node.js 18.0.0 or newer
- Discord.js 14.0.0 or newer
- A running Lavalink server

---

## 🚀 Quick Start

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const { OnePlayer } = require('@pappu100/oneplayer');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const oneplayer = new OnePlayer(client, [
  {
    name: 'main',
    host: 'localhost',
    port: 2333,
    password: 'youshallnotpass',
    secure: false,
    restVersion: 'v4'
  },
], {
  send: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  },
  defaultSearchPlatform: 'ytmsearch',
  restVersion: 'v4',
  defaultVolume: 100,
});

client.on('ready', () => {
  oneplayer.init(client.user.id);
  console.log('✅ Bot ready!');
});

client.on('raw', (packet) => {
  oneplayer.updateVoiceState(packet);
});

client.login('YOUR_BOT_TOKEN');
```

---

## 🎵 Playing Music

```javascript
// Create player
const player = oneplayer.createConnection({
  guildId: message.guild.id,
  voiceChannel: message.member.voice.channel.id,
  textChannel: message.channel.id,
  deaf: true,
});

// Search and play
const result = await oneplayer.resolve({
  query: 'never gonna give you up',
  requester: message.author,
});

if (result.tracks.length) {
  player.queue.add(result.tracks[0]);
  await player.play();
}
```

---

## 🎛️ Audio Filters

```javascript
// Presets
await player.filters.setBassBoost(0.5);
await player.filters.setNightcore();
await player.filters.setVaporwave();
await player.filters.set8D();

// Custom filters
await player.filters.setEqualizer([
  { band: 0, gain: 0.5 },
  { band: 1, gain: 0.3 },
]);

await player.filters.setTimescale(true, {
  speed: 1.2,
  pitch: 1.0,
  rate: 1.0,
});

await player.filters.setKaraoke(true, {
  level: 1.0,
  monoLevel: 1.0,
  filterBand: 220.0,
  filterWidth: 100.0,
});

// Clear all filters
await player.filters.clearFilters();
```

---

## � Loop Modes

```javascript
player.setLoop('none');   // No loop
player.setLoop('track');  // Loop current track
player.setLoop('queue');  // Loop entire queue
```

---

## 📋 Queue Management

```javascript
// Add tracks
player.queue.add(track);
player.queue.add([track1, track2, track3]);

// Queue operations
player.queue.shuffle();
player.queue.clear();
player.queue.remove(0);
player.queue.move(0, 5);
player.queue.swap(0, 1);

// Get queue info
console.log(player.queue.size);
console.log(player.queue.totalDuration);
console.log(player.queue.formattedDuration);
```

---

## � Player Control

```javascript
// Playback control
await player.play();
await player.pause(true);
await player.stop();
await player.skip();

// Volume control
await player.setVolume(100); // 0-200

// Seek
await player.seek(30000); // 30 seconds

// Get current position
const position = player.currentPosition;

// Check player state
if (player.isIdle) {
  console.log('Player is idle');
}
```

---

## 📡 Events

OnePlayer supports both player-level and global-level event listening for maximum flexibility.

### Global Events (OnePlayer Instance)

Listen to events from all players globally:

```javascript
// Track events - fired for all players
oneplayer.on('trackStart', (player, track) => {
  console.log(`Now playing: ${track.info.title} in guild ${player.guildId}`);
});

oneplayer.on('trackEnd', (player, track, payload) => {
  console.log(`Track ended: ${payload.reason} in guild ${player.guildId}`);
});

oneplayer.on('trackError', (player, track, payload) => {
  console.error('Track error:', payload.exception);
});

oneplayer.on('trackStuck', (player, track, payload) => {
  console.error('Track stuck:', payload);
});

// Player lifecycle events
oneplayer.on('playerCreate', (player) => {
  console.log(`Player created: ${player.guildId}`);
});

oneplayer.on('playerDestroy', (player) => {
  console.log(`Player destroyed: ${player.guildId}`);
});

// Node events
oneplayer.on('nodeCreate', (node) => {
  console.log(`Node created: ${node.name}`);
});

oneplayer.on('nodeDestroy', (node) => {
  console.log(`Node destroyed: ${node.name}`);
});
```

### Player-Specific Events

Listen to events from a specific player:

```javascript
const player = oneplayer.createConnection({ /* ... */ });

// These events only fire for this specific player
player.on('trackStart', (player, track) => {
  console.log(`Track started: ${track.info.title}`);
});

player.on('trackEnd', (player, track, payload) => {
  console.log(`Track ended: ${payload.reason}`);
});

player.on('trackError', (player, track, payload) => {
  console.error('Track error:', payload.exception);
});
```

### Event Compatibility

For backward compatibility, all track events (`trackStart`, `trackEnd`, `trackError`, `trackStuck`, `socketClosed`) are emitted on both:
- The specific player instance
- The global OnePlayer instance

This means you can listen on either level depending on your needs:
- Use global events for centralized logging or handling across all guilds
- Use player-specific events for guild-specific functionality

---

## 🔧 Configuration Options

```javascript
const oneplayer = new OnePlayer(client, nodes, {
  // Required: Send voice state to Discord
  send: (guildId, payload) => { /* ... */ },
  
  // Search settings
  defaultSearchPlatform: 'ytmsearch', // or 'ytsearch', 'scsearch'
  restVersion: 'v4',                  // or 'v3'
  
  // Player settings
  defaultVolume: 100,                 // 0-200
  connectionTimeout: 10000,           // ms
  
  // Node settings
  reconnectTimeout: 3000,             // ms
  reconnectTries: 3,                  // attempts
  
  // Debug
  debug: false,
});
```

---

Full documentation is available at [oneplayer.js.org](https://oneplayer.js.org)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⭐ Show Your Support

Give a ⭐️ if this project helped you!

---

<div align="center">

Made with ❤️ by the Community One

</div>


