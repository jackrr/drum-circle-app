import { rtcConfig } from './rtc';

export function initialize(url: string) {
	// TODO: Implement stream/buffer pattern for queuing messages for BE
	const sock = new WebSocket(`ws://${url}`);

	const rtcConn = new RTCPeerConnection(rtcConfig);
	const sendChannel = rtcConn.createDataChannel('foo');
	// sock.addEventListener('open', (event) => {
	// 	console.log('open', event);
	// });

	sock.addEventListener('message', async (event) => {
		console.log('message received', event);

		try {
			const res = await rtcConn.setRemoteDescription(
				new RTCSessionDescription(JSON.parse(event.data))
			);
			console.log('remote description set');
			sendChannel.onclose = () => console.log('sendChannel has closed');
			sendChannel.onopen = (ev) => {
				console.log('sendChannel has opened', ev);
				sendChannel.send('Hello over RTC!!');
			};
			sendChannel.onmessage = (e) =>
				console.log(`Message from DataChannel '${sendChannel.label}' payload '${e.data}'`);
		} catch (err) {
			console.log(err);
		}
	});

	rtcConn.onnegotiationneeded = (e) =>
		rtcConn
			.createOffer()
			.then((d) => rtcConn.setLocalDescription(d))
			.catch(console.error);

	rtcConn.onicecandidate = (event) => {
		if (event.candidate !== null) {
			console.log('sending sd');
			sock.send(JSON.stringify(rtcConn.localDescription));
		}

		console.log(event, rtcConn);
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
		channel.onopen = (event) => {
			channel.send('Hi back!');
		};
		channel.onmessage = (event) => {
			console.log(event.data);
		};
	};
}
