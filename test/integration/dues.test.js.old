const {Member, MemberTypeEnum} = require('../../models/member');
const {Due} = require('../../models/due');
const {User} = require('../../models/user');
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcrypt');

let server;

let token;
let member1;
let member2;
let member3;
let userId;

describe('/api/dues', () => {
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

    // generate members
    let payload = {
      _id: 123,
      certificateNumber: 123,
      lastName: "Member",
      type: MemberTypeEnum[0],
      salutation: "Mr.Member",
      address: "123 Member Dr",
      location: "Club, PO",
      zip: "12345-1234",
      primaryPhone: "555-555-5555",
      primaryEmail: "pool@member.com",
      numberOfMembers: 1
    };

    let member = await new Member(payload).save();

    member1 = member._id;

    payload.lastName = "Member2";
    payload.certificateNumber = payload._id = 1234;

    member = await new Member(payload).save();

    member2 = member._id;

    payload.lastName = "Member3";
    payload.certificateNumber = payload._id = 12345;

    member = await new Member(payload).save();

    member3 = member._id;
  });

  afterEach(async () => {
    await Member.deleteMany({});
    await User.deleteMany({});
    await Due.deleteMany({});
    if (server) {
      await server.close();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  /**********************************************
   *  GET /api/dues
   **********************************************/
  describe('GET /', () => {
    let duesCount;

    beforeEach(async () => {
      // generate dues data
      let payload = {
        member: member1,
        amount: 1234,
        check: "5555",
        membershipYear: new Date().getFullYear()
      };

      let due = new Due(payload);
      await due.save();

      payload.member = member2;
      due = new Due(payload);
      await due.save();

      payload.member = member3;
      due = new Due(payload);
      await due.save();

      duesCount = 3;
    });

    const exec = () => {
      return request(server)
        .get('/api/dues')
        .set('x-auth-token', token);
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return all dues on success', async () => {
      const res = await exec();
      expect(res.body.length).toBe(duesCount);
    });

    it('should return 403 if user is not an admin', async () => {
      let user = await User.findByIdAndUpdate(userId, {
        $set: {
          isAdmin: false
        }
      }, {new:true});

      token = user.generateAuthToken();

      const res = await exec();
      expect(res.status).toBe(403);
    });

    it('should return 401 if no token is provided', async () => {
      token = '';

      const res = await exec();
      expect(res.status).toBe(401);
    });


    it('should return 400 if token is invalid', async () => {
      token = 'TestValues';

      const res = await exec();
      expect(res.status).toBe(400);
    });
  });

  
  /**********************************************
   *  POST /api/dues
   **********************************************/
  describe('POST /', () => {
    let payload;
    let amount;
    let check;

    beforeEach(async () => {
      // generate dues data

      amount = 1234;
      check = '5555'
      payload = {
        member: member1,
        amount: amount,
        check: check,
        membershipYear: new Date().getFullYear()
      };
    });

    const exec = () => {
      return request(server)
        .post('/api/dues')
        .set('x-auth-token', token)
        .send(payload);
    }

    it('should return 200 on success', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return posted due on success', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('amount', amount);
      expect(res.body).toHaveProperty('check', check);
    });

    it('should add due to database on success', async () => {
      const res = await exec();

      const due = await Due.find({member: member1});

      expect(res.status).toBe(200);
      expect(due.length).toBe(1);
      expect(due[0]).toHaveProperty('amount', amount);
      expect(due[0]).toHaveProperty('check', check);
    });
    
    it('should set the date if not supplied', async () => {
      const res = await exec();

      const due = await Due.find({member: member1});

      const date = new Date(due[0].date);
      const day = date.getDate();
      const year = date.getFullYear();
      const month = date.getMonth();
      expect(day).toBe(new Date().getDate());
      expect(year).toBe(new Date().getFullYear());
      expect(month).toBe(new Date().getMonth());
    });

    it('should return 401 if no auth token', async () => {
      token = '';
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it('should return 403 if not an admin', async () => {
      let user = await User.findByIdAndUpdate(userId, {
        $set: {
          isAdmin: false
        }
      }, {new:true});

      token = user.generateAuthToken();

      const res = await exec();
      expect(res.status).toBe(403);
    });
    
    it('should return 400 if token is invalid', async () => {
      token = 'test';
      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 400 if member not present', async () => {
      delete payload.member;
      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 400 if amount not present', async () => {
      delete payload.amount;
      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 400 if check not present', async () => {
      delete payload.check;
      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 400 if membershipYear not present', async () => {
      delete payload.membershipYear;
      const res = await exec();
      expect(res.status).toBe(400);
    });

  });
});
