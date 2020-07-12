require('../shared/extensions');
const publicIp = require('public-ip');
const config = require('config');
const schedule = require('node-schedule');
const {sendEmail} = require('./google/email');
const {logInfo} = require('../debug/logging');

const IP_CHANGE_SUBJECT = "***URGENT*** PUBLIC IP ADDRESS CHANGE ***URGENT***";
const IP_CHANGE_BODY = `
This is a scripted response intended to alarm us when our server's public IP Address has changed.

We need to redirect our domain name to point to the new public IP address when this occurs.

The new public IP address: {0}
`;

const IP_POSSIBLY_CHANGE_SUBJECT = "***ATTENTION*** PUBLIC IP ADDRESS UPDATED ***ATTENTION***";
const IP_POSSIBLY_CHANGE_BODY = `
Either the server is starting up, or the IP Address has changed.

Current public IP Address: {0}
`

var publicAddress = "";

async function compareIp() {
  const currentIp = await publicIp.v4();

  // On Startup, send email anyways
  if (publicAddress === "") {
    logInfo(`Current IP Address is ${currentIp}`);
    publicAddress = currentIp;
    await sendEmail(IP_POSSIBLY_CHANGE_SUBJECT, IP_POSSIBLY_CHANGE_BODY.format(publicAddress), config.get('ipEmail'));
    return;
  }

  if (publicAddress !== currentIp) {
    logInfo(`IP Address change from ${publicAddress} to ${currentIp}`);
    publicAddress = currentIp;

    await sendEmail(IP_CHANGE_SUBJECT, IP_CHANGE_BODY.format(publicAddress), config.get('ipEmail'));
  }
}

var job = schedule.scheduleJob('*/5 * * * *', compareIp);

module.exports = job;
