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
    await Schedule.deleteMany({});
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

      let schedule = new Schedule({
        weekdays: 127,  // open everyday
        start: start,
        end: end,
        startTime: 800,
        endTime: 2100
      });

      await schedule.save();

      start = new Date(end);
      end = new Date(start);
      end.setMonth((start.getMonth() + 1) % 12);

      schedule = new Schedule({
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
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty('weekdays');
      expect(res.body[0]).toHaveProperty('start');
      expect(res.body[0]).toHaveProperty('end');
      expect(res.body[0]).toHaveProperty('startTime');
      expect(res.body[0]).toHaveProperty('endTime');
    });
  });

  /**********************************************
   *  GET /api/schedules/current
   **********************************************/
  describe('GET /current', () => {
    let payload;

    beforeEach(async () => {
      let start = new Date();
      let end = new Date(start);
      end.setMonth((start.getMonth() + 1) % 12);
      
      payload = {
        weekdays: 121,
        start: start,
        end: end,
        startTime: 830, // special hours for current payload
        endTime: 1800 // special hours for current payload
      };

      let schedule = new Schedule(payload);

      await schedule.save();

      start = new Date(end);
      end = new Date(start);
      end.setMonth((start.getMonth() + 1) % 12);

      schedule = new Schedule({
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
        .get('/api/schedules/current');
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return current schedule on successful request', async () => {
      const res = await exec();
      expect(res.body).toHaveProperty('weekdays', payload.weekdays);
      expect(res.body).toHaveProperty('start');
      expect(res.body).toHaveProperty('end');
      expect(res.body).toHaveProperty('startTime', payload.startTime);
      expect(res.body).toHaveProperty('endTime', payload.endTime);
    });

    it('should return most recently created current schedule if they overlap', async () => {
      // wait a second before adding a newer entry
      setTimeout(async () => {
        let start = new Date(payload.start);
        let end = new Date(start);
        payload = {
          weekdays: 4,
          start: start,
          end: end,
          startTime: 0, 
          endTime: 1500 
        };

        let schedule = new Schedule(payload);
        await schedule.save();
      }, 1000);

      const res = await exec();
      expect(res.body).toHaveProperty('weekdays', payload.weekdays);
      expect(res.body).toHaveProperty('start');
      expect(res.body).toHaveProperty('end');
      expect(res.body).toHaveProperty('startTime', payload.startTime);
      expect(res.body).toHaveProperty('endTime', payload.endTime);
    });
  });
  
  /**********************************************
   *  GET /api/schedules/date
   **********************************************/
  describe('GET /date', () => {
    let payload;
    let targetDate;

    beforeEach(async () => {
      let start = new Date();
      start.setDate(0);
      let end = new Date(start);
      end.setMonth((start.getMonth() + 1) % 12);
      

      let schedule = new Schedule({
        weekdays: 121,
        start: start,
        end: end,
        startTime: 830,
        endTime: 1800 
      });

      await schedule.save();

      start = new Date(end);
      end = new Date(start);
      end.setMonth((start.getMonth() + 1) % 12);

      targetDate = new Date(start);
      targetDate.setDate(targetDate.getDate() + 5);

      payload = {
        weekdays: 127,  // open everyday
        start: start,
        end: end,
        startTime: 800,
        endTime: 2100
      };

      schedule = new Schedule(payload);

      await schedule.save();
    });

    const exec = () => {
      return request(server)
        .get('/api/schedules/date/' + targetDate);
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return target schedule on successful request', async () => {
      const res = await exec();
      expect(res.body).toHaveProperty('weekdays', payload.weekdays);
      expect(res.body).toHaveProperty('start');
      expect(res.body).toHaveProperty('end');
      expect(res.body).toHaveProperty('startTime', payload.startTime);
      expect(res.body).toHaveProperty('endTime', payload.endTime);
    });

    it('should return 404 if no schedule is found for the given date', async () => {
      await Schedule.deleteMany({});

      const res = await exec();
      expect(res.status).toBe(404);
    });

    it('should return 400 if the date format is invalid', async () => {
      targetDate = 'abcd';

      const res = await exec();
      expect(res.status).toBe(400);
    });
  });
});