const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
var format = require("date-fns/format");

app.use(express.json());
let database = null;
const dbpath = path.join(__dirname, "todoApplication.db");

const initializeDbServer = async () => {
  try {
    database = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("server Running at http//:localhost:3000/")
    );
  } catch (error) {
    console.log(`Db error ${error.message}`);
    process.exit(1);
  }
};

initializeDbServer();
const hasStatus = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const convertof = (eachp) => {
  return {
    id: eachp.id,
    todo: eachp.todo,
    priority: eachp.priority,
    status: eachp.status,
    category: eachp.category,
    dueDate: eachp.due_date,
  };
};
const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hastodo = (requestQuery) => {
  return requestQuery.todo !== undefined;
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
        SELECT * FROM todo 
        WHERE
         todo LIKe '%${search_q}%' And category='${category}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
      break;
  }

  data = await database.all(getTodosQuery);
  response.send(data.map((eachObject) => convertof(eachObject)));
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const selectQuery = `
    select * from todo where id=${todoId};`;
  const responseDb = await database.get(selectQuery);
  response.send(convertof(responseDb));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  var formatDate = format(new Date(date), "yyyy - MM - dd");
  const selectQuery = `
  SELECT * FROM todo where due_date='${formatDate}';`;
  const responseDb = await database.all(selectQuery);
  console.log(responseDb);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const createQuery = `
    INSERT INTO todo (id,todo,category,priority,status,due_date)
    VALUES
        (${id},
        '${todo}',
        '${category}'
        '${priority}',
        '${status}',,
        ${dueDate});`;
  await database.run(createQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    date = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      date='${date}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `
    delete from todo where id=${todoId};`;
  await database.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
