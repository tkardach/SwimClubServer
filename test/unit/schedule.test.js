const {
  getNumberFromWeekdayMask, 
  getWeekdayMaskFromNumber, 
  getMask} = require('../../models/schedule');

// Test schedule methods
describe('Schedule', () => {
  describe('getNumberFromWeekdayMask', () => {
    it('should return correct number for weekday mask', () => {
      // Mask to Binary (read backwards)
      // SFThWXXSu = 01111001 = 121
      const mask = getMask(true);
      mask.monday = false;
      mask.tuesday = false;
      expect(getNumberFromWeekdayMask(mask)).toBe(121);
    });
  
    it('should return correct number for empty weekday mask', () => {
      // Mask to Binary (read backwards)
      // XXXXXXX = 0000000 = 0
      const mask = getMask(false);
      expect(getNumberFromWeekdayMask(mask)).toBe(0);
    });

    it('should return correct number for full weekday mask', () => {
      // Mask to Binary (read backwards)
      // SFThWTMSu = 01111111 = 127
      const mask = getMask(true);
      expect(getNumberFromWeekdayMask(mask)).toBe(127);
    });
  });

  describe('getWeekdayMaskFromNumber', () => {
    it('should return correct mask for 121', () => {
      // Mask to Binary (read backwards)
      // SFThWXXSu = 01111001 = 121
      const mask = getWeekdayMaskFromNumber(121);
      expect(mask.monday).toBe(false);
      expect(mask.tuesday).toBe(false);
      expect(mask.wednesday).toBe(true);
      expect(mask.thursday).toBe(true);
      expect(mask.friday).toBe(true);
      expect(mask.saturday).toBe(true);
      expect(mask.sunday).toBe(true);
    });
  
    it('should return correct mask for 0', () => {
      // Mask to Binary (read backwards)
      // XXXXXXX = 0000000 = 0
      const mask = getWeekdayMaskFromNumber(0);
      expect(mask.monday).toBe(false);
      expect(mask.tuesday).toBe(false);
      expect(mask.wednesday).toBe(false);
      expect(mask.thursday).toBe(false);
      expect(mask.friday).toBe(false);
      expect(mask.saturday).toBe(false);
      expect(mask.sunday).toBe(false);
    });

    it('should return correct mask for 127', () => {
      // Mask to Binary (read backwards)
      // SFThWTMSu = 01111111 = 127
      const mask = getWeekdayMaskFromNumber(127);
      expect(mask.monday).toBe(true);
      expect(mask.tuesday).toBe(true);
      expect(mask.wednesday).toBe(true);
      expect(mask.thursday).toBe(true);
      expect(mask.friday).toBe(true);
      expect(mask.saturday).toBe(true);
      expect(mask.sunday).toBe(true);
    });
  });
});