import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import joi from "joi";

const app = express();
app.use(express.json());
app.use(cors());
dotenv.config();

// Validação de participantes JOI
const userSchema = joi.object({
  name: joi.string().required(),
});

// Validação de mensagens JOI
const messagesSchema = joi.object({
  to: joi.string().required(),
  text: joi.string().required(),
  type: joi.valid("message", "private_message").required()
})

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

  const validation = userSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  try {
    await db.collection("participants").insertOne(newParticipant);
    const participant = await db
      .collection("participants")
      .findOne({ name: name });
    await db.collection("messages").insertOne(entryLog);

    if (participant)
      return res
        .status(409)
        .send("Este nome de usuário já está sendo utilizado!");
    res.status(201).send("Participante adicionado");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/messages", async (req, res) => {
  const { user } = req.header.user
  const {to, text, type} = req.body;
  const h = dayjs().format("HH:mm:ss");
  const validation = messagesSchema.validate(req.body, { abortEarly: false });

  const sender = await db.collection("participants").findOne({name: user})
  if (!sender || validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }


});

app.get("/participants", (req, res) => {
  db.collection("participants")
    .find()
    .toArray()
    .then((participants) => res.status(201).send(participants))
    .catch((err) => res.status(500).send(err.message));
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
