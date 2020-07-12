const nodemailer = require('nodemailer');
const config = require('config');

/**
 * Send an email using the gmail account
 * @param {subject} subject - Subject of the email
 * @param {body} body - Body of the email
 * @param {*} to - Receipient of the email
 */
async function sendEmail(subject, body, to) {
  var smtpTransport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.get('gmailAccount'),
      pass: config.get('gmailPass')
    }
  });
  var mailOptions = {
    to: to,
    from: config.get('gmailAccount'),
    subject: subject,
    text: body
  };
  await smtpTransport.sendMail(mailOptions);
}

module.exports.sendEmail = sendEmail;