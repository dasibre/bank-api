// hash password password123

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT;
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION;

// Load users from mock database
let users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));

// In-memory storage for third-party clients
const clients = [
  {
    client_id: process.env.CLIENT_ID,
    client_secret: process.env.CLIENT_SECRET
  }
];

/**
 * Third-party authentication (Client Credentials Grant)
 */
app.post('/auth/third-party', (req, res) => {
  const { client_id, client_secret } = req.body;

  const client = clients.find(c => c.client_id === client_id && c.client_secret === client_secret);
  if (!client) {
    return res.status(401).json({ message: 'Invalid client credentials' });
  }

  const token = jwt.sign({ client_id }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });
  res.json({ access_token: token, expires_in: TOKEN_EXPIRATION });
});

/**
 * Account holder authentication
 */
app.post('/auth/account-holder', authenticateClientApp,(req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const userToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '15m' });
  res.json({ access_token: userToken, expires_in: '15m' });
});

/**
 * Consent flow: Provide third-party app temporary access to account holder data
 */
app.post('/consent',authenticateClientApp, (req, res) => {
  const { user_token } = req.body;

  try {
    const decoded = jwt.verify(user_token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const consentToken = jwt.sign(
      { userId: user.id, claims: ['read_balance', 'transfer_funds'] },
      JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({ consent_token: consentToken, expires_in: '10m' });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired user token' });
  }
});

/**
 * Get Account Balance (requires consent token)
 */
app.get('/account/balance', authenticateClientApp, authenticateConsentToken(['read_balance']), (req, res) => {
  const user = users.find(u => u.id === req.user.userId);
  res.json({ account_number: user.account_number, balance: user.balance });
});

/**
 * Middleware to authenticate consent tokens
 */
function authenticateConsentToken(requiredClaims) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'Missing authorization header' });

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Check if the token contains the required claims
      const hasRequiredClaims = requiredClaims.every(claim => decoded.claims.includes(claim));
      if (!hasRequiredClaims) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
}

/**
 * Middleware to authenticate the third-party client application
 */
function authenticateClientApp(req, res, next) {
  const authHeader = req.headers['client-authorization'];
  if (!authHeader) return res.status(401).json({ message: 'Missing client application token' });


  const token = authHeader.split(' ')[1]; // Extract token from "Bearer <token>"
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (error) {
    console.log("Verification fail", authHeader);
    return res.status(401).json({ message: 'Invalid or expired client application token' });
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Bank API running on http://localhost:${PORT}`);
});

