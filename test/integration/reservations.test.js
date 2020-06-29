const {User} = require('../../models/user');
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcrypt');
const {ValidationStrings} = require('../../shared/strings');
const calendar = require('../../modules/google/calendar');
const sheets = require('../../modules/google/sheets');


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
    let getMembersSpy;
    let getPaidMembersDictSpy;
    let getEventsForDateAndTimeSpy;
    let getEventsForDateSpy;

    beforeEach(async () => {
      payload = {
        memberEmail: 'test2@test.com',
        date: new Date(),
        start: 800,
        end: 930
      }

      postEventToCalendarSpy = jest.spyOn(calendar, 'postEventToCalendar').mockImplementation((event) => {
        return event;
      });

      getEventsForDateAndTimeSpy = jest.spyOn(calendar, 'getEventsForDateAndTime').mockImplementation((start, end, startTime, endTime) => {
        return [];
      })

      getEventsForDateSpy = jest.spyOn(calendar, 'getEventsForDate').mockImplementation((date) => {
        return [];
      })

      getMembersSpy = jest.spyOn(sheets, 'getAllMembers').mockImplementation((lite) => {
        return [
          {
            lastName: 'Test1',
            certificateNumber: '1',
            primaryEmail: 'test1@test.com',
            secondaryEmail: 'test1@test1.com'
          },
          {
            lastName: 'Test2',
            certificateNumber: '2',
            primaryEmail: 'test2@test.com',
            secondaryEmail: 'test2@test2.com'
          },
          {
            lastName: 'Test3',
            certificateNumber: '3',
            primaryEmail: 'test3@test.com',
            secondaryEmail: 'test3@test3.com'
          }
        ]
      });
      getPaidMembersDictSpy = jest.spyOn(sheets, 'getAllPaidMembersDict').mockImplementation((lite) => {
        return {
          '2': {
            lastName: 'Test2',
            certificateNumber: '2',
            primaryEmail: 'test2@test.com',
            secondaryEmail: 'test2@test2.com'
          },
          '3': {
            lastName: 'Test3',
            certificateNumber: '3',
            primaryEmail: 'test3@test.com',
            secondaryEmail: 'test3@test3.com'
          }
        };
      });
    });

    afterEach(() => {
      postEventToCalendarSpy.mockRestore();
      getPaidMembersDictSpy.mockRestore();
      getMembersSpy.mockRestore();
      getEventsForDateSpy.mockRestore();
      getEventsForDateAndTimeSpy.mockRestore();
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
    
    it('should return 400 when memberEmail missing', async ()=> {
      delete payload.memberEmail;

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
    
    it('should return 400 when member has not paid', async ()=> {
      payload.memberEmail = 'test1@test.com';

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 404 when member email is not found', async ()=> {
      payload.memberEmail = "random@email.com";

      const res = await exec();
      expect(res.status).toBe(404);
    });

    it('should return 400 when multiple member emails found', async ()=> {
      getMembersSpy = jest.spyOn(sheets, 'getAllMembers').mockImplementation((lite) => {
        return [
          {
            lastName: 'Test1',
            certificateNumber: '1',
            primaryEmail: 'test1@test.com',
            secondaryEmail: 'test1@test1.com'
          },
          {
            lastName: 'Test2',
            certificateNumber: '2',
            primaryEmail: 'test2@test.com',
            secondaryEmail: 'test2@test2.com'
          },
          {
            lastName: 'Test3',
            certificateNumber: '3',
            primaryEmail: 'test3@test.com',
            secondaryEmail: 'test3@test3.com'
          },
          {
            lastName: 'Test4',
            certificateNumber: '4',
            primaryEmail: 'test2@test.com',
            secondaryEmail: 'test2@test2.com'
          }
        ]
      });

      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 400 when member has already made 3+ reservations in a week', async ()=> {
      getEventsForDateAndTimeSpy = jest.spyOn(calendar, 'getEventsForDateAndTime').mockImplementation((start, end, startTime, endTime) => {
        return [
          {
            summary: '2',
            start: {dateTime: new Date(payload.date)},
            end: {dateTime: new Date(payload.date)},
            htmlLink: '123.com'
          },
          {
            summary: '2',
            start: {dateTime: new Date(payload.date)},
            end: {dateTime: new Date(payload.date)},
            htmlLink: '123.com'
          },
          {
            summary: '2',
            start: {dateTime: new Date(payload.date)},
            end: {dateTime: new Date(payload.date)},
            htmlLink: '123.com'
          },
          {
            summary: '1',
            start: {dateTime: new Date(payload.date)},
            end: {dateTime: new Date(payload.date)},
            htmlLink: '123.com'
          },
          {
            summary: '3',
            start: {dateTime: new Date(payload.date)},
            end: {dateTime: new Date(payload.date)},
            htmlLink: '123.com'
          }
        ];
      })

      getEventsForDateSpy = jest.spyOn(calendar, 'getEventsForDate').mockImplementation((date) => {
        return [];
      })

      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 400 when member has made more than 1 reservation on given day', async ()=> {

      getEventsForDateSpy = jest.spyOn(calendar, 'getEventsForDate').mockImplementation((date) => {
        return [
          {
            summary: '2',
            start: {dateTime: new Date(payload.date)},
            end: {dateTime: new Date(payload.date)},
            htmlLink: '123.com'
          }
        ];
      })

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
