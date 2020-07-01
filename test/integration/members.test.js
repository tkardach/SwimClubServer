const {User, USER_ERRORS} = require('../../models/user');
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

describe('/api/members', () => {
  let getMembersSpy;
  let getAllAccountsDict;

  beforeEach(async () => {
    server = require('../../server');
    
    const ret = await createUser(server, true);

    session = ret.session;
    userPayload = ret.payload;
    
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
          primaryEmail: 'test4@test.com',
          secondaryEmail: 'test4@test.com'
        },
        {
          lastName: 'Test5',
          certificateNumber: '5',
          primaryEmail: 'test5@test.com',
          secondaryEmail: 'test5@test.com'
        },
        {
          lastName: 'Test6',
          certificateNumber: '6',
          primaryEmail: 'test6@test.com',
          secondaryEmail: 'test6@test.com'
        },
        {
          lastName: 'Test7',
          certificateNumber: '7',
          primaryEmail: 'test7@test.com',
          secondaryEmail: 'test7@test.com'
        },
        {
          lastName: 'Test8',
          certificateNumber: '8',
          primaryEmail: 'test8@test.com',
          secondaryEmail: 'test8@test.com'
        }
      ]
    });
    getAllAccountsDict = jest.spyOn(sheets, 'getAllAccountsDict').mockImplementation((lite) => {
      return {
        '1': {
          lastName: 'Test1',
          certificateNumber: '1',
          type: 'PM',
          moneyOwed: false,
          eligibleToReserve: true
        },
        '2': {
          lastName: 'Test2',
          certificateNumber: '2',
          type: 'BD',
          moneyOwed: true,
          eligibleToReserve: false
        },
        '3': {
          lastName: 'Test3',
          certificateNumber: '3',
          type: 'LE',
          moneyOwed: false,
          eligibleToReserve: true
        },
        '4': {
          lastName: 'Test4',
          certificateNumber: '4',
          type: 'BE',
          moneyOwed: false,
          eligibleToReserve: true
        },
        '5': {
          lastName: 'Test5',
          certificateNumber: '5',
          type: 'CO',
          moneyOwed: false,
          eligibleToReserve: true
        },
        '6': {
          lastName: 'Test6',
          certificateNumber: '6',
          type: 'PL',
          moneyOwed: false,
          eligibleToReserve: true
        },
        '7': {
          lastName: 'Test7',
          certificateNumber: '7',
          type: 'SL',
          moneyOwed: false,
          eligibleToReserve: true
        },
        '8': {
          lastName: 'Test8',
          certificateNumber: '8',
          type: 'CL',
          moneyOwed: false,
          eligibleToReserve: true
        },
        '9': {
          lastName: 'Test9',
          certificateNumber: '9',
          type: 'EL',
          moneyOwed: false,
          eligibleToReserve: true
        }
      }
    });
  });

  afterEach(async () => {
    getMembersSpy.mockRestore();
    getAllAccountsDict.mockRestore();
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
  describe('GET /', () => {

    const exec = () => {
      return request(server)
        .get('/api/members')
        .set('Cookie', session);
    } 

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return all members on successful request', async () => {
      const res = await exec();
      expect(res.body.length).toBe(4);
    });


    it('should return 403 if no admin user session is present', async () => {
      session = '';
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it('should return 403 if user is not an admin', async () => {
      await User.deleteMany({});
      const ret = await createUser(server, false);
      session = ret.session;

      const res = await exec();
      expect(res.status).toBe(403);
    });
  });
});