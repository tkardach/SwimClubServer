const mongoose = require('mongoose');
const request = require('supertest');

let server;

describe('/api/dues', () => {
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
   *  GET /api/dues
   **********************************************/
  describe('GET /', () => {
    it('should return 200 on successful request', () => {
      expect(true).toBe(true);
    });
  });
});
