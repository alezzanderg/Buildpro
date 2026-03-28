import { Router, type IRouter, type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/users/me", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user.id));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

router.put("/users/me", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { firstName, lastName } = req.body as {
    firstName?: string;
    lastName?: string;
  };
  const [updated] = await db
    .update(usersTable)
    .set({
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, req.user.id))
    .returning();
  res.json(updated);
});

export default router;
