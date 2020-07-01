const sheet = require('../sheets.json');
const sheets = require('../../modules/google/sheets');

describe('sheets', () => {
  let allMembersSpy;
  let allAccountsSpy;

  beforeEach(() => {
    allMembersSpy = jest.spyOn(sheets, 'getAllSheetsMembers').mockImplementation(async () => {
      return sheet.allMembers;
    });
    allAccountsSpy = jest.spyOn(sheets, 'getAllSheetsAccounts').mockImplementation(async () => {
      return sheet.allAccounts;
    });
  });

  afterEach(() => {
    allMembersSpy.mockRestore();
    allAccountsSpy.mockRestore();
  });
  
  describe('getAllAccounts()', () => {
    it('should return all accounts', async () => {
      const res = await sheets.getAllAccounts();
      expect(res.length).toBe(sheet.allAccounts.length);
    });

    it('should return all accounts in the form of an object', async () => {
      const res = await sheets.getAllAccounts();
      expect(res[0]).toHaveProperty('lastName');
      expect(res[0]).toHaveProperty('certificateNumber');
      expect(res[0]).toHaveProperty('moneyOwed');
      expect(res[0]).toHaveProperty('eligibleToReserve');
    });
  });
  
  describe('getAllAccountsDict()', () => {
    it('should return all accounts', async () => {
      const res = await sheets.getAllAccountsDict();
      expect(Object.keys(res).length).toBe(sheet.allAccounts.length);
    });

    it('should return all accounts in the form of an object', async () => {
      const res = await sheets.getAllAccountsDict();

      let account = sheet.allAccounts[0];
      const test = account[sheets.ACCOUNT_INDICES.CertificateNumber] + account[sheets.ACCOUNT_INDICES.Type];
      expect(res[test]).toHaveProperty('lastName');
      expect(res[test]).toHaveProperty('certificateNumber');
      expect(res[test]).toHaveProperty('moneyOwed');
      expect(res[test]).toHaveProperty('eligibleToReserve');
    });
  });
  
  describe('getAllMembers()', () => {
    it('should return all members', async () => {
      const res = await sheets.getAllMembers();
      expect(res.length).toBe(sheet.allMembers.length);
    });

    it('should return all members in the form of an object, with all member information using false flag', async () => {
      const res = await sheets.getAllMembers(false);

      expect(res[0]).toHaveProperty('lastName');
      expect(res[0]).toHaveProperty('certificateNumber');
      expect(res[0]).toHaveProperty('primaryEmail');
      expect(res[0]).toHaveProperty('primaryPhone');
    });

    it('should return all members in the form of an object, with limited member information using true flag', async () => {
      const res = await sheets.getAllMembers(true);

      expect(res[0]).toHaveProperty('lastName');
      expect(res[0]).toHaveProperty('certificateNumber');
      expect(res[0]).not.toHaveProperty('primaryEmail');
      expect(res[0]).not.toHaveProperty('primaryPhone');
    });
  });
  
  describe('getAllMembersDict()', () => {
    it('should return all members', async () => {
      const res = await sheets.getAllMembersDict();
      expect(Object.keys(res).length).toBe(sheet.allMembers.length);
    });

    it('should return all members in the form of an object, with all member information using false flag', async () => {
      const res = await sheets.getAllMembersDict(false);

      let member = sheet.allMembers[0];
      const test = member[sheets.MEMBER_INDICES.CertificateNumber] + member[sheets.MEMBER_INDICES.Type];
      expect(res[test]).toHaveProperty('lastName');
      expect(res[test]).toHaveProperty('certificateNumber');
      expect(res[test]).toHaveProperty('primaryEmail');
      expect(res[test]).toHaveProperty('primaryPhone');
    });

    it('should return all members in the form of an object, with limited member information using true flag', async () => {
      const res = await sheets.getAllMembersDict(true);

      let member = sheet.allMembers[0];
      const test = member[sheets.MEMBER_INDICES.CertificateNumber] + member[sheets.MEMBER_INDICES.Type];
      expect(res[test]).toHaveProperty('lastName');
      expect(res[test]).toHaveProperty('certificateNumber');
      expect(res[test]).not.toHaveProperty('primaryEmail');
      expect(res[test]).not.toHaveProperty('primaryPhone');
    });
  });
  
  describe('getAllPaidMembers()', () => {
    it('should return all members which have paid dues', async () => {
      const res = await sheets.getAllPaidMembers();
      expect(res.length).toBe(8);
    });
  });
  
  describe('getAllPaidMembersDict()', () => {
    it('should return all members which have paid dues', async () => {
      const res = await sheets.getAllPaidMembersDict();
      expect(Object.keys(res).length).toBe(8);
    });
  });
});