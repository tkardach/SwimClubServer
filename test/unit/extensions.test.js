require('../../shared/extensions');

// Test extension methods
describe('Extension Methods', () => {
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
  describe('Date.compareTime', () => {
    it('should return -1 if time is before specified time', () => {
      let date = new Date();
      let today = new Date(date);

      date.setHours(date.getHours() - 1);

      expect(date.compareTime(today)).toBe(-1);
    });
    it('should return 1 if time is after specified time', () => {
      let date = new Date();
      let today = new Date(date);

      date.setHours(date.getHours() + 1);

      expect(date.compareTime(today)).toBe(1);
    });
    it('should return 0 if time is exactly the same', () => {
      let date = new Date();
      date.setHours(8,30,0,0);
      let today = new Date(date);

      expect(date.compareTime(today)).toBe(0);
    });
    it('should return -1 if date is less than compared', () => {
      let date = new Date();
      let today = new Date(date);
      date.setDate(date.getDate()-1);

      expect(date.compareTime(today)).toBe(-1);
    });
    it('should return 1 if date is greater than compared', () => {
      let date = new Date();
      let today = new Date(date);
      date.setDate(date.getDate()+1);

      expect(date.compareTime(today)).toBe(1);
    });
  });
  describe('Date.equalsTimeNumber', () => {
    it('should return true if date time value matches time number', () => {
      let date = new Date();
      date.setHours(8, 30, 0, 0);

      expect(date.equalsTimeNumber(830)).toBe(true);
    });
    it('should return false if date time hour value does not match number', () => {
      let date = new Date();
      date.setHours(8, 30, 0, 0);

      expect(date.equalsTimeNumber(930)).toBe(false);
    });
    it('should return false if date time minute value does not match number', () => {
      let date = new Date();
      date.setHours(8, 30, 0, 0);

      expect(date.equalsTimeNumber(845)).toBe(false);
    });
  });
});