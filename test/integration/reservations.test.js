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
  startDate = new Date(
    today.getFullYear(), 
    today.getMonth(),
    today.getDate() + 1,
    8, 0, 0, 0);
  endDate = new Date(
    today.getFullYear(), 
    today.getMonth(),
    today.getDate() + 1,
    9, 30, 0, 0);

  let res = new Reservation({
    member: member1,
    startTime: startDate,
    endTime: endDate
  });
  await res.save()

  invacantResId = res._id;

  startDate = new Date(
    today.getFullYear(), 
    today.getMonth(),
    today.getDate() + 1,
    10, 0, 0, 0);
  endDate = new Date(
    today.getFullYear(), 
    today.getMonth(),
    today.getDate() + 1,
    11, 30, 0, 0);
    
  res = new Reservation({
    startTime: startDate,
    endTime: endDate
  });
  await res.save()

  vacantResId = res._id;

  startDate = new Date(
    today.getFullYear(), 
    today.getMonth(),
    today.getDate() + 1,
    12, 0, 0, 0);
  endDate = new Date(
    today.getFullYear(), 
    today.getMonth(),
    today.getDate() + 1,
    13, 30, 0, 0);
    
  res = new Reservation({
    member: member2,
    startTime: startDate,
    endTime: endDate
  });
  await res.save()

  startDate = new Date(
    today.getFullYear(), 
    today.getMonth(),
    today.getDate() + 1,
    14, 0, 0, 0);
  endDate = new Date(
    today.getFullYear(), 
    today.getMonth(),
    today.getDate() + 1,
    15, 30, 0, 0);
    
  res = new Reservation({
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
    let payload;

    beforeEach(async () => {
    });

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
      console.log(res.body);
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

    it('should return reservation with member names on success', async () => {
      const res = await exec();
      expect(res.body.length).toBe(resCount);
    });
  });

  // should return 400 if reservation missing start time
  // should return 400 if reservation missing end time
  // should return 403 if user is not an admin
  // should return 401 if token is empty
  // should return 400 if token is invalid
  // should 
});
