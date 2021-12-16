const { Router } = require('express');
const { Users, Transactions } = require('../db.js');

const router = Router();

router.post('/', async (req, res, next) => {
    let { email, amount, date, estatus, target} = req.body;
    let intAmount = parseInt(amount)
    try {
        let transaction = await Transactions.create({
            amount: intAmount,
            date: date,
            status: estatus === 'COMPLETED' ? "Approved" : "Reject",
            paymentMethod: "PayPal",
            email: email,
            target: target
        })

        return res.json(transaction)

    } catch (error) {
        next(error)
    }
})

router.get('/', async (req, res) => {

    const { email } = req.body;
    
    // console.log(email)
    if (email) {
        console.log(email)
        let transactionsByEmail = await Transactions.findAll({
            where: {
                email: email
            },
        }
        )
        console.log(transactionsByEmail)
        return res.json(transactionsByEmail)
    }
    else {
        let allTransactions = await Transactions.findAll();
        return res.json(allTransactions)
    }
}
)

module.exports = router;



