const { User } = require('../../models/user');
const request = require('supertest');

let server;

// test user api
describe('/api/users', () => {
  beforeEach(() => {
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

  // should not return anything if there are no users
  // 
  describe('GET /', () => {
    let adminToken;

    beforeEach(async () => {
      // Insert a user into the database
      const user = new User({
        name: 'testAdmin',
        email: 'test@admin.com',
        password: 'P@ssword2!',
        isAdmin: true
      });

      adminToken = user.generateAuthToken();
      await user.save();
    });

    const exec = () => {
      return request(server)
        .get('/api/users')
        .set('x-auth-token', adminToken);
    }

    // If the user is not an admin, it should return 403 error
    it('should return 403 if user is not an admin', async () => {
      adminToken = new User().generateAuthToken();
      const res = await exec();
      expect(res.status).toBe(403);
    });

    // If the database does not have users, it should not crash
    it('should return no users if database empty', async () => {
      await User.deleteMany({});
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });

    // GET should succesfully return users in the database
    it('should return all users', async () => {
      // Insert a user into the database
      await User.collection.insertOne({
        name: 'test2',
        email: 'test2@user.com',
        password: 'P@ssword2!',
        isAdmin: false
      });

      // Await the result, we expect the user to be returned
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some(u => u.name === 'test2')).toBeTruthy();
      expect(res.body.some(u => u.name === 'testAdmin')).toBeTruthy();
    });
  });

  // GET /me returns the current users information
  describe('GET /me', () => {
    let name;
    let email;
    let password;
    let isAdmin;

    // We should create the "me" user before each test case
    beforeEach(async () => {
      name = "Test User";
      email = "test@user.com";
      password = "P@ssword!";
      isAdmin = false;

      user = new User({
        name: name,
        email: email,
        password: password,
        isAdmin: isAdmin
      });

      token = user.generateAuthToken();
      await user.save();
    });

    const exec = () => {
      return request(server)
        .get('/api/users/me')
        .set('x-auth-token', token);
    }

    // If the current user does not have proper access, it should throw 401
    it('should return 401 if user does not have proper access', async () => {
      token = '';
      const res = await exec();

      expect(res.status).toBe(401);
    });


    it('should return 404 if the token does not match user in database', async () => {
      token = new User().generateAuthToken();
      const res = await exec();

      expect(res.status).toBe(404);
    });

    // The successful case should return the current user, minus the password
    it('should return the current user', async () => {
      const res = await exec();

      expect(res.body).toHaveProperty('_id');
      expect(res.body).toHaveProperty('name');
      expect(res.body).toHaveProperty('email');
      expect(res.body).not.toHaveProperty('password');
    });
  });

  describe('POST /', () => {
    let name;
    let email;
    let password;

    // We should create the "me" user before each test case
    beforeEach(async () => {
      name = "Test User";
      email = "test@user.com";
      password = "P@55word!";
    });

    const exec = () => {
      return request(server)
        .post('/api/users')
        .send({ name, email, password });
    }

    it('should return 400 if user name < 2 characters', async () => {
      name = 'b';
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if user name > 50 characters', async () => {
      name = 'b' * 51;
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if user provides invalid email', async () => {
      email = "test"
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if user provides email which already exists', async () => {
      // Insert a user into the database
      await User.collection.insertOne({
        name: 'test2',
        email: email,
        password: 'P@ssword2!'
      });

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 400 if user provides weak password', async () => {
      password = 'weak';
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it('should return 200 if user is succesfully added', async () => {
      const res = await exec();

      const dbUser = User.find({ email: email });

      expect(dbUser).not.toBe(null);
      expect(res.status).toBe(200);
    });

    it('should return the added user in the response', async () => {
      const res = await exec();

      const dbUser = User.find({ email: email });

      expect(res.body).toHaveProperty('email', email);
      expect(res.body).toHaveProperty('name', name);
      expect(res.body).not.toHaveProperty('password');
      expect(res.body.email).toBe(email);
    });
  });
});