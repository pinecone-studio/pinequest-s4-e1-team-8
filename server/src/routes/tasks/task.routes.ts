import { Hono } from "hono";
import { createTask } from "../../controllers/tasks/post-task";
import { deleteTask } from "../../controllers/tasks/delete-task";
import { getTask } from "../../controllers/tasks/get-task";
import { getTasks } from "../../controllers/tasks/get-tasks";
import { updateTask } from "../../controllers/tasks/patch-task";
import { Bindings } from "../../lib/common/types";

const taskRoutes = new Hono<{ Bindings: Bindings }>();

taskRoutes.get("/", getTasks);
taskRoutes.get("/:id", getTask);
taskRoutes.post("/", createTask);
taskRoutes.patch("/:id", updateTask);
taskRoutes.delete("/:id", deleteTask);

export default taskRoutes;
