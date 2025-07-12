import { Request, Response } from "express";
import { registerProjectService } from "@/services/project.service";

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
