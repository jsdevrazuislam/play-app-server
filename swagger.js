import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  swaggerDefinition: {
    restapi: "3.0.0",
    info: {
      title: "My API",
      version: "1.0.0",
      description: "My REST API",
    },
    servers: [
      {
        url: "http://localhost:3000",
      },
    ],
    tags: [
      {
        name: 'User',
        description: 'Operations related to users',
      },
      {
        name: 'Product',
        description: 'Operations related to products',
      },
    ],
  },
  apis: ["./src/routes/**/*.js"],
};

const specs = swaggerJsdoc(options);

export const swagger = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));
};
