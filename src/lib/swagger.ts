import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api", // define api folder
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Sports Mate API",
        version: "1.0",
        description: "Sports Mate API Documentation",
      },
      security: [],
    },
  });
  return spec;
};
