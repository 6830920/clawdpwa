// Simple WebSocket test with correct client ID
const ws = new WebSocket('ws://127.0.0.1:18789');
let seq = 0;

function send(data) {
  const frame = {
    type: 'req',
    id: String(++seq),
    ...data
  };
  ws.send(JSON.stringify(frame));
}

ws.onopen = () => {
  console.log('[Test] WebSocket connected, waiting for challenge...');
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  // Handle connect.challenge
  if (msg.type === 'event' && msg.event === 'connect.challenge') {
    console.log('[Test] Received challenge, sending connect...');
    send({
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: 'webchat-ui',
          version: '0.1.0',
          platform: 'web',
          mode: 'webchat',
        },
        auth: {
          token: '99a1282cff39ec6008916016302302fe42dd769c6d1fdfc1',
        },
      },
    });
  }

  // Handle connect response
  if (msg.type === 'res' && msg.id === '1') {
    if (msg.ok) {
      console.log('[Test] ✓ Connected successfully!');
      console.log('[Test] Gateway info:', JSON.stringify(msg.payload, null, 2));

      // Test chat.send
      setTimeout(() => {
        console.log('[Test] Sending chat message...');
        send({
          method: 'chat.send',
          params: {
            sessionKey: 'global',
            message: 'Hello from test client!',
            thinking: true,
            deliver: true,
          },
        });
      }, 1000);
    } else {
      console.error('[Test] Connect failed:', msg.error);
      ws.close();
    }
  }

  // Handle chat events
  if (msg.type === 'event' && msg.event === 'chat.delta') {
    process.stdout.write(msg.payload.text || '');
  }

  if (msg.type === 'event' && msg.event === 'chat.result') {
    console.log('\n[Test] ✓ Chat completed!');
    ws.close();
  }
};

ws.onerror = (error) => {
  console.error('[Test] Error:', error);
};

ws.onclose = (event) => {
  console.log('\n[Test] Closed:', event.code, event.reason);
  setTimeout(() => process.exit(0), 100);
};

// Timeout after 30 seconds
setTimeout(() => {
  console.log('[Test] Timeout');
  ws.close();
  process.exit(1);
}, 30000);
