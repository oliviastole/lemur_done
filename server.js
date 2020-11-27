
const express = require('express');
const dbhandler = require('./db_handler.js');
const app = express(); //server-app
const crypto = require('crypto');
const { readSync } = require('fs');

const secret = process.env.SECRET || "iremvosjie399403"; // I PRODUKSJON MÅ DENNE I ENV.VARIABLER - noe som finnes på datamaskin
const salt = process.env.SALT || "fjkaj34f93jfe9w00"; // kryptering, passord, sikkerhet for passord

let logindata = {};

// middleware ------------------------------------
app.use(express.json()); // gjør at vi bruker json og kan skrive slik vi gjør, for å håndtere JSONdata
app.use('/', express.static('client')); // for serving client files

app.use('/', function(req, res, next) {

    // Unntak: endepunkter som IKKE skal beskyttes, alle skal kunne ha tilgang her
    // Gjelder: create_user og user_login
    if (req.method == "POST" && req.path == "/users"){
        next();
        return;
    }

    if (req.path == "/users/auth") {
        next();
        return;
    }

    // beskytte endepunkter 
    let token = req.headers.auth; // får tak i tokenet/headers

    // hvis token ikke finnes
    let regex = /^\d+,\S+,\S{128}$/;
    let validFormat = regex.test(token);
    if (validFormat == false) {
        res.status(403).json({msg: "No token"});
        return;
    }
    
    let [userid, username, sign] = token.split(",");

    // verifiser token
    crypto.scrypt(username, secret, 64, function(err, key){
        let signCheck = key.toString("hex");

        if (sign == signCheck) {
            logindata.username = username;
            logindata.userid = userid;
            next(); // token er ok
        }
        else {
            res.status(403).json({msg: "Invalid token"});
        }
    });

   // next() gjør at koden kjører videre til de andre endepunktene
});

// css -----------------------------------------------



// LISTS

// endpoint GET ----------------------------------
app.get('/lists', async function (req, res) {
    
    let lists = await dbhandler.getLists(logindata.userid);
    
    res.status(200).json(lists); //send response, sender listen til nettside

});

// endpoint GET ----------------------------------
app.get('/lists/public', async function (req, res) {
    
    let lists = await dbhandler.getPublicLists();
    
    res.status(200).json(lists); //send response, sender publiclisten til nettside

});

// endpoint POST ---------------------------------
app.post('/lists', async function (req, res) {

    let listName = req.body.list_name;
    let listPubl = req.body.publ;
    let listComm = req.body.comm;

    let result = await dbhandler.createList(listName, listPubl, listComm, logindata.userid);

    res.status(200).json({msg: "You have created a new list"}); //send response    

});

// endpoint PUT ---------------------------------
app.put('/lists', async function (req, res) {

    let listName = req.body.list_name;
    let listPubl = req.body.publ;
    let listComm = req.body.comm;
    let listId = req.body.list_id;

    let result = await dbhandler.changeList(listId, listName, listPubl, listComm, logindata.userid);

    res.status(200).json({msg: "You have changed a list"});    

});

// endpoint DELETE ----------------------------------
app.delete('/lists', async function (req, res) {
    
    let listeid = req.body.id;
    let result = await dbhandler.deleteList(listeid, logindata.userid);
    res.status(200).json({msg: "You have deleted the list"}); 

});


// ITEM

// endpoint GET ---------------------------------
app.get('/list_item', async function (req, res) {

    let listid = req.query.listid;
    let items = await dbhandler.getItems(listid);
    res.status(200).json(items); // sender items til nettsiden

});

// endpoint POST ---------------------------------
app.post('/list_item', async function (req, res) {

    let itemName = req.body.item_name;
    let listId = req.body.list_id;
    let result = await dbhandler.createItem(itemName, listId);
    
    res.status(200).json({msg: "You have created a new item"});    

});

// endpoint DELETE ----------------------------------
app.delete('/list_item', async function (req, res) {
    
    let itemid = req.body.id;
    let result = await dbhandler.deleteItem(itemid);
    res.status(200).json({msg: "The item is deleted"}); 

});


// Create user
// endpoint CREATE USER POST ---------------------------------
app.post('/users', async function (req, res) {

    let user_name = req.body.user_name;
    let password = req.body.password;
    

    crypto.scrypt(password, salt, 64, async function(err, key){
        let hashedPsw = key.toString("hex");

        let result = await dbhandler.createUser(user_name, hashedPsw);

        res.status(200).json({msg: "You have created a new user"}); 
    });   

});


// UPDATE USER

app.put('/users', async function (req, res) {

    let user_name = req.body.user_name;
    let password = req.body.password;
    let userid = req.body.id;

    crypto.scrypt(password, "", 64, async function(err, key){
        let hashedPsw = key.toString("hex");

        let result = await dbhandler.editUser(userid, user_name, hashedPsw);

        res.status(200).json({msg: "You have changed your user"}); 
    });   

});

// endpoint DELETE ----------------------------------
app.delete('/users', async function (req, res) {
    
    let userid = req.body.id;
    let result = await dbhandler.deleteUser(userid);
    res.status(200).json({msg: "The user is deleted"}); 

});



// endpoint LOGIN POST auth --------------------------------------

app.post('/users/auth', async function (req, res) {
    
    let username = req.body.email;
    let password = req.body.psw;

    let result = await dbhandler.getUser(username);

    if (result.length == 0){
        res.status(401).json({msg: "Not valid user"});
        return;
    }

    crypto.scrypt(password, "", 64, async function(err, key){
        let hashedPsw = key.toString("hex");

        if (result[0].password == hashedPsw){
           
            // Create token if login is OK
           crypto.scrypt(username, secret, 64, function(err, key){
                let sign = key.toString("hex");
                let newToken = result[0].id + "," + username + "," + sign; // I følge standard bør username (payload) kodes til base64
                res.status(200).json({token: newToken});
            });

        }
        else {
            res.status(401).json({msg: "Wrong password"});
        } 
    }); 

});


// endpoint DELETE ----------------------------------
app.delete('/users', async function (req, res) {
    let id = req.body.id;
    let result = await dbhandler.deleteUser(id);
    res.status(200).json({msg: "You have deleted the user"}); 

});


// general error handling -----------------------------

app.use(function(err, req, res, next) { // hvis det er noe annet som skjer på serveren så sendes denne
    res.status(500).json({msg: "Server error", details: err});
});


// start server -----------------------------------
let port = process.env.PORT || 3000;
app.listen(port, function () {
    // console.log('Server listening on port 3000!');
});


