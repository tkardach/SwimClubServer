const {User} = require('../../models/user');
const {Reservation} = require('../../models/reservation');
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcrypt');
const {ValidationStrings} = require('../../shared/strings');
const calendar = require('../../modules/calendar');


let server;
let token;

describe('/api/reservations', () => {
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
    await Reservation.deleteMany({});
    if (server) {
      await server.close();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  /**********************************************
   *  POST /api/reservations
   **********************************************/
  describe('POST /', () => {
    let payload;
    let postEventToCalendarSpy;

    beforeEach(async () => {
      payload = {
        summary: '#52',
        member: '#52',
        date: new Date(),
        start: 800,
        end: 930
      }

      postEventToCalendarSpy = jest.spyOn(calendar, 'postEventToCalendar').mockImplementation((event) => {
        return event;
      });
    });

    afterEach(() => {
      postEventToCalendarSpy.mockRestore();
    });

    const exec = () => {
      return request(server)
        .post('/api/reservations')
        .send(payload);
    } 

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should add reservation to the database on success', async () => {
      const res = await exec();

      const db = await Reservation.find();

      expect(db.length).toBe(1);
      expect(db[0]).toHaveProperty('member', payload.member);
      expect(db[0]).toHaveProperty('start', payload.start);
      expect(db[0]).toHaveProperty('end', payload.end);
    });

    it('should return 400 when summary missing', async ()=> {
      delete payload.summary;
      
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 when date missing', async ()=> {
      delete payload.date;

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 when start missing', async ()=> {
      delete payload.start;

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 when end missing', async ()=> {
      delete payload.end;

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 500 when event does not post', async ()=> {
      postEventToCalendarSpy = jest.spyOn(calendar, 'postEventToCalendar').mockImplementation((event) => {
        return null;
      });

      const res = await exec();
      expect(res.status).toBe(500);
    });

    it('should return 500 when post event throws error', async ()=> {
      postEventToCalendarSpy = jest.spyOn(calendar, 'postEventToCalendar').mockImplementation((event) => {
        throw "Error";
      });

      const res = await exec();
      expect(res.status).toBe(500);
    });
  });
  
});
