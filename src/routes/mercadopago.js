const { default: axios } = require('axios');
const { Router, response } = require('express');
const mercadopago = require("mercadopago");
const { Transactions } = require('../db.js');


// Almacenamos en memoria la pKey y el accessToken
const mercadoPagoPublicKey = "TEST-d9ce698b-8910-455b-b6c7-3d2f64de1f85";
const mercadoPagoAccessToken = "TEST-6855450579427110-110110-b07a702ed800f3deb656e5e22c0095e9-139834795";

// Verificamos que se hayan seteado
if (!mercadoPagoPublicKey || !mercadoPagoAccessToken) {
  !mercadoPagoPublicKey ? console.log("Error: public key not defined") : console.log("Error: Access Token not defined");
}

// Steamos el Access Token
mercadopago.configurations.setAccessToken(mercadoPagoAccessToken);


const router = Router();

// Registro de articulos
router.post('/process_payment', async (req, res, next) => {
  const { body } = req;
  const { payer } = body;

  // console.log(body)
  const paymentData = { // los q no estan comentados, son los OBLIGATORIOS <---
    transaction_amount: Number(body.transaction_amount),
    token: body.token,
    description: body.description,
    installments: Number(body.installments),
    payment_method_id: body.payment_method_id,
    issuer_id: body.issuer_id,
    payer: {
      email: payer.email,
      identification: {
        type: payer.identification.type,
        number: payer.identification.number
      }
    }
  };
console.log(req.body)
  // Guardar pago
  // console.log(mercadopago.payment.save)
  mercadopago.payment.save(paymentData)
    .then(function (response) { // fulfilled
      // console.log(response)
      Transactions.create({
        status: "Approved",
        paymentMethod: "MercadoPago",
        amount: response.body.transaction_amount,
        date: response.body.date_created,
        email: payer.email
      })
    })
    .then(response => {
      // console.log(response)
    })
    .catch(function (error) { // error
      console.log(error)
      res.status(500).send(error);
    });
});

// Test
router.get('/', (req, res) => {
  res.send("Mercadopago");
})

module.exports = router;