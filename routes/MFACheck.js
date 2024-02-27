var express = require('express');
var router = express.Router();
const mfaService = require("../app/services/MFAServices");
const btcWalletModule = require("../app/helpers/btcAccountHelper");
const ethWalletModule = require("../app/helpers/ethAccountHelper");

router.get('/', async function(req, res, next) {
    if (!req.session.mfaCheck) {
        res.redirect("/logout");
        return;
    }
    if (req.session.mfaCheck.confirmed) {
        res.redirect("/home");
        return;
    }
    if (!req.session.user) {
        if (!req.session.tempUser) {
            res.redirect("/logout");
            return;
        }
        if (!req.session.mfaCheck.hasSentCode) {
            await mfaService.sendMFA(req.session.tempUser, req);
        }
        res.render('MFACheck', {hasHeader: false, emailMFA: req.session.tempUser.emailMFA, phoneMFA: req.session.tempUser.phoneMFA, authMFA: req.session.tempUser.authMFA, error: req.flash('error'), success: req.flash('success') });
        return;
    }
    if (!req.session.mfaCheck.hasSentCode) {
        await mfaService.sendMFA(req.session.user, req);
    }
    let btcAmount;
    try {
        btcAmount =  await btcWalletModule.getBalance(req.session.user.btcPublicKey);
    } catch (e) {
        btcAmount = 0;
    }
    const ethAmount = await ethWalletModule.getBalance(req.session.user.ethPublicKey);
    res.render('MFACheck', {username: req.session.user.username, btcAmount: btcAmount, ethAmount: ethAmount, fiatsAmount: req.session.user.fiats, hasHeader: true, emailMFA: req.session.user.emailMFA, phoneMFA: req.session.user.phoneMFA, authMFA: req.session.user.authMFA, error: req.flash('error'), success: req.flash('success') });
});

router.post('/', async function(req,res) {
    if (!req.session.mfaCheck) {
        res.redirect("/logout");
        return;
    }
    if (req.session.mfaCheck.confirmed) {
        res.redirect("/home");
        return;
    }
    if (!req.session.user) {
        if (!req.session.tempUser) {
            res.redirect("/logout");
            return;
        }
        if (mfaService.checkMFA(req.session.tempUser, req)) {
            req.session.mfaCheck.confirmed = true;
            res.redirect(req.session.mfaCheck.redirect);
            return;
        }

    } else {
        if (mfaService.checkMFA(req.session.user, req)) {
            req.session.mfaCheck.confirmed = true;
            res.redirect(req.session.mfaCheck.redirect);
            return;
        }
    }
    req.flash('error', "Un ou plusieurs code(s) sont invalides.");
    res.redirect("/checkMFA");
});

module.exports = router;