const { MongoClient } = require("mongodb");
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const client = new MongoClient(process.env.DATABASE_URL);

async function connect() {
    let connection = null;
    console.log('Conectando...');
    let conection = null;

    try {
        conection = await client.connect();
        console.log('¡Conectado!');

    } catch (error) {
        console.log(error.message);
    }
    return conection;
}

async function disconnect() {
    try {
        await client.close();
        console.log('¡Desconectado!');

    } catch (error) {
        console.log(error.message);
    }
}

async function conectToCollection(collectionName) {
    const connection = await connect();
    const db = connection.db(process.env.DATABASE_NAME);
    const collection = db.collection(collectionName);

    return collection
}

async function generarId(collection) {
    const documentoMax_Id = await collection.find().sort({ codigo: -1 }).limit(1).toArray();
    const Max_Id = documentoMax_Id[0]?.codigo ?? 0;


    return Max_Id + 1;
}

module.exports = { conectToCollection, disconnect, generarId };