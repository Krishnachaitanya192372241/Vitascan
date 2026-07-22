# Security Remediation Guide

## 1. Fixing BOLA (Broken Object Level Authorization)
Ensure that every endpoint accepting an ID checks if the authenticated user owns that ID.
```javascript
// BAD
app.put('/api/users/:id', async (req, res) => {
    await db.user.update(req.params.id, req.body); 
});

// GOOD
app.put('/api/users/:id', async (req, res) => {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    await db.user.update(req.params.id, req.body);
});
```

## 2. Removing Hardcoded Secrets
Move the JWT secret from code to an environment variable.
```javascript
// BAD
const secret = 'super-secret-key-123';

// GOOD
const secret = process.env.JWT_SECRET;
```

## 3. Rate Limiting Implementation
Apply robust rate limiting to all public endpoints.
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests
    message: 'Too many login attempts, please try again later.'
});

app.post('/api/auth/login', authLimiter, loginController);
```
