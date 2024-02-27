let speakeasy = require("speakeasy");
let QRCode = require('qrcode');


function generateNewSecret() {
    return speakeasy.generateSecret({name: 'Cryptova'});
}

function checkCode(mfa, secret) {
   return speakeasy.totp.verify({ secret: secret,
        encoding: 'base32',
        token: mfa });
}

async function generateQRCode(secret) {
    return QRCode.toDataURL(secret.otpauth_url);
}

module.exports = {
    generateNewSecret,
    generateQRCode,
    checkCode,
};