var nodeCount = 0;
var currentBox = 0;
var boxMap = new Map();
var boxMenu = null;
var canvasMenu = null;
var mouseX = 0;
var mouseY = 0;
var currentBoxDrag = 0;


var globalScale = 1.0;
var globalX = 0;
var globalY = 0;

function worldToScreenX(x) {
  return globalScale*(x)+window.innerWidth*0.5+globalX;
}
function worldToScreenY(y) {
  return globalScale*(y)+window.innerHeight*0.5+globalY;
}

function screenToWorldX(x) {
  return (x-window.innerWidth*0.5-globalX)/globalScale;
}

function screenToWorldY(y) {
  return (y-window.innerWidth*0.5-globalY)/globalScale;
}

class InputBox {
  constructor(id,defaultText="f(x)=") {
    console.log(id);
    this.id = id;
    this.boxElement = document.createElement("div");
    this.boxElement.id = id;
    this.boxElement.className = "mathBox";
    this.boxElement.innerHTML = "<math-field math-virtual-keyboard-policy='manual' id='"+"mathformula"+this.id+"' oncontextmenu='return false;'>"+defaultText+"</math-field>";
    this.boxElement.style.scale = globalScale;
    this.boxElement.setAttribute("oncontextmenu","return false;");
    this.moves = true;
    document.body.appendChild(this.boxElement);
    let mf = document.getElementById("mathformula"+id);
    mf.menuItems = [];
    this.menuOption = this.box;
    this.x = (event.pageX-0.5*window.innerWidth)/globalScale;
    this.y = (event.pageY-0.5*window.innerHeight)/globalScale;
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
  setPosition(x,y) {
    this.x = x;
    this.y = y;
    this.updatePagePosition();
  }

  move(x,y) {
    this.setPosition(x+this.x,y+this.y);
  }

  remove() {
    this.boxElement.remove();
  }
  scale(s) {
    this.boxElement.style.scale = s;
  }
}

function scrollMathDivs() {
  for (const key of boxMap.keys()) {
    let box = boxMap.get(key);
    box.scale(globalScale);
  }
}

class Menu {
  constructor(id, styleClass,innerHTML) {
    this.visible = false;
    this.menuElement = document.createElement("div");
    this.menuElement.className = styleClass;
    this.menuElement.id = id;
    this.menuElement.innerHTML = innerHTML;
    document.body.appendChild(this.menuElement);
    
    this.menuOption = this.menuElement.childNodes[0];

    this.menuElement.addEventListener("mouseleave", e=> {
      this.toggleMenu("hide");
    });
  }
  addMenuOption(text,action) {
    this.menuElement.childNodes[0].innerHTML += "<li class='menu-option' onclick="+action+">"+text+"</li>";
  }

  toggleMenu(command) {
    this.menuElement.style.display = command === "show" ? "block" : "none";
    this.visible= !this.visible;
  };

  setPosition({top,left}) {
    this.menuElement.style.left = `${left-5}px`;
    this.menuElement.style.top = `${top-5}px`;
    this.toggleMenu("show");
  }

}


addEventListener("load", (event) => {
  canvasMenu = new Menu(
    "canvasmenu",
    "menu",
    "<ul class='menu-options'></ul></div>"
  );
  canvasMenu.addMenuOption("Insert Math","addMathBox()");
  //canvasMenu.addMenuOption("Insert Text","addTextBox()");

  boxMenu = new Menu(
    "boxmenu",
    "menu",
    "<ul class='menu-options'></ul></div>"
  );
  boxMenu.addMenuOption("Remove","deleteMathBox()");
  //boxMenu.addMenuOption("Derivative","createDerivative()");
  //boxMenu.addMenuOption("Integral","createIntegral()");
  boxMenu.addMenuOption("Toggle movement","toggleMovement()");

  document.getElementById("canvas").addEventListener("click", e => {
    if (!e.ctrlKey) {
      if (e.target.matches("mathBox")) {
        currentBox = e.target.id;
        //console.log("here matches mathbox", event.target);
        if (boxMenu.visible) boxMenu.toggleMenu("hide");
      }
      if (e.target.id=="canvas") {
        //console.log("matches canvasmenu");
        if (canvasMenu.visible) canvasMenu.toggleMenu("hide");
      }
    }
  });

  addEventListener("wheel", (event) => {
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
    e.preventDefault();
    console.log(e.target);
    if (e.target.id=="canvas") {
        if (!e.ctrlKey) {
        const origin = {
        left: e.pageX,
        top: e.pageY
        };
        canvasMenu.setPosition(origin);
        return false;
        }
    }
    if (e.target.matches("math-field")) {
        currentBox = e.target.parentNode.id;
        if (!e.ctrlKey) {
                if (boxMenu.visible) boxMenu.toggleMenu("show");
          const origin = {
          left: e.pageX,
          top: e.pageY
          };
          boxMenu.setPosition(origin);
        }
    }

  });

  document.getElementById("canvas").addEventListener("mousedown", e => {
    if (e.target.matches("math-field") & e.ctrlKey) {
      console.log("math");
      dragMouseDown(e);
    }
    else {
      dragViewPort(e);
    }
  });

  document.addEventListener('beforeinput',(e)=>{
    if (e.inputType === 'insertLineBreak'){
      colorVariable();
    }

  });


  
  function dragViewPort(e) {
    e = (e || window.event);
    // get the mouse cursor position at startup:
    mouseX = e.clientX;
    mouseY = e.clientY;
    document.onmouseup = closeDragViewPort;
    // call a function whenever the cursor moves:
    document.onmousemove = viewPortDrag;
  }

  function viewPortDrag(e) {
    console.log("dragging", globalX);
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = mouseX - e.clientX;
    pos2 = mouseY - e.clientY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    globalX -= pos1;
    globalY -= pos2;

  }

  function closeDragViewPort(e) {
    document.onmouseup = null;
    document.onmousemove = null;
    currentBoxDrag = 0;
  }

  function dragMouseDown(e) {
    currentBoxDrag = boxMap.get(e.target.parentNode.id);
    e.preventDefault();
    e = (e || window.event);
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
    currentBoxDrag = 0;
  }


  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = mouseX - e.clientX;
    pos2 = mouseY - e.clientY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    //console.log(currentBoxDrag.boxElement.offsetLeft - pos1,currentBoxDrag.boxElement.offsetTop - pos2);
    currentBoxDrag.move(-pos1/globalScale,-pos2/globalScale);
  }
  console.log("page loaded");

});



function addMathBox(text="f(x)=") {
  nodeCount += 1;
  boxMap.set(String(nodeCount),new InputBox(nodeCount,defaultText=text));
  canvasMenu.toggleMenu("hide");
}

function deleteMathBox() {
  boxMap.get(currentBox).remove();
  boxMap.delete(currentBox);
  boxMenu.toggleMenu("hide");
}


function toggleMovement() {
  boxMap.get(currentBox).moves = !boxMap.get(currentBox).moves;
}
function computeBoxMotion(deltaTime) {
  for (const key1 of boxMap.keys()) {
    boxMap.get(key1).updatePagePosition();
    for (const key2 of boxMap.keys()) {
      if ((key1!==key2) & (key1!=currentBoxDrag.id) & (boxMap.get(key1).moves===true) & (boxMap.get(key2).moves===true)) {
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
var oldTimeStamp;
function gameLoop(timeStamp) {
  secondsPassed = (timeStamp - oldTimeStamp) / 1000;
  oldTimeStamp = timeStamp;
  computeBoxMotion(secondsPassed);
  window.requestAnimationFrame(gameLoop);
}


