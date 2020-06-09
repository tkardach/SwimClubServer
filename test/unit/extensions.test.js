require('../../shared/extensions');

// Test generating user token
describe('Date.compareDate', () => {
  it('should return -1 if date is less than compared', () => {
    let date = new Date();
    let today = new Date(date);

    date.setDate(today.getDate() - 1);

    expect(date.compareDate(today)).toBe(-1);
  });

  it('should return 1 if date is greater than compared', () => {
    let date = new Date();
    let today = new Date(date);

    date.setDate(today.getDate() + 1);

    expect(date.compareDate(today)).toBe(1);
  });

  it('should return 0 if date is equal', () => {
    let date = new Date();
    let today = new Date(date);

    date.setHours(1,2,3,4);
    today.setHours(7,8,9,10);

    expect(date.compareDate(today)).toBe(0);
  });
});