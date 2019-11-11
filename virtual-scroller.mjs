class VirtualScrollerElement extends HTMLElement{

constructor(){
  super();
  this._window=this._placeholder=this._template=this._model=null;
  this._height=this._rowHeight=this._rowCount=this._itemCount=0;
  this._colCount=1;
  this._clones=[];this._rowIndices=[];
  this.attachShadow({mode:'open'}).innerHTML=`
<style>
:host{position:relative;display:block;overflow:auto}
:host>div>div{position:relative;margin:0;padding:0;overflow:hidden}
:host>div>div:nth-child(2)>div{position:absolute;top:0;right:0;left:0;margin:0;padding:0;display:grid;grid-auto-rows:auto}}
</style>
<div>
  <div><slot name="header"></slot></div>
  <div>
    <div><slot></slot></div>
  </div>
  <div><slot name="footer"></div>
</div>`;
}

connectedCallback(){
  this._placeholder=this.shadowRoot.querySelectorAll(':host>div>div')[1];
  this._window=this._placeholder.querySelector('div');
  this._template=this.querySelector('template');
  if(!this._template){
    this._template=document.createElement('template');
    this._template.innerHTML='<div>template</div>';
  }
  if(this._model) this._layout();
  this.shadowRoot.host.addEventListener('scroll',this._render.bind(this));
  new ResizeObserver(_=>{
    const height=this.clientHeight;
    if(Math.abs(height-this._height)>this._rowHeight) this._layout();
  }).observe(this);
}

set model(model){
  if(this._model!==model){
    this._model=model;
  }
  if(this.isConnected) this._layout();
}

get model(){
  return this._model;
}

_layout(){
  console.log('layout');
  const count=this._count();
  if(count===0){
    while(this._clones.length>0) this._removeRow();
    return;
  }
  this.shadowRoot.host.style.height='100vh';
  this.shadowRoot.host.style.overflow='hidden';
  const colCount=this._cols();
  const firstRow=this._clones.length?this._clones[this._clones.length-1]:this._addRow(colCount);
  const rowHeight=this._rowHeight=this._heights(firstRow).reduce((sum,cur)=>sum+cur,0);
  const heights=this._heights(this.shadowRoot.host);
  const viewportHeight=this.shadowRoot.host.getBoundingClientRect().height-heights[0]-heights[2];
  if(colCount!==this._colCount){
    this._colCount=colCount;
    while(this._clones.length>0) this._removeRow();
  }
  const itemCount=this._itemCount=this._count();
  const rowCount=this._rowCount=Math.ceil(itemCount/colCount);
  this._placeholder.style.height=`${rowCount*rowHeight}px`;
  const windowRowCount=Math.min(rowCount,Math.ceil(viewportHeight/rowHeight)*3);
  while(this._clones.length<windowRowCount) this._addRow(colCount);
  while(this._clones.length>windowRowCount) this._removeRow();
  this._rowIndices.fill(-1);
  this.shadowRoot.host.style.height='auto';
  this.shadowRoot.host.style.overflow='auto';
  this._render();
  this._height=this.clientHeight;
}

_render(){
  const scrollTop=this.scrollTop;
  const rowHeight=this._rowHeight;
  let offset=scrollTop-scrollTop%rowHeight;
  let firstWindowRowIndex=Math.trunc(scrollTop/rowHeight);
  let max=this._clones.length/3;
  while(firstWindowRowIndex>0&&max-->0){
    --firstWindowRowIndex;
    offset-=rowHeight;
  }
  const colCount=this._colCount;
  const rowCount=this._rowCount;
  const itemCount=this._itemCount;
  this._window.style.top=`${offset}px`;
  const model=this._model;
  const render=model.render||((el,i)=>el.textContent=`${i+1}`);
  this._clones.forEach((row,i)=>{
    const rowIndex=i+firstWindowRowIndex;
    if(i>rowCount){
      row.style.visibility='hidden';
      this._rowIndices[i]=-1;
    }else{
      row.style.visibility='visible';
      if(this._rowIndices[i]!==rowIndex){
        this._rowIndices[i]=rowIndex;
        if(colCount===1) render(row,rowIndex,rowIndex,0);
        else{
          const cells=row.children;
          for(let colIndex=0; colIndex<colCount; ++colIndex){
            const cell=cells.item(colIndex);
            const itemIndex=rowIndex*colCount+colIndex;
            if(itemIndex>itemCount) cell.style.visibility='hidden';
            else{
              cell.style.visibility='visible';
              render(cell,itemIndex,rowIndex,colIndex);
            }
          }
        }
      }
    }
  });
}

_cols(){
  const t=typeof (this._model||{}).cols;
  if(t==='function') return this._model.cols();
  if(t==='number') return this._model.cols;
  return 1;
}

_count(){
  const t=typeof (this._model||{}).count;
  if(t==='function') return this._model.count();
  if(t==='number') return this._model.count;
  return this._model.length||0;
}

_heights(el){
  const style=getComputedStyle(el);
  return [parseFloat(style.marginTop),parseFloat(style.height),parseFloat(style.marginBottom)];
}

_clone(){
  const el=document.importNode(this._template.content,true);
  if(el.children.length===1) return el.children.item(0);
  const div=document.createElement('div');
  div.appendChild(el);
  return div;
}

_row(colCount){
  if(colCount===1) return this._clone();
  const div=document.createElement('div');
  for(let i=0;i<colCount;++i){
    div.appendChild(this._clone());
  }
  div.style.display='grid';
  div.style.gridTemplateColumns='repeat(3,1fr)';
  return div;
}

_addRow(colCount){
  const row=this._row(colCount);
  this.appendChild(row);
  this._clones.push(row);
  this._rowIndices.push(-1);
  return row;
}

_removeRow(){
  const el=this._clones.pop();
  this._rowIndices.pop();
  el.parentElement.removeChild(el);
}

}

customElements.define('virtual-scroller', VirtualScrollerElement);

export { VirtualScrollerElement as default }
