const http = require('http');
const fs = require('fs');

const contentTypes = new Map([
  [ "html", "text/html" ],
  [ "js", "application/javascript" ],
  [ "mjs", "application/javascript" ],
  [ "json", "application/json" ]
]);

const nyc = require.main === module ? false : (()=>{
  try{
    return !!fs.statSync(`${__dirname}/../.nyc/virtual-scroller.mjs`);
  }catch(_){
    return false;
  }
})();

if(nyc) console.log('using instrumented code');

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
  const p = `${__dirname}/../${nyc&&request.url==='/virtual-scroller.mjs'?'.nyc/virtual-scroller.mjs':path}`;
  fs.promises.stat(p).then(it=>{
      response.writeHead(200,{
        "Content-Type":contentType,
        "Cache-Control":"no-cache"
      });
      fs.promises.readFile(p).then(it=>{
        response.end(it);
      });
    }
  ).catch(_=>{
    response.writeHead(404);
    response.end();
  });
});

if (require.main === module) server.listen(80);

