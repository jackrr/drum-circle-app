import type { Subject } from 'wonka';
import { makeSubject, merge, map, never, subscribe, pipe } from 'wonka';

type Stream = ReturnType<typeof makeSubject>['source'];

type PeerServerPayload = {
	name: string;
	sdp?: string;
	ice?: string;
};

class PeerConnection {
	rtc: RTCPeerConnection;
	channel?: RTCDataChannel;
	toPeer: (PeerServerPayload: PeerServerPayload) => void;

	constructor(toPeer: (payload: PeerServerPayload) => void) {
		this.toPeer = toPeer;

		this.rtc = new RTCPeerConnection({
			iceServers: [
				{
					urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
				}
			]
		});

		this.rtc.ondatachannel = (event) => {
			this.registerChannel(event.channel, false);
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
				this.toPeer({
					name: 'ice_candidate',
					ice: JSON.stringify(ev.candidate)
				});
		};
	}

	private registerChannel(channel: RTCDataChannel, initiating: boolean) {
		this.channel = channel;

		this.channel.onopen = (_) => {
			if (initiating) this.channel?.send('Hello over RTC!!');
		};

		this.channel.onclose = () => console.log('chan has closed');

		// TODO: expose I/O to peer
		this.channel.onmessage = (e) =>
			console.log(`Message from DataChannel '${this.channel?.label}' payload '${e.data}'`);
	}

	async initiate() {
		this.registerChannel(this.rtc.createDataChannel('peer_data_stream'), true);

		const offer = await this.rtc.createOffer();
		await this.rtc.setLocalDescription(offer);

		this.toPeer({
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

				this.toPeer({
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
	inbound: Stream;

	constructor(url: string) {
		const wsUrl = `ws://${url}`;
		const { source, next, complete } = makeSubject();
		this.inbound = source;

		this.socket = new WebSocket(wsUrl);

		this.socket.addEventListener('message', (event) => {
			const payload = JSON.parse(event.data);
			next(payload);
		});

		this.socket.addEventListener('open', () => {
			console.log(`Connected to backend server at ${wsUrl}`);
		});

		this.socket.addEventListener('close', () => {
			console.log(`Connected to backend server at ${wsUrl} closed`);
			next(complete);
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

enum DrumCircleEventName {
	JOINED,
	NEW_PEER
}

export class DrumCircle {
	serverConnection: ServerConnection;
	peers: { [peerId: string]: PeerConnection };
	circleId?: string;
	peerServerOutbound?: Stream;
	unsubMergedPeers?: () => void;

	feed: Subject<DrumCircleEvent>;

	constructor(backendUrl: string) {
		this.serverConnection = new ServerConnection(backendUrl);
		this.peers = {};

		this.feed = makeSubject<DrumCircleEvent>();

		pipe(
			this.feed.source,
			subscribe((e) => console.log('DrumCircleEvent', e))
		);

		pipe(
			this.serverConnection.inbound,
			subscribe((m) => this.handleServerInbound(m))
		);
	}

	private addPeerSource(s: Stream) {
		this.unsubMergedPeers && this.unsubMergedPeers();

		if (this.peerServerOutbound) {
			this.peerServerOutbound = merge(this.peerServerOutbound, s);
		} else {
			this.peerServerOutbound = s;
		}

		const { unsubscribe } = pipe(
			this.peerServerOutbound,
			subscribe((p) => this.serverConnection.sendMessage(p))
		);

		this.unsubMergedPeers = unsubscribe;
	}

	private createPeerConnection(peerId: string) {
		const { source, next, complete } = makeSubject();

		const wrapped = pipe(
			source,
			map((p) => ({ ...p, member_id: peerId, circle_id: this.circleId }))
		);

		this.addPeerSource(wrapped);

		// TODO: circular ref?
		this.peers[peerId] = new PeerConnection(next);

		return this.peers[peerId];
	}

	private delegateToPeer(payload: ServerPayload) {
		if (!payload.member_id) {
			console.error('Missing peer for payload', payload);
			return;
		}

		if (!this.peers[payload.member_id]) {
			this.createPeerConnection(payload.member_id);
		}

		const peer = this.peers[payload.member_id];

		peer.handleServerInbound(payload);
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
				this.delegateToPeer(payload);
				break;
		}
	}

	create() {
		this.serverConnection.sendMessage({
			name: 'new_circle'
		});
	}

	join(circleId: string) {
		this.serverConnection.sendMessage({
			name: 'join_circle',
			circle_id: circleId
		});
	}

	onJoin(joined: (circleId: string) => void) {
		const { unsubscribe } = pipe(
			this.feed.source,
			subscribe((ev) => {
				if (ev.name === DrumCircleEventName.JOINED && this.circleId) {
					unsubscribe();
					joined(this.circleId);
				}
			})
		);
	}
}
