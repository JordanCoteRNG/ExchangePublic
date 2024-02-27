var express = require('express');
var router = express.Router();
const mfaService = require("../app/services/MFAServices");
const btcWalletModule = require("../app/helpers/btcAccountHelper");
const ethWalletModule = require("../app/helpers/ethAccountHelper");

router.get('/', async function(req, res, next) {
    if (!req.session.user) {
        res.redirect("/logout");
        return;
    }
    if (!req.session.setupMFA) {
        req.flash("error", "Aucun setup de MFA n'a été demandé");
        res.redirect("/profile");
        return;
    }
    if (!req.session.setupMFA.completed && req.session.setupMFA.tType === "auth") {
        let btcAmount;
        try {
            btcAmount =  await btcWalletModule.getBalance(req.session.user.btcPublicKey);
        } catch (e) {
            btcAmount = 0;
        }
        const ethAmount = await ethWalletModule.getBalance(req.session.user.ethPublicKey);
        res.render("secretSetup", {qrUrl: req.session.setupMFA.url, secret: req.session.setupMFA.mfa.base32, username: req.session.user.username, btcAmount: btcAmount, ethAmount: ethAmount, fiatsAmount: req.session.user.fiats, error: req.flash('error'), success: req.flash('success')});
        return;
    }
    res.redirect("/profile");
});

module.exports = router;