// Test script to simulate browser behavior
const ws = new WebSocket('ws://127.0.0.1:18789');
let seq = 0;
let currentRunId = null;
let assistantTexts = [];

function send(data) {
  const frame = {
    type: 'req',
    id: String(++seq),
    ...data
  };
  ws.send(JSON.stringify(frame));
  console.log('[Test] Sent:', data.method || data.event);
}

ws.onopen = () => {
  console.log('[Test] ✓ Connected to Gateway');
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log('[Test] Received:', msg.type, msg.event || msg.id || '', msg.method || '');

  // Handle connect.challenge
  if (msg.type === 'event' && msg.event === 'connect.challenge') {
    console.log('[Test] Challenge received, sending connect...');
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
  if (msg.type === 'res' && msg.id === '1' && msg.ok) {
    console.log('[Test] ✓ Connected');
    console.log('[Test] Sending test message...');

    // Send a message
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
  }

  // Handle chat.send response
  if (msg.type === 'res' && msg.id === '2' && msg.ok) {
    currentRunId = msg.payload.runId;
    console.log('[Test] ✓ Message sent, runId:', currentRunId);
  }

  // Handle agent assistant events (streaming text)
  if (msg.type === 'event' && msg.event === 'agent' && msg.payload.stream === 'assistant') {
    const text = msg.payload.data.text;
    assistantTexts.push(text);
    console.log('[Test] Assistant stream:', text.substring(Math.max(0, text.length - 50)));
  }

  // Handle agent lifecycle end
  if (msg.type === 'event' && msg.event === 'agent' && msg.payload.stream === 'lifecycle' && msg.payload.data.phase === 'end') {
    console.log('[Test] ✓ Agent lifecycle ended');
  }

  // Handle chat final
  if (msg.type === 'event' && msg.event === 'chat' && msg.payload.state === 'final') {
    console.log('[Test] ✓ Chat final state reached');
    console.log('[Test] Final response:', assistantTexts.length > 0 ? assistantTexts[assistantTexts.length - 1] : '(no text)');

    // Close after 2 seconds
    setTimeout(() => {
      console.log('[Test] ✓ Test completed successfully!');
      ws.close();
      process.exit(0);
    }, 2000);
  }

  // Handle errors
  if (msg.type === 'res' && msg.error) {
    console.error('[Test] ✗ Error:', msg.error);
    ws.close();
    process.exit(1);
  }
};

ws.onerror = (error) => {
  console.error('[Test] ✗ WebSocket error:', error);
  process.exit(1);
};

ws.onclose = () => {
  console.log('[Test] Connection closed');
  setTimeout(() => process.exit(0), 100);
};

// Timeout after 30 seconds
setTimeout(() => {
  console.error('[Test] ✗ Timeout after 30 seconds');
  ws.close();
  process.exit(1);
}, 30000);
