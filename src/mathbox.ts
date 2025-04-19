function worldToScreenX(x: number,globalX: number, globalScale: number) {
    return globalScale * (x) + window.innerWidth * 0.5 + globalX;
}
function worldToScreenY(y: number, globalY: number, globalScale: number) {
    return globalScale * (y) + window.innerHeight * 0.5 + globalY;
}


class InputBox {

  domID: string;
  boxElement: HTMLElement;
  isMoveable: boolean;
  moving: boolean;
  positionX: number;
  positionY: number;
  
  constructor(id: string, globalScale: number=1) {
    let defaultText: string = "f(x)=";
    this.domID = id;
    this.boxElement = document.createElement("div");
    this.boxElement.id = id;
    this.boxElement.className = "mathBox";
    this.boxElement.innerHTML = "<math-field math-virtual-keyboard-policy='manual' id='"+"mathformula"+this.domID+"' oncontextmenu='return false;'>"+defaultText+"</math-field>";
    this.boxElement.style.scale = String(globalScale);
    this.boxElement.style.transformOrigin = "left top";
    this.boxElement.setAttribute("oncontextmenu","return false;");
    this.isMoveable = true;
    this.moving = false;
    document.body.appendChild(this.boxElement);
    let mf = document.getElementById("mathformula"+id);
    mf.menuItems = [];

    this.positionX = (window.event as MouseEvent).clientX-0.5*window.innerWidth/globalScale;
    this.positionY = (window.event as MouseEvent).clientY-0.5*window.innerHeight/globalScale;
    this.boxElement.style.left = worldToScreenX(this.positionX,0,1)+"px";
    this.boxElement.style.top = worldToScreenY(this.positionY,0,1)+"px";
  }

  update(offsetX: number, offsetY: number, scale: number) {
    this.boxElement.style.left = worldToScreenX(this.positionX,offsetX,scale)+"px";
    this.boxElement.style.top = worldToScreenY(this.positionY,offsetY,scale)+"px";
  }

  getPosition() {
    return [this.positionX,this.positionY];
  }
  setPosition(x:number,y: number) {
    this.positionX = x;
    this.positionY = y;
  }

  move(x: number,y: number) {
    this.setPosition(x+this.positionX,y+this.positionY);
  }

  remove() {
    this.boxElement.remove();
  }
  scale(s: number) {
    this.boxElement.style.scale = String(s);
  }

  toggleMovement() {
    this.isMoveable= !this.isMoveable;
  }
}

