const USER = require('../models/user');
const crypto = require("crypto");


const getUserById = async (accountId) => {
    return USER.findOne({_id : accountId});
};

const getUserByEmail = async (email) => {
    return USER.findOne({email : email});
};

const createUser = async (email, username, password) => {
    const salt = crypto.randomBytes(16).toString("hex");
    let hPassword = password + salt;
    hPassword = crypto.createHash('sha256').update(hPassword).digest('hex');
    return await USER.create({email : email, username: username, password: hPassword, salt: salt, fiats: 0, phoneNumber: '', transactionLog: [], emailMFA: false, phoneMFA: false, authMFA: false, secretAuthenticator: '', secretAuthenticatorIv: ''});
};

const userExist = async (email) => {
   return USER.exists({email: email});
};

module.exports = {
    getUserById,
    getUserByEmail,
    createUser,
    userExist,
};