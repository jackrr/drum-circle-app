import { v4 as uuid } from 'uuid';
import { rtcConfig } from './rtc';

enum State {
	NEW,
	CREATING,
	JOINING,
	JOINED
}

class RTCPeer {
	peerId: string;
	conn: RTCPeerConnection;
	channel: RTCDataChannel;

	constructor(peerId: string) {
		this.peerId = peerId;
		this.conn = new RTCPeerConnection(rtcConfig);
		this.chan = this.conn.createDataChannel('music_feed');

		this.chan.onopen = (ev) => {
			console.log('chan has opened', ev);
			this.chan.send('Hello over RTC!!');
		};

		this.chan.onclose = () => console.log('chan has closed');

		this.chan.onmessage = (e) =>
			console.log(`Message from DataChannel '${this.chan.label}' payload '${e.data}'`);

		this.conn.onconnectionstatechange = (e) => {
			console.log('rtc conn state change', e);
		};
		this.conn.onicecandidateerror = (e) => {
			console.log('rtc ice candidate error', e);
		};

		this.conn.ondatachannel = (event) => {
			console.log('Received data channel', event);
			const channel = event.channel;
			// channel.onopen = (event) => {
			// 	channel.send('Hi back!');
			// };
			channel.onmessage = (event) => {
				console.log('got message on data channel', event.data);
			};
		};
	}

	async getInitialOffer() {
		// TODO: why the pair of on candidate/on negotiation? interplay here is a little funky
		const conn = this.conn;
		return new Promise((resolve) => {
			conn.addEventListener('negotiationneeded', async function handleNegotiationNeeded(e) {
				const offer = await conn.createOffer();
				conn.setLocalDescription(offer);
				conn.removeEventListener('negotiationneeded', handleNegotiationNeeded);
				resolve(offer);
			});
			// this.conn.onnegotiationneeded = async (e) => {
			// 	try {
			// 		const offer = await rtcConn.createOffer();
			// 		rtcConn.setLocalDescription(offer);
			// 	} catch (err) {
			// 		console.error('Failed to create offer', err);
			// 	}
			// };

			// rtcConn.onicecandidate = (event) => {
			// 	if (event.candidate !== null) {
			// 		console.log('sending new sdp');
			// 		sock.send(JSON.stringify(rtcConn.localDescription));
			// 	}
			// };
		});
	}

	async addRemote(sdp: string) {
		console.log(`offer: setting ${this.peerId} remote to `, sdp);
		await this.conn.setRemoteDescription(new RTCSessionDescription(sdp));
		console.log('remote description set');
		const answer = await this.conn.createAnswer();
		this.conn.setLocalDescription(answer);
		return answer;
	}

	async setRemoteAnswer(sdp: string) {
		console.log(`answer: setting ${this.peerId} remote to `, sdp);
		await this.conn.setRemoteDescription(sdp);
	}
}

export class ConnectionManager {
	userId: ReturnValue<uuid>;
	state: State;
	serverSocket: WebSocket;
	rtcConnections: RTCPeer[];
	drumCircleId?: string;
	private watchers: { [state in State]?: () => void[] };

	constructor(serverSocket: WebSocket) {
		this.state = State.NEW;
		this.serverSocket = serverSocket;
		this.rtcConnections = [];
		this.watchers = {};
		this.userId = uuid();
	}

	private setState(state: State) {
		this.state = state;

		const waiting = this.watchers[state];

		if (!waiting) return;

		waiting.forEach((w) => w());
		this.watchers[state] = [];
	}

	private async onChangeToState(targetState: State) {
		if (this.state === targetState) return Promise.resolve();

		return new Promise((resolve) => {
			if (!this.watchers[this.state]) this.watchers[this.state] = [];
			this.watchers[this.state].push(resolve);
		});
	}

	private sendMessage(message) {
		console.log('sending', message);
		if (message.sdp) {
			message.sdp = JSON.stringify(message.sdp);
		}
		this.serverSocket.send(JSON.stringify(message));
	}

	async processServerMessage(message) {
		const payload = JSON.parse(message);
		console.log('GOT MESSAGE', payload, { state: this.state });

		switch (payload.name) {
			case 'circle_created':
				if (this.state === State.JOINING) {
					this.drumCircleId = payload.circle_id;
					this.setState(State.JOINED);
				} else {
					console.log(this.state === State.CREATING, State.CREATING);
					console.error('Unexpected event', payload);
				}
				break;
			case 'circle_discovery':
				if (this.state === State.JOINING) {
					this.drumCircleId = payload.circle_id;
					this.rtcConnections = payload.members.map((peerId) => new RTCPeer(peerId));

					Promise.all(
						this.rtcConnections.map(async (p) => {
							const offer = await p.getInitialOffer();

							this.sendMessage({
								name: 'new_member_rtc_offer',
								circle_id: this.drumCircleId,
								member_id: p.peerId,
								sdp: offer
							});
						})
					);
				} else {
					console.error('Unexpected event', payload);
				}
				break;
			case 'new_member_rtc_offer':
				if (this.state === State.JOINED) {
					const newPeer = new RTCPeer(payload.member_id);
					this.rtcConnections.push(newPeer);
					const answer = await newPeer.addRemote(JSON.parse(payload.sdp));
					this.sendMessage({
						name: 'new_member_rtc_answer',
						circle_id: this.drumCircleId,
						// always send ID of joiner (offer)
						member_id: newPeer.peerId,
						sdp: answer
					});
				} else {
					console.error('Unexpected event', payload);
				}
				break;

			case 'new_member_rtc_answer':
				if ([State.JOINING, State.JOINED].includes(this.state)) {
					const newPeer = this.rtcConnections.find((c) => c.peerId === payload.member_id);

					await newPeer.setRemoteAnswer(JSON.parse(payload.sdp));

					// Need at least one peer connection to be "joined"
					this.setState(State.JOINED);
				} else {
					console.error('Unexpected event', payload);
				}
				break;
		}
	}

	async createCircle() {
		if (this.state !== State.NEW) {
			console.error('Cannot create new circle on this manager');
		}

		this.setState(State.JOINING);

		this.sendMessage({
			name: 'new_circle'
		});
		return this.onChangeToState(State.JOINED);
	}

	async joinCircle(circleId: string) {
		if (this.state !== State.NEW) {
			console.error('Cannot join circle on this manager');
		}

		this.setState(State.JOINING);

		this.sendMessage({
			name: 'join_circle',
			circle_id: circleId
		});

		return this.onChangeToState(State.JOINED);
	}
}

export async function initialize(url: string): ConnectionManager {
	const wsUrl = `ws://${url}`;
	const serverSocket = new WebSocket(wsUrl);
	const manager = new ConnectionManager(serverSocket);

	serverSocket.addEventListener('message', (event) => {
		manager.processServerMessage(event.data);
	});

	return new Promise((resolve) => {
		serverSocket.addEventListener('open', () => {
			console.log(`Connected to backend server at ${wsUrl}`);
			resolve(manager);
		});
	});
}
