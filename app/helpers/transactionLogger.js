const userBroker = require("../../brokers/userBroker");

async function addTransaction(req, tType, description, from, to, amount) {
    let user = await userBroker.getUserById(req.session.user._id);
    const transaction = {
        tType: tType,
        description: description,
        from: from,
        to: to,
        amount: amount
    };
    user.transactionLog.push(transaction);
    await user.save();
    req.session.user = user;
}

module.exports = {
    addTransaction,
};