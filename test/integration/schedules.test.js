const {Schedule} = require('../../models/schedule');
const {User} = require('../../models/user');
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcrypt');
const {ValidationStrings} = require('../../shared/strings');

let server;

describe('/api/schedules', () => {
  beforeEach(async () => {
    server = require('../../server');
    
    // Create a test user
    let user = new User({
      name: "Test User",
      email: "test@user.com",
      password: "P@ssword!",
      isAdmin: true
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    userId = user._id;

    token = user.generateAuthToken();
  });

  afterEach(async () => {
    await User.deleteMany({});
    if (server) {
      await server.close();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  /**********************************************
   *  GET /api/schedules
   **********************************************/
  describe('GET /', () => {
    beforeEach(async () => {
      let start = new Date();
      let end = new Date(start);
      end.setMonth((start.getMonth() + 1) % 12);

      const schedule = new Schedule({
        weekdays: 127,  // open everyday
        start: start,
        end: end,
        startTime: 800,
        endTime: 2100
      });

      await schedule.save();
    });

    const exec = () => {
      return request(server)
        .get('/api/schedules');
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return existing schedules on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });
  });

  /**********************************************
   *  GET /api/schedules/current
   **********************************************/
  describe('GET /current', () => {
    const exec = () => {
      return request(server)
        .get('/api/schedules/current');
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return current schedule on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });
  });
});