/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { taskService } from '../services/taskService';
import { Task, CreateTaskData, UpdateTaskData } from '../types';
import TaskList from '../components/TaskList';
import TaskModal from '../components/TaskModal';
import TaskFilters from '../components/TaskFilters';

function  Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  useEffect(() => {
    fetchTasks();
  }, [filters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasks(filters);
      setTasks(data);
      setError('');
    } catch (err: unknown) {
      setError('Failed to fetch tasks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowModal(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowModal(true);
  };

  const handleSaveTask = async (data: CreateTaskData | UpdateTaskData) => {
    try {
      if (editingTask) {
        await taskService.updateTask(editingTask.id, data as UpdateTaskData);
      } else {
        await taskService.createTask(data as CreateTaskData);
      }
      await fetchTasks();
      setShowModal(false);
      setEditingTask(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskService.deleteTask(id);
        await fetchTasks();
      } catch (err: unknown) {
        setError('Failed to delete task: ' + err);
      }
    }
  };

  return (
    <div>
      <header className="header">
        <div className="header-content">
          <h1>Task Manager</h1>
          <nav className="nav">
            <span>Welcome, {user?.name}!</span>
            <button onClick={handleLogout} className="btn btn-secondary btn-sm">
              Logout
            </button>
          </nav>
        </div>
      </header>

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2>My Tasks ({tasks.length})</h2>
          <button onClick={handleCreateTask} className="btn btn-primary">
            + Create Task
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <TaskFilters filters={filters} onFilterChange={setFilters} />

        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : (
          <TaskList
            tasks={tasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
          />
        )}

        {showModal && (
          <TaskModal
            task={editingTask}
            onSave={handleSaveTask}
            onClose={() => {
              setShowModal(false);
              setEditingTask(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
