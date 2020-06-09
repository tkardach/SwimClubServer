const {validateTime, validatePhoneNumber, validateEmail} = require('../../shared/validation');


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
});