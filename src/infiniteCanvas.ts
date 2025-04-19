
interface canvasItem {
  domID: string;
  positionX: number;
  positionY: number;
  scale: (scale: number)=>(void);
  update: (offsetX: number,offsetY: number, scale: number)=>(void);
  move: (x: number, y: number)=>(void);
  remove: ()=>(void);
  toggleMovement: ()=>(void);
  isMoveable: boolean;
}

// A helper class that can manage object placement
// and movement about the infiniteCanvas.
class infiniteCanvas {
  offsetX: number = 0;
  offsetY: number = 0;
  scale: number = 1;
  items: Map<string,canvasItem> = new Map<string,canvasItem>;
  itemCount: number = 0;
  // Stuff related to tracking mouse input
  mouseX: number = 0;
  mouseY: number = 0;

  // Keep track of objects being manipulated
  currentSelection: canvasItem | null = null;

  constructor() {}

  insertItem(newItem: canvasItem) {
    this.items.set(newItem.domID,newItem);
    newItem.update(this.offsetX,this.offsetY,this.scale);
    newItem.scale(this.scale);
  }


  insertItemInputBox() {
    this.itemCount+= 1;
    this.insertItem(new InputBox(String(this.itemCount)));
  }

  removeItem(itemID: string) {
    this.items.get(itemID).remove();
    this.items.delete(itemID);
  }

  updateCanvas() {
    for (const [key,value] of this.items) {
      value.update(this.offsetX,this.offsetY,this.scale);
    }
  }

  scaleItems() {
    for (const [key,value] of this.items) {
      value.scale(this.scale);
    }
  }
  // FuncglobalScaletion that zooms into or out of the canvas based on a wheelEvent
  zoom(event: WheelEvent) {
    let sign = 1;  
    let mx = event.clientX-0.5*window.innerWidth;
    let my = event.clientY-0.5*window.innerHeight;

    // Zoom in
    if (event.deltaY<0) {
      this.scale *= 1.2;
      this.offsetX += (this.offsetX-mx)*1.2-(this.offsetX-mx);
      this.offsetY += (this.offsetY-my)*1.2-(this.offsetY-my);
    }
    // Zoom out
    if (event.deltaY>0) {
      sign = -1;
      this.scale /= 1.2;
      this.offsetX += (this.offsetX-mx)*1/1.2-(this.offsetX-mx);
      this.offsetY += (this.offsetY-my)*1/1.2-(this.offsetY-my);
    }

    this.scaleItems();
  }
  

  // Entry point for panning around the canvas. 
  startPan(event: MouseEvent) {
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
    document.onmouseup = (event: MouseEvent)=>{this.closePan(this,event)};
    document.onmousemove = (event: MouseEvent)=>{this.pan(this,event)};
  }
  pan(caller: infiniteCanvas,event: MouseEvent) {
    event.preventDefault();
    // calculate the new cursor position:
    let pos1 = this.mouseX - event.clientX;
    let pos2 = this.mouseY - event.clientY;
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
    this.offsetX -= pos1;
    this.offsetY -= pos2;
    console.log(this);
  }

  closePan(caller: infiniteCanvas, event: MouseEvent) {
    document.onmouseup = null;
    document.onmousemove = null;
  }



  selectItem(itemID: string) {
    this.currentSelection = this.items.get(itemID);
  }

  selectNone() {
    this.currentSelection = null;
  }


  startDragItem(event: MouseEvent) {
    this.selectItem(((event.target as HTMLElement).parentNode as HTMLElement).id);
    event.preventDefault();
    if (event.ctrlKey) {
      // get the mouse cursor position at startup:
      this.mouseX = event.clientX; 
      this.mouseY = event.clientY;
      document.onmouseup = (event: MouseEvent)=>{this.closeDragItem(event)};
      // call a function whenever the cursor moves:
      document.onmousemove = (event: MouseEvent)=>{this.dragItem(event)};
    }
  }
  dragItem(event: MouseEvent) {
    event.preventDefault();
    let pos1 = this.mouseX - event.clientX;
    let pos2 = this.mouseY - event.clientY;
    this.mouseX = event.clientX;
    this.mouseY = event.clientY;
    this.currentSelection.move(-pos1/this.scale,-pos2/this.scale);
  }

  closeDragItem(event: MouseEvent) {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    this.selectNone(); 
  }
}
