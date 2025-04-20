const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Logify = require('../../../lib/logify');

const app = express();
const port = process.env.PORT || 3001;

const logify = new Logify({
  serviceName: 'user-service',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  indexPrefix: 'logify',
  logLevel: 'info'
});

app.use(cors());
app.use(express.json());

app.use(logify.requestLogger());
app.use(logify.responseLogger());
app.use(logify.errorHandler());

const users = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'user', status: 'active', lastLogin: new Date() },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'admin', status: 'active', lastLogin: new Date() }
];

app.get('/api/stats', (req, res) => {
  logify.info('Fetching API stats', { requestId: req.requestId });
  res.json(logify.getApiStats());
});

app.get('/api/users', (req, res) => {
  logify.info('Fetching all users', { requestId: req.requestId });
  
  if (Math.random() < 0.05) {
    logify.error('Failed to fetch users', {
      requestId: req.requestId,
      error: 'Database connection error',
      stack: new Error().stack
    });
    return res.status(500).json({ error: 'Internal server error' });
  }
  
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  logify.info('Fetching user', {
    requestId: req.requestId,
    userId: id
  });
  
  const user = users.find(u => u.id === id);
  
  if (!user) {
    logify.warn('User not found', {
      requestId: req.requestId,
      userId: id
    });
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

app.get('/api/users/search', (req, res) => {
  const { query, role, status } = req.query;
  
  logify.info('Searching users', {
    requestId: req.requestId,
    query,
    role,
    status
  });
  
  let results = [...users];
  
  if (query) {
    results = results.filter(u => 
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
    );
  }
  
  if (role) {
    results = results.filter(u => 
      u.role.toLowerCase() === role.toLowerCase()
    );
  }
  
  if (status) {
    results = results.filter(u => 
      u.status.toLowerCase() === status.toLowerCase()
    );
  }
  
  logify.info('Search results', {
    requestId: req.requestId,
    resultCount: results.length
  });
  
  res.json(results);
});

app.post('/api/users', (req, res) => {
  const { name, email, role } = req.body;
  
  logify.info('Creating new user', {
    requestId: req.requestId,
    name,
    email,
    role
  });
  
  if (Math.random() < 0.1) {
    logify.error('Failed to create user', {
      requestId: req.requestId,
      error: 'Validation error',
      details: 'Email already exists'
    });
    return res.status(400).json({ error: 'Invalid user data' });
  }
  
  const newUser = {
    id: uuidv4(),
    name,
    email,
    role: role || 'user',
    status: 'active',
    createdAt: new Date(),
    lastLogin: new Date()
  };
  
  users.push(newUser);
  
  logify.info('User created successfully', {
    requestId: req.requestId,
    userId: newUser.id
  });
  
  res.status(201).json(newUser);
});

app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, role, status } = req.body;
  
  logify.info('Updating user', {
    requestId: req.requestId,
    userId: id,
    updates: { name, email, role, status }
  });
  
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    logify.warn('User not found for update', {
      requestId: req.requestId,
      userId: id
    });
    return res.status(404).json({ error: 'User not found' });
  }
  
  const updatedUser = {
    ...users[userIndex],
    name: name || users[userIndex].name,
    email: email || users[userIndex].email,
    role: role || users[userIndex].role,
    status: status || users[userIndex].status,
    updatedAt: new Date()
  };
  
  users[userIndex] = updatedUser;
  
  logify.info('User updated successfully', {
    requestId: req.requestId,
    userId: id
  });
  
  res.json(updatedUser);
});

app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;
  
  logify.info('Deleting user', {
    requestId: req.requestId,
    userId: id
  });
  
  const userIndex = users.findIndex(u => u.id === id);
  
  if (userIndex === -1) {
    logify.warn('User not found for deletion', {
      requestId: req.requestId,
      userId: id
    });
    return res.status(404).json({ error: 'User not found' });
  }
  
  const deletedUser = users.splice(userIndex, 1)[0];
  
  logify.info('User deleted successfully', {
    requestId: req.requestId,
    userId: id
  });
  
  res.json(deletedUser);
});

app.patch('/api/users/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  logify.info('Updating user status', {
    requestId: req.requestId,
    userId: id,
    status
  });
  
  const user = users.find(u => u.id === id);
  
  if (!user) {
    logify.warn('User not found for status update', {
      requestId: req.requestId,
      userId: id
    });
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (!['active', 'inactive', 'suspended'].includes(status)) {
    logify.error('Invalid status update', {
      requestId: req.requestId,
      userId: id,
      invalidStatus: status
    });
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  user.status = status;
  
  logify.info('User status updated successfully', {
    requestId: req.requestId,
    userId: id,
    newStatus: status
  });
  
  res.json(user);
});

app.post('/api/users/:id/login', (req, res) => {
  const { id } = req.params;
  
  logify.info('User login attempt', {
    requestId: req.requestId,
    userId: id
  });
  
  const user = users.find(u => u.id === id);
  
  if (!user) {
    logify.warn('Login failed - user not found', {
      requestId: req.requestId,
      userId: id
    });
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (user.status !== 'active') {
    logify.warn('Login failed - user not active', {
      requestId: req.requestId,
      userId: id,
      status: user.status
    });
    return res.status(403).json({ error: 'User account is not active' });
  }
  
  user.lastLogin = new Date();
  
  logify.info('User logged in successfully', {
    requestId: req.requestId,
    userId: id,
    lastLogin: user.lastLogin
  });
  
  res.json({ message: 'Login successful', lastLogin: user.lastLogin });
});

app.listen(port, () => {
  logify.info(`User service listening on port ${port}`);
}); 