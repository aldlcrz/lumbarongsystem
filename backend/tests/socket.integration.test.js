const http = require('http');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const { io: createClient } = require('../../frontend/node_modules/socket.io-client');
const {
  configureSocketServer,
  emitToUser,
  SOCKET_EVENTS,
} = require('../src/utils/socketUtility');

describe('Socket utility integration', () => {
  let httpServer;
  let ioServer;
  let port;

  beforeAll((done) => {
    httpServer = http.createServer();
    ioServer = new Server(httpServer, {
      cors: {
        origin: '*',
      },
    });

    configureSocketServer(ioServer);

    httpServer.listen(0, () => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll((done) => {
    ioServer.close();
    httpServer.close(done);
  });

  it('emits room events to authenticated user sockets', (done) => {
    const token = jwt.sign(
      { id: 'seller-1', role: 'seller' },
      process.env.JWT_SECRET || 'lumbarong_secret_key_2026'
    );

    const client = createClient(`http://127.0.0.1:${port}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: false,
    });

    client.on('connect', () => {
      emitToUser('seller-1', SOCKET_EVENTS.ORDER_UPDATED, {
        orderId: 'order-1',
        status: 'Shipped',
      });
    });

    client.on(SOCKET_EVENTS.ORDER_UPDATED, (payload) => {
      expect(payload).toMatchObject({
        orderId: 'order-1',
        status: 'Shipped',
      });
      client.disconnect();
      done();
    });

    client.on('connect_error', (error) => {
      done(error);
    });
  });
});
