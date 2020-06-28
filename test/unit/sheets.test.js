const jwt = require('jsonwebtoken');
const config = require('config');
const sheet = require('../sheets.json');
const sheets = require('../../modules/google/sheets');


describe('sheets', () => {
  let allMembersSpy;
  let allAccountsSpy;

  beforeEach(() => {
    allMembersSpy = jest.spyOn(sheets, 'getAllSheetsMembers');
    allAccountsSpy = jest.spyOn(sheets, 'getAllSheetsAccounts');
    allMembersSpy.mockImplementation(sheet.allMembers);
    allAccountsSpy.mockReturnValue(sheet.allAccounts);
  })
  it('should return all ', async () => {
    console.log(sheet.allMembers);
  });
});