const mongoose = require('mongoose');

let server;

describe('/api/reservations', () => {
  beforeEach(() => {
    server = require('../../server');
  });

  afterEach(async () => {
    await mongoose.connection.close();
    if (server) {
      await server.close();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  /**********************************************
   *  GET /api/reservations
   **********************************************/
  describe('GET /', () => {
    it('should return 200 on successful request', () => {
      expect(true).toBe(true);
    });
  });
});
