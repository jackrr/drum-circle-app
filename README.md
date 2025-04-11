# Drum Circle (Client App)

## Todo

### V0

- Playback and delivery of sound
- Display of peers w/ name

### Bugs

- Username doesn't send initially


## Features

- V0 - Create a "drum circle"
- V2 - Browse available drum circles
- V0 - Join a drum circle
- V1 - Select an instrument
- V0 - Send a sound
- V0 - Recieve sounds
- V0 - Playback of sounds (local and sent)
- V1 - Send sounds for instrument set

## WebRTC APIs

### Creating drum circle

1. Client opens WS to backend
1. Client sends create message to backend
1. Backend generates shortcode/ID of circle
1. Backend sends back circle ID
1. ... wait for other members ... (see join)
1. Backend forwards SDP offer from joiner
1. Client creates new RTC conn with remote description to SDP
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

1. Client sends agreed contract on data channel
