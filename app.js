const { format, isValid } = require("date-fns");
const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const addDays = require("date-fns/addDays");

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

app.use(express.json());

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

convertTodoObjectToResponseObject = (dbResponse) => {
  return {
    id: dbResponse.id,
    todo: dbResponse.todo,
    category: dbResponse.category,
    priority: dbResponse.priority,
    status: dbResponse.status,
    dueDate: dbResponse.due_date,
  };
};

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

let statusList = ["TO DO", "IN PROGRESS", "DONE"];
let priorityList = ["HIGH", "MEDIUM", "LOW"];
let categoryList = ["WORK", "HOME", "LEARNING"];

const invalidStatus = (response) => {
  response.status(400);
  response.send("Invalid Todo Status");
};
const invalidPriority = (response) => {
  response.status(400);
  response.send("Invalid Todo Priority");
};

const invalidCategory = (response) => {
  response.status(400);
  response.send("Invalid Todo Category");
};
const invalidDate = (response) => {
  response.status(400);
  response.send("Invalid Due Date");
};

// app.get("/todos/", async (request, response) => {
//   let getTodoQuery = "";
//   const { search_q = "", category, priority, status } = request.query;
//   switch (true) {
//     case hasStatus(request.query):
//       getTodoQuery = `select * from todo where todo Like '%${search_q}' and status = '${status}';`;
//       break;
//     case hasPriority(request.query):
//       getTodoQuery = `select * from todo where todo Like '%${search_q}' and priority = '${priority}';`;
//       break;
//     case hasPriorityAndStatus(request.query):
//       getTodoQuery = `select * from todo where todo like '%${search_q}' and priority = '${priority}' and status = '${status}';`;
//       break;
//     case hasCategoryAndStatus(request.query):
//       getTodoQuery = `select * from todo where todo like '%${search_q}' and category = '${category}' and status = '${status}';`;
//       break;
//     case hasCategory(request.query):
//       getTodoQuery = `select * from todo where todo Like '%${search_q}' and category = '${category}';`;
//       break;
//     case hasCategoryAndPriority(request.query):
//       getTodoQuery = `select * from todo where todo like '%${search_q}' and category = '${category}' and priority = '${priority}';`;
//       break;
//     default:
//       getTodoQuery = `
//       SELECT
//         *
//       FROM
//         todo
//       WHERE
//         todo LIKE '%${search_q}%';`;
//   }
//   const data = await db.all(getTodoQuery);
//   console.log(data);
//   response.send(
//     data.map((eachTodo) => {
//       return convertTodoObjectToResponseObject(eachTodo);
//     })
//   );
// });

app.get("/todos/", async (request, response) => {
  const { search_q = "", status, priority, category, due_date } = request.query;
  let data = null;
  let getTodoQuery = "";

  if (status !== undefined && priority !== undefined) {
    getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
    data = await db.all(getTodoQuery);
    response.send(data);
  } else if (priority !== undefined) {
    if (priorityList.includes(priority)) {
      getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      data = await db.all(getTodoQuery);
      response.send(data);
    } else {
      invalidPriority(response);
    }
  } else if (status !== undefined) {
    if (statusList.includes(status)) {
      getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      data = await db.all(getTodoQuery);
      response.send(data);
    } else {
      invalidStatus(response);
    }
  } else if (category !== undefined && status !== undefined) {
    getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';`;
    data = await db.all(getTodoQuery);
    response.send(data);
  } else if (category !== undefined && priority !== undefined) {
    getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%'
        AND category = '${category}'
        AND priority = '${priority}';`;
    data = await db.all(getTodoQuery);
    response.send(data);
  } else if (category !== undefined) {
    if (categoryList.includes(category)) {
      getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%'
        AND category = '${category}';`;
      data = await db.all(getTodoQuery);
      response.send(data);
    } else {
      invalidCategory(response);
    }
  } else {
    getTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE todo LIKE '%${search_q}%';`;
    data = await db.all(getTodoQuery);
    response.send(data);
  }
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `select * from todo where id= ${todoId};`;

  const data = await db.get(getTodoQuery);
  response.send(convertTodoObjectToResponseObject(data));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const formatDate = format(new Date(date), "yyyy-MM-dd");
  if (isValid(new Date(date)) === false) {
    invalidDate(response);
  } else {
    const selectTodoQuery = `SELECT id,todo,priority,status,category,due_date AS dueDate FROM todo WHERE due_date='${date}';`;
    const todoResponse = await db.all(selectTodoQuery);
    response.send(todoResponse);
  }
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (statusList.includes(status) === false) {
    invalidStatus(response);
  } else if (priorityList.includes(priority) === false) {
    invalidPriority(response);
  } else if (categoryList.includes(category) === false) {
    invalidCategory(response);
  } else if (isValid(new Date(dueDate)) === false) {
    invalidDate(response);
  } else {
    const createTodoQuery = `INSERT INTO 
                                todo (id,todo,priority,status,category,due_date) 
                            VALUES ('${id}','${todo}','${priority}','${status}','${category}','${dueDate}')`;
    const createResponse = await db.run(createTodoQuery);
    response.send("Todo Successfully Added");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  let data = null;
  let getTodoQuery = "";

  if (status !== undefined) {
    if (statusList.includes(status)) {
      getTodoQuery = `UPDATE todo SET status = '${status}' WHERE id ='${todoId}';`;
      data = await db.run(getTodoQuery);
      response.send("Status Updated");
    } else {
      invalidStatus(response);
    }
  } else if (priority !== undefined) {
    if (priorityList.includes(priority)) {
      getTodoQuery = `UPDATE todo SET priority = '${priority}' WHERE id ='${todoId}';`;
      data = await db.run(getTodoQuery);
      response.send("Priority Updated");
    } else {
      invalidPriority(response);
    }
  } else if (todo !== undefined) {
    getTodoQuery = `UPDATE todo SET todo = '${todo}' WHERE id ='${todoId}';`;
    data = await db.run(getTodoQuery);
    response.send("Todo Updated");
  } else if (category !== undefined) {
    if (categoryList.includes(category)) {
      getTodoQuery = `UPDATE todo SET category = '${category}' WHERE id ='${todoId}';`;
      data = await db.run(getTodoQuery);
      response.send("Category Updated");
    } else {
      invalidCategory(response);
    }
  } else if (isValid(new Date(dueDate)) === false) {
    invalidDate(response);
  } else {
    const real_date = format(new Date(dueDate), "yyyy-MM-dd");
    getTodoQuery = `UPDATE todo SET due_date = '${real_date}' WHERE id ='${todoId}';`;
    data = await db.run(getTodoQuery);
    response.send("Due Date Updated");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `DELETE FROM todo WHERE id= '${todoId}';`;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
