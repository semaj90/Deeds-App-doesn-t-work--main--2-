import { j as json } from "../../../../../chunks/index.js";
const GET = async () => {
  try {
    const recentCases = [
      {
        id: "1",
        title: "Robbery Investigation",
        status: "active",
        priority: "high",
        createdAt: new Date(Date.now() - 864e5).toISOString(),
        // 1 day ago
        lastActivity: new Date(Date.now() - 36e5).toISOString()
        // 1 hour ago
      },
      {
        id: "2",
        title: "Fraud Case Review",
        status: "pending",
        priority: "medium",
        createdAt: new Date(Date.now() - 1728e5).toISOString(),
        // 2 days ago
        lastActivity: new Date(Date.now() - 72e5).toISOString()
        // 2 hours ago
      },
      {
        id: "3",
        title: "Assault Investigation",
        status: "closed",
        priority: "low",
        createdAt: new Date(Date.now() - 6048e5).toISOString(),
        // 1 week ago
        lastActivity: new Date(Date.now() - 864e5).toISOString()
        // 1 day ago
      }
    ];
    return json(recentCases);
  } catch (error) {
    console.error("Error fetching recent cases:", error);
    return json({ error: "Failed to fetch recent cases" }, { status: 500 });
  }
};
export {
  GET
};
