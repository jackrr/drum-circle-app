import { rtcConfig } from './rtc';

export function initialize(url: string) {
	// TODO: Implement stream/buffer pattern for queuing messages for BE
	const sock = new WebSocket(`ws://${url}`);

	const rtcConn = new RTCPeerConnection(rtcConfig);
	const sendChannel = rtcConn.createDataChannel('foo');
	sendChannel.onopen = (ev) => {
		console.log('sendChannel has opened', ev);
		sendChannel.send('Hello over RTC!!');
	};

	sendChannel.onclose = () => console.log('sendChannel has closed');

	sendChannel.onmessage = (e) =>
		console.log(`Message from DataChannel '${sendChannel.label}' payload '${e.data}'`);
	// sock.addEventListener('open', (event) => {
	// 	console.log('open', event);
	// });

	sock.addEventListener('message', async (event) => {
		const sdp = JSON.parse(event.data);
		console.log({ sdp });

		try {
			const res = await rtcConn.setRemoteDescription(new RTCSessionDescription(sdp));
			console.log('remote description set');
			// sendChannel.send('hello world!!!');

			try {
				const answer = await rtcConn.createAnswer();
				rtcConn.setLocalDescription(answer);
				sock.send(JSON.stringify(answer));
			} catch (err) {
				console.log('failed to create answer', err);
			}
		} catch (err) {
			console.log(err);
		}
	});

	// TODO: why the pair of on candidate/on negotiation? interplay here is a little funky
	rtcConn.onnegotiationneeded = async (e) => {
		try {
			const offer = await rtcConn.createOffer();
			rtcConn.setLocalDescription(offer);
		} catch (err) {
			console.error('Failed to create offer', err);
		}
	};

	rtcConn.onicecandidate = (event) => {
		if (event.candidate !== null) {
			console.log('sending new sdp');
			sock.send(JSON.stringify(rtcConn.localDescription));
		}
	};

	rtcConn.onconnectionstatechange = (e) => {
		console.log('rtc conn state change', e);
	};
	rtcConn.onicecandidateerror = (e) => {
		console.log('rtc ice candidate error', e);
	};

	rtcConn.ondatachannel = (event) => {
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
