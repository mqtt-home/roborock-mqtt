## ADDED Requirements

### Requirement: Connect to Roborock cloud MQTT broker
The system SHALL establish an MQTT connection to the Roborock cloud broker using credentials derived from the login response. The MQTT username and password SHALL be computed as MD5 hashes of the userId and a combination of userId + sessionId respectively.

#### Scenario: Successful MQTT connection
- **WHEN** valid IoT credentials are available from login
- **THEN** the system connects to the Roborock MQTT broker and subscribes to `rr/m/o/{userId}/{username}/#` for inbound device messages

#### Scenario: MQTT disconnection
- **WHEN** the connection to Roborock's MQTT broker is lost
- **THEN** the system reconnects with exponential backoff and re-subscribes to device topics

### Requirement: Binary protocol message encoding
The system SHALL encode outbound messages using the Roborock binary protocol: a 19-byte header (protocol version, sequence number, random value, timestamp, protocol ID, payload length), an AES/ECB encrypted JSON body, and a 4-byte CRC32 footer.

#### Scenario: Send command to device
- **WHEN** a command needs to be sent to a device
- **THEN** the system encodes the JSON payload into the binary protocol format, encrypts the body, computes the CRC32 checksum, and publishes to `rr/m/i/{userId}/{username}/{deviceId}`

### Requirement: Binary protocol message decoding
The system SHALL decode inbound messages from the Roborock binary protocol format. The system SHALL validate the CRC32 checksum and decrypt the AES/ECB encrypted body to extract the JSON payload.

#### Scenario: Receive status from device
- **WHEN** a message is received on the subscription topic
- **THEN** the system validates the CRC32 checksum, decrypts the body using the derived AES key, and parses the JSON payload

#### Scenario: Invalid checksum
- **WHEN** a received message has a CRC32 mismatch
- **THEN** the system logs a warning and discards the message

### Requirement: AES key derivation
The system SHALL derive AES encryption keys using MD5 of: timestamp (hex-encoded with character rearrangement pattern [5,6,3,7,1,2,0,4]) concatenated with the device key and a salt value.

#### Scenario: Key derivation for message
- **WHEN** encrypting or decrypting a message with a given timestamp
- **THEN** the system derives the AES key by rearranging the hex-encoded timestamp characters, concatenating with device key and salt, and computing MD5

### Requirement: Request-response correlation
The system SHALL track outbound request sequence numbers and correlate them with inbound responses to match command responses to their originating requests.

#### Scenario: Command with response
- **WHEN** a command is sent with a sequence number
- **THEN** the system matches the response by sequence number and delivers the result to the caller
