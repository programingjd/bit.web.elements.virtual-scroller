const http = require('http');
const fs = require('fs').promises;

const contentTypes = new Map([
  [ "html", "text/html" ],
  [ "js", "application/javascript" ],
  [ "mjs", "application/javascript" ],
  [ "json", "application/json" ]
]);


const server = exports.server = http.createServer((request,response)=>{
  const path = new URL(request.url, 'http://localhost/').pathname.substring(1);
  const i = path.lastIndexOf('.');
  if(i === -1) {
    response.writeHead(404);
    response.end();
    return;
  }
  const contentType = contentTypes.get(path.substring(i+1));
  if(!contentType) {
    response.writeHead(404);
    response.end();
    return;
  }
  fs.stat(`${__dirname}/../${path}`).then(it=>{
      response.writeHead(200,{
        "Content-Type":contentType,
        "Cache-Control":"no-cache"
      });
      fs.readFile(`${__dirname}/../${path}`).then(it=>{
        response.end(it);
      });
    }
  ).catch(_=>{
    response.writeHead(404);
    response.end();
  });
});

server.listen(8080);

