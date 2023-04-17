import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

// Configuração do banco de dados

const mongoClient = new MongoClient(process.env.DATABASE_URL);
try {
  await mongoClient.connect();
  console.log("MongoDB conectado!");
} catch (err) {
  console.log(err.message);
}

const db = mongoClient.db();

// Endpoints
app.post("/participants", async (req, res) => {
  const { name } = req.body;
  const newParticipant = { name, lastStatus: Date.now() };
  const h = dayjs().format("HH:mm:ss");
  const entryLog = {
    from: name,
    to: "todos",
    text: "entra na sala...",
    type: "status",
    time: h,
  };

  try {
    await db.collection("participants").insertOne(newParticipant);
    await db.collection("messages").insertOne(entryLog);
    res.status(201).send("Participante adicionado");
  } catch (err) {
    res.status(500).send(err.message);
  }

});

app.post("/messages", async (req, res) => {});

app.get("/participants", (req, res) => {
  db.collection("participants")
    .find()
    .toArray()
    .then((participants) => res.status(201).send(participants))
    .catch((err) => res.status(500).send(err.message));
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
