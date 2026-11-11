const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function create(req, res, next) {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  try {
    const newTask = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(201).json(newTask);
  } catch (err) {
    return next(err);
  }
}

async function index(req, res, next) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id,
      },
      select: {
        title: true,
        isCompleted: true,
        id: true,
      },
    });

    if (tasks.length === 0) {
      return res.status(404).json({
        message: "No tasks found.",
      });
    }

    return res.status(200).json(tasks);
  } catch (err) {
    return next(err);
  }
}

async function show(req, res, next) {
  const id = parseInt(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found.",
      });
    }

    return res.status(200).json(task);
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  const { error, value } = patchTaskSchema.validate(req.body ?? {}, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  const id = parseInt(req.params.id);

  try {
    const task = await prisma.task.update({
      data: value,
      where: {
        id,
        userId: global.user_id,
      },
      select: {
        title: true,
        isCompleted: true,
        id: true,
      },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "The task was not found.",
      });
    } else {
      return next(err);
    }
  }
}

async function deleteTask(req, res, next) {
  const id = parseInt(req.params.id);

  try {
    await prisma.task.delete({
      where: {
        id,
        userId: global.user_id,
      },
    });

    return res.status(200).json({
      message: "Task deleted successfully.",
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        message: "Task not found.",
      });
    } else {
      return next(err);
    }
  }
}

module.exports = {
  create,
  index,
  show,
  update,
  deleteTask,
};
