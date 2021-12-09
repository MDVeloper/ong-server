
const { Router, response } = require('express');

const mercadopago = require("mercadopago");
const { Users, Transactions } = require('../db.js');

const router = Router();

// Almacenamos en memoria la pKey y el accessToken
const mercadoPagoPublicKey = "TEST-d9ce698b-8910-455b-b6c7-3d2f64de1f85";
const mercadoPagoAccessToken = "TEST-6855450579427110-110110-b07a702ed800f3deb656e5e22c0095e9-139834795";

// Verificamos que se hayan seteado
if (!mercadoPagoPublicKey || !mercadoPagoAccessToken) {
	!mercadoPagoPublicKey ? console.log("Error: public key not defined") : console.log("Error: Access Token not defined");
}

// Steamos el Access Token
mercadopago.configure({
	access_token: mercadoPagoAccessToken,
});

router.post("/create_preference", (req, res) => {
	console.log(req.body)
	let preference = {
		items: [
			{
				title: req.body.description,
				unit_price: Number(req.body.price),
				quantity: Number(req.body.quantity),
			}
		],
		back_urls: {
			"success": "http://localhost:3000/",
			"failure": "http://localhost:3000/",
			"pending": "http://localhost:3000/"
		},
		auto_return: "all",
	};
	
	Transactions.create({
		amount: req.body.price,
		date: "01/01/01",
		status: "Approved",
		paymentMethod: "MercadoPago",
		email: req.body.email
	})
	.then((resp) => {
		// res.send("OK")
	})

	mercadopago.preferences.create(preference)
		.then(function (response) {
			res.json({
				id: response.body.id
			});
		}).catch(function (error) {
			console.log(error);
		});
});

router.get('/feedback', function (req, res) {
	res.json({
		Payment: req.query.payment_id,
		Status: req.query.status,
		MerchantOrder: req.query.merchant_order_id
	});
});

module.exports = router;