const userBroker = require("../../brokers/userBroker");
const sendGrid = require("./sendGridService");
const twilioService = require("./twilioService");
const speakeasyService = require("./speakeasyService");
const encryptionService = require('./encryptionService');
const crypto = require("crypto");

const activateEmail = async (req) => {
    let user = await userBroker.getUserById(req.session.user._id);
    user.emailMFA = true;
    await user.save();
    req.session.user = user;
    req.session.setupMFA.completed = true;
};
const deactivateEmail = async (req) => {
    let user = await userBroker.getUserById(req.session.user._id);
    user.emailMFA = false;
    await user.save();
    req.session.user = user;
};
const activatePhone = async (req) => {
    let user = await userBroker.getUserById(req.session.user._id);
    user.phoneMFA = true;
    await user.save();
    req.session.user = user;
    req.session.setupMFA.completed = true;
};
const deactivatePhone = async (req) => {
    let user = await userBroker.getUserById(req.session.user._id);
    user.phoneMFA = false;
    await user.save();
    req.session.user = user;
};
const activateAuth = async (req) => {
    let user = await userBroker.getUserById(req.session.user._id);
    let encryptedSecret = encryptionService.encrypt(req.session.password, req.session.user.salt, req.session.setupMFA.mfa.base32);
    user.authMFA = true;
    user.secretAuthenticator = encryptedSecret.encryptedData;
    user.secretAuthenticatorIv = encryptedSecret.iv;
    await user.save();
    req.session.user = user;
    req.session.setupMFA.completed = true;
};
const deactivateAuth = async (req) => {
    let user = await userBroker.getUserById(req.session.user._id);
    user.authMFA = false;
    user.secretAuthenticator = '';
    user.secretAuthenticatorIv = '';
    await user.save();
    req.session.user = user;
};

function generateRandomNumber() {
    const min = 100000;
    const max = 999999;
    const randomBytes = crypto.randomBytes(4);
    const randomValue = randomBytes.readUInt32BE(0);
    return min + (randomValue % (max - min + 1));
}

async function setupEmail(req) {
    req.session.setupMFA =  {
        tType: "email",
        mfa: generateRandomNumber(),
        completed: false
    };
    await sendGrid.sendEmail(req.session.user.email, req.session.setupMFA.mfa);
}

async function setupPhone(req) {
    req.session.setupMFA = {
        tType: "phone",
        mfa: generateRandomNumber(),
        completed: false
    };
   await twilioService.sendText(req.session.setupMFA.mfa, req.session.user.phoneNumber);
}

async function setupAuth(req) {
    req.session.setupMFA = {
        tType: "auth",
        mfa: speakeasyService.generateNewSecret(),
        completed: false
    };
    req.session.setupMFA.url = await speakeasyService.generateQRCode(req.session.setupMFA.mfa);
}

async function sendMFA(user, req) {
    req.session.mfaCheck.hasSentCode = true;
    if (user.emailMFA) {
        req.session.codeEmail = generateRandomNumber();
        await sendGrid.sendEmail(user.email, req.session.codeEmail);
    }
    if (user.phoneMFA) {
        req.session.codePhone = generateRandomNumber();
        await twilioService.sendText(req.session.codePhone, user.phoneNumber);
    }
}

function checkMFA(user, req) {
    if (user.emailMFA) {
        if (!checkEmailOrPhoneCode(req.body.emailMFA, req.session.codeEmail)) {
            return false;
        }
    }
    if (user.phoneMFA) {
        if (!checkEmailOrPhoneCode(req.body.phoneMFA, req.session.codePhone)) {
            return false;
        }
    }
    if (user.authMFA) {
        const secret = encryptionService.decrypt(req.session.password, user.salt, user.secretAuthenticator, user.secretAuthenticatorIv);
        if (!checkAuthCode(req.body.authMFA, secret)) {
            return false;
        }
    }
    return true;
}

function checkEmailOrPhoneCode(mfa, answer) {
    return parseInt(mfa) === answer;
}

function checkAuthCode(mfa, secret) {
    return speakeasyService.checkCode(parseInt(mfa), secret);
}

module.exports = {
    activateEmail,
    deactivateEmail,
    activatePhone,
    deactivatePhone,
    activateAuth,
    deactivateAuth,
    setupEmail,
    setupPhone,
    setupAuth,
    checkEmailOrPhoneCode,
    checkAuthCode,
    sendMFA,
    checkMFA
};