/**
 * OnePlayer - Minimal Lavalink client TypeScript definitions
 * Engine and Player only
 * @version 2.1.0
 */

import { EventEmitter } from 'events';

// Node configuration
export interface NodeOptions {
  name?: string;
  host: string;
  port: number;
  password: string;
  secure?: boolean;
  restVersion?: 'v3' | 'v4';
  sessionId?: string;
}

// OnePlayer configuration
export interface OnePlayerOptions {
  send: (guildId: string, payload: any) => void;
  defaultSearchPlatform?: string;
  restVersion?: 'v3' | 'v4';
  reconnectTimeout?: number;
  reconnectTries?: number;
  defaultVolume?: number;
  connectionTimeout?: number;
  debug?: boolean;
}

// Connection options
export interface ConnectionOptions {
  guildId: string;
  voiceChannel: string;
  textChannel?: string;
  deaf?: boolean;
  mute?: boolean;
}

// Resolve options
export interface ResolveOptions {
  query: string;
  source?: string;
  requester?: any;
  node?: string | Node;
}

// Resolve result
export interface ResolveResult {
  loadType: string;
  exception?: any;
  playlistInfo?: any;
  tracks: Track[];
}

// Main classes
export class OnePlayer extends EventEmitter {
  constructor(client: any, nodes: NodeOptions[], options: OnePlayerOptions);
  
  // Properties
  public client: any;
  public nodes: NodeOptions[];
  public nodeMap: Map<string, Node>;
  public players: Map<string, Player>;
  public clientId: string | null;
  public initiated: boolean;
  public version: string;
  
  // Methods
  public init(clientId: string): OnePlayer;
  public createNode(options: NodeOptions): Node;
  public destroyNode(identifier: string): void;
  public updateVoiceState(packet: any): void;
  public createConnection(options: ConnectionOptions): Player;
  public createPlayer(node: Node, options: ConnectionOptions): Player;
  public destroyPlayer(guildId: string): void;
  public removeConnection(guildId: string): void;
  public get(guildId: string): Player;
  public resolve(options: ResolveOptions): Promise<ResolveResult>;
  public decodeTrack(track: string, node?: Node): Promise<any>;
  public decodeTracks(tracks: string[], node?: Node): Promise<any[]>;
  
  // Getters
  public get leastUsedNodes(): Node[];
  public get bestNode(): Node;
}

export class Node extends EventEmitter {
  constructor(oneplayer: OnePlayer, node: NodeOptions, options: OnePlayerOptions);
  
  public name: string;
  public host: string;
  public port: number;
  public password: string;
  public secure: boolean;
  public restVersion: string;
  public connected: boolean;
  public penalties: number;
  public rest: Rest;
  
  public connect(): void;
  public disconnect(): void;
  public destroy(): void;
}

export class Rest {
  constructor(oneplayer: OnePlayer, options: any);
  
  public calls: number;
  public version: string;
  
  public loadTracks(identifier: string): Promise<any>;
  public decodeTrack(track: string): Promise<any>;
  public decodeTracks(tracks: string[]): Promise<any[]>;
  public updatePlayer(guildId: string, payload: any): Promise<any>;
  public destroyPlayer(guildId: string): Promise<any>;
}

export class Player extends EventEmitter {
  constructor(oneplayer: OnePlayer, node: Node, options: ConnectionOptions);
  
  public oneplayer: OnePlayer;
  public node: Node;
  public guildId: string;
  public voiceChannel: string;
  public textChannel?: string;
  public connection: Connection;
  public queue: Queue;
  public filters: Filters;
  public current: Track | null;
  public previous: Track | null;
  public playing: boolean;
  public paused: boolean;
  public connected: boolean;
  public volume: number;
  public position: number;
  public loop: 'none' | 'track' | 'queue';
  
  public connect(options?: ConnectionOptions): void;
  public disconnect(): void;
  public destroy(): void;
  public play(track?: Track): Promise<void>;
  public stop(): Promise<void>;
  public pause(pause?: boolean): Promise<void>;
  public seek(position: number): Promise<void>;
  public setVolume(volume: number): Promise<void>;
  public skip(): Promise<void>;
  public setLoop(mode: 'none' | 'track' | 'queue'): void;
  
  public get currentPosition(): number;
  public get isIdle(): boolean;
  public get state(): any;
}

export class Track {
  constructor(data: any, requester: any, node: Node);
  
  public encoded: string;
  public info: {
    identifier: string;
    isSeekable: boolean;
    author: string;
    length: number;
    isStream: boolean;
    position: number;
    title: string;
    uri: string;
    artworkUrl?: string;
    isrc?: string;
    sourceName: string;
  };
  public requester: any;
  public node: Node;
}

export class Queue {
  public tracks: Track[];
  public size: number;
  public duration: number;
  
  public add(track: Track | Track[]): void;
  public remove(index: number): Track | null;
  public clear(): void;
  public shuffle(): void;
  public shift(): Track | null;
  public unshift(track: Track): void;
  public get first(): Track | null;
}

export class Connection {
  constructor(player: Player);
  
  public player: Player;
  public sessionId?: string;
  public region?: string;
  public selfDeaf: boolean;
  public selfMute: boolean;
  
  public setServerUpdate(data: any): void;
  public setStateUpdate(data: any): void;
}

export class Filters {
  constructor(player: Player, options?: any);
  
  public player: Player;
  public volume: number;
  public equalizer: any[];
  public karaoke: any;
  public timescale: any;
  public tremolo: any;
  public vibrato: any;
  public rotation: any;
  public distortion: any;
  public channelMix: any;
  public lowPass: any;
  
  public setEqualizer(bands: Array<{band: number, gain: number}>): Promise<void>;
  public setKaraoke(enabled: boolean, options?: any): Promise<void>;
  public setTimescale(enabled: boolean, options?: any): Promise<void>;
  public setTremolo(enabled: boolean, options?: any): Promise<void>;
  public setVibrato(enabled: boolean, options?: any): Promise<void>;
  public setRotation(enabled: boolean, options?: any): Promise<void>;
  public setDistortion(enabled: boolean, options?: any): Promise<void>;
  public setChannelMix(enabled: boolean, options?: any): Promise<void>;
  public setLowPass(enabled: boolean, options?: any): Promise<void>;
  public clearFilters(): Promise<void>;
  
  // Presets
  public setBassBoost(level?: number): Promise<void>;
  public setNightcore(): Promise<void>;
  public setVaporwave(): Promise<void>;
  public set8D(): Promise<void>;
  
  public get active(): string[];
  public get hasFilters(): boolean;
}

// Export default
export default OnePlayer;