// Test complete chat flow - debug all events
const ws = new WebSocket('ws://127.0.0.1:18789');
let seq = 0;
let sessionId = null;

function send(data) {
  const frame = {
    type: 'req',
    id: String(++seq),
    ...data
  };
  ws.send(JSON.stringify(frame));
}

ws.onopen = () => {
  console.log('[Test] ✓ Connected');
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log('[Test] Received:', msg.type, msg.event || msg.id || '', JSON.stringify(msg).substring(0, 200));

  // Handle connect.challenge
  if (msg.type === 'event' && msg.event === 'connect.challenge') {
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
      console.log('[Test] ✓ Connected, sending message...');
      send({
        method: 'chat.send',
        params: {
          sessionKey: 'global',
          message: '你好',
          thinking: 'auto',
          deliver: true,
          idempotencyKey: `test-${Date.now()}`,
        },
      });
    } else {
      console.error('[Test] ✗ Connect failed:', msg.error);
      ws.close();
    }
  }

  // Handle all events
  if (msg.type === 'event') {
    if (msg.event === 'chat.delta') {
      const text = msg.payload?.text || msg.payload?.output?.text || '';
      if (text) process.stdout.write(text);
    }

    if (msg.event === 'chat.result') {
      console.log('\n[Test] ✓ Chat completed!');
      console.log('[Test] Result:', JSON.stringify(msg.payload, null, 2));
      ws.close();
    }

    if (msg.event === 'chat.error') {
      console.error('\n[Test] ✗ Chat error:', msg.payload);
      ws.close();
    }

    if (msg.event === 'agent') {
      console.log('[Test] Agent event:', msg.payload);
    }
  }
};

ws.onerror = (error) => {
  console.error('[Test] ✗ Error:', error);
};

ws.onclose = (event) => {
  console.log(`\n[Test] Closed: ${event.code} - ${event.reason}`);
  setTimeout(() => process.exit(0), 100);
};

// Wait longer for response
setTimeout(() => {
  console.log('\n[Test] Still waiting... (keeping connection open)');
}, 30000);

setTimeout(() => {
  console.log('\n[Test] Timeout after 90 seconds, closing...');
  ws.close();
  process.exit(1);
}, 90000);
