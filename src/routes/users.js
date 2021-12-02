const { Router } = require('express');
const { Users, Transactions} = require('../db.js');
const jwt = require('jsonwebtoken');
var session = require('express-session')
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');

const router = Router();

// Funcion verificadora de token.
function verifyTokenWasCreated(req, res, next) {
	const headersAuthorization = req.headers["authorization"]; // Necesitamos enviar el dato en los headers

    console.log("headersAuthorization");
	console.log(headersAuthorization);

	if (typeof headersAuthorization !== 'undefined') {
		const authSplit = headersAuthorization.split(" ");
		const authToken = authSplit[1]; // [authorization, token] 0 1
		req.token = authToken; // seteamos el request con el token en una propiedad "token"
		next()
	} else {
		res.status(403).send("authorization header undefined");
	}
}

/*  Verificamos si el token coincide con el anterior o no.
    Esto nos sirve para usar en todos los endpoints que queramos que si o si requieran que este logeado, que tenga el mismo token. */
function verifyMatch(req, res, next) {
    console.log("verifyMatch");
    jwt.verify(req.token, 'TODO_ENV', (error, data) => {
        if (error) return res.status(403).send("tokens doesn't match");;    
        console.log("next()");
        next();
    })
}

// Main path
router.get('/', (req, res) => {
    res.send("soy users");
})

// Registro de usuarios
router.post("/register", async (req, res, next) => {
    try {
        const { name, lastName, password, email, country, state, birthday, privilege, volunteer, course } = req.body;

        let usersInstance = await Users.create({
            name: name,
            lastName: lastName,
            password: password,
            email: email,
            country: country,
            state: state,
            birthday: birthday,
            privilege: privilege,
            volunteer: volunteer,
            course: course,
        });
        
        res.status(200).json(usersInstance);
    }
    catch (error) {
        next(error);
    }

})

// Get /detail
router.get("/detail", verifyTokenWasCreated, verifyMatch, async (req, res, next) => {
    const { id } = req.query;
    let integerId = parseInt(id);

    if (typeof integerId === "number" && !isNaN(integerId)){
        try{
            let user = await Users.findOne({
                where: {
                    id: integerId,
                },
                include: Transactions
            });
        
            res.status(200).json(user);
        }
        catch(error){
            next(error);
        }
    }
    else{
        res.status(400).send("Id invalido");
    }

})

// Get /all (debugging)
router.get('/all', async (req, res) => {

    let allUsers = await Users.findAll({
        attributes: ["id", "name", "lastName", "password", "email", "country", "state", "birthday", "privilege", "volunteer", "course", "createdAt"],
    });
    
    //Promise.all(allUsers).then(resp => res.status(200).json(allUsers));
    return res.status(200).json(allUsers);
})

// Ruta para login
router.post('/login', async (req, res, next) => {
    const {email, password} = req.body;

    if(email && password){
        try {
            let logUser = await Users.findOne({
                where: {
                    email: email,
                    password: password
                }
            });
    
            if(logUser){
                //let validUser = true;
                //return res.json(validUser)
                const token = jwt.sign({logUser}, 'TODO_ENV');
                console.log(token);
                return res.json({token}); // { "token": "eyJhbGciOiJ...........etc etc" }
            }
            else {
                //let invalidUser = false;
                //return res.json(invalidUser)
                const token = undefined;
                console.log(token);
                return res.json({token}) // undefined {}
            }
        } catch (error) {
            next(error)
        }
    }
    else {
        return res.send("User not found")
    }
});

// Ruta logout
router.get("/logout", async (req, res, next) => {
    req.session.destroy()
});

module.exports = router;

