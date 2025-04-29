# Drum Circle (Client App)

Svelte(kit) app for playing music in a group.

## Dev setup

1. Clone this repo.

1. Create a file `.env` in the root of the project with the following:

```bash
PUBLIC_WS_SERVER_HOST=ws://localhost:8080
```

1. Clone and follow dev setup steps for the [backend server](https://github.com/jackrr/drum-circle-serverhttps://github.com/jackrr/drum-circle-server).

1. Install dependencies
```bash
npm i
```

1. Start server
```bash
npm run dev
```


## Contributing

See the [Issues](https://github.com/jackrr/drum-circle-app/issues) tab
to find proposed features and known issues. You are welcome to suggest
a solution on one of those, put up a PR, or open a new issue to
suggest additional changes!

## WebRTC APIs

### Creating drum circle

1. Client opens WS to backend
1. Client sends create message to backend
1. Backend generates shortcode/ID of circle
1. Backend sends back circle ID
1. ... wait for other members ... (see join)
1. Backend forwards SDP offer from joiner
1. Client creates new RTC conn with remote description to SDP
1. ... Both clients start exchanging ICE candidates through backend ...
1. Client creates RTC conn answer
1. Client sends to RTC answer to backend
1. Backend sends RTC answer to _the specific joiner_

### Joining drum circle

1. Client opens WS to backend
1. Client sends join message with ID of circle
1. Backend sends message with "IDs" of members in circle
1. Client creates new RTC conn for each member
1. Client sends payload with SDP offer for each ID of member
1. Backend forwards SDP offer to each member of drum circle
1. GOTO Creating drum circle ... wait for other members ...

### Playing music

1. Client sends sound events on RTC data channel
