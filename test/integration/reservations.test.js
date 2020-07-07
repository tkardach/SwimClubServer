const {User} = require('../../models/user');
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcrypt');
const {ValidationStrings} = require('../../shared/strings');
const calendar = require('../../modules/google/calendar');
const sheets = require('../../modules/google/sheets');
const {createUser} = require('../utility');


let server;
let session;
let userPayload;

describe('/api/reservations', () => {
  beforeEach(async () => {
    server = require('../../server');

    const ret = await createUser(server, true);

    session = ret.session;
    userPayload = ret.payload;
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
        end: 930,
        type: 'family'
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
            id: '1D',
            lastName: 'Test1',
            certificateNumber: '1',
            primaryEmail: 'test1@test.com',
            secondaryEmail: 'test1@test1.com'
          },
          {
            id: '2D',
            lastName: 'Test2',
            certificateNumber: '2',
            primaryEmail: 'test2@test.com',
            secondaryEmail: 'test2@test2.com'
          },
          {
            id: '3D',
            lastName: 'Test3',
            certificateNumber: '3',
            primaryEmail: 'test3@test.com',
            secondaryEmail: 'test3@test3.com'
          }
        ]
      });
      getPaidMembersDictSpy = jest.spyOn(sheets, 'getAllPaidMembersDict').mockImplementation((lite) => {
        return {
          '2D': {
            id: '2D',
            lastName: 'Test2',
            certificateNumber: '2',
            primaryEmail: 'test2@test.com',
            secondaryEmail: 'test2@test2.com'
          },
          '3D': {
            id: '3D',
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
        .send(payload)
        .set('Cookie', session);
    } 

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
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
            id: '1D',
            lastName: 'Test1',
            certificateNumber: '1',
            primaryEmail: 'test1@test.com',
            secondaryEmail: 'test1@test1.com'
          },
          {
            id: '2D',
            lastName: 'Test2',
            certificateNumber: '2',
            primaryEmail: 'test2@test.com',
            secondaryEmail: 'test2@test2.com'
          },
          {
            id: '3D',
            lastName: 'Test3',
            certificateNumber: '3',
            primaryEmail: 'test3@test.com',
            secondaryEmail: 'test3@test3.com'
          },
          {
            id: '4D',
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
    
    it('should return 400 when member has already made 3+ reservations in a week and not same day reservation', async ()=> {
      getEventsForDateAndTimeSpy = jest.spyOn(calendar, 'getEventsForDateAndTime').mockImplementation((start, end, startTime, endTime) => {
        return [
          {
            summary: '2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
          },
          {
            summary: '2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
          },
          {
            summary: '2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
          },
          {
            summary: '1',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
          },
          {
            summary: '3',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
          }
        ];
      })

      getEventsForDateSpy = jest.spyOn(calendar, 'getEventsForDate').mockImplementation((date) => {
        return [
          {
            summary: '2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
          }
        ];
      })

      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 400 when member has already made a reservation on this day, using #certNumber', async ()=> {
      getEventsForDateAndTimeSpy = jest.spyOn(calendar, 'getEventsForDateAndTime').mockImplementation((start, end, startTime, endTime) => {
        return [
          {
            summary: '1',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
          },
          {
            summary: '3',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
          },
          {
            summary: '4',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
          }
        ];
      })

      getEventsForDateSpy = jest.spyOn(calendar, 'getEventsForDate').mockImplementation((date) => {
        return [
          {
            summary: '#2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
          }
        ];
      })

      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 200 when member has already made 3 reservations in a week, but no reservations today', async ()=> {
      getEventsForDateAndTimeSpy = jest.spyOn(calendar, 'getEventsForDateAndTime').mockImplementation((start, end, startTime, endTime) => {
        return [
          {
            summary: '1',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
          },
          {
            summary: '3',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
          },
          {
            summary: '4',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
          }
        ];
      })

      getEventsForDateSpy = jest.spyOn(calendar, 'getEventsForDate').mockImplementation((date) => {
        return [];
      })

      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return 400 when there are 4 or more reservations for a timeslot', async ()=> {
      getEventsForDateAndTimeSpy = jest.spyOn(calendar, 'getEventsForDateAndTime').mockImplementation((start, end, startTime, endTime) => {
        return [
          {
            summary: '1',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100, payload.end % 100)},
            htmlLink: '123.com',
            description: 'family'
          },
          {
            summary: '3',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100, payload.end % 100)},
            htmlLink: '123.com',
            description: 'family'
          },
          {
            summary: '4',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100, payload.end % 100)},
            htmlLink: '123.com',
            description: 'family'
          },
          {
            summary: '5',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100, payload.end % 100)},
            htmlLink: '123.com',
            description: 'family'
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
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'family'
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
