import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);
// Callback: (nested) Hey, when you're done cooking, call me.
// Await: I’ll wait here until the food is ready.

const DATABASE_NAME = 'TodoApp.db';
// Android: internal storage
// iOS: app sandbox

//Open DB connection
export const getDBConnection = async () => {
  const db = await SQLite.openDatabase({
    name: DATABASE_NAME,
    location: 'default',
  });
  console.log('DB connected:', DATABASE_NAME);
  return db;
};

//Create todos table if not exists
export const createTable = async db => {
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS todos (
      id        TEXT PRIMARY KEY NOT NULL,
      title     TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      datetime  TEXT,
      createdAt TEXT NOT NULL
    );
  `);
  console.log('Table ready');
};

// Fetch all todos - newest first
export const getTodos = async db => {
  console.log('I am here');
  db.transaction(tx => {
    tx.executeSql('SELECT * FROM todos', [], (txObj, resultSet) => {
      console.log(resultSet); // check full object
      console.log(resultSet.rows);
      console.log(resultSet.rows._array); // 👈 correct
    });
  });

  const [results] = await db.executeSql(
    'SELECT * FROM todos ORDER BY createdAt DESC;',
  );

  const todos = [];
  // Convert DB rows to JS objects
  for (let i = 0; i < results.rows.length; i++) {
    const row = results.rows.item(i);
    todos.push({
      id: row.id,
      title: row.title,
      completed: row.completed === 1, // SQLite stores 0/1, convert to boolean true/false
      datetime: row.datetime,
      createdAt: row.createdAt,
    });
  }
  console.log('Fetched todos:', todos.length);
  return todos;
};

//Insert a new todo
export const saveTodo = async (db, todo) => {
  await db.executeSql(
    `INSERT INTO todos (id, title, completed, datetime, createdAt)
     VALUES (?, ?, ?, ?, ?);`, //? = placeholders, prevents SQL injection
    [
      todo.id,
      todo.title,
      todo.completed ? 1 : 0,
      todo.datetime || null,
      todo.createdAt,
    ],
  );
  console.log('Todo saved:', todo.title);
};

//update completed status
export const updateTodoCompleted = async (db, id, completed) => {
  await db.executeSql('UPDATE todos SET completed = ? WHERE id = ?;', [
    completed ? 1 : 0,
    id,
  ]);
  console.log('Todo updated:', id, '→ completed:', completed);
};

//Delete a todo by id
export const deleteTodo = async (db, id) => {
  await db.executeSql('DELETE FROM todos WHERE id = ?;', [id]);
  console.log('Todo deleted:', id);
};
