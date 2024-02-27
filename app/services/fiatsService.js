const {isEmpty} = require("validator");
const transactionLogger = require("../helpers/transactionLogger");

const addFiats = async (req, res, user) => {

    if (isEmpty(req.body.amount)) {
        req.flash('error', "Le montant ne peut pas être vide!");
        res.redirect("/buy");
        return;
    }
    if (isNaN(req.body.amount)) {
        req.flash('error', "Le montant doit être un chiffre!");
        res.redirect("/buy");
        return;
    }
    if (parseFloat(req.body.amount) < 0) {
        req.flash('error', "Le montant ne peut pas être négatif!");
        res.redirect("/buy");
        return;
    }

    if (isNaN(req.body.cardNumber) || isEmpty(req.body.cardNumber)) {
        req.flash('error', "La carte de crédit est invalide!");
        res.redirect("/buy");
        return;
    }
    if (isNaN(req.body.expMonths) || req.body.expMonths.length !== 2 || req.body.expYears.length !== 2 || isNaN(req.body.expYears)) {
        req.flash('error', "La date d'expiration est invalide!");
        res.redirect("/buy");
        return;
    }
    if (isNaN(req.body.cvc) || isEmpty(req.body.cvc) || req.body.cvc.length !== 3) {
        req.flash('error', "Le code cvc est invalide!");
        res.redirect("/buy");
        return;
    }
    user.fiats = (parseFloat(user.fiats) + parseFloat(req.body.amount)).toFixed(2);
    await user.save();
    req.session.user = user;
    req.flash('success', parseFloat(req.body.amount).toFixed(2) + "$CAD a été ajouter à votre fiats.");
    await transactionLogger.addTransaction(req, "Achat", "Fiats", "Cryptova", "Votre compte", parseFloat(req.body.amount).toFixed(2));
    if (req.session.mfaCheck) {
        delete req.session.mfaCheck;
    }
    res.redirect("/home");
};


module.exports = {
    addFiats,
};