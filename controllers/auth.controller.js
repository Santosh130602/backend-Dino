const pool = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// -------------------- SIGNUP --------------------
const signup = async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      error: "Name, email, and password are required",
    });
  }

  const userRole = role === "admin" ? "admin" : "user";
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const checkUser = await client.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (checkUser.rows.length > 0) {
      throw new Error("User already exists with this email");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRes = await client.query(
      `INSERT INTO users (name, email, phone, password, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, role`,
      [name, email, phone, hashedPassword, userRole]
    );

    const userId = userRes.rows[0].id;
    const assets = await client.query(
      "SELECT id, name FROM asset_types WHERE name IN ('Silver','Gold','Diamond')"
    );

    const silver = assets.rows.find(a => a.name === "Silver")?.id;
    const gold = assets.rows.find(a => a.name === "Gold")?.id;
    const diamond = assets.rows.find(a => a.name === "Diamond")?.id;

    if (!silver || !gold || !diamond) {
      throw new Error("Assets not seeded correctly (Silver/Gold/Diamond missing)");
    }

    await client.query(
      `INSERT INTO wallets (user_id, asset_id, balance)
   VALUES 
   ($1, $2, 0),
   ($1, $3, 100),
   ($1, $4, 0)`,
      [userId, silver, gold, diamond]
    );


    await client.query("COMMIT");

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: userId,
        name,
        email,
        phone,
        role: userRole,
        wallets: {
          gold: 100,
          silver: 0,
          diamond: 0
        }
      }
    });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};





// LOGIN

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required",
    });
  }

  try {
    const userRes = await pool.query(
      "SELECT id, name, email, phone, password, role FROM users WHERE email = $1",
      [email]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = userRes.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  signup,
  login,
};
