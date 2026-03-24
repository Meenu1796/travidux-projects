import axios from 'axios';

// ✅ Your Django backend URL
const BASE_URL = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fetch all todos from Django
export const fetchTodos = async () => {
  const { data } = await api.get('/todos/');
  return data.map(todo => ({
    ...todo,
    id: todo.id.toString(),
    completed: todo.completed,
  }));
};

// Save a new todo to Django
export const saveTodo = async todo => {
  const { data } = await api.post('/todos/', {
    title: todo.title,
    completed: false,
    datetime: todo.datetime || null,
  });
  return { ...data, id: data.id.toString() };
};

// Toggle completed status
export const updateTodo = async (id, completed) => {
  const { data } = await api.patch(`/todos/${id}/`, { completed });
  return data;
};

// Delete a todo
export const deleteTodo = async id => {
  await api.delete(`/todos/${id}/`);
};
