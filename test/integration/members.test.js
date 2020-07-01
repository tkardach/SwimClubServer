const {User, USER_ERRORS} = require('../../models/user');
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcrypt');
const {ValidationStrings} = require('../../shared/strings');
const calendar = require('../../modules/google/calendar');
const sheets = require('../../modules/google/sheets');
const {createUser} = require('../utility');
const sheet = require('../sheets.json');


let server;
let session;
let userPayload;

describe('/api/members', () => {
  let allMembersSpy;
  let allAccountsSpy;

  beforeEach(async () => {
    server = require('../../server');
    
    const ret = await createUser(server, true);

    session = ret.session;
    userPayload = ret.payload;
    
    allMembersSpy = jest.spyOn(sheets, 'getAllSheetsMembers').mockImplementation(async () => {
      return sheet.allMembers;
    });
    allAccountsSpy = jest.spyOn(sheets, 'getAllSheetsAccounts').mockImplementation(async () => {
      return sheet.allAccounts;
    });
  });

  afterEach(async () => {
    allAccountsSpy.mockRestore();
    allMembersSpy.mockRestore();
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
      expect(res.body.length).toBe(sheet.allMembers.length);
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