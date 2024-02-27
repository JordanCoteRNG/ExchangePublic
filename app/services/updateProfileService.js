const userBroker = require("../../brokers/userBroker");
const encryptionService = require("./encryptionService");
const crypto = require("crypto");
const ReEmail = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/;
const RePassword = /(?=(.*[0-9]))(?=.*[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z]))(?=(.*)).{8,}/;
const ReUsername = /^[a-zA-Z0-9_-]{3,16}$/;
const RePhone =  /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
const updateProfile = async (req, res) => {
    let user = await userBroker.getUserById(req.session.user._id);
    if (req.body.username !== req.session.user.username) {
        if (!ReUsername.exec(req.body.username)) {
            req.flash('error', "Nom d'utilisateur invalide.");
            res.redirect("/profile");
            return;
        }
        user.username = req.body.username;
    }
    if (req.body.email !== req.session.user.email) {
        if (!ReEmail.exec(req.body.email)) {
            req.flash('error', "Le format du email n'est pas valide.");
            res.redirect("/profile");
            return;
        }
        if (await userBroker.userExist(req.body.email.toLowerCase())) {
            req.flash('error', "Un compte existe déjà avec cet email.");
            res.redirect("/profile");
            return;
        }
        user.email = req.body.email;
    }
    if (req.body.phoneNumber !== req.session.user.phoneNumber) {
        if (!RePhone.exec(req.body.phoneNumber)) {
            req.flash('error', "Mauvais format de numéro!");
            res.redirect("/profile");
            return;
        }
        user.phoneNumber = req.body.phoneNumber;
    }
    if (req.body.password === undefined || req.body.password === "") {

    } else {
        if (!RePassword.exec(req.body.password)) {
            req.flash('error', "Le mot de passe doit contenir au moins huit caractères, une minuscule, une majuscule, un chiffre et un caractère spécial");
            res.redirect("/profile");
            return;
        }

        if (req.body.password !== req.body.confirmPassword) {
            req.flash('error', "Les mots de passe ne sont pas pareil.");
            res.redirect("/profile");
            return;
        }
        let ethPrivateKey = encryptionService.decrypt(req.session.password, req.session.user.salt, req.session.user.ethPrivateKey, req.session.user.ethIv);
        let btcPrivateAddress = encryptionService.decrypt(req.session.password, req.session.user.salt, req.session.user.btcPrivateKey, req.session.user.btcIv);
        let secret;
        if (req.session.user.authMFA) {
            secret = encryptionService.decrypt(req.session.password, req.session.user.salt, req.session.user.secretAuthenticator, req.session.user.secretAuthenticatorIv);
        }
        const salt = crypto.randomBytes(16).toString("hex");
        let hPassword = req.body.password + salt;
        hPassword = crypto.createHash('sha256').update(hPassword).digest('hex');
        user.salt = salt;
        user.password = hPassword;
        ethPrivateKey = encryptionService.encrypt(req.body.password, salt, ethPrivateKey);
        btcPrivateAddress = encryptionService.encrypt(req.body.password, salt, btcPrivateAddress);
        if (req.session.user.authMFA) {
            secret = encryptionService.encrypt(req.body.password, salt, secret);
            user.secretAuthenticatorIv = secret.iv;
            user.secretAuthenticator = secret.encryptedData;
        }
        user.btcIv = btcPrivateAddress.iv;
        user.ethIv = ethPrivateKey.iv;
        user.btcPrivateKey = btcPrivateAddress.encryptedData;
        user.ethPrivateKey = ethPrivateKey.encryptedData;
        req.session.password = req.body.password;
    }
    await user.save();
    req.session.user = user;
    req.flash('success', "Votre compte a bien été modifié");
    res.redirect("/profile");
};

module.exports = {
    updateProfile,
};