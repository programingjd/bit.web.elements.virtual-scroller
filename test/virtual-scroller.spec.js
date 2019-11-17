const assert = require('assert');
const http = require('http');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const delay=millis=>new Promise(resolve=>setTimeout(resolve,millis));

let server;
let browser;

before(async function(){
  this.timeout(10000);
  server = require('./serve').server;
  browser = await puppeteer.launch({
    args: [ '--disable-gpu', '--disable-setuid-sandbox', '--no-sandbox' ],
    dumpio: true
  });
  console.log(browser);
});

after(async ()=>{
  server.close();
  await browser.close();
});

describe('Minimal', function(){
  this.timeout(10000);
  let page;
  before(async()=>{
    page = await browser.newPage();
    await page.setViewport({ width: 600, height: 600 });
    await page.goto(
      `http://localhost:8080/test/data/minimal.html`,
      { timeout: 5000, waitUntil: 'networkidle0' }
    );
  });
  after(async()=>{
    await page.close();
  });
  it('page loaded',async ()=>{
    assert.strictEqual(await page.title(), 'Minimal');
    const body = await page.$('body');
    assert.strictEqual(await page.evaluate(it=>it.classList.contains('loaded'),body), true);
  });
  it('scrollbar', async()=>{
    assert.strictEqual(await page.evaluate(()=>document.elementFromPoint(100,5).textContent), 'a');
    const element = await page.$('virtual-scroller');
    assert.strictEqual(await page.evaluate(it=>it.offsetHeight<it.scrollHeight,element),true);
    await page.evaluate(it=>it.scrollTop+=200, element);
    await delay(50);
    assert.strictEqual(await page.evaluate(it=>it.scrollTop, element), 200);
    assert.strictEqual(await page.evaluate(()=>document.elementFromPoint(100,5).textContent), 'f');
    await page.evaluate(it=>it.scrollTop+=400, element);
    await delay(50);
    assert.strictEqual(await page.evaluate(it=>it.scrollTop, element), 336);
    assert.strictEqual(await page.evaluate(()=>document.elementFromPoint(100,5).textContent), 'j');
  });
});

describe('Small', function(){
  this.timeout(10000);
  let page;
  before(async()=>{
    page = await browser.newPage();
    await page.setViewport({ width: 600, height: 600 });
    await page.goto(
      `http://localhost:8080/test/data/small.html`,
      { timeout: 5000, waitUntil: 'networkidle0' }
    );
  });
  after(async()=>{
    await page.close();
  });
  it('page loaded',async ()=>{
    assert.strictEqual(await page.title(), 'Small');
    const body = await page.$('body');
    assert.strictEqual(await page.evaluate(it=>it.classList.contains('loaded'),body), true);
  });
  it('scrollbar', async()=>{
    assert.strictEqual(await page.evaluate(()=>document.elementFromPoint(100,5).textContent), '1');
    const element = await page.$('virtual-scroller');
    assert.strictEqual(await page.evaluate(it=>it.offsetHeight<it.scrollHeight,element),false);
    await page.evaluate(it=>it.scrollTop+=200, element);
    await delay(50);
    assert.strictEqual(await page.evaluate(it=>it.scrollTop, element), 0);
  });
});

describe('Small with columns', function(){
  this.timeout(10000);
  let page;
  before(async()=>{
    page = await browser.newPage();
    await page.setViewport({ width: 600, height: 600 });
    await page.goto(
      `http://localhost:8080/test/data/small_cols.html`,
      { timeout: 5000, waitUntil: 'networkidle0' }
    );
  });
  after(async()=>{
    await page.close();
  });
  it('page loaded',async ()=>{
    assert.strictEqual(await page.title(), 'Small with columns');
    const body = await page.$('body');
    assert.strictEqual(await page.evaluate(it=>it.classList.contains('loaded'),body), true);
  });
  it('scrollbar', async()=>{
    assert.strictEqual(await page.evaluate(()=>document.elementFromPoint(5,5).textContent), '1');
    assert.strictEqual(await page.evaluate(()=>document.elementFromPoint(300,5).textContent), '2');
    assert.strictEqual(await page.evaluate(()=>document.elementFromPoint(595,5).textContent), '3');
    const element = await page.$('virtual-scroller');
    assert.strictEqual(await page.evaluate(it=>it.offsetHeight<it.scrollHeight,element),false);
    await page.evaluate(it=>it.scrollTop+=200, element);
    await delay(50);
    assert.strictEqual(await page.evaluate(it=>it.scrollTop, element), 0);
  });
});

describe('Simple', function(){
  this.timeout(10000);
  let page;
  before(async()=>{
    page = await browser.newPage();
    await page.setViewport({ width: 600, height: 600 });
    await page.goto(
      `http://localhost:8080/test/data/simple.html`,
      { timeout: 5000, waitUntil: 'networkidle0' }
    );
  });
  after(async()=>{
    await page.close();
  });
  it('page loaded',async ()=>{
    assert.strictEqual(await page.title(), 'Simple');
    const body = await page.$('body');
    assert.strictEqual(await page.evaluate(it=>it.classList.contains('loaded'),body), true);
  });
  it('scrollbar', async()=>{
    const element = await page.$('virtual-scroller');
    assert.strictEqual(await page.evaluate(it=>it.offsetHeight<it.scrollHeight,element),true);
    const checkIndices=async (x,y,index,row,col)=>{
      const text = await page.evaluate(p=>document.elementFromPoint(p.x,p.y).textContent,{x,y});
      const obj = JSON.parse(text);
      assert.strictEqual(obj.index, index);
      assert.strictEqual(obj.row, row);
      assert.strictEqual(obj.col, col);
    };
    await checkIndices(5,5, 0, 0, 0);
    await checkIndices(595,5, 1, 0, 1);
    await page.evaluate(it=>it.scrollTop+=200, element);
    await delay(50);
    assert.strictEqual(await page.evaluate(it=>it.scrollTop, element), 200);
    await checkIndices(595, 5, 9, 4, 1);
    await page.evaluate(it=>it.scrollTop+=200, element);
    await delay(50);
    assert.strictEqual(await page.evaluate(it=>it.scrollTop, element), 400);
    await checkIndices(595, 595, 41, 20, 1);
    await page.evaluate(it=>it.scrollTop+=10000*64, element);
    await delay(50);
    assert.strictEqual(await page.evaluate(it=>it.scrollTop, element), 239400);
    await checkIndices(50, 5, 9974, 4987, 0);
  });
});

describe('Jouyou', function(){
  this.timeout(10000);
  let page;
  before(async()=>{
    page = await browser.newPage();
    await page.setViewport({ width: 600, height: 600 });
    await page.goto(
      `http://localhost:8080/test/data/jouyou.html`,
      { timeout: 5000, waitUntil: 'networkidle0' }
    );
  });
  after(async()=>{
    await page.close();
  });
  it('page loaded',async ()=>{
    assert.strictEqual(await page.title(), 'Jouyou');
    const body = await page.$('body');
    assert.strictEqual(await page.evaluate(it=>it.classList.contains('loaded'),body), true);
  });
  it('scrollbar', async()=>{
    assert.strictEqual(
      await page.evaluate(
        ()=>document.elementsFromPoint(50,50).find(it=>it.tagName.toLowerCase()==='div').title
      ),
      '人'
    );
    assert.strictEqual(
      await page.evaluate(
        ()=>document.elementsFromPoint(50,50).find(it=>it.tagName.toLowerCase()==='svg')!==null
      ),
      true
    );
    const element = await page.$('virtual-scroller');
    await page.evaluate(it=>it.scrollTop+=200, element);
    await delay(50);
    assert.strictEqual(await page.evaluate(it=>it.scrollTop, element), 200);
    assert.strictEqual(
      await page.evaluate(
        ()=>document.elementsFromPoint(50,50).find(it=>it.tagName.toLowerCase()==='div').title
      ),
      '大'
    );
    await page.evaluate(it=>it.scrollTop+=2000, element);
    await delay(50);
    assert.strictEqual(await page.evaluate(it=>it.scrollTop, element), 2200);
    assert.strictEqual(
      await page.evaluate(
        ()=>document.elementsFromPoint(50,50).find(it=>it.tagName.toLowerCase()==='div').title
      ),
      '来'
    );
    await page.evaluate(it=>it.scrollTop+=10000, element);
    await delay(50);
    assert.strictEqual(await page.evaluate(it=>it.scrollTop, element), 12200);
    assert.strictEqual(
      await page.evaluate(
        ()=>document.elementsFromPoint(50,50).find(it=>it.tagName.toLowerCase()==='div').title
      ),
      '由'
    );
    await page.evaluate(it=>it.scrollTop+=100000, element);
    await delay(50);
    assert.strictEqual(await page.evaluate(it=>it.scrollTop, element), 90536);
    assert.strictEqual(
      await page.evaluate(
        ()=>document.elementsFromPoint(50,50).find(it=>it.tagName.toLowerCase()==='div').title
      ),
      '虞'
    );
  });
});
