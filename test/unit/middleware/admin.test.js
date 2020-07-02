const {admin, checkAdmin} = require('../../../middleware/admin');
const {createUser} = require('../../utility');

describe('admin middleware', () => {
  let req;

  beforeEach(() => {
    req = {
      user: {
        isAdmin: false,
        email: 'test@email.com',
        password: 'password'
      }
    }
  })

  it('should return 403 status if user is not an admin', () => {
    expect(admin())
  });
});