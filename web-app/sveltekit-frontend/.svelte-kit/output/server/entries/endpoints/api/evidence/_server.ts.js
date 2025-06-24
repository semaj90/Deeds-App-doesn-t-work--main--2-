import { j as json } from "../../../../chunks/index.js";
const GET = async () => {
  try {
    const evidence = [
      {
        id: "1",
        title: "Surveillance Video - Main Street",
        type: "video",
        caseId: "1",
        uploadedBy: "Officer Smith",
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
        description: "Security footage from the incident location",
        status: "verified"
      },
      {
        id: "2",
        title: "Witness Statement - John Doe",
        type: "document",
        caseId: "1",
        uploadedBy: "Detective Johnson",
        uploadedAt: new Date(Date.now() - 36e5).toISOString(),
        description: "Written statement from key witness",
        status: "pending"
      },
      {
        id: "3",
        title: "Fingerprint Analysis",
        type: "forensic",
        caseId: "2",
        uploadedBy: "Lab Tech Davis",
        uploadedAt: new Date(Date.now() - 72e5).toISOString(),
        description: "Fingerprint analysis results",
        status: "verified"
      }
    ];
    return json(evidence);
  } catch (error) {
    console.error("Error fetching evidence:", error);
    return json({ error: "Failed to fetch evidence" }, { status: 500 });
  }
};
const POST = async ({ request }) => {
  try {
    const data = await request.json();
    const newEvidence = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      uploadedAt: (/* @__PURE__ */ new Date()).toISOString(),
      status: "pending"
    };
    return json(newEvidence, { status: 201 });
  } catch (error) {
    console.error("Error creating evidence:", error);
    return json({ error: "Failed to create evidence" }, { status: 500 });
  }
};
export {
  GET,
  POST
};
