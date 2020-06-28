const config = require('config');
const {google} = require('googleapis');
const {logError} = require('../../debug/logging');

// Initialize constants
if (!config.get('serviceKey')) {
    logError('serviceKey not found', 'serviceKey variable could not be found');
}

const PRIVATE_KEY = require(config.get('serviceKey'));


/**
 * Generates a JWT service account client for making calendar API calls
 */
async function generateJwtClient(scopes) {
    let jwtClient = new google.auth.JWT(
        PRIVATE_KEY.client_email,
        null,
        PRIVATE_KEY.private_key,
        scopes
    );

    try {
        await jwtClient.authorize();
        return jwtClient;
    } catch (err) {
        logError(err, 'Failed to authorize jwtClient');
        return null;
    }
}

module.exports.generateJwtClient = generateJwtClient;