const WebSocket = require('ws');
const PORT = process.env.PORT || 10000;
const wss = new WebSocket.Server({ port: PORT });
const users = {};

wss.on('connection', connection => {
  connection.on('message', message => {
    let data;
    try { data = JSON.parse(message); } catch (e) { return; }

    switch (data.type) {
      case 'login':
        if (users[data.name]) {
          sendTo(connection, { type: 'login', success: false });
        } else {
          users[data.name] = connection;
          connection.name = data.name;
          sendTo(connection, { type: 'login', success: true });
        }
        break;
      case 'offer':
      case 'answer':
      case 'candidate':
        const conn = users[data.name];
        if (conn) {
          sendTo(conn, { type: data.type, ...data, name: connection.name });
        }
        break;
      case 'leave':
        const conn2 = users[data.name];
        if (conn2) sendTo(conn2, { type: 'leave' });
        break;
    }
  });

  connection.on('close', () => {
    if (connection.name) delete users[connection.name];
  });
});

function sendTo(conn, msg) {
  conn.send(JSON.stringify(msg));
}

console.log(`WebSocket signaling server running on port ${PORT}`);