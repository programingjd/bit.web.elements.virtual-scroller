class VirtualScrollerElement extends HTMLElement{

constructor(){
  super();
  this._window=this._placeholder=this._template=this._model=null;
  this._height=this._rowHeight=this._rowCount=this._itemCount=0;
  this._colCount=1;
  this._clones=[];this._indices=[];
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
    this._rowOffset=0;
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
    this._clones=[];
    this._indices=[];
    this._window.innerHTML='';
    return;
  }
  this.shadowRoot.host.style.height='100vh';
  this.shadowRoot.host.style.overflow='hidden';
  const heights=this._heights(this.shadowRoot.host);
  const first=this._clones.length?this._clones[this._clones.length-1]:this._addElement();
  const rowHeight=this._rowHeight=this._heights(first).reduce((sum,cur)=>sum+cur,0);
  const viewportHeight=this.shadowRoot.host.getBoundingClientRect().height-heights[0]-heights[2];
  const colCount=this._colCount=this._cols();
  const itemCount=this._itemCount=this._count();
  const rowCount=this._rowCount=Math.ceil(itemCount/colCount);
  this._placeholder.style.height=`${rowCount*rowHeight}px`;
  const windowRowCount=Math.min(rowCount,Math.ceil(viewportHeight/rowHeight)*3);
  while(this._clones.length<windowRowCount*colCount) this._addElement();
  while(this._clones.length>windowRowCount*colCount) this._removeElement();
  this._indices.fill(-1);
  this.shadowRoot.host.style.height='auto';
  this.shadowRoot.host.style.overflow='auto';
  this._render();
  this._height=this.clientHeight;
}

_render(){
  const scrollTop=this.scrollTop;
  const rowHeight=this._rowHeight;
  let offset=scrollTop-scrollTop%rowHeight;
  const firstVisibleRowIndex=Math.trunc(scrollTop/rowHeight);
  let firstWindowRowIndex=firstVisibleRowIndex;
  let max=this._clones.length/3;
  while(firstWindowRowIndex>0&&max-->0){
    --firstWindowRowIndex;
    offset-=rowHeight;
  }
  const rowCount=this._rowCount;
  const itemCount=this._itemCount;
  this._window.style.top=`${offset}px`;
  this._clones.forEach((el,i)=>{
    const index=i+firstWindowRowIndex;
    if(i>itemCount){
      el.style.visibility='hidden';
      this._indices[i]=-1;
    }else{
      el.style.visibility='visible';
      if(this._indices[i]!==index){
        this._indices[i]=index;
        el.textContent=`Row ${index+1}`;
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

_addElement(){
  const el=document.importNode(this._template.content,true);
  if(el.children.length===1){
    this._clones.push(this.appendChild(el.children.item(0)));
  }else{
    const div=document.createElement('div');
    div.appendChild(el);
    this._clones.push(this.appendChild(div));
  }
  this._indices.push(-1);
  return this._clones[this._clones.length-1];
}

_removeElement(){
  const el=this._clones.pop();
  this._indices.pop();
  el.parentElement.removeChild(el);
}

}

customElements.define('virtual-scroller', VirtualScrollerElement);

export { VirtualScrollerElement as default }
