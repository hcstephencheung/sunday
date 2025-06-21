/**
 * THIS IS NOT USED BECAUSE IT'S INCOMPLETE. IMPLEMENT A WEBSOCKET EVENT PARSER
 * SO WE CAN USE IT AS AN API, KIND OF LIKE SERVER SENT EVENTS (SSE)
 */
const WEBSOCKET_PROTOCOL = window.location.protocol === 'https:' ? 'wss://' : 'ws://';

const COMPLETED_EVENT = "event: completed\n";
const DELTA_EVENT = "event: delta\n";
const EVENT_DELIMITER = "============\n\n";
// TODO: until websocket data is properly parsed into events
// we'll just split the final result with delta events with separator
export const DELTA_COMPLETED_SEPARATER = EVENT_DELIMITER

class WebSocketEventProxy {
    ws: WebSocket | null = null;
    buffer: string[] = []; // complete buffer of all messages from websocket
    eventBuffer: string[] = []; // buffer until EVENT_DELIMITER is received
    callbacks: {
        onDelta: (data: any) => void;
        onCompleted: (data: any) => void;
    } = {
        onDelta: () => {},
        onCompleted: () => {}
    }

    async connect(url: string) {
        if (this.ws) {
            console.log('Closing existing WebSocket connection');
            this.ws.close();
        }

        return new Promise<boolean>((resolve, reject) => {
            try {
                this.ws = new WebSocket(WEBSOCKET_PROTOCOL + url);
                this.ws.onopen = () => {
                    console.log('WebSocket connection opened');
                    resolve(true);
                };
            }
            catch (e) {
                console.error('WebSocket connection error:', e);
                reject(e);
            }
        });
    }

    async parseWebSocketDataIntoEvents() {
        if (!this.ws) {
            throw new Error('WebSocket is not connected');
        }

        // clear any previous data
        this.buffer = [];

        this.ws.onmessage = (event) => {
            const data = event.data;
            
            this.buffer.push(event.data); // accumulate all messages
            this.eventBuffer.push(data);

            // TODO: implement a parser here, mimic behaviour of SSE, but with callbacks instead
            //       of events
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
        };
    }
}

export default WebSocketEventProxy;