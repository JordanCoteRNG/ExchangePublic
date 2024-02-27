const sgMail = require("@sendgrid/mail");
const {isEmpty} = require("validator");
const transactionLogger = require("../helpers/transactionLogger");
sgMail.setApiKey(''); // Need API Key


const sendEmail = async (to, mfa) => {
    const msg = {
        to: to,
        from: '', // Your sendgrid email
        template_id: '', // The template id you want to use
        dynamic_template_data: {
            mfa: mfa // The name of the code you can use in your template.
        }
    };

    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
        })
        .catch((error) => {
            console.error(error)
        });
};

module.exports = {
    sendEmail
};