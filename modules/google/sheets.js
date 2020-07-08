const {StringConstants} = require('../../shared/strings');
const {google, networkmanagement_v1beta1} = require('googleapis');
const {generateJwtClient} = require('./general');
const {logError} = require('../../debug/logging');
const config = require('config');
const _ = require('lodash');


// Initialize constants
const SCOPES = [StringConstants.Sheets.Scopes.SheetsR];


function checkEmpty(value) {
    return value === undefined || value === null || value === '';
}

//#region Members Methods

const MEMBER_INDICES = {
    LastName: 0,
    CertificateNumber: 1,
    Type: 2,
    Salutation: 3,
    Address: 4,
    Location: 5,
    Zip: 6,
    PrimaryPhone: 7,
    SecondaryPhone: 8,
    PrimaryEmail: 9,
    SecondaryEmail: 10,
    DirectorName: 11,
    DirectorEmail: 12,
    DirectorPhone: 13,
    FamilyMembers: 14,
    Notes: 15,
    NumberOfMembers: 16,
    OwesMoney: 17
}

const MEMBER_TYPES = {
    PermanentMember: 'PM',
    BoardMember: 'BD',
    ClubOwned: 'CO',
    LeasedMember: 'PL',
    SoldMember: 'SL',
    ClubOwnedLeasing: 'CL',
    ExtendedLease: 'EL',
    BoardExtendedLease: 'BE',
    NonPMLeasingPMMembership: 'LE'
}

const ACCEPTABLE_MEMBER_TYPES = [
    MEMBER_TYPES.BoardMember,
    MEMBER_TYPES.PermanentMember,
    MEMBER_TYPES.BoardExtendedLease,
    MEMBER_TYPES.NonPMLeasingPMMembership
]

function generateMember(sheetsMember) {
    return {
        id: sheetsMember[MEMBER_INDICES.CertificateNumber] + sheetsMember[MEMBER_INDICES.Type],
        lastName: sheetsMember[MEMBER_INDICES.LastName],
        certificateNumber: sheetsMember[MEMBER_INDICES.CertificateNumber],
        type: sheetsMember[MEMBER_INDICES.Type],
        salutation: sheetsMember[MEMBER_INDICES.Salutation],
        address: sheetsMember[MEMBER_INDICES.Address],
        location: sheetsMember[MEMBER_INDICES.Location],
        zip: sheetsMember[MEMBER_INDICES.Zip],
        primaryPhone: sheetsMember[MEMBER_INDICES.PrimaryPhone],
        secondaryPhone: sheetsMember[MEMBER_INDICES.SecondaryPhone],
        primaryEmail: sheetsMember[MEMBER_INDICES.PrimaryEmail] ? sheetsMember[MEMBER_INDICES.PrimaryEmail].toLowerCase().trim() : '',
        secondaryEmail: sheetsMember[MEMBER_INDICES.SecondaryEmail] ? sheetsMember[MEMBER_INDICES.SecondaryEmail].toLowerCase().trim() : '',
        directorName: sheetsMember[MEMBER_INDICES.DirectorName],
        directorEmail: sheetsMember[MEMBER_INDICES.DirectorEmail] ? sheetsMember[MEMBER_INDICES.DirectorEmail].toLowerCase().trim() : '',
        DirectorPhone: sheetsMember[MEMBER_INDICES.DirectorPhone],
        familyMembers: sheetsMember[MEMBER_INDICES.FamilyMembers],
        notes: sheetsMember[MEMBER_INDICES.Notes],
        numberOfMembers: sheetsMember[MEMBER_INDICES.NumberOfMembers]
    }
}

function convertMembers(sheetsMembers) {
    const members = [];

    sheetsMembers.forEach(mem => {
        const newMem = generateMember(mem);
        
        members.push(newMem);
    });

    return members;
}

function convertMembersLite(sheetsMembers) {
    const members = [];

    sheetsMembers.forEach(mem => {
        const newMem = {
            id: mem[MEMBER_INDICES.CertificateNumber] + mem[MEMBER_INDICES.Type],
            lastName: mem[MEMBER_INDICES.LastName],
            certificateNumber: mem[MEMBER_INDICES.CertificateNumber],
            type: mem[MEMBER_INDICES.Type]
        }

        members.push(newMem);
    });

    return members;
}

function convertMembersDict(sheetsMembers) {
    const members = {};

    sheetsMembers.forEach(mem => {
        const newMem = {
            id: mem[MEMBER_INDICES.CertificateNumber] + mem[MEMBER_INDICES.Type],
            lastName: mem[MEMBER_INDICES.LastName],
            certificateNumber: mem[MEMBER_INDICES.CertificateNumber],
            type: mem[MEMBER_INDICES.Type],
            salutation: mem[MEMBER_INDICES.Salutation],
            address: mem[MEMBER_INDICES.Address],
            location: mem[MEMBER_INDICES.Location],
            zip: mem[MEMBER_INDICES.Zip],
            primaryPhone: mem[MEMBER_INDICES.PrimaryPhone],
            secondaryPhone: mem[MEMBER_INDICES.SecondaryPhone],
            primaryEmail: mem[MEMBER_INDICES.PrimaryEmail] ? mem[MEMBER_INDICES.PrimaryEmail].toLowerCase().trim() : '',
            secondaryEmail: mem[MEMBER_INDICES.SecondaryEmail] ? mem[MEMBER_INDICES.SecondaryEmail].toLowerCase().trim() : '',
            directorName: mem[MEMBER_INDICES.DirectorName],
            directorEmail: mem[MEMBER_INDICES.DirectorEmail] ? mem[MEMBER_INDICES.DirectorEmail].toLowerCase().trim() : '',
            DirectorPhone: mem[MEMBER_INDICES.DirectorPhone],
            familyMembers: mem[MEMBER_INDICES.FamilyMembers],
            notes: mem[MEMBER_INDICES.Notes],
            numberOfMembers: mem[MEMBER_INDICES.NumberOfMembers]
        }

        members[newMem.id] = newMem;
    });

    return members;
}

function convertMembersLiteDict(sheetsMembers) {
    const members = {};

    sheetsMembers.forEach(mem => {
        const newMem = {
            id: mem[MEMBER_INDICES.CertificateNumber] + mem[MEMBER_INDICES.Type],
            lastName: mem[MEMBER_INDICES.LastName],
            certificateNumber: mem[MEMBER_INDICES.CertificateNumber],
            type: mem[MEMBER_INDICES.Type]
        }

        members[newMem.id] = newMem;
    });

    return members;
}

async function getAllSheetsMembers() {
    let jwtClient = await generateJwtClient(SCOPES);
    const sheets = google.sheets({version: 'v4', jwtClient});

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: config.get('sheetId'),
            range: 'Members!A2:S',
            key: config.get('sheetAPIKey')
        });

        return res.data.values;
    } catch (err) {
        logError(err, `Failed to retrieve members from google sheet\n${err}`);
        return null;
    }
}

async function getAllMembers(lite) {
    const sheetsMembers = await sheets.getAllSheetsMembers();
    const accountsDict = await sheets.getAllAccountsDict();

    const members = lite ? convertMembersLite(sheetsMembers) : 
                            convertMembers(sheetsMembers);
    return members.filter(member => member.id in accountsDict);
}

async function getAllMembersDict(lite) {
    const sheetsMembers = await sheets.getAllSheetsMembers();
    const accountsDict = await sheets.getAllAccountsDict();

    const membersDict = lite ? convertMembersLiteDict(sheetsMembers) : 
                            convertMembersDict(sheetsMembers);

    return _.pickBy(membersDict, function(member, id) {
        return id in accountsDict;
    });
}

async function getAllPaidMembers(lite) {
    const members = await sheets.getAllMembers(lite);
    const accountsDict = await sheets.getAllAccountsDict();

    return members.filter(member => 
        accountsDict[member.id] && 
        accountsDict[member.id].eligibleToReserve === true);
}

async function getAllPaidMembersDict(lite) {
    const membersDict = await sheets.getAllMembersDict(lite);
    const accountsDict = await sheets.getAllAccountsDict();

    return _.pickBy(membersDict, function(member, id) {
        return accountsDict[id] && accountsDict[id].eligibleToReserve === true;
    });
}


//#endregion

//#region Accounts Methods

const ACCOUNT_INDICES = {
    CertificateNumber: 0,
    LastName: 1,
    Type: 2,
    MoneyOwed: 41,
    EligibleToReserve: 43
}

function generateAccount(sheetsAccount) {
    return {
        id: sheetsAccount[ACCOUNT_INDICES.CertificateNumber] + sheetsAccount[ACCOUNT_INDICES.Type],
        certificateNumber: sheetsAccount[ACCOUNT_INDICES.CertificateNumber],
        lastName: sheetsAccount[ACCOUNT_INDICES.LastName],
        type: sheetsAccount[ACCOUNT_INDICES.Type],
        moneyOwed: !checkEmpty(sheetsAccount[ACCOUNT_INDICES.MoneyOwed]),
        eligibleToReserve: !checkEmpty(sheetsAccount[ACCOUNT_INDICES.EligibleToReserve])
    }
}

function accountAcceptable(account) {
    return  account.lastName !== '' &&
            isNaN(account.lastName) &&
            !isNaN(account.certificateNumber);
}

function convertAccounts(sheetsAccounts) {
    const accounts = [];
    sheetsAccounts.forEach(acc => {
        const newAccount = generateAccount(acc);
        if (accountAcceptable(newAccount))
            accounts.push(newAccount);
    });

    return accounts;
}

function convertAccountsDict(sheetsAccounts) {
    const accounts = {};
    sheetsAccounts.forEach(acc => {
        const newAccount = generateAccount(acc);
        if (accountAcceptable(newAccount))
            accounts[newAccount.id] = newAccount;
    });

    return accounts;
}

async function getAllSheetsAccounts() {
    let jwtClient = await generateJwtClient(SCOPES);
    const sheets = google.sheets({version: 'v4', jwtClient});

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: config.get('sheetId'),
            range: 'Accounts!A4:AR',
            key: config.get('sheetAPIKey')
        });
        return res.data.values;
    } catch (err) {
        logError(err, `Failed to retrieve members from google sheet\n${err}`);
        return null;
    }
}

async function getAllAccounts() {
    return convertAccounts(await sheets.getAllSheetsAccounts());
}

async function getAllAccountsDict() {
    return convertAccountsDict(await sheets.getAllSheetsAccounts());
}

//#endregion

const sheets = {
    getAllSheetsMembers,
    getAllMembers,
    getAllMembersDict,
    getAllPaidMembers,
    getAllPaidMembersDict,
    getAllSheetsAccounts,
    getAllAccounts,
    getAllAccountsDict,
    ACCOUNT_INDICES,
    MEMBER_INDICES
};

module.exports = sheets;
