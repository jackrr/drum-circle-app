import type { Subject } from 'wonka';
import { env } from '$env/dynamic/public';
import type { SoundEvent } from '$lib/sound.svelte';
import { makeSubject, map, subscribe, pipe } from 'wonka';

export enum P2PMessageName {
	USERNAME = 'USERNAME',
	SOUND = 'SOUND',
	DISCONNECT = 'DISCONNECT',
	CONNECTED = 'CONNECTED'
}

type P2PMessage = {
	peerId: string;
	name: P2PMessageName;
	payload?: any;
};

type PeerServerPayload = {
	name: string;
	sdp?: string;
	ice?: string;
};

type PeerP2PMessage = Omit<P2PMessage, 'peerId'>;

class PeerConnection {
	rtc: RTCPeerConnection;
	channel?: RTCDataChannel;

	incomingP2PMessages: Subject<PeerP2PMessage>;
	outgoingP2PMessages: Subject<PeerP2PMessage>;
	outgoingServerMessages: Subject<PeerServerPayload>;

	constructor() {
		this.incomingP2PMessages = makeSubject<PeerP2PMessage>();
		this.outgoingP2PMessages = makeSubject<PeerP2PMessage>();
		this.outgoingServerMessages = makeSubject<PeerServerPayload>();

		this.rtc = new RTCPeerConnection({
			iceServers: [
				{
					urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
				}
			]
		});

		this.rtc.ondatachannel = (event) => {
			this.registerChannel(event.channel);
		};

		// TODO: kill these if noisy, just for debugging
		this.rtc.onconnectionstatechange = (e) => {
			console.log('rtc conn state change', this.rtc.connectionState);
		};

		this.rtc.onicecandidateerror = (e) => {
			console.log('rtc ice candidate error', e);
		};

		this.rtc.onicecandidate = (ev) => {
			ev.candidate &&
				this.outgoingServerMessages.next({
					name: 'ice_candidate',
					ice: JSON.stringify(ev.candidate)
				});
		};
	}

	private registerChannel(channel: RTCDataChannel) {
		this.channel = channel;

		let unsubscribe: () => void = () => {};

		this.channel.onopen = (_) => {
			console.log('data channel opened');
			const piped = pipe(
				this.outgoingP2PMessages.source,
				subscribe((m) => {
					this.channel?.send(JSON.stringify(m));
				})
			);

			this.incomingP2PMessages.next({ name: P2PMessageName.CONNECTED });

			unsubscribe = piped.unsubscribe;
		};

		this.channel.onclose = () => {
			console.log('data channel has closed');
			this.incomingP2PMessages.next({ name: P2PMessageName.DISCONNECT });
			this.incomingP2PMessages.complete();
			unsubscribe();
		};

		this.channel.onmessage = (e) => this.incomingP2PMessages.next(JSON.parse(e.data));
	}

	close() {
		this.channel?.close();
		this.rtc.close();
	}

	async initiate() {
		this.registerChannel(this.rtc.createDataChannel('peer_data_stream'));

		const offer = await this.rtc.createOffer();
		await this.rtc.setLocalDescription(offer);

		this.outgoingServerMessages.next({
			name: 'new_member_rtc_offer',
			sdp: JSON.stringify(offer)
		});
	}

	async handleServerInbound(payload: PeerServerPayload) {
		switch (payload.name) {
			case 'new_member_rtc_offer':
				await this.rtc.setRemoteDescription(JSON.parse(payload.sdp!));
				const answer = await this.rtc.createAnswer();
				await this.rtc.setLocalDescription(answer);

				this.outgoingServerMessages.next({
					name: 'new_member_rtc_answer',
					sdp: JSON.stringify(answer)
				});
				break;
			case 'new_member_rtc_answer':
				await this.rtc.setRemoteDescription(JSON.parse(payload.sdp!));
				break;
			case 'ice_candidate':
				this.rtc.addIceCandidate(JSON.parse(payload.ice!));
				break;
		}
	}
}

class ServerConnection {
	socket: WebSocket;
	inbound: Subject<ServerPayload>;

	constructor(url: string) {
		this.inbound = makeSubject<ServerPayload>();
		this.socket = new WebSocket(url);
	}

	close() {
		this.socket.close();
	}

	async init() {
		return new Promise<void>((resolve) => {
			this.socket.addEventListener('message', (event) => {
				const payload = JSON.parse(event.data);
				this.inbound.next(payload);
			});

			this.socket.addEventListener('close', () => {
				console.log('Connection to backend server closed');
				this.inbound.complete();
			});

			this.socket.addEventListener('open', () => {
				console.log('Connected to backend server');
				resolve();
			});
		});
	}

	sendMessage(message: ServerPayload) {
		this.socket.send(JSON.stringify(message));
	}
}

type ServerPayload = {
	name: string;
	member_id?: string;
	circle_id?: string;
	members?: string[];
	sdp?: string;
	ice?: string;
};

type DrumCircleEvent = {
	name: DrumCircleEventName;
	payload?: any;
};

export enum DrumCircleEventName {
	JOINED,
	PEER_MESSAGE
}

export class DrumCircle {
	private serverConnection: ServerConnection;
	private peers: { [peerId: string]: PeerConnection };

	circleId?: string;
	username?: string;
	feed: Subject<DrumCircleEvent>;

	constructor() {
		this.peers = {};

		this.feed = makeSubject<DrumCircleEvent>();

		this.serverConnection = new ServerConnection(env.PUBLIC_WS_SERVER_HOST);
		pipe(this.serverConnection.inbound.source, subscribe(this.handleServerInbound.bind(this)));
	}

	async connect() {
		await this.serverConnection.init();
	}

	close() {
		this.serverConnection.close();
		Object.values(this.peers).forEach((p) => p.close());
	}

	private createPeerConnection(peerId: string) {
		const peer = new PeerConnection();

		// Send server messages to server
		pipe(
			peer.outgoingServerMessages.source,
			map((p) => ({ ...p, member_id: peerId, circle_id: this.circleId })),
			subscribe((m) => this.serverConnection.sendMessage(m))
		);

		// Send messages from peer to svelteland
		pipe(
			peer.incomingP2PMessages.source,
			subscribe((m) => {
				// if connected event, respond with username
				if (m.name === P2PMessageName.CONNECTED) {
					this.sendToPeer(peer, {
						name: P2PMessageName.USERNAME,
						payload: { username: this.username }
					});
				}

				this.feed.next({
					name: DrumCircleEventName.PEER_MESSAGE,
					payload: {
						...m,
						peerId
					}
				});
			})
		);
		this.peers[peerId] = peer;

		return peer;
	}

	private sendToPeer(p: PeerConnection, payload: PeerP2PMessage) {
		p.outgoingP2PMessages.next(payload);
	}

	private handleServerInbound(payload: ServerPayload) {
		switch (payload.name) {
			case 'circle_created':
				this.circleId = payload.circle_id;
				this.feed.next({ name: DrumCircleEventName.JOINED, payload: { circleId: this.circleId } });
				break;
			case 'circle_discovery':
				this.circleId = payload.circle_id;
				this.feed.next({ name: DrumCircleEventName.JOINED, payload: { circleId: this.circleId } });
				payload.members?.forEach((memberId) => {
					const peer = this.createPeerConnection(memberId);
					peer.initiate();
				});
				break;
			case 'new_member_rtc_offer':
			case 'new_member_rtc_answer':
			case 'ice_candidate':
				// Delegate to peer
				if (!payload.member_id) {
					console.error('Missing peer for payload', payload);
					return;
				}

				if (!this.peers[payload.member_id]) {
					this.createPeerConnection(payload.member_id);
				}

				const peer = this.peers[payload.member_id];

				peer.handleServerInbound(payload);
				break;
		}
	}

	create() {
		return new Promise((resolve) => {
			const { unsubscribe } = pipe(
				this.feed.source,
				subscribe((e) => {
					if (e.name === DrumCircleEventName.JOINED) {
						resolve(e.payload.circleId);
						unsubscribe();
					}
				})
			);

			this.serverConnection.sendMessage({
				name: 'new_circle'
			});
		});
	}

	join(circleId: string) {
		this.serverConnection.sendMessage({
			name: 'join_circle',
			circle_id: circleId
		});
	}

	onPeerEvent(cb: (m: P2PMessage) => void) {
		const { unsubscribe } = pipe(
			this.feed.source,
			subscribe((e) => {
				if (e.name === DrumCircleEventName.PEER_MESSAGE) {
					cb(e.payload);
				}
			})
		);

		return unsubscribe;
	}

	setUserName(username: string) {
		this.username = username;
		Object.values(this.peers).forEach((p) => {
			this.sendToPeer(p, { name: P2PMessageName.USERNAME, payload: { username } });
		});
	}

	broadcastSoundPayload(payload: SoundEvent) {
		Object.values(this.peers).forEach((p) => {
			this.sendToPeer(p, {
				name: P2PMessageName.SOUND,
				payload
			});
		});
	}
}
