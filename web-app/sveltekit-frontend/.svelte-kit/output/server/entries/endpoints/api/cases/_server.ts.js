import { j as json } from "../../../../chunks/index.js";
const GET = async () => {
  try {
    const cases = [
      {
        id: "1",
        title: "Sample Case #1",
        status: "active",
        priority: "high",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        description: "A sample case for testing purposes"
      },
      {
        id: "2",
        title: "Sample Case #2",
        status: "pending",
        priority: "medium",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        description: "Another sample case for testing"
      }
    ];
    return json(cases);
  } catch (error) {
    console.error("Error fetching cases:", error);
    return json({ error: "Failed to fetch cases" }, { status: 500 });
  }
};
const POST = async ({ request }) => {
  try {
    const data = await request.json();
    const newCase = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "pending"
    };
    return json(newCase, { status: 201 });
  } catch (error) {
    console.error("Error creating case:", error);
    return json({ error: "Failed to create case" }, { status: 500 });
  }
};
export {
  GET,
  POST
};
