var express = require('express');
const btcWalletModule = require("../app/helpers/btcAccountHelper");
const ethWalletModule = require("../app/helpers/ethAccountHelper");
var router = express.Router();
router.get('/', async function(req, res, next) {
    if (!req.session.user) {
        res.redirect("/logout");
        return;
    }
    if (!req.session.mfaCheck) {
        if (req.session.user.emailMFA || req.session.user.phoneMFA || req.session.user.authMFA) {
            req.session.mfaCheck = {
                redirect: "/transfer",
                hasSentCode: false,
                confirmed: false
            };
            res.redirect("/checkMFA");
            return;
        }
    } else {
        if (!req.session.mfaCheck.redirect !== "/transfer") {
            if (req.session.user.emailMFA || req.session.user.phoneMFA || req.session.user.authMFA) {
                req.session.mfaCheck.redirect = "/transfer";
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
    if (req.session.isBTC) {
        res.render("transfer", {isBTC: true,  username: req.session.user.username, btcAmount: btcAmount, ethAmount: ethAmount, fiatsAmount: req.session.user.fiats, error: req.flash('error'), success: req.flash('success')});
    } else {
        res.render("transfer", {isBTC: false, username: req.session.user.username, btcAmount: btcAmount, ethAmount: ethAmount, fiatsAmount: req.session.user.fiats, error: req.flash('error'), success: req.flash('success')});
    }
});
router.get('/btc', async function(req, res, next) {
    req.session.isBTC = true;
    res.redirect("/transfer");
});
router.get('/eth', async function(req, res, next) {
    req.session.isBTC = false;
    res.redirect("/transfer");
});

router.post('/', async function(req, res) {
    if (!req.session.user) {
        res.redirect("/logout");
        return;
    }
    if (!req.session.mfaCheck) {
        if (req.session.user.emailMFA || req.session.user.phoneMFA || req.session.user.authMFA) {
            req.session.mfaCheck = {
                redirect: "/transfer",
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
    if (req.body.radioCrypto === 'btc') {
        await btcWalletModule.transferBitcoin(req, res);
        return;
    }
    await ethWalletModule.transferETH(req, res);
});

module.exports = router;