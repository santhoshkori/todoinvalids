const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format_date = require("date-fns/format");
var isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());

const main_path = path.join(__dirname, "todoApplication.db");
let todo_DB = null;
const intilize_todo_DB = async () => {
  try {
    todo_DB = await open({
      filename: main_path,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at 3000");
    });
  } catch (e) {
    console.log(`${e.message}`);
    process.exit(1);
  }
};
intilize_todo_DB();

const has_status = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const has_priority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const has_priority_and_has_status = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const has_category_and_has_status = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const has_category = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const has_category_and_has_priority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const change_label = (id) => {
  return {
    id: id.id,
    todo: id.todo,
    priority: id.priority,
    status: id.status,
    category: id.category,
    dueDate: id.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  const { status, search_q = "", priority, category } = request.query;
  let todo_query;
  const statusValid = ["TO DO", "IN PROGRESS", "DONE"];
  const priorityvalid = ["HIGH", "MEDIUM", "LOW"];
  const categoryValids = ["WORK", "HOME", "LEARNING"];
  switch (true) {
    case has_status(request.query):
      const validate = statusValid.includes(status);

      if (validate === false) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        todo_query = `
      SELECT 
      *
      FROM
      todo
      WHERE
      status = "${status}" AND todo LIKE "%${search_q}%"
      ;`;
        const get_details = await todo_DB.all(todo_query);
        response.send(
          get_details.map((id) => {
            return change_label(id);
          })
        );
      }
      break;
    case has_priority(request.query):
      const validpriority = priorityvalid.includes(priority);
      if (validpriority === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        todo_query = `
      SELECT
      *
      FROM
      todo
      WHERE
      priority="${priority}" AND todo LIKE "%${search_q}%"
      ;`;
        const get_details = await todo_DB.all(todo_query);
        response.send(
          get_details.map((id) => {
            return change_label(id);
          })
        );
      }

      break;
    case has_priority_and_has_status(request.query):
      todo_query = `
      SELECT
      *
      FROM
      todo
      WHERE
      priority="${priority}" And status ="${status}" AND todo LIKE "%${search_q}%"
      ;`;
      break;
    case has_category_and_has_status(request.query):
      todo_query = `
      SELECT 
      *
      FROM 
      todo
      WHERE
      category="${category}" AND status="${status}" AND todo LIKE "%${search_q}%"
      ;`;
      break;
    case has_category(request.query):
      const validcategory = categoryValids.includes(category);
      if (validcategory === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        todo_query = `
      SELECT
      *
      FROM 
      todo
      WHERE
      category="${category}" AND todo LIKE "%${search_q}%"
      ;`;
        const get_details = await todo_DB.all(todo_query);
        response.send(
          get_details.map((id) => {
            return change_label(id);
          })
        );
      }
      break;
    case has_category_and_has_priority(request.query):
      todo_query = `
      SELECT
      *
      FROM
      todo
      WHERE 
      category="${category}" AND priority="${priority}" AND todo LIKE "%${search_q}%"
      ;`;
      break;
    default:
      todo_query = `
      SELECT
      *
      FROM 
      todo
      WHERE
      todo LIKE "%${search_q}%"
      ;`;
      const get_details = await todo_DB.all(todo_query);
      response.send(
        get_details.map((id) => {
          return change_label(id);
        })
      );
      break;
  }
  //console.log(todo_query);
});

///2---get by todo id
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const get_by_id_query = `
  SELECT
  *
  FROM 
  todo 
  WHERE 
  id=${todoId}
  ;`;
  const get_todoby_id = await todo_DB.get(get_by_id_query);
  response.send(change_label(get_todoby_id));
});

///api3----Returns a list of all todos with a specific due date in the query parameter /agenda/?date=2021-12-12
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const validate_date = isValid(new Date(date));
  const formatted_date = format_date(new Date(date), "yyyy-MM-dd");
  console.log(formatted_date);
  console.log(validate_date);

  if (validate_date === false) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    const specific_todo_query = `
  SELECT
  *
  FROM 
  todo
  WHERE
  due_date="${formatted_date}"
  ;`;

    const specific_todo = await todo_DB.all(specific_todo_query);
    response.send(
      specific_todo.map((eachspectodo) => change_label(eachspectodo))
    );
  }
});
//api---4Create a todo in the todo table,
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const post_data_query = `
  INSERT INTO todo
  
  (id,todo,priority,status,category,due_date)
  VALUES
  (${id},"${todo}","${priority}","${status}","${category}","${dueDate}")
  ;`;
  const post_data = await todo_DB.run(post_data_query);
  response.send("Todo Successfully Added");
});

//api--5 Updates the details of a specific todo based on the todo ID

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  console.log(todoId);
  const unq_todo_query = `
  SELECT
  *
  FROM 
  todo
  WHERE
  id=${todoId} 
  ;`;
  const unq_todo = await todo_DB.get(unq_todo_query);
  //console.log(unq_todo);
  const {
    todo = unq_todo.todo,
    priority = unq_todo.priority,
    status = unq_todo.status,
    category = unq_todo.category,
    duedate = unq_todo.due_date,
  } = request.body;
  const statusValid = ["TO DO", "IN PROGRESS", "DONE"];
  const priorityvalid = ["HIGH", "MEDIUM", "LOW"];
  let value_updated = "";
  switch (true) {
    case request.body.status !== undefined:
      value_updated = "Status";
      const status_valids = statusValid.includes(request.body.status);
      if (status_valids === false) {
        response.status(400);
        response.send(`Invalid Todo ${value_updated}`);
      } else {
        const updatestatusquery = `
        UPDATE todo
        SET
        status="${request.body.status}"
        WHERE
        id=${todoId}
        ;`;
        const updatestatus = await todo_DB.run(updatestatusquery);
        response.send("Status Updated");
      }
      break;
    case request.body.priority !== undefined:
      const priorityvalids = priorityvalid.includes(priority);
      //console.log(priorityvalids);
      if (priorityvalids === false) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        value_updated = "Priority";
        const updatePriorityquery = `
        UPDATE todo
        SET
        priority="${priority}"
        WHERE
        id=${todoId}
        ;`;
        const updatepriority = await todo_DB.run(updatePriorityquery);
        response.send(`Updated ${value_updated}`);
      }
      break;
    case category !== undefined:
      const categoryValids = ["WORK", "HOME", "LEARNING"];
      const categoryValid = categoryValids.includes(category);
      //console.log(categoryValid);
      if (categoryValid === false) {
        response.status(400);
        response.send("Invalid Todo Category");
      } else {
        value_updated = "Category";
        const validcategory_query = `
        UPDATE todo
        SET
        category="${category}"
        WHERE
        id=${todoId}
        ;`;
        const validcategory = await todo_DB.run(validcategory_query);
        response.send(`Updated ${value_updated}`);
      }

      break;

    default:
      value_updated = "Todo";
      const updatetodo_query = `
      UPDATE todo
      SET
      todo="${todo}"
      WHERE
        id=${todoId}
      ;`;

      const update_todo = await todo_DB.run(updatetodo_query);
      response.send(`Updated ${value_updated}`);
      break;
  }
  //console.log(todo);
});
module.exports = app;
