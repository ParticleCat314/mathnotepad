var nodeCount = 0;
var currentBox = 0;
var boxMap = new Map<string,InputBox>;
var boxMenu: SelectionMenu = null;
var canvasMenu: SelectionMenu = null;
var mouseX = 0;
var mouseY = 0;
var currentBoxDrag: InputBox | null = null;
var globalScale = 1.0;
var globalX = 0;
var globalY = 0;

function worldToScreenX(x: number) {
    return globalScale * (x) + window.innerWidth * 0.5 + globalX;
}
function worldToScreenY(y: number) {
    return globalScale * (y) + window.innerHeight * 0.5 + globalY;
}
function screenToWorldX(x: number) {
    return (x - window.innerWidth * 0.5 - globalX) / globalScale;
}
function screenToWorldY(y: number) {
    return (y - window.innerWidth * 0.5 - globalY) / globalScale;
}

class InputBox {

  id: string;
  boxElement: HTMLElement;
  moves: boolean;
  moving: boolean;
  x: number;
  y: number;
  

  constructor(id: string) {
    let defaultText: string = "f(x)=";
    this.id = id;
    this.boxElement = document.createElement("div");
    this.boxElement.id = id;
    this.boxElement.className = "mathBox";
    this.boxElement.innerHTML = "<math-field math-virtual-keyboard-policy='manual' id='"+"mathformula"+this.id+"' oncontextmenu='return false;'>"+defaultText+"</math-field>";
    this.boxElement.style.scale = String(globalScale);
    this.boxElement.setAttribute("oncontextmenu","return false;");
    this.moves = true;
    this.moving = false;
    document.body.appendChild(this.boxElement);
    let mf = document.getElementById("mathformula"+id);
    mf.menuItems = [];

    this.x = (window.event as MouseEvent).clientX-0.5*window.innerWidth/globalScale;
    this.y = (window.event as MouseEvent).clientY-0.5*window.innerHeight/globalScale;
    this.boxElement.style.left = worldToScreenX(this.x)+"px";
    this.boxElement.style.top = worldToScreenY(this.y)+"px";
  }
  updatePagePosition() {
    this.boxElement.style.left = worldToScreenX(this.x)+"px";
    this.boxElement.style.top = worldToScreenY(this.y)+"px";
  }

  getPosition() {
    return [this.x,this.y];
  }
  setPosition(x:number,y: number) {
    this.x = x;
    this.y = y;
    this.updatePagePosition();
  }

  move(x: number,y: number) {
    this.setPosition(x+this.x,y+this.y);
  }

  remove() {
    this.boxElement.remove();
  }
  scale(s: number) {
    this.boxElement.style.scale = String(s);
  }
}



class SelectionMenu {
  visible: boolean = false;
  menuElement: HTMLElement;
  menuOption: HTMLElement;


  constructor(id: string, styleClass: string,innerHTML: string) {
    this.menuElement = document.createElement("div");
    this.menuElement.className = styleClass;
    this.menuElement.id = id;
    this.menuElement.innerHTML = innerHTML;
    document.body.appendChild(this.menuElement);
    
    this.menuOption = this.menuElement.childNodes[0] as HTMLElement;

    this.menuElement.addEventListener("mouseleave", e=> {
      this.toggleMenu("hide");
    });
  }
  addMenuOption(text: string,action: ()=>void) {
    //(this.menuOption as HTMLElement).innerHTML += "<li class='menu-option'>"+text+"</li>";
    let option = document.createElement("li");
    option.className = "menu-option";
    option.innerHTML = text;
    option.onclick = action;
    (this.menuOption as HTMLElement).appendChild(option);
  }

  toggleMenu(command: string) {
    this.menuElement.style.display = command === "show" ? "block" : "none";
    this.visible= !this.visible;
  };

  setPosition(left: number,top: number) {
    this.menuElement.style.left = String(left-5)+"px";
    this.menuElement.style.top = String(top-5)+"px";
    this.toggleMenu("show");
  }

}



addEventListener("load", (event) => {
  canvasMenu = new SelectionMenu(
    "canvasmenu",
    "menu",
    "<ul class='menu-options'></ul></div>"
  );
  canvasMenu.addMenuOption("Insert Math",addMathBox);
  boxMenu = new SelectionMenu(
    "boxmenu",
    "menu",
    "<ul class='menu-options'></ul></div>"
  );
  boxMenu.addMenuOption("Remove",deleteMathBox);
  boxMenu.addMenuOption("Toggle movement",toggleMovement);

  document.getElementById("canvas").addEventListener("click", e => {
    if (!e.ctrlKey) {
      if ((e.target as HTMLElement).matches("mathBox")) {
        currentBox = Number((e.target as HTMLElement).id);
        if (boxMenu.visible) boxMenu.toggleMenu("hide");
      }
      if ((e.target as HTMLElement).id=="canvas") {
        if (canvasMenu.visible) canvasMenu.toggleMenu("hide");
      }
    }
  });

  addEventListener("wheel", (event: WheelEvent) => {
    let sign = 1;
        
    let mx = event.clientX-0.5*window.innerWidth;
    let my = event.clientY-0.5*window.innerHeight;

    if (event.deltaY<0) {
      globalScale *= 1.2;
      globalX += (globalX-mx)*1.2-(globalX-mx);
      globalY += (globalY-my)*1.2-(globalY-my);
    }
    if (event.deltaY>0) {
      sign = -1;
      globalScale /= 1.2;
      globalX += (globalX-mx)*1/1.2-(globalX-mx);
      globalY += (globalY-my)*1/1.2-(globalY-my);
    }
    scrollMathDivs();
  });

  document.getElementById("canvas").addEventListener("contextmenu", e => {
    let eventTarget = e.target as HTMLElement;
    e.preventDefault();
    if (eventTarget.id=="canvas") {
        if (!e.ctrlKey) {
        canvasMenu.setPosition(e.pageX,e.pageY);
        return false;
        }
    }
    if (eventTarget.matches("math-field")) {
        currentBox = Number((eventTarget.parentNode as HTMLElement).id);
        if (!e.ctrlKey) {
                if (boxMenu.visible) boxMenu.toggleMenu("show");
          boxMenu.setPosition(e.pageX,e.pageY);
        }
    }

  });

  document.getElementById("canvas").addEventListener("mousedown", (e: MouseEvent) => {
    if ((e.target as HTMLElement).matches("math-field") && e.ctrlKey) {
      dragMouseDown(e);
    }
    else {
      dragViewPort(e);
    }
  });

 
  let pos1 = 0;
  let pos2 = 0;
  let mouseX = 0;
  let mouseY = 0;

  function dragViewPort(e: MouseEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    document.onmouseup = closeDragViewPort;
    // call a function whenever the cursor moves:
    document.onmousemove = viewPortDrag;
  }

  function viewPortDrag(e: MouseEvent) {
    console.log("dragging", globalX);
    e.preventDefault();

    // calculate the new cursor position:
    pos1 = mouseX - e.clientX;
    pos2 = mouseY - e.clientY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    globalX -= pos1;
    globalY -= pos2;

  }

  function closeDragViewPort(e: MouseEvent) {
    document.onmouseup = null;
    document.onmousemove = null;
    currentBoxDrag = null;
  }

  function dragMouseDown(e: MouseEvent) {
    currentBoxDrag = boxMap.get((((e.target as HTMLElement).parentNode as HTMLElement).id));
    currentBoxDrag.moving = true;
    e.preventDefault();
    if (e.ctrlKey) {
      // get the mouse cursor position at startup:
      mouseX = e.clientX;
      mouseY = e.clientY;
      document.onmouseup = closeDragElement;
      // call a function whenever the cursor moves:
      document.onmousemove = elementDrag;
    }
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
    currentBoxDrag.moving = false;
    currentBoxDrag = null;
  }


  function elementDrag(e: MouseEvent) {
    console.log("here");
    //e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:b
    pos1 = mouseX - e.clientX;
    pos2 = mouseY - e.clientY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    currentBoxDrag.move(-pos1/globalScale,-pos2/globalScale);
  }
  console.log("page loaded");
});


function scrollMathDivs() {
  for (const key of boxMap.keys()) {
    let box = boxMap.get(key);
    box.scale(globalScale);
  }
}

function toggleMovement() {
  boxMap.get(String(currentBox)).moves = !boxMap.get(String(currentBox)).moves;
}

function addMathBox() {
  nodeCount += 1;
  boxMap.set(String(nodeCount),new InputBox(String(nodeCount)));
  canvasMenu.toggleMenu("hide");
}

function deleteMathBox() {
  boxMap.get(String(currentBox)).remove();
  boxMap.delete(String(currentBox));
  boxMenu.toggleMenu("hide");
}


function computeBoxMotion(deltaTime: number) {
  for (const key1 of boxMap.keys()) {
    boxMap.get(key1).updatePagePosition();
    for (const key2 of boxMap.keys()) {
      if ((key1!==key2) && (boxMap.get(key1).moves===true) && (boxMap.get(key2).moves===true) && (boxMap.get(key1).moving===false)) {
        let a = boxMap.get(key1);
        let b = boxMap.get(key2);
        
        let rx = a.x-b.x;
        let ry = a.y-b.y;

        let dist = Math.sqrt(rx*rx+ry*ry);
        if (dist<500) {

          
          let rxN = rx/dist;
          let ryN = ry/dist;
          let forceX = -0.0001*((100-dist)*(100-dist)*rxN)+(2/dist*dist)*rxN;
          let forceY = -0.0001*((100-dist)*(100-dist)*ryN)+(2/dist*dist)*ryN;
          a.move(forceX,forceY);
        }
      }
    }
  }
}



window.requestAnimationFrame(gameLoop);
var oldTimeStamp: number;
var secondsPassed: number;

function updateBoxes() {
 for (const key1 of boxMap.keys()) {
    boxMap.get(key1).updatePagePosition();
  }
}

// Probably should try to find an alternativ to running it as a game loop
function gameLoop(timeStamp: number) {
  secondsPassed = (timeStamp - oldTimeStamp) / 1000;
  oldTimeStamp = timeStamp;
  computeBoxMotion(secondsPassed);
  //updateBoxes();
  window.requestAnimationFrame(gameLoop);
}


