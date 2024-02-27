const mongoose= require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema({
    email: {type: String},
    username: {type: String},
    password: {type: String},
    salt: {type: String},
    fiats: {type: Number},
    btcIv: {type: String},
    btcPrivateKey: {type: String},
    btcPublicKey: {type: String},
    ethIv: {type: String},
    ethPrivateKey: {type: String},
    ethPublicKey: {type: String},
    secretAuthenticator: {type: String},
    secretAuthenticatorIv: {type: String},
    phoneNumber: {type: String},
    transactionLog: [
        {
            tType: {type: String},
            description: {type: String},
            from: {type: String},
            to: {type: String},
            amount: {type: String}
        }
    ],
    emailMFA: {type: Boolean},
    phoneMFA: {type: Boolean},
    authMFA: {type: Boolean}
},
{
    timestamps: true,
});

module.exports = mongoose.model('Users', UserSchema, 'users');