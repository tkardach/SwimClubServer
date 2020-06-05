const {Member, MemberTypeEnum} = require('../../models/member');
const {User} = require('../../models/user');
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcrypt');

let server;
let userId;
let token;

describe('/api/members', () => {
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
    await Member.deleteMany({});
    if (server) {
      await server.close();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  })
  
  /**********************************************
   *  GET /api/members
   **********************************************/
  describe('GET /', () => {
    let memberCount;

    beforeEach(async () => {
      let payload = {
        _id: 123,
        lastName: "Member",
        certificateNumber: 123,
        type: MemberTypeEnum[0],
        salutation: "Mr.Member",
        address: "123 Member Dr",
        location: "Club, PO",
        zip: "12345-1234",
        primaryPhone: "555-555-5555",
        primaryEmail: "pool@member.com",
        numberOfMembers: 1
      };

      await new Member(payload).save();

      payload._id = 1234;
      payload.certificateNumber = payload._id;
      payload.lastName = "OtherMember"

      await new Member(payload).save();

      memberCount = 2;
    });    

    const exec = () => {
      return request(server)
        .get('/api/members');
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return empty list if no members', async () => {
      await Member.deleteMany({});

      const res = await exec();

      expect(res.body.length).toBe(0);
    });

    it('should return list of all members', async () => {
      const res = await exec();

      expect(res.body.length).toBe(memberCount);
    });

    it('should return all non-sensitive member information for each member', async () => {
      const res = await exec();
      expect(res.body[0]).toHaveProperty('certificateNumber');
      expect(res.body[0]).toHaveProperty('lastName');
      expect(res.body[0]).toHaveProperty('numberOfMembers');
    });

    it('should NOT return any sensitive member information', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body[0]).not.toHaveProperty('address');
      expect(res.body[0]).not.toHaveProperty('primaryPhone');
      expect(res.body[0]).not.toHaveProperty('secondaryPhone');
      expect(res.body[0]).not.toHaveProperty('primaryEmail');
      expect(res.body[0]).not.toHaveProperty('secondaryEmail');
      expect(res.body[0]).not.toHaveProperty('dirEmail');
      expect(res.body[0]).not.toHaveProperty('dirPhone');
      expect(res.body[0]).not.toHaveProperty('location');
      expect(res.body[0]).not.toHaveProperty('zip');
    });
  });

  /**********************************************
   *  POST /api/members
   **********************************************/
  describe('POST /', () => {
    let payload;

    beforeEach(async () => {
      payload = {
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
    });    

    const exec = () => {
      return request(server)
        .post('/api/members')
        .set('x-auth-token', token)
        .send(payload);
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return created member on successful request', async () => {
      const res = await exec();
      expect(res.body).toHaveProperty('lastName', payload.lastName);
      expect(res.body).toHaveProperty('primaryEmail', payload.primaryEmail);
      expect(res.body).toHaveProperty('primaryPhone', payload.primaryPhone);
      expect(res.body).toHaveProperty('address', payload.address);
      expect(res.body).toHaveProperty('numberOfMembers', payload.numberOfMembers);
      expect(res.body).toHaveProperty('certificateNumber', payload.certificateNumber);
      expect(res.body).toHaveProperty('type', payload.type);
      expect(res.body).toHaveProperty('zip', payload.zip);
    });

    it('should add member to the database', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return 401 if no token is provided', async () => {
      token = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it('should return 403 if the user is not an admin', async () => {
      const user = await User.findByIdAndUpdate(userId, {
        $set: {
          isAdmin: false
        }
      }, {new:true});
      
      token = user.generateAuthToken();
      
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it('should return 400 if certificateNumber is missing', async () => {
      delete payload.certificateNumber;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 if lastName is missing', async () => {
      delete payload.lastName;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 if salutation is missing', async () => {
      delete payload.salutation;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 if address is missing', async () => {
      delete payload.address;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 if location is missing', async () => {
      delete payload.location;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 if zip is missing', async () => {
      delete payload.zip;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 if primaryPhone is missing', async () => {
      delete payload.primaryPhone;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 if primaryEmail is missing', async () => {
      delete payload.primaryEmail;
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 if numberOfMembers is missing', async () => {
      delete payload.numberOfMembers;
      const res = await exec();
      expect(res.status).toBe(400);
    });
  });
});
