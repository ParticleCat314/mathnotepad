class SelectionMenu {
    constructor(id, styleClass) {
        this.visible = false;
        this.menuElement = document.createElement("div");
        this.menuElement.className = styleClass;
        this.menuElement.id = id;
        this.menuElement.innerHTML = String("<ul class='menu-options'></ul></div>");
        document.body.appendChild(this.menuElement);
        this.menuOption = this.menuElement.childNodes[0];
        this.menuElement.addEventListener("mouseleave", e => {
            this.toggleMenu("hide");
        });
    }
    addMenuOption(text, action) {
        let option = document.createElement("li");
        option.className = "menu-option";
        option.innerHTML = text;
        option.onclick = action;
        this.menuOption.appendChild(option);
    }
    toggleMenu(command) {
        this.menuElement.style.display = command === "show" ? "block" : "none";
        this.visible = !this.visible;
    }
    ;
    setPosition(left, top) {
        this.menuElement.style.left = String(left - 5) + "px";
        this.menuElement.style.top = String(top - 5) + "px";
        this.toggleMenu("show");
    }
}
function worldToScreenX(x, globalX, globalScale) {
    return globalScale * (x) + window.innerWidth * 0.5 + globalX;
}
function worldToScreenY(y, globalY, globalScale) {
    return globalScale * (y) + window.innerHeight * 0.5 + globalY;
}
class InputBox {
    constructor(id, globalScale = 1) {
        let defaultText = "f(x)=";
        this.domID = id;
        this.boxElement = document.createElement("div");
        this.boxElement.id = id;
        this.boxElement.className = "mathBox";
        this.boxElement.innerHTML = "<math-field math-virtual-keyboard-policy='manual' id='" + "mathformula" + this.domID + "' oncontextmenu='return false;'>" + defaultText + "</math-field>";
        this.boxElement.style.scale = String(globalScale);
        this.boxElement.style.transformOrigin = "left top";
        this.boxElement.setAttribute("oncontextmenu", "return false;");
        this.isMoveable = true;
        this.moving = false;
        document.body.appendChild(this.boxElement);
        let mf = document.getElementById("mathformula" + id);
        mf.menuItems = [];
        this.positionX = window.event.clientX - 0.5 * window.innerWidth / globalScale;
        this.positionY = window.event.clientY - 0.5 * window.innerHeight / globalScale;
        this.boxElement.style.left = worldToScreenX(this.positionX, 0, 1) + "px";
        this.boxElement.style.top = worldToScreenY(this.positionY, 0, 1) + "px";
    }
    update(offsetX, offsetY, scale) {
        this.boxElement.style.left = worldToScreenX(this.positionX, offsetX, scale) + "px";
        this.boxElement.style.top = worldToScreenY(this.positionY, offsetY, scale) + "px";
    }
    getPosition() {
        return [this.positionX, this.positionY];
    }
    setPosition(x, y) {
        this.positionX = x;
        this.positionY = y;
    }
    move(x, y) {
        this.setPosition(x + this.positionX, y + this.positionY);
    }
    remove() {
        this.boxElement.remove();
    }
    scale(s) {
        this.boxElement.style.scale = String(s);
    }
    toggleMovement() {
        this.isMoveable = !this.isMoveable;
    }
}
class infiniteCanvas {
    constructor() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.items = new Map;
        this.itemCount = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        this.currentSelection = null;
    }
    insertItem(newItem) {
        this.items.set(newItem.domID, newItem);
        newItem.update(this.offsetX, this.offsetY, this.scale);
        newItem.scale(this.scale);
    }
    insertItemInputBox() {
        this.itemCount += 1;
        this.insertItem(new InputBox(String(this.itemCount)));
    }
    removeItem(itemID) {
        this.items.get(itemID).remove();
        this.items.delete(itemID);
    }
    updateCanvas() {
        for (const [key, value] of this.items) {
            value.update(this.offsetX, this.offsetY, this.scale);
        }
    }
    scaleItems() {
        for (const [key, value] of this.items) {
            value.scale(this.scale);
        }
    }
    zoom(event) {
        let sign = 1;
        let mx = event.clientX - 0.5 * window.innerWidth;
        let my = event.clientY - 0.5 * window.innerHeight;
        if (event.deltaY < 0) {
            this.scale *= 1.2;
            this.offsetX += (this.offsetX - mx) * 1.2 - (this.offsetX - mx);
            this.offsetY += (this.offsetY - my) * 1.2 - (this.offsetY - my);
        }
        if (event.deltaY > 0) {
            sign = -1;
            this.scale /= 1.2;
            this.offsetX += (this.offsetX - mx) * 1 / 1.2 - (this.offsetX - mx);
            this.offsetY += (this.offsetY - my) * 1 / 1.2 - (this.offsetY - my);
        }
        this.scaleItems();
    }
    startPan(event) {
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
        document.onmouseup = (event) => { this.closePan(this, event); };
        document.onmousemove = (event) => { this.pan(this, event); };
    }
    pan(caller, event) {
        event.preventDefault();
        let pos1 = this.mouseX - event.clientX;
        let pos2 = this.mouseY - event.clientY;
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
        this.offsetX -= pos1;
        this.offsetY -= pos2;
        console.log(this);
    }
    closePan(caller, event) {
        document.onmouseup = null;
        document.onmousemove = null;
    }
    selectItem(itemID) {
        this.currentSelection = this.items.get(itemID);
    }
    selectNone() {
        this.currentSelection = null;
    }
    startDragItem(event) {
        this.selectItem(event.target.parentNode.id);
        event.preventDefault();
        if (event.ctrlKey) {
            this.mouseX = event.clientX;
            this.mouseY = event.clientY;
            document.onmouseup = (event) => { this.closeDragItem(event); };
            document.onmousemove = (event) => { this.dragItem(event); };
        }
    }
    dragItem(event) {
        event.preventDefault();
        let pos1 = this.mouseX - event.clientX;
        let pos2 = this.mouseY - event.clientY;
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
        this.currentSelection.move(-pos1 / this.scale, -pos2 / this.scale);
    }
    closeDragItem(event) {
        document.onmouseup = null;
        document.onmousemove = null;
        this.selectNone();
    }
}
var boxMenu = null;
var canvasMenu = null;
let c = new infiniteCanvas();
addEventListener("wheel", (event) => {
    c.zoom(event);
});
document.getElementById("canvas").addEventListener("click", e => {
    if (!e.ctrlKey) {
        if (e.target.matches("mathBox")) {
            c.selectItem(e.target.id);
            if (boxMenu.visible)
                boxMenu.toggleMenu("hide");
        }
        if (e.target.id == "canvas") {
            if (canvasMenu.visible)
                canvasMenu.toggleMenu("hide");
        }
    }
});
document.getElementById("canvas").addEventListener("contextmenu", e => {
    let eventTarget = e.target;
    e.preventDefault();
    if (eventTarget.id == "canvas") {
        if (!e.ctrlKey) {
            canvasMenu.setPosition(e.pageX, e.pageY);
            return false;
        }
    }
    if (eventTarget.matches("math-field")) {
        c.selectItem(eventTarget.parentNode.id);
        if (!e.ctrlKey) {
            if (boxMenu.visible)
                boxMenu.toggleMenu("show");
            boxMenu.setPosition(e.pageX, e.pageY);
        }
    }
});
canvasMenu = new SelectionMenu("canvasmenu", "menu");
canvasMenu.addMenuOption("Insert Math", () => { c.insertItemInputBox(); });
boxMenu = new SelectionMenu("boxmenu", "menu");
boxMenu.addMenuOption("Remove", () => { c.removeItem(c.currentSelection.domID); });
boxMenu.addMenuOption("Toggle movement", () => { c.currentSelection.toggleMovement(); });
document.getElementById("canvas").addEventListener("mousedown", (e) => {
    if (e.target.matches("math-field") && e.ctrlKey) {
        c.startDragItem(e);
    }
    else {
        c.startPan(e);
    }
});
function computeBoxMotion(deltaTime) {
    for (const key1 of c.items.keys()) {
        c.updateCanvas();
        for (const key2 of c.items.keys()) {
            if ((key1 !== key2) && (c.items.get(key1).isMoveable === true) && (c.items.get(key2).isMoveable === true) && c.currentSelection !== c.items.get(key1)) {
                let a = c.items.get(key1);
                let b = c.items.get(key2);
                let rx = a.positionX - b.positionX;
                let ry = a.positionY - b.positionY;
                let dist = Math.sqrt(rx * rx + ry * ry);
                if (dist < 500) {
                    let rxN = rx / dist;
                    let ryN = ry / dist;
                    let forceX = -0.0001 * ((100 - dist) * (100 - dist) * rxN) + (2 / dist * dist) * rxN;
                    let forceY = -0.0001 * ((100 - dist) * (100 - dist) * ryN) + (2 / dist * dist) * ryN;
                    a.move(forceX, forceY);
                }
            }
        }
    }
}
var oldTimeStamp;
var secondsPassed;
var fps = document.getElementById("fps");
function gameLoop(timeStamp) {
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;
    computeBoxMotion(secondsPassed);
    fps.textContent = String(1 / secondsPassed);
    window.requestAnimationFrame(gameLoop);
}
window.requestAnimationFrame(gameLoop);
//# sourceMappingURL=main.js.map