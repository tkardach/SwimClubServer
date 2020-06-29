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
   *  GET /api/members
   **********************************************/
  describe('POST /', () => {
    let payload;
    let getMembersSpy;
    let getMembersSpyDictSpy;

    beforeEach(async () => {
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
        .get('/api/members');
    } 

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });
  });
});