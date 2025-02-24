// car-flows.ts
import axios from "axios";
import moment from "moment";

interface CarQuoteData {
  name: string;
  email: string;
  dob: string;
  make: string;
  model: string;
  trim: string;
  year: string;
  number: string;
}

export const CAR_QUOTATION_FLOW = [
  {
    field: "year",
    question: (data: any) =>
      `Let's start with your car details. What's the manufacturing year?`,
    validate: (value: string, data: any) =>
      data.years?.includes(value) && /^\d{4}$/.test(value),
    error: (data: any) =>
      `Please Enter one from available years: ${
        data.years?.join(", ") || "1990-2024"
      }`,
    function: "get_years",
  },

  {
    field: "model",
    question: (data: any) =>
      `Available models for ${data.make}: ${data.models.join(
        ", "
      )}. Which model?`,
    validate: (value: string, data: any) => data.models.includes(value),
    error: "Please select a valid model from the list",
    function: "get_models",
  },
  {
    field: "trim",
    question: (data: any) =>
      `Available trims for ${data.model}: ${data.trims.join(
        ", "
      )}. Which trim?`,
    validate: (value: string, data: any) => data.trims.includes(value),
    error: "Please select a valid trim from the list",
    function: "get_trims",
  },
  {
    field: "dob",
    question: "Please enter your date of birth (DD-MM-YYYY)",
    validate: (value: string) => moment(value, "DD-MM-YYYY").isValid(),
    error: "Please enter a valid date in DD-MM-YYYY format",
  },
  {
    field: "name",
    question: "Please enter your full name",
    validate: (value: string) => value.trim().length > 3,
    error: "Please enter a valid name",
  },
  {
    field: "email",
    question: "Please enter your email address",
    validate: (value: string) => /\S+@\S+\.\S+/.test(value),
    error: "Please enter a valid email address",
  },
  {
    field: "number",
    question: "Please enter your mobile number",
    validate: (value: string) => /^\d{10}$/.test(value),
    error: "Please enter a valid 10-digit phone number",
  },
];

export async function handleCarFunction(functionName: string, params: any) {
  try {
    console.log("params", functionName);
    switch (functionName) {
      case "get_years":
        const years = await getYear();
        console.log("params", years);
        return {
          message: `Available years: ${years.join(", ")}`,
          data: { years },
        };

      case "get_cars":
     
        const makes = await getCars(params.year);
        
        console.log("params", makes);
        return {
          message: `Available makes for ${params.year}: ${makes.join(", ")}`,
          data: { makes },
        };

      case "get_models":
        const models = await getModels(params.make, params.year);
        return {
          message: `Available models for ${params.make}: ${models.join(", ")}`,
          data: { models },
        };

      case "get_trims":
        const trims = await getTrims(params.make, params.year, params.model);
        return {
          message: `Available trims: ${trims.join(", ")}`,
          data: { trims },
        };

      default:
        return { error: "Function not implemented" };
    }
  } catch (error) {
    console.error("Car function error:", error);
    return { error: "Failed to retrieve data. Please try again." };
  }
}

// API Functions
async function getCars(year: string) {
  console.log("year", year);
  const response = await axios.get(
    `https://api.dev.esanad.com/api/cars/getnewcars?year=${year}`
  );
  return response.data.data;
}

async function getYear() {
  try {
    const response = await axios.get(
      `https://api.dev.esanad.com/api/cars/getyears`,
      { timeout: 5000 }
    );
    return response.data.data || [];
  } catch (error) {
    console.error("Year API error:", error);
    return [];
  }
}

async function getModels(make: string, year: string) {
  const response = await axios.post(
    `https://api.dev.esanad.com/api/cars/ `,
    { make, year }
  );
  return response.data.data;
}

async function getTrims(make: string, year: string, model: string) {
  const response = await axios.post(
    "https://api.dev.esanad.com/api/cars/gettrim",
    { make, year, model }
  );
  return response.data.data;
}

export async function getQuotes(data: CarQuoteData) {
  const url = "https://api.dev.esanad.com/api/generatem/generatequotes";
  const body = {
    fullName: data.name,
    email: data.email,
    dateOfBirth: moment(data.dob, "DD-MM-YYYY").format("DD-MM-YYYY"),
    make: data.make,
    model: data.model,
    trim: data.trim,
    oneYearLicence: true,
    year: data.year,
    mobileNumber: data.number,
    policyEffectiveDate: new Date().toISOString().split("T")[0],
  };

  const response = await axios.post(url, body);
  return response.data.data.quotesUrl;
}
