const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const port = 8000;

// Middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

// Constants
let data = require("./mockdb.json");
const dataFilePath = path.join(__dirname, "./mockdb.json");
const SECRET_KEY = "mock-secret";

// ===== Auth Method ===== //
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = data.users.find(
    (u) => u.username === username && u.password === password
  );
  const token = `mock-token-${user.sub}`;

  if (user) {
    res.json({ token, user });
  } else {
    res.status(401).json({ message: "Invalid username or password" });
  }
  // const token = jwt.sign({ sub: user.sub }, SECRET_KEY);
  // res.json({ token: "mock_token", user });
});

app.get("/api/auth/user", (req, res) => {
  const { token } = req.query;
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = data.users.find((u) => u.sub === decoded.sub);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
});

// ===== Users Method ===== //
app.get("/api/users", (req, res) => {
  const { bu_name } = req.query;
  if (bu_name) {
    const filtered = data.users.filter((u) =>
      u.roles_assignment.some((r) => r.bu_name === bu_name)
    );
    res.json(filtered);
  } else {
    res.json(data.users);
  }
});

// Get Users by Bu and Role //
app.get("/api/user", (req, res) => {
  const { bu_name, role_name } = req.query;
  const filtered = data.users.filter((u) =>
    u.roles_assignment.some(
      (a) => a.bu_name === bu_name && a.roles.includes(role_name)
    )
  );
  res.json(filtered);
});

// Get User by Id //
app.get("/api/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const user = data.users.find((u) => u.user_id === id);
  user ? res.json(user) : res.status(404).json({ message: "User not found" });
});

// Delete Users by Id //
app.delete("/api/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  data.users = data.users.filter((u) => u.user_id !== id);
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  res.json({ message: "User deleted" });
});

// Create User //
app.post("/api/users", (req, res) => {
  const newUser = { id: data.users.length + 1, ...req.body };
  data.users.push(newUser);
  fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error("Error writing to mockdb.json:", err);
      res.status(500).json({ error: "Error writing to mockdb.json" });
    } else {
      res.status(201).json({ status: "Ok", data: newUser });
    }
  });
});

// Update User //
app.put("/api/users/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = data.users.findIndex((u) => u.user_id === id);
  if (index !== -1) {
    data.users[index] = { ...data.users[index], ...req.body };
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    res.json(data.users[index]);
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

// ===== Role Method ===== //
// app.get("/api/roles", (req, res) => {
//   const roles = data.roles;
//   res.json(roles);
// });

// Get Roles by Bu //
app.get("/api/roles", (req, res) => {
  const { bu_name } = req.query;
  if (bu_name) {
    res.json(data.roles.filter((r) => r.bu_name === bu_name));
  } else {
    res.json(data.roles);
  }
});

// Get Roles by Bu and Name //
app.get("/api/role", (req, res) => {
  const { bu_name, role_name } = req.query;
  const roleBu = data.roles.find((r) => r.bu_name === bu_name);
  if (roleBu) {
    const role = roleBu.roles.find((r) => r.role_name === role_name);
    role ? res.json(role) : res.status(404).json({ message: "Role not found" });
  } else {
    res.status(404).json({ message: "BU not found" });
  }
});

// ===== Organizations Method ===== //
app.get("/api/organizations", (req, res) => {
  res.json(data.organizations);
});

// Get Organization by Id //
app.get("/api/organizations/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const org = data.organizations.find((o) => o.bu_id === id);
  org ? res.json(org) : res.status(404).json({ message: "Bu not found" });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});