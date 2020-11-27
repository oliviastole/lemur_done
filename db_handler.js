// Dette er setupkode/connection, som gjelder for serveren, og som ikke trenger å gjentas
// DATABASEHÅNDTERING

const pg = require('pg');
const dbhandler = {};

const dbcred = process.env.DATABASE_URL || "postgres://morekptiiwaimg:ea31b397226cbc620a97a79c583ff20f10fab3ec2a70bf65f52514a85483c1f5@ec2-52-48-65-240.eu-west-1.compute.amazonaws.com:5432/d9vuo2najrmusl";

const pool = new pg.Pool({
    connectionString: dbcred,
    ssl: {rejectUnauthorized: false}
});


// HANDLERS -------------------------------

// Velger alt fra lister

dbhandler.getLists = async function(userid) {
    let sql = "SELECT * FROM lists WHERE userid = $1";
    let values = [userid];
    let result = await pool.query(sql, values);
    return result.rows;
}

// Velger alle listene som er satt til public

dbhandler.getPublicLists = async function() {
    let sql = "SELECT lists.id, lists.list_name, lists.comm, users.user_name FROM lists INNER JOIN users ON lists.userid=users.id";
    let result = await pool.query(sql);
    return result.rows;
}

// Lager en ny liste

dbhandler.createList = async function(name, publ, comm, userid) {
    let sql = "INSERT INTO lists (id, list_name, publ, comm, userid) VALUES (DEFAULT, $1, $2, $3, $4) RETURNING *";
    let values = [name, publ, comm, userid];
    let result = await pool.query(sql, values);
    return result.rows;
}

// Oppdaterer en eksisterende liste

dbhandler.changeList = async function(id, name, publ, comm, userid) {
    let sql = "UPDATE lists SET list_name = $1, publ = $2, comm = $3, userid = $4 WHERE id = $5";
    let values = [name, publ, comm, userid, id];
    let result = await pool.query(sql, values);
    return result.rows;
}


// Slette en liste

dbhandler.deleteList = async function(id, userid) {
    let sql = "DELETE FROM lists WHERE id = $1 AND userid = $2";
    let values = [id, userid];
    let result = await pool.query(sql, values); // bruke await hvis det tar lang tid (pool)
    return result.rows;
}

// Velger alt fra list_items

dbhandler.getItems = async function(listid) {
    let sql = "SELECT * FROM list_item WHERE list_id = $1";
    let values = [listid];
    let result = await pool.query(sql, values); // bruke await hvis det tar lang tid (pool)
    return result.rows;
}

// Lager nye items

dbhandler.createItem = async function(itemName, listid) {
    let sql = "INSERT INTO list_item (id, item_name, list_id) VALUES (DEFAULT, $1, $2) RETURNING *";
    let values = [itemName, listid];
    let result = await pool.query(sql, values); // bruke await hvis det tar lang tid (pool)
    return result.rows;
}


// Sletter items

dbhandler.deleteItem = async function(id) {
    let sql = "DELETE FROM list_item WHERE id = $1";
    let values = [id];
    let result = await pool.query(sql, values); // bruke await hvis det tar lang tid (pool)
    return result.rows;
}


// Brukes for å logge inn

dbhandler.getUser = async function(username) {
    let sql = "SELECT * FROM users WHERE user_name = $1";
    let values = [username];
    let result = await pool.query(sql, values); 
    return result.rows;
}

// Brukes for å liste opp brukerne

dbhandler.getUsers = async function() {
    let sql = "SELECT * FROM users";
    let result = await pool.query(sql);
    return result.rows;
}

// Opprette ny bruker

dbhandler.createUser = async function(user_name, password) {
    let sql = "INSERT INTO users (id, user_name, password) VALUES (DEFAULT, $1, $2) RETURNING *";
    let values = [user_name, password];
    let result = await pool.query(sql, values); // bruke await hvis det tar lang tid (pool)
    return result.rows;
}

// Oppdatere brukernavn og passord

dbhandler.editUser = async function(userid, user_name, password) {
    let sql = "UPDATE users SET user_name = $1, password = $2 WHERE id = $3 RETURNING *";
    let values = [user_name, password, userid];
    let result = await pool.query(sql, values); // bruke await hvis det tar lang tid (pool)

    return result.rows;
}

// Slette brukeren

dbhandler.deleteUser = async function(id) {
    let sql = "DELETE FROM users WHERE id = $1";
    let values = [id];
    let result = await pool.query(sql, values); // bruke await hvis det tar lang tid (pool)
    return result.rows;
}

//-------------------------------------


module.exports = dbhandler;
