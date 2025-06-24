import { j as json } from "../../../../chunks/index.js";
const GET = async () => {
  try {
    const statutes = [
      {
        id: "1",
        title: "Robbery - First Degree",
        code: "PC 211",
        description: "The felonious taking of personal property in the possession of another, from his person or immediate presence, against his will, accomplished by means of force or fear.",
        penalty: "Imprisonment in state prison for two, three, or five years",
        category: "Theft",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      {
        id: "2",
        title: "Assault with Deadly Weapon",
        code: "PC 245(a)(1)",
        description: "Any person who commits an assault upon the person of another with a deadly weapon or instrument other than a firearm.",
        penalty: "Imprisonment in state prison for two, three, or four years, or in county jail for not exceeding one year",
        category: "Assault",
        updatedAt: new Date(Date.now() - 864e5).toISOString()
      },
      {
        id: "3",
        title: "Fraud - Wire Fraud",
        code: "18 USC 1343",
        description: "Whoever, having devised or intending to devise any scheme or artifice to defraud, transmits or causes to be transmitted by means of wire communication.",
        penalty: "Fine or imprisonment not more than 20 years, or both",
        category: "Fraud",
        updatedAt: new Date(Date.now() - 1728e5).toISOString()
      }
    ];
    return json(statutes);
  } catch (error) {
    console.error("Error fetching statutes:", error);
    return json({ error: "Failed to fetch statutes" }, { status: 500 });
  }
};
const POST = async ({ request }) => {
  try {
    const data = await request.json();
    const newStatute = {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return json(newStatute, { status: 201 });
  } catch (error) {
    console.error("Error creating statute:", error);
    return json({ error: "Failed to create statute" }, { status: 500 });
  }
};
export {
  GET,
  POST
};
