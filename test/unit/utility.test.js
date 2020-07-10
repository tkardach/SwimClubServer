const {datetimeToNumberTime} = require('../../shared/utility');


describe('utility', () => {
  describe('datetimeToNumberTime', () => {
    it('1: should return the valid number equivalent for the datetimes time', () => {
      const date = new Date();
      date.setHours(8, 30, 0, 0);
      expect(datetimeToNumberTime(date)).toBe(830);
    });

    it('2: should return the valid number equivalent for the datetimes time', () => {
      const date = new Date();
      date.setHours(20, 0, 0, 0);
      expect(datetimeToNumberTime(date)).toBe(2000);
    });

    it('3: should return the valid number equivalent for the datetimes time', () => {
      const date = new Date();
      date.setHours(23, 30, 0, 0);
      expect(datetimeToNumberTime(date)).toBe(2330);
    });
  });
});