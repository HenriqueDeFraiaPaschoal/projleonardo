const express = require("express");
const { pool } = require("./data/data");
const jwt = require("jsonwebtoken");
const app = express();
app.use(express.json());

app.listen(8080, () => {
  console.log("Servidor ativo na porta 3000!");
});

app.get("/", (req, res) => {
  res.send("<h1>Hello World</h1>");
});

app.get("/users", async (req, res) => {
  try {
    const client = await pool.connect();
    const { rows } = await client.query("SELECT * FROM Users");
    console.table(rows);
    res.status(200).send(rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao conectar com o servidor!");
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const client = await pool.connect();
  const findUser = await client.query(
    `SELECT * FROM users WHERE email ='${email}'`
  );
  if (!findUser) {
    return res.status(401).json({ error: "Usuário não existe!" });
  }
  if (parseInt(findUser.rows[0].password) !== password) {
    return res.status(401).json({ error: "Senha incorreta!" });
  }
  const { id, name } = findUser.rows[0];
  return res.status(200).json({
    user: {
      id,
      name,
      email,
    },
    token: jwt.sign({ id }, process.env.SECRET_JWT, {
      expiresIn: process.env.EXPIRESIN_JWT,
    }),
  });
});

app.post("/users", async (req, res) => {
  try {
    const { id, name, email, password } = req.body;
    const client = await pool.connect();
    if (!id || !name || !email || !password) {
      return res.status(401).send("Faltam dados para o cadastrameto!");
    }
    const user = await client.query(`SELECT FROM users WHERE id=${id}`);
    if (user.rows.length === 0) {
      await client.query(
        `INSERT INTO users VALUES (${id}, '${email}', '${password}', '${name}')`
      );
      res.status(200).send({
        msg: "Usuário cadastrado!",
        result: {
          id,
          email,
          password,
          name,
        },
      });
    } else {
      res.status(401).send("Usuário já existe!");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao conectar com o servidor!");
  }
});

app.put("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password } = req.body;
    const client = await pool.connect();
    if (!id || !name) {
      return res.status(401).send("Dados inválidos!");
    }
    const user = await client.query(`SELECT FROM users WHERE id=${id}`);
    if (user.rows.length > 0) {
      await client.query(
        `UPDATE users SET name = '${name}',email ='${email}',password ='${password}' WHERE id=${id}`
      );
      res.status(200).send({
        msg: "Usuario atualizado!",
        result: {
          id,
          name,
          email,
          password,
        },
      });
    } else {
      res.status(401).send("O usuário não existe!");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao conectar com o servidor!");
  }
});

app.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (id === undefined) {
      return res.status(401).send("Usuário não informado!");
    }
    const client = await pool.connect();
    const del = await client.query(`DELETE FROM users WHERE id=${id}`);
    if (del.rowCount == 1) {
      return res.status(200).send(`O usuário ${ id } foi deletado!`);
    } else {
      return res.status(401).send("O usuário não existe!");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Erro ao conectar com o servidor!");
  }
});
