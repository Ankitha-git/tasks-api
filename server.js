const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// In-memory data storage for tasks
let tasks = [];
let nextId = 1;

// Add sample data for testing
const initializeSampleData = () => {
  const sampleTasks = [
    {
      title: "Design API architecture",
      description: "Plan the structure and endpoints for the task management API",
      status: "completed",
      priority: "high"
    },
    {
      title: "Implement CRUD operations",
      description: "Create endpoints for Create, Read, Update, and Delete operations",
      status: "in-progress",
      priority: "high"
    },
    {
      title: "Add input validation",
      description: "Validate user input for all API endpoints",
      status: "completed",
      priority: "medium"
    },
    {
      title: "Write API documentation",
      description: "Create comprehensive documentation for all endpoints",
      status: "pending",
      priority: "medium"
    },
    {
      title: "Set up error handling",
      description: "Implement proper error handling and status codes",
      status: "completed",
      priority: "high"
    }
  ];

  sampleTasks.forEach(task => {
    tasks.push(createTask(task.title, task.description, task.status, task.priority));
  });
  
  console.log(`✅ Initialized with ${tasks.length} sample tasks`);
};

// Task model/schema
const createTask = (title, description, status = 'pending', priority = 'medium') => {
  return {
    id: nextId++,
    title: title.trim(),
    description: description.trim(),
    status: status.toLowerCase(),
    priority: priority.toLowerCase(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

// Validation functions
const validateTask = (title, description, status, priority) => {
  const errors = [];
  
  // Title validation
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push('Title is required and must be a non-empty string');
  }
  if (title && title.trim().length > 100) {
    errors.push('Title must be less than 100 characters');
  }
  
  // Description validation
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    errors.push('Description is required and must be a non-empty string');
  }
  if (description && description.trim().length > 500) {
    errors.push('Description must be less than 500 characters');
  }
  
  // Status validation
  const validStatuses = ['pending', 'in-progress', 'completed'];
  if (status && !validStatuses.includes(status.toLowerCase())) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }
  
  // Priority validation
  const validPriorities = ['low', 'medium', 'high'];
  if (priority && !validPriorities.includes(priority.toLowerCase())) {
    errors.push(`Priority must be one of: ${validPriorities.join(', ')}`);
  }
  
  return errors;
};

// Basic route to test server
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Task Management API',
    version: '1.0.0',
    endpoints: {
      'GET /tasks': 'Get all tasks (supports filtering: ?status=pending&priority=high&search=keyword)',
      'GET /tasks/:id': 'Get a specific task',
      'POST /tasks': 'Create a new task',
      'PUT /tasks/:id': 'Update a task',
      'DELETE /tasks/:id': 'Delete a task'
    }
  });
});

// CRUD Operations

// GET /tasks - Get all tasks with optional filtering
app.get('/tasks', (req, res) => {
  try {
    let filteredTasks = [...tasks];
    
    // Filter by status
    if (req.query.status) {
      const status = req.query.status.toLowerCase();
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    // Filter by priority
    if (req.query.priority) {
      const priority = req.query.priority.toLowerCase();
      filteredTasks = filteredTasks.filter(task => task.priority === priority);
    }
    
    // Search in title and description
    if (req.query.search) {
      const searchTerm = req.query.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
      );
    }
    
    res.json({
      success: true,
      count: filteredTasks.length,
      data: filteredTasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching tasks',
      error: error.message
    });
  }
});

// GET /tasks/:id - Get a specific task
app.get('/tasks/:id', (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }
    
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${taskId} not found`
      });
    }
    
    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching task',
      error: error.message
    });
  }
});

// POST /tasks - Create a new task
app.post('/tasks', (req, res) => {
  try {
    const { title, description, status, priority } = req.body;
    
    // Validate input
    const errors = validateTask(title, description, status, priority);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    // Create new task
    const newTask = createTask(title, description, status, priority);
    tasks.push(newTask);
    
    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: newTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error occurred while creating task',
      error: error.message
    });
  }
});

// PUT /tasks/:id - Update a task
app.put('/tasks/:id', (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, description, status, priority } = req.body;
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${taskId} not found`
      });
    }
    
    // Validate input
    const errors = validateTask(title, description, status, priority);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    // Update task
    const updatedTask = {
      ...tasks[taskIndex],
      title: title.trim(),
      description: description.trim(),
      status: (status || tasks[taskIndex].status).toLowerCase(),
      priority: (priority || tasks[taskIndex].priority).toLowerCase(),
      updatedAt: new Date().toISOString()
    };
    
    tasks[taskIndex] = updatedTask;
    
    res.json({
      success: true,
      message: 'Task updated successfully',
      data: updatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating task',
      error: error.message
    });
  }
});

// DELETE /tasks/:id - Delete a task
app.delete('/tasks/:id', (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }
    
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Task with ID ${taskId} not found`
      });
    }
    
    const deletedTask = tasks.splice(taskIndex, 1)[0];
    
    res.json({
      success: true,
      message: 'Task deleted successfully',
      data: deletedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error occurred while deleting task',
      error: error.message
    });
  }
});

// Error handling middleware for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Task Management API running on port ${PORT}`);
  console.log(`📖 Visit http://localhost:${PORT} to see available endpoints`);
  
  // Initialize sample data
  initializeSampleData();
});