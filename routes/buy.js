var express = require('express');
const btcWalletModule = require("../app/helpers/btcAccountHelper");
const ethWalletModule = require("../app/helpers/ethAccountHelper");
const fiatService = require("../app/services/fiatsService");
const userBroker = require("../brokers/userBroker");
var router = express.Router();
router.get('/', async function(req, res, next) {
    if (!req.session.user) {
        res.redirect("/logout");
        return;
    }
    if (!req.session.mfaCheck) {
        if (req.session.user.emailMFA || req.session.user.phoneMFA || req.session.user.authMFA) {
            req.session.mfaCheck = {
                redirect: "/buy",
                hasSentCode: false,
                confirmed: false
            };
            res.redirect("/checkMFA");
            return;
        }
    } else {
        if (!req.session.mfaCheck.redirect !== "/buy") {
            if (req.session.user.emailMFA || req.session.user.phoneMFA || req.session.user.authMFA) {
                req.session.mfaCheck.redirect = "/buy";
            }
        }
        if (!req.session.mfaCheck.confirmed) {
            if (req.session.user.emailMFA || req.session.user.phoneMFA || req.session.user.authMFA) {
                res.redirect("/checkMFA");
                return;
            }
        }
    }
    let btcAmount;
    try {
        btcAmount =  await btcWalletModule.getBalance(req.session.user.btcPublicKey);
    } catch (e) {
        btcAmount = 0;
    }
    const ethAmount = await ethWalletModule.getBalance(req.session.user.ethPublicKey);
    res.render("buyFiats", {username: req.session.user.username, btcAmount: btcAmount, ethAmount: ethAmount, fiatsAmount: req.session.user.fiats, error: req.flash('error'), success: req.flash('success')});
});

router.post('/', async function(req, res) {
    if (!req.session.user) {
        res.redirect("/logout");
        return;
    }
    if (!req.session.mfaCheck) {
        if (req.session.user.emailMFA || req.session.user.phoneMFA || req.session.user.authMFA) {
            req.session.mfaCheck = {
                redirect: "/buy",
                hasSentCode: false,
                confirmed: false
            };
            res.redirect("/checkMFA");
            return;
        }
    } else {
        if (!req.session.mfaCheck.confirmed) {
            if (req.session.user.emailMFA || req.session.user.phoneMFA || req.session.user.authMFA) {
                res.redirect("/checkMFA");
                return;
            }
        }
    }
    let user = await userBroker.getUserById(req.session.user._id);
    await fiatService.addFiats(req, res, user);
});

module.exports = router;