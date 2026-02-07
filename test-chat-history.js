// Test chat.history to get response
const ws = new WebSocket('ws://127.0.0.1:18789');
let seq = 0;
let currentRunId = null;

function send(data) {
  const frame = {
    type: 'req',
    id: String(++seq),
    ...data
  };
  ws.send(JSON.stringify(frame));
}

ws.onopen = () => {
  console.log('[Test] Connected');
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log('[Test]', msg.type, msg.event || msg.id || '', msg.method || '');

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

  // Handle connect
  if (msg.type === 'res' && msg.id === '1' && msg.ok) {
    console.log('[Test] Connected, sending message...');
    send({
      method: 'chat.send',
      params: {
        sessionKey: 'global',
        message: '你好，请用中文回答',
        thinking: 'auto',
        deliver: true,
        idempotencyKey: `test-${Date.now()}`,
      },
    });
  }

  // Handle chat.send response
  if (msg.type === 'res' && msg.id === '2' && msg.ok) {
    currentRunId = msg.payload.runId;
    console.log('[Test] Message sent, runId:', currentRunId);
  }

  // Handle agent events - look for chat completion
  if (msg.type === 'event' && msg.event === 'agent') {
    if (msg.payload.stream === 'lifecycle' && msg.payload.data.phase === 'end') {
      console.log('[Test] Agent ended, fetching history...');

      // Wait a bit then fetch history
      setTimeout(() => {
        console.log('[Test] Sending chat.history request...');
        send({
          method: 'chat.history',
          params: {
            sessionKey: 'global',
            limit: 10,
          },
        });
      }, 500);
    }
  }

  // Handle chat.history response
  if (msg.type === 'res' && msg.id && msg.id !== '1' && msg.id !== '2') {
    console.log('[Test] Response received:', msg.method || 'unknown');
    console.log('[Test] Payload:', JSON.stringify(msg.payload).substring(0, 500));

    if (msg.method === 'chat.history' && msg.ok) {
      const history = msg.payload;
      console.log('[Test] ✓ History received, messages:', history.length);

      // Display all messages
      history.forEach((m, i) => {
        console.log(`[Test] Message ${i + 1}:`, m.role, '-', m.content?.substring(0, 50));
      });

      ws.close();
      setTimeout(() => process.exit(0), 100);
    }
  }

  // Handle chat events with final state
  if (msg.type === 'event' && msg.event === 'chat' && msg.payload.state === 'final') {
    console.log('[Test] Chat final state reached');
  }
};

ws.onerror = (error) => {
  console.error('[Test] Error:', error);
  ws.close();
  process.exit(1);
};

ws.onclose = (event) => {
  console.log(`[Test] Closed: ${event.code} - ${event.reason}`);
  setTimeout(() => process.exit(0), 100);
};

setTimeout(() => {
  console.log('[Test] Timeout');
  ws.close();
  process.exit(1);
}, 30000);
