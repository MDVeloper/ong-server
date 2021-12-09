const { Router } = require('express');
const { Users, Transactions } = require('../db.js');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const localStrategy = require("passport-local").Strategy;
const bcrypt = require('bcrypt');
var session = require('express-session');

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
        console.log("Verify OK");
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

        hash = await bcrypt.hash(password, 10);

        console.log(req.body)

        let usersInstance = await Users.create({
            name: name,
            lastName: lastName,
            password: hash,
            email: email,
            country: country,
            state: state,
            birthday: birthday,
            privilege: privilege,
            volunteer: volunteer,
            course: course,
        });
        
        let tokenid = await Users.findOne({
            where: {
                email: usersInstance.email
            }
        })
        
        const { id } = tokenid
        const token = jwt.sign({"id" : id}, 'TODO_ENV');
        console.log(token);
        return res.status(200).json({ token });
        // return res.status(200).json(usersInstance);
    }
    catch (error) {
        next(error);
    }

})

// Get /detail
router.get("/detail", async (req, res, next) => {
    const { id } = req.query;
    let integerId = parseInt(id);

    if (typeof integerId === "number" && !isNaN(integerId)) {
        try {
            let user = await Users.findOne({
                where: {
                    id: integerId,
                },
                attributes: ["id", "name", "lastName", "email", "country", "state", "birthday", "privilege", "volunteer", "course", "createdAt"],
            });

            let thisUserDonations = await Transactions.findAll({
                where: {
                    email: user.dataValues.email
                },
            }
            );

            user.dataValues.donations = thisUserDonations
            res.status(200).json(user);
        }
        catch (error) {
            next(error);
        }
    }
    else {
        res.status(400).send("Id invalido");
    }

})


// Get /all (debugging)
router.get('/all', async (req, res) => {
    const { email } = req.body;
    let allUsers = await Users.findAll({
        attributes: ["id", "name", "lastName", "password", "email", "country", "state", "birthday", "privilege", "volunteer", "course", "createdAt"],
    });

    for (let i = 0; i < allUsers.length; i++) {
        let thisDonations = await await Transactions.findAll({
            where: {
                email: allUsers[i].dataValues.email
            },
        });
        allUsers[i].dataValues.donations = thisDonations
    }

    return res.status(200).json(allUsers);
})

// Definimos el login de passport modificando los campos usernameField por "email" y passwordField a "password" por si acaso.
passport.use(new localStrategy({ usernameField: "email", passwordField: "password" }, async (email, password, done) => {
    console.log("localStrategy");
    try {
        // Buscamos al usuario por email
        const userInstance = await Users.findOne({
            where: {
                email: email,
            }
        });

        // Verificamos si encontro un usuario
        if (!userInstance) {
            console.log("no userInstance");
            return done(null, false, { message: "Usuario no encontrado" });
        }

        // Validamos la contraseña
        const validate = (async (password, userHashedPassword) => {
            const verify = await bcrypt.compare(password, userHashedPassword)
            return verify;
        })(password, userInstance.dataValues.password);

        console.log(validate);

        if (!validate) {
            console.log("no paso el validate");
            return done(null, false, { message: "Contraseña Incorrecta" });
        }

        return done(null, userInstance, { message: "Login OK" });
    }
    catch (error) {
        done(error);
    }
}));

// Configuración de la persistencia de la sesión autenticada

// Para recuperar los datos de la sesión autenticada Passport necesita dos métodos para
// serializar y deserializar al usuario de la sesión. Para ello la forma más práctica de hacerlo
// es serializando el ID del usuario para luego al deserealizar a partir de dicho ID obtener
// los demás datos de ese usuario. Esto permite que la información almacenada en la sesión sea
// lo más simple y pequeña posible
passport.serializeUser((user, done) => {
    console.log("serializing...");
    console.log(user);
    done(null, user.id);
});

// Al deserealizar la información del usuario va a quedar almacenada en req.user
passport.deserializeUser(async (id, done) => {
    console.log("deserializing...");

    try {
        let foundedUser = await Users.findByPk(id);

        if (foundedUser) {
            return done(null, foundedUser)
        }
        return done(null, false, { message: "Usuario no encontrado para deserealizar" });
    }
    catch (error) {
        console.log("err");
        return done(null, false, { message: "Algo fallo durante la deserializacion" });
    }
});

function isAuthenticated(req, res, next) {
    console.log("isAuthenticated");
    if (req.isAuthenticated()) {
        console.log(req);
        next();
    } else {
        res.redirect("/login");
    }
}

// Ruta para login
router.post('/login', passport.authenticate('local', { failureRedirect: '/loginFail' }), async (req, res, next) => {
    console.log("/login!");

    const { email } = req.body;

    try {
        let foundUser = await Users.findOne({
            where: {
                email: email
            }
        });

        if (foundUser) {
            const { id } = foundUser
            const token = jwt.sign({"id" : id}, 'TODO_ENV');
            console.log(token);
            return res.json({ token }); // { "token": "eyJhbGciOiJ...........etc etc" }
        }
        else {
            const token = undefined;
            console.log(token);
            return res.json({ token }) // undefined {}
        }
    } catch (error) {
        next(error)
    }

    res.redirect('/loginOK');
});
/*
router.post('/login', async (req, res, next) => {
    const {email, password} = req.body;

    if (email && password) {
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
});*/

// Ruta logout

module.exports = router;

