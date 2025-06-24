import { d as db, c as cases } from "../../../../chunks/index3.js";
import { r as redirect } from "../../../../chunks/index.js";
import { eq } from "drizzle-orm";
const load = async ({ params, locals }) => {
  const user = locals.user;
  const session = locals.session;
  if (!session || !user) {
    throw redirect(302, "/login");
  }
  const caseId = params.id;
  try {
    const caseDetails = await db.query.cases.findFirst({
      where: eq(cases.id, caseId),
      with: { evidence: true, criminals: { with: { criminal: true } } }
      // Eager load evidence and criminals
    });
    if (!caseDetails) {
      throw redirect(302, "/cases");
    }
    return {
      session,
      caseDetails
    };
  } catch (error) {
    console.error("Error loading case:", error);
    throw redirect(302, "/cases");
  }
};
const actions = {
  updateCase: async ({ request, params, locals }) => {
    const user = locals.user;
    const session = locals.session;
    if (!session || !user) {
      throw redirect(302, "/login");
    }
    const caseId = params.id;
    try {
      const data = await request.formData();
      const status = data.get("status");
      await db.update(cases).set({
        title: data.get("title"),
        description: data.get("description"),
        dangerScore: parseInt(data.get("dangerScore")) || 0,
        status,
        aiSummary: data.get("aiSummary") || null,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        closedAt: status === "closed" ? (/* @__PURE__ */ new Date()).toISOString() : null
      }).where(eq(cases.id, caseId));
      return { success: true, message: "Case updated successfully" };
    } catch (error) {
      console.error("Error updating case:", error);
      return { success: false, error: "Failed to update case" };
    }
  }
};
export {
  actions,
  load
};
