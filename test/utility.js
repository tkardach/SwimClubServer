const {User} = require('../models/user');
const request = require('supertest');

async function createUser(server, admin, email='') {
  let session;

  const payload = {
    isAdmin: admin,
    email: 'test@tester.com',
    password: 'test'
  };

  if (email !== '') 
    payload.email = email;

  const user = new User(payload);

  await user.save();

  await 
    request(server)
      .post('/api/users/login')
      .send({
        username: payload.email,
        password: payload.password
      })
      .then(res => {
        session = res
          .headers['set-cookie'][0]
          .split(',')
          .map(item => item.split(';')[0])
          .join(';')
      });

  return {
    user: user,
    session: session,
    payload: payload
  };
}

module.exports.createUser = createUser;