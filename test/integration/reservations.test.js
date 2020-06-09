const {Member, MemberTypeEnum} = require('../../models/member');
const {Reservation} = require('../../models/reservation');
const {User} = require('../../models/user');
const mongoose = require('mongoose');
const request = require('supertest');
const bcrypt = require('bcrypt');
const {ValidationStrings} = require('../../shared/strings');

let server;
let token;
let member1;
let member2;
let member3;

let startDate;
let endDate;
let today; 
let resCount;

let vacantResId;
let invacantResId;

async function generateMembers() {
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
}

async function generateReservations() {
  today = new Date();
  startDate = 800;
  endDate = 930;

  let res = new Reservation({
    member: member1,
    date: today,
    startTime: startDate,
    endTime: endDate
  });
  await res.save()

  invacantResId = res._id;

  startDate = 1000;
  endDate = 1130;
    
  res = new Reservation({
    date: today,
    startTime: startDate,
    endTime: endDate
  });
  await res.save()

  vacantResId = res._id;

  startDate = 1200;
  endDate = 1330;
    
  res = new Reservation({
    member: member2,
    date: today,
    startTime: startDate,
    endTime: endDate
  });
  await res.save()

  startDate = 1400;
  endDate = 1530;
    
  res = new Reservation({
    date: today,
    startTime: startDate,
    endTime: endDate
  });
  await res.save()

  resCount = 4;
}


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

    await generateMembers();
    await generateReservations();
  });

  afterEach(async () => {
    await Member.deleteMany({});
    await User.deleteMany({});
    await Reservation.deleteMany({});
    if (server) {
      await server.close();
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  /**********************************************
   *  GET /api/reservations
   **********************************************/
  describe('GET /', () => {

    const exec = () => {
      return request(server)
        .get('/api/reservations');
    }

    const adminExec = () => {
      return request(server)
        .get('/api/reservations')
        .set('x-auth-token', token);
    }

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return reservation on success', async () => {
      const res = await exec();
      expect(res.body.length).toBe(resCount);
    });

    it('should not return member names for non admins', async () => {
      const res = await exec();
      res.body.forEach(reservation => {
        expect(
          reservation.member == ValidationStrings.Reservation.EmptyReservation || 
          reservation.member == ValidationStrings.Reservation.ReservedReservation).toBe(true);
      })
    });

    it('should return 200 on successful admin request', async () => {
      const res = await adminExec();
      expect(res.status).toBe(200);
    });

    it('should return reservation with member names on success for admin', async () => {
      const res = await adminExec();
      res.body.forEach(reservation => {
        expect(
          reservation.member == ValidationStrings.Reservation.EmptyReservation || 
          reservation.member != ValidationStrings.Reservation.ReservedReservation).toBe(true);
      })
    });
  });

  /**********************************************
   *  POST /api/reservations
   **********************************************/
  describe('POST /', () => {
    let payload;

    beforeEach(() => {
      payload = {
        date: new Date(),
        startTime: 800,
        endTime: 930
      }
    });

    const exec = () => {
      return request(server)
        .post('/api/reservations')
        .set('x-auth-token', token)
        .send(payload);
    } 

    it('should return 200 on successful request', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it('should return newly created reservation on success', async () => {
      const res = await exec();
      expect(res.body).toHaveProperty('startTime', payload.startTime);
      expect(res.body).toHaveProperty('endTime', payload.endTime);
    });

    it('should post to database on success', async () => {
      const res = await exec();

      const dbRes = await Reservation.find();

      expect(dbRes[0]).toHaveProperty('startTime', payload.startTime);
      expect(dbRes[0]).toHaveProperty('endTime', payload.endTime);
    });
    
    it('should return 403 if user is not an admin', async () => {
      const user = await User.findByIdAndUpdate(userId, {
        $set: {
          isAdmin: false
        }
      }, {new:true});
      
      token = user.generateAuthToken();

      const res = await exec();
      expect(res.status).toBe(403);
    });
    
    it('should return 401 if token is empty', async () => {
      token = '';

      const res = await exec();
      expect(res.status).toBe(401);
    });
    
    it('should return 400 if token is invalid', async () => {
      token = '123';
      
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it('should return 400 if reservation missing start time', async () => {
      delete payload.startTime;
      
      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 400 if reservation missing end time', async () => {
      delete payload.endTime;

      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 400 if reservation is made for a date previous to today', async () => {
      payload.date = payload.date.setDate(payload.date.getDate() - 1);
      
      const res = await exec();
      expect(res.status).toBe(400);
    });
    
    it('should return 400 if reservation is made on a closed date', async () => {
      const res = await exec();
      expect(res.status).toBe(400);
    });
  });
});
