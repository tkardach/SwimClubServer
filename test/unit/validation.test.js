const {validateTime, validatePhoneNumber, validateEmail, getValidDate} = require('../../shared/validation');


describe('validation', () => {
  describe('validateTime', () => {
    it('should allow valid time', () => {
      expect(validateTime(2359)).toBe(true);
    });

    it('should not allow minutes greater than 60', () => {
      expect(validateTime(2399)).toBe(false);
    });
    
    it('should not allow minutes equal to 60', () => {
      expect(validateTime(2360)).toBe(false);
    });
    
    it('should not allow negative numbers', () => {
      expect(validateTime(-2359)).toBe(false);
    });
    
    it('should not allow hours greater than 23', () => {
      expect(validateTime(2459)).toBe(false);
    });

    it('should not allow 2400', () => {
      expect(validateTime(2400)).toBe(false);
    });
    
    it('should allow valid time, single digit hour', () => {
      expect(validateTime(459)).toBe(true);
    });
    
    it('should not allow minutes greater than 60, single digit hours', () => {
      expect(validateTime(499)).toBe(false);
    });
    
    it('should allow 0 time', () => {
      expect(validateTime(0)).toBe(true);
    });
  });
  describe('validateTime', () => {
    it('should allow valid date as number', () => {
      const example = getValidDate(1577865600000);
      expect(example instanceof Date).toBe(true);
      expect(!isNaN(example.getMonth())).toBe(true);
    });
    it('should allow valid date as number string', () => {
      const example = getValidDate('1577865600000');
      expect(example instanceof Date).toBe(true);
      expect(!isNaN(example.getMonth())).toBe(true);
    });
    it('should allow valid date as string', () => {
      const example = getValidDate('1/1/2020');
      expect(example instanceof Date).toBe(true);
      expect(!isNaN(example.getMonth())).toBe(true);
    });
    it('should not allow invalid date as string', () => {
      const example = getValidDate('not a date');
      expect(example).toBe(null);
    });
  });
});