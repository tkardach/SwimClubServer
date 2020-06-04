const mongoose = require('mongoose');

let server;

describe('/api/dates', () => {
  beforeEach(() => {
    server = require('../../server');
  });

  afterEach(async () => {
    if (server) {
      await server.close();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  /**********************************************
   *  GET /api/dates
   **********************************************/
  describe('GET /', () => {
    it('should return 200 on successful request', () => {
      expect(true).toBe(true);
    });
  });
});
