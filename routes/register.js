var express = require('express');
var router = express.Router();
const btcWalletModule = require('../app/helpers/btcAccountHelper');
const ethWalletModule = require('../app/helpers/ethAccountHelper');
const userBroker = require("../brokers/userBroker");
const ReEmail = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/;
const RePassword = /(?=(.*[0-9]))(?=.*[\!@#$%^&*()\\[\]{}\-_+=~`|:;"'<>,./?])(?=.*[a-z])(?=(.*[A-Z]))(?=(.*)).{8,}/;
const ReUsername = /^[a-zA-Z0-9_-]{3,16}$/;

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('register', { title: 'Enregistrement', error: req.flash('error'), success: req.flash('success') });
});

router.post("/", async function (req, res) {

    if (!RePassword.exec(req.body.password)) {
        req.flash('error', "Le mot de passe doit contenir au moins huit caractères, une minuscule, une majuscule, un chiffre et un caractère spécial");
        res.redirect("/register");
        return;
    }

    if (req.body.password !== req.body.confirmPassword) {
        req.flash('error', "Les mots de passe ne sont pas pareil.");
        res.redirect("/register");
        return;
    }

    if (!ReEmail.exec(req.body.email)) {
        req.flash('error', "Le format du email n'est pas valide.");
        res.redirect("/register");
        return;
    }
    if (await userBroker.userExist(req.body.email.toLowerCase())) {
        req.flash('error', "Un compte existe déjà avec cet email.");
        res.redirect("/register");
        return;
    }

    if (!ReUsername.exec(req.body.username)) {
        req.flash('error', "Nom d'utilisateur invalide.");
        res.redirect("/register");
        return;
    }
    let newUser = await userBroker.createUser(req.body.email.toLowerCase(), req.body.username, req.body.password);
    await btcWalletModule.generateWallet(newUser, req.body.password);
    await ethWalletModule.generateWallet(newUser, req.body.password);
    req.flash('success', "Compte crée avec succès.");
    res.redirect("/login");
});

module.exports = router;