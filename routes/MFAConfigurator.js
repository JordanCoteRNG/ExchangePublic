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
    if (!req.session.setupMFA.completed) {
        let btcAmount;
        try {
            btcAmount =  await btcWalletModule.getBalance(req.session.user.btcPublicKey);
        } catch (e) {
            btcAmount = 0;
        }
        const ethAmount = await ethWalletModule.getBalance(req.session.user.ethPublicKey);
        res.render("setupMFA", {username: req.session.user.username, btcAmount: btcAmount, ethAmount: ethAmount, fiatsAmount: req.session.user.fiats, error: req.flash('error'), success: req.flash('success')});
        return;
    }
    res.redirect("/profile");
});

router.post('/', async function(req, res) {
    if (!req.session.user) {
        res.redirect("/logout");
        return;
    }
    if (req.session.setupMFA) {
        if (req.session.setupMFA.tType === "email") {
            if (mfaService.checkEmailOrPhoneCode(req.body.mfa, req.session.setupMFA.mfa)) {
                await mfaService.activateEmail(req);
                req.flash('success', "Authentication avec email activé avec succès.");
                res.redirect("/profile");
                return;
            }
            req.flash('error', "Code invalide, veuillez réesayer.");
            res.redirect("/setupMFA");
            return;
        }
        if (req.session.setupMFA.tType === "phone") {
            if (mfaService.checkEmailOrPhoneCode(req.body.mfa, req.session.setupMFA.mfa)) {
                await mfaService.activatePhone(req);
                req.flash('success', "Authentication avec téléphone activé avec succès.");
                res.redirect("/profile");
                return;
            }
            req.flash('error', "Code invalide, veuillez réesayer.");
            res.redirect("/setupMFA");
            return;
        }
        if (req.session.setupMFA.tType === "auth") {
            if (mfaService.checkAuthCode(req.body.mfa, req.session.setupMFA.mfa.base32)) {
                await mfaService.activateAuth(req);
                req.flash('success', "Authentication avec téléphone activé avec succès.");
                res.redirect("/profile");
                return;
            }
            req.flash('error', "Code invalide, veuillez réesayer.");
            res.redirect("/setupMFA");
            return;
        }
    }
    res.redirect("/profile");
});

router.get('/email', async function(req, res, next) {
    if (!req.session.user) {
        res.redirect("/logout");
        return;
    }
    if (req.session.user.emailMFA) {
        await mfaService.deactivateEmail(req);
        req.flash('success', "Authentication avec email désactivé avec succès.");
        res.redirect("/profile");
    } else {
        await mfaService.setupEmail(req);
        res.redirect("/setupMFA");
    }
});

router.get('/phone', async function(req, res, next) {
    if (!req.session.user) {
        res.redirect("/logout");
        return;
    }
    if (req.session.user.phoneMFA) {
        await mfaService.deactivatePhone(req);
        req.flash('success', "Authentication avec téléphone désactivé avec succès.");
        res.redirect("/profile");
    } else {
        if (req.session.user.phoneNumber === '') {
            req.flash('error', "Il n'y a pas encore de numéro de téléphone associé à ce compte.");
            res.redirect("/profile");
            return;
        }
        mfaService.setupPhone(req);
        res.redirect("/setupMFA");
    }
});

router.get('/auth', async function(req, res, next) {
    if (!req.session.user) {
        res.redirect("/logout");
        return;
    }
    if (req.session.user.authMFA) {
        await mfaService.deactivateAuth(req);
        req.flash('success', "Authentication avec email désactivé avec succès.");
        res.redirect("/profile");
    } else {
        await mfaService.setupAuth(req);
        res.redirect("/secretSetup");
    }
});

module.exports = router;