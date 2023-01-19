import db from '../db/dbConfig.js';
import CustomAPIError from '../errors/custom-error.js';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';

export const register = async (req, res) => {
  const { name, email, password, password2 } = req.body;

  if (!name || !email || !password || !password2) {
    throw new CustomAPIError('Plese enter all fields', StatusCodes.BAD_REQUEST);
  }

  if (password.length < 6) {
    throw new CustomAPIError(
      'Password should be at least 6 characters',
      StatusCodes.BAD_REQUEST
    );
  }

  if (password !== password2) {
    throw new CustomAPIError('Passwords do not match', StatusCodes.BAD_REQUEST);
  }

  const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [
    email,
  ]);

  //if user with same email already exists
  if (existingUser.rowCount !== 0) {
    throw new CustomAPIError('Email already registered', StatusCodes.CONFLICT);
  }

  // password hashing
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await db.query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING email',
    [name, email, hashedPassword]
  );

  // some JWT token for future functionality
  const JWT_token = 12345;

  res
    .status(StatusCodes.CREATED)
    .json({ email: user.rows[0].email, JWT_token });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new CustomAPIError('Plese enter all fields', StatusCodes.BAD_REQUEST);
  }

  const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);

  if (user.rowCount === 0) {
    throw new CustomAPIError('User not found', StatusCodes.NOT_FOUND);
  }

  const isValidPassword = await bcrypt.compare(password, user.rows[0].password);

  if (!isValidPassword) {
    throw new CustomAPIError(
      'Wrong email or password',
      StatusCodes.BAD_REQUEST
    );
  }

  // some JWT token for future functionality
  const JWT_token = 12345;

  res.status(StatusCodes.OK).json({ email: user.rows[0].email, JWT_token });
};
