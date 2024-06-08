import swaggerAutogen from 'swagger-autogen';

const doc = {
  info:{
    title:"Playtube RestAPI",
    description:"A simple Playtube API application with Swagger"
  },
  host: 'localhost:3000',
  schemas:['http'],
  tags:[],
  components: {
    securitySchemes:{
        bearerAuth: {
            type: 'http',
            scheme: 'bearer'
        }
    }
}

}

const outputFile = './swagger.output.json';
const endPointsFiles = ['./src/app.js'];

swaggerAutogen()(outputFile, endPointsFiles, doc).then(async () => {
  await import('./src/app.js');
});