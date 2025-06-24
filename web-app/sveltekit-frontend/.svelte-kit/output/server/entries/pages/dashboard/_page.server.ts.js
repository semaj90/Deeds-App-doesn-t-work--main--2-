import { r as redirect } from "../../../chunks/index.js";
import { d as db, c as cases, a as criminals } from "../../../chunks/index3.js";
const load = async ({ locals }) => {
  if (!locals.session || !locals.user) {
    throw redirect(302, "/login");
  }
  const recentCases = await db.select().from(cases).limit(5).orderBy(cases.createdAt);
  const recentCriminals = await db.select().from(criminals).limit(6).orderBy(criminals.createdAt);
  return {
    recentCases,
    recentCriminals
  };
};
export {
  load
};
