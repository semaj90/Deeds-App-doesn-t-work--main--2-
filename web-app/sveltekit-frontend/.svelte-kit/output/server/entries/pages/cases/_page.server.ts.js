import { d as db, c as cases } from "../../../chunks/index3.js";
import { eq } from "drizzle-orm";
import { r as redirect } from "../../../chunks/index.js";
const load = async ({ locals }) => {
  const user = locals.user;
  const session = locals.session;
  if (!session || !user) {
    throw redirect(302, "/login");
  }
  try {
    const userCases = await db.select().from(cases).where(eq(cases.createdBy, user.id));
    return {
      session,
      user,
      cases: userCases
    };
  } catch (error) {
    console.error("Error loading cases:", error);
    return {
      session,
      cases: []
    };
  }
};
export {
  load
};
