import { r as redirect } from "../../../chunks/index.js";
import { d as db, c as cases, b as crimes, a as criminals, e as evidence } from "../../../chunks/index3.js";
import { count, eq } from "drizzle-orm";
const load = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, "/login");
  }
  try {
    const [
      totalCases,
      openCases,
      closedCases,
      totalCrimes,
      totalCriminals,
      totalEvidence,
      felonyCases,
      misdemeanorCases,
      citationCases
    ] = await Promise.all([
      // Total cases
      db.select({ count: count() }).from(cases),
      // Open cases
      db.select({ count: count() }).from(cases).where(eq(cases.status, "open")),
      // Closed cases  
      db.select({ count: count() }).from(cases).where(eq(cases.status, "closed")),
      // Total crimes
      db.select({ count: count() }).from(crimes),
      // Total criminals
      db.select({ count: count() }).from(criminals),
      // Total evidence
      db.select({ count: count() }).from(evidence),
      // Felony cases
      db.select({ count: count() }).from(crimes).where(eq(crimes.chargeLevel, "felony")),
      // Misdemeanor cases
      db.select({ count: count() }).from(crimes).where(eq(crimes.chargeLevel, "misdemeanor")),
      // Citation cases
      db.select({ count: count() }).from(crimes).where(eq(crimes.chargeLevel, "citation"))
    ]);
    const userStats = {
      totalCases: totalCases[0]?.count || 0,
      openCases: openCases[0]?.count || 0,
      closedCases: closedCases[0]?.count || 0,
      totalCrimes: totalCrimes[0]?.count || 0,
      totalCriminals: totalCriminals[0]?.count || 0,
      totalEvidence: totalEvidence[0]?.count || 0,
      felonyCases: felonyCases[0]?.count || 0,
      misdemeanorCases: misdemeanorCases[0]?.count || 0,
      citationCases: citationCases[0]?.count || 0
    };
    return {
      user: locals.user,
      session: locals.session,
      userStats
    };
  } catch (error) {
    console.error("Error loading user stats:", error);
    return {
      user: locals.user,
      session: locals.session,
      userStats: {
        totalCases: 0,
        openCases: 0,
        closedCases: 0,
        totalCrimes: 0,
        totalCriminals: 0,
        totalEvidence: 0,
        felonyCases: 0,
        misdemeanorCases: 0,
        citationCases: 0
      }
    };
  }
};
export {
  load
};
