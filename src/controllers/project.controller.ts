import { Request, Response } from "express";
import {
  registerProjectService,
  getProjectByIdService,
  getAllProjectsService,
  getPaginatedProjectsService,
} from "@/services/project-service";

export const registerProjectController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const project = req.body;
    const savedProject = await registerProjectService(project);

    res.status(201).json({
      message: "Project registered successfully",
      data: savedProject,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error registering project" });
  }
};

export const getProjectByIdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const project = await getProjectByIdService(id);

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.status(200).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching project" });
  }
};

export const getAllProjectsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const projects = await getAllProjectsService();
    res.status(200).json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching all projects" });
  }
};

export const getPaginatedProjectsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    if (page < 1 || limit < 1) {
      res.status(400).json({ error: "Invalid pagination parameters. Page and limit must be positive numbers." });
      return;
    }

    const paginatedResult = await getPaginatedProjectsService(page, limit);
    res.status(200).json(paginatedResult);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching paginated projects" });
  }
};