const request = require('supertest');
const { User } = require('../../models/user');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
let server;
let user;
let token;

describe('auth middleware integration', () => {
  beforeEach(async () => {
    server = require('../../server');

    // Create a test user
    user = new User({
      name: "Test User",
      email: "test@user.com",
      password: "P@ssword!",
      isAdmin: false
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    await user.save();

    token = user.generateAuthToken();
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

  const exec = () => {
    return request(server)
      .get('/api/users/me')
      .set('x-auth-token', token)
  };

  it('should return 401 if no token is provided', async () => {
    token = '';

    const res = await exec();

    expect(res.status).toBe(401);
  });

  it('should return 400 if token is invalid', async () => {
    token = 'a';

    const res = await exec();

    expect(res.status).toBe(400);
  });

  it('should return 200 if token is valid', async () => {
    const res = await exec();

    expect(res.status).toBe(200);
  });
});