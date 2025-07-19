import { Request, Response } from "express";
import { registerUserService } from "@/services/register-user-service";

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, authMethod } = req.body;

    if (!email || !["email", "google"].includes(authMethod)) {
      res.status(400).json({ error: "Invalid email or auth method" });
      return;
    }

    const user = await registerUserService({
      email,
      auth_method: authMethod,
    });

    res.status(201).json({
      message: "User registered successfully",
      user, 
    });
  } catch (error: any) {
    console.error("❌ Register error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
