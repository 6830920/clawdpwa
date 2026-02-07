// 测试 chat.history 返回格式
const ws = new WebSocket('ws://127.0.0.1:18789');
let seq = 0;

function send(data) {
  const frame = {
    type: 'req',
    id: String(++seq),
    ...data
  };
  ws.send(JSON.stringify(frame));
  console.log('[Send]', JSON.stringify(frame, null, 2));
}

ws.onopen = () => {
  console.log('[Test] Connected to Gateway');
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  console.log('\n[Receive]', msg.type, msg.event || msg.id, msg.method || '');

  if (msg.type === 'event' && msg.event === 'connect.challenge') {
    send({
      method: 'connect',
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: { id: 'webchat-ui', version: '1.0.0', platform: 'web', mode: 'webchat' },
        auth: { token: '99a1282cff39ec6008916016302302fe42dd769c6d1fdfc1' }
      }
    });
  }

  // 连接成功后立即请求历史
  if (msg.type === 'res' && msg.id === '1' && msg.ok) {
    console.log('[Test] Connected, fetching history...');
    send({
      method: 'chat.history',
      params: {
        sessionKey: 'global',
        limit: 10
      }
    });
  }

  // 处理所有 res 响应
  if (msg.type === 'res' && msg.id === '2') {
    console.log('\n========== HISTORY RESPONSE ==========');
    console.log('Full message:', JSON.stringify(msg, null, 2));
    console.log('OK:', msg.ok);
    console.log('Method:', msg.method);
    console.log('Payload type:', typeof msg.payload);
    console.log('Is array:', Array.isArray(msg.payload));
    console.log('======================================\n');

    if (msg.ok && msg.payload) {
      if (Array.isArray(msg.payload)) {
        console.log(`✅ Success! Found ${msg.payload.length} messages`);
        msg.payload.forEach((m, i) => {
          console.log(`  Message ${i + 1}:`, m.role, '-', m.content?.substring(0, 50));
        });
      } else {
        console.log('Payload is object, keys:', Object.keys(msg.payload));
        if (msg.payload.messages) {
          console.log(`✅ Found ${msg.payload.messages.length} messages in payload.messages`);
          msg.payload.messages.forEach((m, i) => {
            console.log(`  Message ${i + 1}:`, m.role, '-', m.content?.substring(0, 50));
          });
        }
      }
    } else {
      console.log('❌ Error or empty payload');
    }

    ws.close();
    setTimeout(() => process.exit(0), 500);
  }

  // 错误处理
  if (msg.type === 'res' && msg.error) {
    console.log('❌ Error:', msg.error);
  }
};

ws.onerror = (error) => {
  console.error('[Test] Error:', error);
};

ws.onclose = () => {
  console.log('[Test] Connection closed');
};

setTimeout(() => {
  console.log('[Test] Timeout');
  ws.close();
  process.exit(1);
}, 10000);
