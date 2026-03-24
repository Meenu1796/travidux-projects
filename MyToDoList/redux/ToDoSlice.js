import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  todos: [], //slice no. 1
};
// Slice = one focused piece of your Redux store
// **If your app grew bigger, you'd have more slices:**
// ```
// store = {
//     todos:    [...],   ← todoSlice.js manages this
//     user:     {...},   ← userSlice.js manages this
//     settings: {...},   ← settingsSlice.js manages this
// }
// ```

// Each slice file is responsible for:
// ```
// 1. Its own piece of data (initialState)
// 2. Its own actions (addTodo, toggleTodo, deleteTodo)
// 3. Its own reducers (how that data changes)
// ```

const todoSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    // Called from AddTodoScreen when user submits the form
    // action.payload = the full new todo object
    addTodo: (state, action) => {
      state.todos.unshift(action.payload); // add to top of list
    },
    // ----- createSlice takes 3 things:

    // name: 'todos'
    // → the name of this slice
    // → used internally by Redux for action names
    // → your actions will be named: 'todos/addTodo'
    //                                'todos/toggleTodo'
    //                                'todos/deleteTodo'

    // initialState
    // → the starting data (empty todos array)
    // → same as the initialState we defined above

    // reducers: { ... }
    // → the functions that define HOW data changes
    // → one function per action
    // → each function receives (state, action)

    // -----  addTodo() -> Called when:  user submits the form in AddTodoScreen
    //               dispatch(addTodo(newTodo))

    // state        → current todos array in the store
    //                [ todo1, todo2, todo3 ]

    // action       → the message sent by dispatch
    // action.payload → the actual data sent with it

    // unshift()    → adds to the BEGINNING of the array
    //                so newest todo appears at TOP of list

    //------
    // Called from TodoListScreen when user taps the checkbox icon
    // action.payload = todo id
    toggleTodo: (state, action) => {
      const todo = state.todos.find(t => t.id === action.payload);
      if (todo) {
        todo.completed = !todo.completed;
      }
    },

    // Called from TodoListScreen when user taps the delete icon
    // action.payload = todo id
    deleteTodo: (state, action) => {
      state.todos = state.todos.filter(t => t.id !== action.payload);
    },
  },
});

export const { addTodo, toggleTodo, deleteTodo } = todoSlice.actions;
export default todoSlice.reducer;

// User taps delete on "Buy groceries" (id: '1')
//             ↓
// dispatch(deleteTodo('1'))          ← TodoListScreen
//             ↓
// Action created:
// { type: 'todos/deleteTodo', payload: '1' }
//             ↓
// Store sends action to reducer      ← Store.js
//             ↓
// deleteTodo reducer runs:
// state.todos.filter(t => t.id !== '1')
//             ↓
// Store updates with new todos array ← ToDoSlice.js
//             ↓
// persistor auto saves to AsyncStorage
//             ↓
// useSelector detects change         ← TodoListScreen
//             ↓
// FlatList re-renders without        ← UI updates ✅
// the deleted todo
