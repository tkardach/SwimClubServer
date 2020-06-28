const {StringConstants} = require('../../shared/strings');
const {google} = require('googleapis');
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

function generateMember(sheetsMember) {
    return {
        lastName: sheetsMember[MEMBER_INDICES.LastName],
        certificateNumber: sheetsMember[MEMBER_INDICES.CertificateNumber],
        type: sheetsMember[MEMBER_INDICES.Type],
        salutation: sheetsMember[MEMBER_INDICES.Salutation],
        address: sheetsMember[MEMBER_INDICES.Address],
        location: sheetsMember[MEMBER_INDICES.Location],
        zip: sheetsMember[MEMBER_INDICES.Zip],
        primaryPhone: sheetsMember[MEMBER_INDICES.PrimaryPhone],
        secondaryPhone: sheetsMember[MEMBER_INDICES.SecondaryPhone],
        primaryEmail: sheetsMember[MEMBER_INDICES.PrimaryEmail],
        secondaryEmail: sheetsMember[MEMBER_INDICES.SecondaryEmail],
        directorName: sheetsMember[MEMBER_INDICES.DirectorName],
        directorEmail: sheetsMember[MEMBER_INDICES.DirectorEmail],
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
            lastName: mem[MEMBER_INDICES.LastName],
            certificateNumber: mem[MEMBER_INDICES.CertificateNumber],
            type: mem[MEMBER_INDICES.Type],
            salutation: mem[MEMBER_INDICES.Salutation],
            address: mem[MEMBER_INDICES.Address],
            location: mem[MEMBER_INDICES.Location],
            zip: mem[MEMBER_INDICES.Zip],
            primaryPhone: mem[MEMBER_INDICES.PrimaryPhone],
            secondaryPhone: mem[MEMBER_INDICES.SecondaryPhone],
            primaryEmail: mem[MEMBER_INDICES.PrimaryEmail],
            secondaryEmail: mem[MEMBER_INDICES.SecondaryEmail],
            directorName: mem[MEMBER_INDICES.DirectorName],
            directorEmail: mem[MEMBER_INDICES.DirectorEmail],
            DirectorPhone: mem[MEMBER_INDICES.DirectorPhone],
            familyMembers: mem[MEMBER_INDICES.FamilyMembers],
            notes: mem[MEMBER_INDICES.Notes],
            numberOfMembers: mem[MEMBER_INDICES.NumberOfMembers]
        }

        members[newMem.certificateNumber] = newMem;
    });

    return members;
}

function convertMembersLiteDict(sheetsMembers) {
    const members = {};

    sheetsMembers.forEach(mem => {
        const newMem = {
            lastName: mem[MEMBER_INDICES.LastName],
            certificateNumber: mem[MEMBER_INDICES.CertificateNumber],
            type: mem[MEMBER_INDICES.Type]
        }

        members[newMem.certificateNumber] = newMem;
    });

    return members;
}

async function getAllSheetsMembers() {
    let jwtClient = await generateJwtClient(SCOPES);
    const sheets = google.sheets({version: 'v4', jwtClient});

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: '1AE2j_p2O5e9K_x1-WLiUsZu-SOq5oi5QYsKD6OGMvCQ',//config.get('memberSheetId'),
            range: 'Members!A2:S',
            key: 'AIzaSyDfSZseRSB9_S37-7_j4QOYphfFBzSBUCk'
        });

        return res.data.values;
    } catch (err) {
        logError(err, `Failed to retrieve members from google sheet\n${err}`);
        return null;
    }
}

async function getAllMembers(lite) {
    const sheetsMembers = await getAllSheetsMembers();
    const accountsDict = await getAllAccountsDict();

    const members = lite ? convertMembersLite(sheetsMembers) : 
                            convertMembers(sheetsMembers);
    return members.filter(member => member.certificateNumber in accountsDict);
}

async function getAllMembersDict(lite) {
    const sheetsMembers = await getAllSheetsMembers();
    const accountsDict = await getAllAccountsDict();

    const membersDict = lite ? convertMembersLiteDict(sheetsMembers) : 
                            convertMembersDict(sheetsMembers);

    return _.pickBy(membersDict, function(member, cert) {
        return cert in accountsDict;
    });
}

async function getAllPaidMembers(lite) {
    const members = await getAllMembers(lite);
    const accountsDict = await getAllAccountsDict();

    return members.filter(member => 
        accountsDict[member.certificateNumber] && 
        accountsDict[member.certificateNumber].eligibleToReserve === true);
}

async function getAllPaidMembersDict(lite) {
    const membersDict = await getAllMembersDict(lite);
    const accountsDict = await getAllAccountsDict();

    return _.pickBy(membersDict, function(member, cert) {
        return accountsDict[cert] && accountsDict[cert].eligibleToReserve === true;
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
        certificateNumber: sheetsAccount[ACCOUNT_INDICES.CertificateNumber],
        lastName: sheetsAccount[ACCOUNT_INDICES.LastName],
        type: sheetsAccount[ACCOUNT_INDICES.Type],
        moneyOwed: !checkEmpty(sheetsAccount[ACCOUNT_INDICES.MoneyOwed]),
        eligibleToReserve: !checkEmpty(sheetsAccount[ACCOUNT_INDICES.EligibleToReserve])
    }
}

function convertAccounts(sheetsAccounts) {
    const accounts = [];
    sheetsAccounts.forEach(acc => {
        const newAccount = generateAccount(acc);
        if (newAccount.lastName !== '' &&
        isNaN(newAccount.lastName) &&
            !isNaN(newAccount.certificateNumber))
            accounts.push(newAccount);
    });

    return accounts;
}

function convertAccountsDict(sheetsAccounts) {
    const accounts = {};
    sheetsAccounts.forEach(acc => {
        const newAccount = generateAccount(acc);
        if (newAccount.lastName !== '' &&
            isNaN(newAccount.lastName) &&
            !isNaN(newAccount.certificateNumber))
            accounts[newAccount.certificateNumber] = newAccount;
    });

    return accounts;
}

async function getAllSheetsAccounts() {
    let jwtClient = await generateJwtClient(SCOPES);
    const sheets = google.sheets({version: 'v4', jwtClient});

    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: '1AE2j_p2O5e9K_x1-WLiUsZu-SOq5oi5QYsKD6OGMvCQ',//config.get('memberSheetId'),
            range: 'Accounts!A4:AR',
            key: 'AIzaSyDfSZseRSB9_S37-7_j4QOYphfFBzSBUCk'
        });
        return res.data.values;
    } catch (err) {
        logError(err, `Failed to retrieve members from google sheet\n${err}`);
        return null;
    }
}

async function getAllAccounts() {
    return convertAccounts(await getAllSheetsAccounts());
}

async function getAllAccountsDict() {
    return convertAccountsDict(await getAllSheetsAccounts());
}

//#endregion


module.exports = {
    getAllSheetsMembers,
    getAllMembers,
    getAllMembersDict,
    getAllPaidMembers,
    getAllPaidMembersDict,
    getAllSheetsAccounts,
    getAllAccounts,
    getAllAccountsDict
};
