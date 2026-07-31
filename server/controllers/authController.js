const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    const user = { id: result.insertId, name, email };
    const token = signToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = ?',
      [email]
    );
    const dbUser = rows[0];

    if (!dbUser) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, dbUser.password_hash);
    if (!passwordMatches) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const user = { id: dbUser.id, name: dbUser.name, email: dbUser.email };
    const token = signToken(user);

    res.json({ token, user });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    const user = rows[0];

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    res.json({ user });
  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login, me };
