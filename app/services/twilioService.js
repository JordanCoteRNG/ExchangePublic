const accountSid = ''; // Need Twilio accountSid
const authToken = ''; // Need Twilio authToken
const client = require('twilio')(accountSid, authToken);

async function sendText(mfa, phone) {
    const msg = 'Code MFA: ' + mfa;
    await client.messages
        .create({
            body: msg,
            from: '', // Your Twilio Phone Number.
            to: phone
        });
}

module.exports = {
    sendText,
};