import swaggerAutogen from 'swagger-autogen';

const doc = {
  info:{
    title:"Playtube RestAPI",
    description:"Test description"
  },
  host: 'localhost:3000',
  schemas:['http'],
  tags:[]
}

const outputFile = './swagger.output.json';
const endPointsFiles = ['./src/app.js'];

swaggerAutogen()(outputFile, endPointsFiles, doc).then(async () => {
  await import('./src/app.js');
});