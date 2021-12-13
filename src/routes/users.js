const { Router } = require('express');
const { Users, Transactions, Articles } = require('../db.js');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const localStrategy = require("passport-local").Strategy;
const googleStrategy = require("passport-google-oauth2").Strategy;
const bcrypt = require('bcrypt');
require('dotenv').config();

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

// Registro de usuarios
router.post("/registro", async (req, res, next) => {
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
router.get("/detail", async (req, res, next) => {
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

passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
 }, async (request, accessToken, refreshToken, profile, done) => {
    console.log("PROFILE!");
    console.log(profile);
    return done(null, profile);
}))

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
    done(null, user);
});

// Al deserealizar la información del usuario va a quedar almacenada en req.user
passport.deserializeUser(async (user, done) => {
    console.log("deserializing...");
    console.log(user);
    
    if (user.provider) return done(null, user);

    try {
        let foundedUser = await Users.findByPk(user.id);

        if (foundedUser) {
            return done(null, foundedUser)
        }
    }
    catch {
        return res.send("User not found")
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

// Auth middleware that checks if the user is logged in
const isLoggedIn = (req, res, next) => {
    console.log("isLoggedIn");
    console.log(req.user);
    if (req.user) {
        next();
    } else {
        res.sendStatus(401);
    }
}

// Ruta para login
router.post('/login', passport.authenticate('local', { failureRedirect: '/loginFail' }), async (req, res, next) => {
    const { email } = req.body;

    try {
        let foundUser = await Users.findOne({
            where: {
                email: email
            }
        });

        if (foundUser) {
            const { id, privilege } = foundUser
            const token = jwt.sign({ "id": id, "privilege": privilege }, 'TODO_ENV');
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

// In this route you can see that if the user is logged in u can acess his info in: req.user
router.get('/good', isLoggedIn, (req, res) =>{
    //res.render("pages/profile",{name:req.user.displayName,pic:req.user.photos[0].value,email:req.user.emails[0].value})
    res.send("Excelente");
})

// Auth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/failed' }),
  function(req, res) {
    // Successful authentication, redirect home.
    //res.redirect('users/good');
    //res.redirect('../users/good');
    res.redirect('http://localhost:3001/users/good');
  }
);

// Modificacion de usuarios
router.put("/:id", async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, lastName, password, email, country, state, birthday, privilege, volunteer, course } = req.body;

        hash = password ? await bcrypt.hash(password, 10) : undefined;

        let usersInstance = await Users.findByPk(id);

        let nameUpdated = name ? name : usersInstance.name
        let lastNameUpdated = lastName ? lastName : usersInstance.lastName
        let passwordUpdated = password ? hash : usersInstance.password
        let emailUpdated = email ? email : usersInstance.email
        let countryUpdated = country ? country : usersInstance.country
        let stateUpdated = state ? state : usersInstance.state
        let birthdayUpdated = birthday ? birthday : usersInstance.birthday
        let privilegeUpdated = privilege ? privilege : usersInstance.privilege
        let volunteerUpdated = volunteer ? volunteer : usersInstance.volunteer
        let courseUpdated = course ? course : usersInstance.course

        /*
        let tokenid = await Users.findOne({
            where: {
                email: usersInstance.email
            }
        })
        */
        //return res.status(200).json({ token });
        let updated = await usersInstance.update({
            name: nameUpdated,
            lastName: lastNameUpdated,
            password: passwordUpdated,
            email: emailUpdated,
            country: countryUpdated,
            state: stateUpdated,
            birthday: birthdayUpdated,
            privilege: privilegeUpdated,
            volunteer: volunteerUpdated,
            course: courseUpdated
        });

        res.status(200).json(updated)
    }
    catch (error) {
        return res.status(500).json(error.parent?.constraint);
    }

})

module.exports = router;

