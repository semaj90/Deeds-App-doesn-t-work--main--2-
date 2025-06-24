import { f as fail, r as redirect } from "../../../../chunks/index.js";
import { d as db, c as cases } from "../../../../chunks/index3.js";
import { randomUUID } from "crypto";
const actions = {
  create: async ({ request, locals }) => {
    const form = await request.formData();
    const title = form.get("title")?.toString();
    const description = form.get("description")?.toString();
    const dangerScore = Number(form.get("dangerScore")) || 0;
    const status = form.get("status")?.toString() || "open";
    const aiSummary = form.get("aiSummary")?.toString() || null;
    if (!title || !description) {
      return fail(400, { error: "Title and description are required." });
    }
    const id = randomUUID();
    const user = locals.user;
    const session = locals.session;
    const createdBy = user?.id;
    if (!createdBy || !session) {
      return fail(401, { error: "Not authenticated." });
    }
    try {
      await db.insert(cases).values({
        id,
        caseNumber: `CASE-${(/* @__PURE__ */ new Date()).getFullYear()}-${Date.now().toString().slice(-6)}`,
        // Generate unique case number
        title,
        description,
        dangerScore,
        status,
        aiSummary,
        createdBy
      });
      throw redirect(303, `/cases/${id}`);
    } catch (e) {
      console.error(e);
      return fail(500, { error: "Failed to create case." });
    }
  }
};
export {
  actions
};
