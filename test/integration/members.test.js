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
          type: 'PM',
          moneyOwed: true,
          eligibleToReserve: false
        },
        '3': {
          lastName: 'Test3',
          certificateNumber: '3',
          type: 'PM',
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
      expect(res.body.length).toBe(3);
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