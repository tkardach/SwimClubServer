const {Schedule} = require('../../models/schedule')
const {User} = require('../../models/user');
const mongoose = require('mongoose');
const request = require('supertest');
const {createUser} = require('../utility');
const {ValidationStrings, StringConstants} = require('../../shared/strings');
const calendar = require('../../modules/google/calendar')


let server;
let session;
let userPayload;
let yesterday;

async function generateScheduleAroundDate(date) {
  let startDate = new Date(date);
  startDate.setHours(0,0,0,0)

  const payload = {
    day: 0,
    startDate: startDate,
    timeslots: [
      {
        type: StringConstants.Schedule.Types.Family,
        start: 700,
        end: 800,
        maxOccupants: 2
      },
      {
        type: StringConstants.Schedule.Types.Family,
        start: 800,
        end: 900,
        maxOccupants: 2
      },
      {
        type: StringConstants.Schedule.Types.Family,
        start: 900,
        end: 1000,
        maxOccupants: 2
      }
    ]
  }

  let schedule = new Schedule(payload);
  await schedule.save()

  payload.day = 1;
  schedule = new Schedule(payload);
  await schedule.save()

  payload.day = 2;
  schedule = new Schedule(payload);
  await schedule.save()

  payload.day = 3;
  schedule = new Schedule(payload);
  await schedule.save()

  payload.day = 4;
  schedule = new Schedule(payload);
  await schedule.save()
  
  payload.day = 5;
  schedule = new Schedule(payload);
  await schedule.save()
  
  payload.day = 6;
  payload.timeslots.push(
    {
      type: StringConstants.Schedule.Types.Lap,
      start: 1000,
      end: 1100,
      maxOccupants: 1
    },
    {
      type: StringConstants.Schedule.Types.Lessons,
      start: 1200,
      end: 1300,
      maxOccupants: 0
    },
    {
      type: StringConstants.Schedule.Types.Blocked,
      start: 1400,
      end: 1500,
      maxOccupants: 1
    },
    {
      type: StringConstants.Schedule.Types.Lap,
      start: 1600,
      end: 1700,
      maxOccupants: 1
    }
  )

  schedule = new Schedule(payload);
  await schedule.save()
}

describe('/api/schedules', () => {
  beforeEach(async () => {
    server = require('../../server');
    
    const ret = await createUser(server, true);

    session = ret.session;
    userPayload = ret.payload;

    yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    await generateScheduleAroundDate(yesterday)
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
   *  GET /api/schedules
   **********************************************/
  describe('GET /', () => {
    const exec = () => {
      return request(server)
        .get('/api/schedules');
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return all schedules on successful request', async () => {
      const res = await exec();
      expect(res.body.length).toBe(7);
    });

    it('should return empty list if no schedules', async () => {
      await Schedule.deleteMany({});

      const res = await exec();
      expect(res.body.length).toBe(0);
    });
  });

  /**********************************************
   *  GET /api/schedules/date/:date
   **********************************************/
  describe('GET /date/:date', () => {
    let date;

    beforeEach(() => {
      date = new Date();
    })

    const exec = () => {
      return request(server)
        .get('/api/schedules/date/' + date);
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return the schedule for the given date on success', async () => {
      const res = await exec();
      expect(res.body).toHaveProperty('day', date.getDay());
    });

    it('should return empty object if no schedule', async () => {
      await Schedule.deleteMany({});

      const res = await exec();
      expect(res.body).toMatchObject({});
    });

    it('should return 400 if date is not valid', async () => {
      date = "abcdefg"

      const res = await exec();
      expect(res.status).toBe(400);
    });
  });

  /**********************************************
   *  GET /api/schedules/period/:date
   **********************************************/
  describe('GET /period/:date', () => {
    let date;

    beforeEach(async () => {
      date = new Date();
      let oldDate = new Date(date)
      oldDate.setDate(oldDate.getDate() - 10)

      await generateScheduleAroundDate(oldDate)
    })

    const exec = () => {
      return request(server)
        .get('/api/schedules/period/' + date);
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return empty list if no schedules', async () => {
      await Schedule.deleteMany({});

      const res = await exec();
      expect(res.body.length).toBe(0);
    });

    it('should return 400 if date is not valid', async () => {
      date = "abcdefg"

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return only the schedules for the time period', async () => {
      const res = await exec();
      expect(res.body.length).toBe(7);
    });

    it('should return only the schedules for the time period', async () => {
      const res = await exec();

      let retDate = new Date(res.body[0].startDate)
      expect(retDate.getDate()).toBe(yesterday.getDate());
    });
  });

  /**********************************************
   *  GET /api/schedules/timeslots/:date
   **********************************************/
  describe('GET /timeslots/:date', () => {
    let day6;
    let payloadDate;
    let getEventsForDateSpy;

    beforeEach(async () => {
      day6 = new Date()
      day6.setDate(day6.getDate() + (6 - day6.getDay()))
      payloadDate = day6.getTime();
      getEventsForDateSpy = jest.spyOn(calendar, 'getEventsForDate').mockImplementation((date) => {
        return [
          {
            summary: '2',
            start: {dateTime: new Date(day6).setHours(8,0,0,0)},
            end: {dateTime: new Date(day6).setHours(9,0,0,0)},
            htmlLink: '123.com',
            description: StringConstants.Schedule.Types.Family
          },
          {
            summary: '2',
            start: {dateTime: new Date(day6).setHours(8,0,0,0)},
            end: {dateTime: new Date(day6).setHours(9,0,0,0)},
            htmlLink: '123.com',
            description: StringConstants.Schedule.Types.Family
          },
          {
            summary: '2',
            start: {dateTime: new Date(day6).setHours(10,0,0,0)},
            end: {dateTime: new Date(day6).setHours(11,0,0,0)},
            htmlLink: '123.com',
            description: StringConstants.Schedule.Types.Lap
          },
          {
            summary: '2',
            start: {dateTime: new Date(day6).setHours(7,0,0,0)},
            end: {dateTime: new Date(day6).setHours(8,0,0,0)},
            htmlLink: '123.com',
            description: StringConstants.Schedule.Types.Blocked
          }
        ];
      })
    })

    afterEach(() => {
      getEventsForDateSpy.mockRestore();
    })

    const exec = () => {
      return request(server)
        .get('/api/schedules/timeslots/' + payloadDate);
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return all timeslots for day on success', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(7);
    });

    it('should set vacant value appropriately for all returned timeslots on success', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(7);
      // Should have the blocked timeslot
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            type: StringConstants.Schedule.Types.Blocked,
            vacant: false,
            start: 1400,
            end: 1500
          })
        ])
      );
      // Should have a vacant lap timeslot
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            type: StringConstants.Schedule.Types.Lap,
            vacant: true,
            start: 1600,
            end: 1700
          })
        ])
      );
      // Should have invacant lap timeslot due to max reservations
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            type: StringConstants.Schedule.Types.Lap,
            vacant: false,
            start: 1000,
            end: 1100
          })
        ])
      );
      // Should have a vacant family timeslot
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            type: StringConstants.Schedule.Types.Family,
            vacant: true,
            start: 900,
            end: 1000
          })
        ])
      );
      // Should have an invacant family timeslot due to blocking event
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            type: StringConstants.Schedule.Types.Family,
            vacant: false,
            start: 700,
            end: 800
          })
        ])
      );
      // Should have an invacant family timeslot due to max reservations
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ 
            type: StringConstants.Schedule.Types.Family,
            vacant: false,
            start: 800,
            end: 900
          })
        ])
      );
    });

    it('should return empty list if no schedules', async () => {
      await Schedule.deleteMany({});

      const res = await exec();
      expect(res.body.length).toBe(0);
    });

    it('should return 400 if date is not valid', async () => {
      payloadDate = "abcdefg"

      const res = await exec();
      expect(res.status).toBe(400);
    });
  });
  

  /**********************************************
   *  POST /api/schedules
   **********************************************/
  describe('POST /', () => {
    let payload

    beforeEach(async () => {
      await Schedule.deleteMany({})

      let date = new Date()
      date.setDate(date.getDate() - 10)
      date.setHours(0,0,0,0)

      payload = {
        day: 0,
        startDate: date,
        timeslots: [
          {
            type: StringConstants.Schedule.Types.Family,
            start: 700,
            end: 800,
            maxOccupants: 2
          },
          {
            type: StringConstants.Schedule.Types.Family,
            start: 800,
            end: 900,
            maxOccupants: 2
          },
          {
            type: StringConstants.Schedule.Types.Lap,
            start: 900,
            end: 1000,
            maxOccupants: 2
          }
        ]
      }
    })

    const exec = () => {
      return request(server)
        .post('/api/schedules')
        .send(payload)
        .set('Cookie', session);
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('day', 0);
      expect(res.body.timeslots.length).toBe(3);
    });

    it('should return add schedule to database on success', async () => {
      const res = await exec();

      const dbList = await Schedule.find();

      expect(res.status).toBe(200);
      expect(dbList.length).toBe(1);
      expect(dbList[0]).toHaveProperty('day', 0);
      expect(dbList[0].timeslots.length).toBe(3);
    });

    it('should return 400 if day is missing', async () => {
      delete payload.day

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 if startDate is missing', async () => {
      delete payload.startDate

      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 400 if schedule already exists', async () => {
      const sched = new Schedule(payload)
      await sched.save()

      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 403 if user is not an admin', async () => {
      await User.deleteMany({});
      const ret = await createUser(server, false);
      session = ret.session;
      
      const res = await exec();
      expect(res.status).toBe(403);
    });
  });
  

  /**********************************************
   *  PUT /api/schedules/:id
   **********************************************/
  describe('PUT /:id', () => {
    let payload;
    let schedId;

    beforeEach(async () => {
      await Schedule.deleteMany({})
      
      let date = new Date()
      date.setDate(date.getDate() - 10)
      date.setHours(0,0,0,0)

      payload = {
        day: 0,
        startDate: date,
        timeslots: [
          {
            type: StringConstants.Schedule.Types.Family,
            start: 700,
            end: 800,
            maxOccupants: 2
          },
          {
            type: StringConstants.Schedule.Types.Family,
            start: 800,
            end: 900,
            maxOccupants: 2
          },
          {
            type: StringConstants.Schedule.Types.Lap,
            start: 900,
            end: 1000,
            maxOccupants: 2
          }
        ]
      }

      const schedule = new Schedule(payload);
      await schedule.save()

      payload.day = 6

      schedId = schedule._id;
    })

    const exec = () => {
      return request(server)
        .put('/api/schedules/' + schedId)
        .send(payload)
        .set('Cookie', session);
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });
    
    it('should return update the value in the database', async () => {
      const res = await exec();

      const dbList = await Schedule.find()

      expect(res.status).toBe(200);
      expect(dbList[0]).toHaveProperty('day', 6);
    });

    it('should return 404 if object not found', async () => {
      await Schedule.deleteMany({});
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it('should return 403 if user is not an admin', async () => {
      await User.deleteMany({});
      const ret = await createUser(server, false);
      session = ret.session;
      
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it('should return 400 if the object id is invalid', async () => {
      schedId = '1234'

      const res = await exec();
      expect(res.status).toBe(400);
    });
  });
  
  /**********************************************
   *  DELETE /api/schedules/:id
   **********************************************/
  describe('DELETE /:id', () => {
    let schedId;

    beforeEach(async () => {
      await Schedule.deleteMany({})
      
      let date = new Date()
      date.setDate(date.getDate() - 10)
      date.setHours(0,0,0,0)
      
      const schedule = new Schedule({
        day: 0,
        startDate: date,
        timeslots: [
          {
            type: StringConstants.Schedule.Types.Family,
            start: 700,
            end: 800,
            maxOccupants: 2
          },
          {
            type: StringConstants.Schedule.Types.Family,
            start: 800,
            end: 900,
            maxOccupants: 2
          },
          {
            type: StringConstants.Schedule.Types.Lap,
            start: 900,
            end: 1000,
            maxOccupants: 2
          }
        ],
        maxFamilyReservations: 2,
        maxLapReservations: 4
      });

      await schedule.save()

      schedId = schedule._id;
    })

    const exec = () => {
      return request(server)
        .delete('/api/schedules/' + schedId)
        .set('Cookie', session);
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should remove the schedule from the database', async () => {
      const res = await exec();

      const query = await Schedule.find()

      expect(res.status).toBe(200);
      expect(query.length).toBe(0);
    });

    it('should return 404 if object not found', async () => {
      await Schedule.deleteMany({});
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it('should return 403 if user is not an admin', async () => {
      await User.deleteMany({});
      const ret = await createUser(server, false);
      session = ret.session;
      
      const res = await exec();
      expect(res.status).toBe(403);
    });
    
    it('should return 400 if the object id is invalid', async () => {
      schedId = '1234'
      
      const res = await exec();
      expect(res.status).toBe(400);
    });
  });
});