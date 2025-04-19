var boxMenu: SelectionMenu = null;
var canvasMenu: SelectionMenu = null;
let c = new infiniteCanvas();

addEventListener("wheel", (event: WheelEvent) => {
  c.zoom(event);
});

// Handle clicks related to the menu
document.getElementById("canvas").addEventListener("click", e => {
  if (!e.ctrlKey) {
    if ((e.target as HTMLElement).matches("mathBox")) {
      c.selectItem((e.target as HTMLElement).id);
      if (boxMenu.visible) boxMenu.toggleMenu("hide");
    }
    if ((e.target as HTMLElement).id=="canvas") {
      if (canvasMenu.visible) canvasMenu.toggleMenu("hide");
    }
  }
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
      // Get the id of the selected box
      c.selectItem((eventTarget.parentNode as HTMLElement).id);
      if (!e.ctrlKey) {
              if (boxMenu.visible) boxMenu.toggleMenu("show");
        boxMenu.setPosition(e.pageX,e.pageY);
      }
  }
});


canvasMenu = new SelectionMenu(
  "canvasmenu",
  "menu"
);
canvasMenu.addMenuOption("Insert Math",()=>{c.insertItemInputBox()});
boxMenu = new SelectionMenu(
  "boxmenu",
  "menu"
);
boxMenu.addMenuOption("Remove",()=>{c.removeItem(c.currentSelection.domID)});
boxMenu.addMenuOption("Toggle movement",()=>{c.currentSelection.toggleMovement()});

document.getElementById("canvas").addEventListener("mousedown", (e: MouseEvent) => {
  if ((e.target as HTMLElement).matches("math-field") && e.ctrlKey) {
    c.startDragItem(e);
  }
  else {
    c.startPan(e); 
  }
});



function computeBoxMotion(deltaTime: number) {
  for (const key1 of c.items.keys()) {
    c.updateCanvas();
    for (const key2 of c.items.keys()) {
      if ((key1!==key2) && (c.items.get(key1).isMoveable===true) && (c.items.get(key2).isMoveable===true) && c.currentSelection!==c.items.get(key1)) {
        let a = c.items.get(key1);
        let b = c.items.get(key2);
        
        let rx = a.positionX-b.positionX;
        let ry = a.positionY-b.positionY;

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


var oldTimeStamp: number;
var secondsPassed: number;
var fps = document.getElementById("fps");

function gameLoop(timeStamp: number) {
  secondsPassed = (timeStamp - oldTimeStamp) / 1000;
  oldTimeStamp = timeStamp;
  computeBoxMotion(secondsPassed);
  //updateBoxes();
  //c.updateCanvas();
  fps.textContent = String(1/secondsPassed);
  window.requestAnimationFrame(gameLoop);
}

window.requestAnimationFrame(gameLoop);

