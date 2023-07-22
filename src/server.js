const express = require(`express`);
const { conectToCollection, disconnect, generarId } = require(`../connection_db`);

const server = express();

const messageNotFound = JSON.stringify({ message: 'El código no corresponde a un mueble registrado' });
const messageDatosFaltantes = JSON.stringify({ message: 'Faltan datos relevantes' });
const messageServerError = JSON.stringify({ message: 'Se ha generado un error en el servidor' });

// Middlewares

server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// método GET = Obtener los registros (Permite filtros)

server.get('/api/v1/muebles', async (req, res) => {
    const { categoria, precio_gte, precio_lte } = req.query;
    let muebles = [];

    try {
        const collection = await conectToCollection('muebles');
        if (categoria) muebles = await collection.find({ categoria }).sort({ nombre: 1 }).toArray();
        else if (precio_gte) muebles = await collection.find({ precio: { $gte: Number(precio_gte) } }).sort({ precio: 1}).toArray();
        else if (precio_lte) muebles = await collection.find({ precio: { $lte: Number(precio_lte) } }).sort({ precio: -1}).toArray();
        else muebles = await collection.find().toArray();

        res.status(200).send(JSON.stringify({ payload: muebles }));
    } catch (error) {
        console.log(error.message);
        res.status(500).send(messageServerError);
    } finally {
        await disconnect();
    }
});

// método GET = Obtener un registro en específico

server.get('/api/v1/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        const collection = await conectToCollection('muebles');
        const mueble = await collection.findOne({ codigo: Number(codigo) });

        if (!mueble) return res.status(400).send(messageNotFound);

        res.status(200).send(JSON.stringify({ payload: mueble }));
    } catch (error) {
        console.log(error.message);
        res.status(500).send(messageServerError);
    } finally {
        await disconnect();
    }
});

// Método POST = Crea un nuevo registro

server.post('/api/v1/muebles', async (req, res) => {
    const { nombre, precio, categoria } = req.body;

    if (!nombre || !precio || !categoria) {
        return res.status(400).send(messageDatosFaltantes);
    }

    try {
        const collection = await conectToCollection('muebles');
        const mueble = { codigo: await generarId(collection), nombre, precio, categoria };

        await collection.insertOne(mueble);

        res.status(201).send(JSON.stringify({message: 'Registro creado', payload: mueble }));
    } catch (error) {
        console.log(error.message);
        res.status(500).send(messageServerError);
    } finally {
        await disconnect();
    }
});

// Método PUT = Modifica un registo en específico

server.put('/api/v1/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;
    const { nombre, precio, categoria } = req.body;

    if (!codigo || !nombre || !precio || !categoria) return res.status(400).send(messageDatosFaltantes);

    try {
        const collection = await conectToCollection('muebles');
        let mueble = await collection.findOne({ codigo: Number(codigo) });
        if (!mueble) return res.status(400).send(messageNotFound);
        mueble = {codigo: Number(codigo), nombre, precio, categoria};

        await collection.updateOne({ codigo: Number(codigo) }, { $set: mueble });

        res.status(200).send(JSON.stringify({message: 'Registro actualizado', payload: mueble }));
    } catch (error) {
        console.log(error.message);
        res.status(500).send(messageServerError);
    } finally {
        await disconnect();
    }
});
// Método DELETE = Elimina un registro en específico

server.delete('/api/v1/muebles/:codigo', async (req, res) => {
    const { codigo } = req.params;

    try {
        const collection = await conectToCollection('muebles');
        const mueble = await collection.findOne({ codigo: { $eq: Number(codigo) } });

        if (!mueble) return res.status(400).send(messageNotFound);

        await collection.deleteOne({ codigo: { $eq: Number(codigo) } });

        res.status(200).send(JSON.stringify({message: 'Registro eliminado' }));
    } catch (error) {
        console.log(error.message);
        res.status(500).send(messageServerError);
    } finally {
        await disconnect();
    }
});

// Control de rutas inexistentes

server.use('*', (req, res) => {
    res.status(404).send(JSON.stringify({message: '¡Error 404! La URL indicada no existe en este servidor pruebe con otra ruta' }));
});

// Oyente de peticiones

server.listen(process.env.SERVER_PORT, process.env.SERVER_HOST, () => {
    console.log(`Ejecutandose en http://${process.env.SERVER_HOST}:${process.env.SERVER_PORT}/api/v1/muebles`);
});