var express = require('express');
var router = express.Router();
const userBroker = require("../brokers/userBroker");
const ReEmail = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})*$/;
let crypto = require('crypto');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('login', {  title: 'Identification', error: req.flash('error'), success: req.flash('success') });
});

router.post("/", async function (req, res) {
    if (!ReEmail.exec(req.body.email))
    {
        req.flash('error', "Le format du email n'est pas valide.");
        res.redirect("/login");
        return;
    }

    if (await userBroker.userExist(req.body.email))
    {
        const user = await userBroker.getUserByEmail(req.body.email);
        let hPassword = req.body.password + user.get("salt");
        hPassword = crypto.createHash('sha256').update(hPassword).digest('hex');
        if (hPassword === user.get("password"))
        {
            if (user.emailMFA || user.phoneMFA || user.authMFA) {
                req.session.tempUser = user;
                req.session.password = req.body.password;
                req.session.mfaCheck = {
                    redirect: "/login/confirm",
                    hasSentCode: false,
                    confirmed: false
                };
                res.redirect("/checkMFA");
                return;
            }
            req.session.user = user;
            req.session.password = req.body.password;
            res.redirect("/home");
            return;
        }
    }
    req.flash('error', "Email ou mot de passe invalide.");
    res.redirect("/login");
});

router.get('/confirm', function(req, res, next) {
    if (req.session.mfaCheck.confirmed) {
        req.session.user = req.session.tempUser;
        delete req.session.tempUser;
        delete req.session.mfaCheck;
        res.redirect("/home");
        return;
    }
});

module.exports = router;