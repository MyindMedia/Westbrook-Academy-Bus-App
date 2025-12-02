import { GoogleGenAI } from "@google/genai";
import { AttendanceLog, Bus, RouteType, Student, GeoPoint, StudentStatus, Incident } from "../types";
import { SCHOOL_ADDRESS } from "./mockData";

export const generateTripReport = async (
  bus: Bus,
  routeType: RouteType,
  logs: AttendanceLog[],
  allStudents: Student[],
  tripStats: {
    start: GeoPoint | null;
    end: GeoPoint | null;
  },
  incidents: Incident[]
): Promise<string> => {
  
  if (!process.env.API_KEY) {
    console.warn("No API KEY found");
    return "API Key missing. Cannot generate intelligent report.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Determine Route path
  const origin = routeType === RouteType.AM_PICKUP ? bus.endpointAddress : SCHOOL_ADDRESS;
  const destination = routeType === RouteType.AM_PICKUP ? SCHOOL_ADDRESS : bus.endpointAddress;
  const routeDescription = `${origin} TO ${destination}`;

  // Format data for the model
  const tripData = {
    busName: bus.name,
    driver: bus.driverName,
    routeType: routeType,
    routeDescription: routeDescription,
    expectedOrigin: origin,
    expectedDestination: destination,
    date: new Date().toLocaleDateString(),
    startTime: tripStats.start?.timestamp ? new Date(tripStats.start.timestamp).toLocaleTimeString() : 'Unknown',
    endTime: tripStats.end?.timestamp ? new Date(tripStats.end.timestamp).toLocaleTimeString() : 'Unknown',
    startLocationGPS: tripStats.start ? `${tripStats.start.lat.toFixed(5)}, ${tripStats.start.lng.toFixed(5)}` : 'GPS Unavailable',
    endLocationGPS: tripStats.end ? `${tripStats.end.lat.toFixed(5)}, ${tripStats.end.lng.toFixed(5)}` : 'GPS Unavailable',
    totalStudentsAssigned: allStudents.length,
    incidents: incidents.map(i => ({ type: i.type, severity: i.severity, description: i.description })),
    studentManifest: allStudents.map(student => {
      const log = logs.find(l => l.studentId === student.id);
      return {
        name: student.name,
        grade: student.grade,
        status: log ? log.status : StudentStatus.ABSENT, // Assume absent if not logged by end of trip
        checkInTime: log ? new Date(log.timestamp).toLocaleTimeString() : 'N/A'
      };
    })
  };

  const prompt = `
    You are an AI assistant for Westbrook Academy Transportation. 
    Write a concise, professional summary report for Microsoft Teams based on the completed bus trip data below.
    
    **Trip Data:**
    ${JSON.stringify(tripData, null, 2)}
    
    **Instructions:**
    1. Start with a header: **Trip Report: ${tripData.busName} (${tripData.routeType === RouteType.AM_PICKUP ? 'AM' : 'PM'})**
    2. Explicitly state the route: "${tripData.routeDescription}".
    3. Include start/end times.
    4. Create an "Attendance" section. Explicitly list who was "On Bus/Dropped Off" and who was "Absent".
    5. **Important:** If there are incidents listed in the data, create a specific "**INCIDENT REPORT**" section highlighted in bold/alert style. Summarize the incident.
    6. Note if the GPS coordinates provided (${tripData.startLocationGPS} / ${tripData.endLocationGPS}) seem reasonably close to the expected locations (just a general note if they are wildly off, otherwise ignore).
    7. Use clear Markdown formatting with bold headers and bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Report generation failed.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating report with AI.";
  }
};
