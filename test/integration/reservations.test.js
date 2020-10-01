const {User} = require('../../models/user');
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcrypt');
const {StringConstants} = require('../../shared/strings');
const calendar = require('../../modules/google/calendar');
const sheets = require('../../modules/google/sheets');
const {createUser} = require('../utility');
const {Schedule} = require('../../models/schedule');


let server;
let session;
let userPayload;

describe('/api/reservations', () => {
  beforeEach(async () => {
    server = require('../../server');

    const ret = await createUser(server, true, 'test2@test.com');

    session = ret.session;
    userPayload = ret.payload;
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Schedule.deleteMany({});
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
    let closedDate;
    let postEventToCalendarSpy;
    let getMembersSpy;
    let getPaidMembersDictSpy;
    let getEventsForDateAndTimeSpy;
    let getEventsForDateSpy;

    beforeEach(async () => {
      let date = new Date();
    
      let startDate = new Date(date);
      startDate.setHours(0,0,0,0);
      startDate.setDate(startDate.getDate() - 10);
    
      let schedule = new Schedule({
        day: date.getDay(),
        startDate: startDate,
        timeslots: [
          {
            type: StringConstants.Schedule.Types.Family,
            start: 800,
            end: 930,
            maxOccupants: 4
          },
          {
            type: StringConstants.Schedule.Types.Lap,
            start: 800,
            end: 930,
            maxOccupants: 2
          }
        ]
      });
      await schedule.save()

      closedDate = new Date('10/10/2020');
      closedDate.setYear(date.getFullYear());
      schedule = new Schedule({
        day: closedDate.getDay(),
        startDate: closedDate,
        timeslots: []
      });
      await schedule.save()

      payload = {
        memberEmail: userPayload.email,
        date: date,
        numberSwimmers: 1,
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
            primaryEmail: userPayload.email,
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
            primaryEmail: userPayload.email,
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
            primaryEmail: userPayload.email,
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
            primaryEmail: userPayload.email,
            secondaryEmail: 'test2@test2.com'
          }
        ]
      });

      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 400 if the date is during the closed time', async ()=> {
      payload.date = closedDate;

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 when timeslot start time does not match', async ()=> {
      payload.start = 500

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 when timeslot end time does not match', async ()=> {
      payload.end = 1500

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 when timeslot type does not match', async ()=> {
      payload.type = "Test"

      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('FAMILY: should return 400 when member has already made a reservation on this day, using #certNumber', async ()=> {
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
    
    it('FAMILY: should return 200 when member has already made 2 reservations in a week, but no reservations today', async ()=> {
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

    it('FAMILY: should return 400 when there are 4 or more reservations for a timeslot', async ()=> {
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
    
    it('FAMILY: should return 400 when member has made more than 1 reservation on given day', async ()=> {

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

    it('FAMILY: should return 400 when member has already made 3+ reservations in a week and not same day reservation', async ()=> {
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
    
    it('LAP: should return 200 when member tries to make a second lap reservation for the day', async ()=> {
      let newDate = new Date(payload.date);
      newDate.setDate(newDate.getDate() + 1);
      getEventsForDateAndTimeSpy = jest.spyOn(calendar, 'getEventsForDateAndTime').mockImplementation((start, end, startTime, endTime) => {
        return [
        ];
      })

      getEventsForDateSpy = jest.spyOn(calendar, 'getEventsForDate').mockImplementation((date) => {
        return [
          {
            summary: '2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'lap'
          }];
      })

      payload.type = 'lap';
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('LAP: should return 400 when member has already made 4+ reservations in a week', async ()=> {
      getEventsForDateAndTimeSpy = jest.spyOn(calendar, 'getEventsForDateAndTime').mockImplementation((start, end, startTime, endTime) => {
        return [
          {
            summary: '2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'lap'
          },
          {
            summary: '2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'lap'
          },
          {
            summary: '2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'lap'
          },
          {
            summary: '2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'lap'
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
        return [];
      })

      payload.type = 'lap';
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('LAP: should return 400 when member has already made 2+ reservations in a day ', async ()=> {
      getEventsForDateAndTimeSpy = jest.spyOn(calendar, 'getEventsForDateAndTime').mockImplementation((start, end, startTime, endTime) => {
        return [
          {
            summary: '2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'lap'
          },
          {
            summary: '2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'lap'
          }
        ];
      })

      getEventsForDateSpy = jest.spyOn(calendar, 'getEventsForDate').mockImplementation((date) => {
        return [{
          summary: '2',
          start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
          end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
          htmlLink: '123.com',
          description: 'lap'
        },
        {
          summary: '2',
          start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
          end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
          htmlLink: '123.com',
          description: 'lap'
        }];
      })

      payload.type = 'lap';
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('LAP: should return 400 when there are 2 or more reservations for a given timeslot', async ()=> {
      getEventsForDateAndTimeSpy = jest.spyOn(calendar, 'getEventsForDateAndTime').mockImplementation((start, end, startTime, endTime) => {
        return [
          {
            summary: '2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'lap'
          },
          {
            summary: '2',
            start: {dateTime: new Date(payload.date).setHours(payload.start / 100)},
            end: {dateTime: new Date(payload.date).setHours(payload.end / 100)},
            htmlLink: '123.com',
            description: 'lap'
          }
        ];
      })

      getEventsForDateSpy = jest.spyOn(calendar, 'getEventsForDate').mockImplementation((date) => {
        return [];
      })

      payload.type = 'lap';
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
