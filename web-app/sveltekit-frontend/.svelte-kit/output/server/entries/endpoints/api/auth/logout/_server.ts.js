import { j as json } from "../../../../../chunks/index.js";
const POST = async () => {
  try {
    return json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout error:", error);
    return json({ error: "Logout failed" }, { status: 500 });
  }
};
export {
  POST
};
