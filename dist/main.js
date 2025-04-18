var nodeCount = 0;
var currentBox = 0;
var boxMap = new Map;
var boxMenu = null;
var canvasMenu = null;
var mouseX = 0;
var mouseY = 0;
var currentBoxDrag = null;
var globalScale = 1.0;
var globalX = 0;
var globalY = 0;
function worldToScreenX(x) {
    return globalScale * (x) + window.innerWidth * 0.5 + globalX;
}
function worldToScreenY(y) {
    return globalScale * (y) + window.innerHeight * 0.5 + globalY;
}
function screenToWorldX(x) {
    return (x - window.innerWidth * 0.5 - globalX) / globalScale;
}
function screenToWorldY(y) {
    return (y - window.innerWidth * 0.5 - globalY) / globalScale;
}
class InputBox {
    constructor(id) {
        let defaultText = "f(x)=";
        this.id = id;
        this.boxElement = document.createElement("div");
        this.boxElement.id = id;
        this.boxElement.className = "mathBox";
        this.boxElement.innerHTML = "<math-field math-virtual-keyboard-policy='manual' id='" + "mathformula" + this.id + "' oncontextmenu='return false;'>" + defaultText + "</math-field>";
        this.boxElement.style.scale = String(globalScale);
        this.boxElement.setAttribute("oncontextmenu", "return false;");
        this.moves = true;
        document.body.appendChild(this.boxElement);
        let mf = document.getElementById("mathformula" + id);
        mf.menuItems = [];
        this.x = window.event.clientX - 0.5 * window.innerWidth / globalScale;
        this.y = window.event.clientY - 0.5 * window.innerHeight / globalScale;
        this.boxElement.style.left = worldToScreenX(this.x) + "px";
        this.boxElement.style.top = worldToScreenY(this.y) + "px";
    }
    updatePagePosition() {
        this.boxElement.style.left = worldToScreenX(this.x) + "px";
        this.boxElement.style.top = worldToScreenY(this.y) + "px";
    }
    getPosition() {
        return [this.x, this.y];
    }
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.updatePagePosition();
    }
    move(x, y) {
        this.setPosition(x + this.x, y + this.y);
    }
    remove() {
        this.boxElement.remove();
    }
    scale(s) {
        this.boxElement.style.scale = String(s);
    }
}
class SelectionMenu {
    constructor(id, styleClass, innerHTML) {
        this.visible = false;
        this.menuElement = document.createElement("div");
        this.menuElement.className = styleClass;
        this.menuElement.id = id;
        this.menuElement.innerHTML = innerHTML;
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
addEventListener("load", (event) => {
    canvasMenu = new SelectionMenu("canvasmenu", "menu", "<ul class='menu-options'></ul></div>");
    canvasMenu.addMenuOption("Insert Math", addMathBox);
    boxMenu = new SelectionMenu("boxmenu", "menu", "<ul class='menu-options'></ul></div>");
    boxMenu.addMenuOption("Remove", deleteMathBox);
    boxMenu.addMenuOption("Toggle movement", toggleMovement);
    document.getElementById("canvas").addEventListener("click", e => {
        if (!e.ctrlKey) {
            if (e.target.matches("mathBox")) {
                currentBox = Number(e.target.id);
                if (boxMenu.visible)
                    boxMenu.toggleMenu("hide");
            }
            if (e.target.id == "canvas") {
                if (canvasMenu.visible)
                    canvasMenu.toggleMenu("hide");
            }
        }
    });
    addEventListener("wheel", (event) => {
        let sign = 1;
        let mx = event.clientX - 0.5 * window.innerWidth;
        let my = event.clientY - 0.5 * window.innerHeight;
        if (event.deltaY < 0) {
            globalScale *= 1.2;
            globalX += (globalX - mx) * 1.2 - (globalX - mx);
            globalY += (globalY - my) * 1.2 - (globalY - my);
        }
        if (event.deltaY > 0) {
            sign = -1;
            globalScale /= 1.2;
            globalX += (globalX - mx) * 1 / 1.2 - (globalX - mx);
            globalY += (globalY - my) * 1 / 1.2 - (globalY - my);
        }
        scrollMathDivs();
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
            currentBox = Number(eventTarget.parentNode.id);
            if (!e.ctrlKey) {
                if (boxMenu.visible)
                    boxMenu.toggleMenu("show");
                boxMenu.setPosition(e.pageX, e.pageY);
            }
        }
    });
    document.getElementById("canvas").addEventListener("mousedown", (e) => {
        if (e.target.matches("math-field") && e.ctrlKey) {
            boxMap.get(e.target.id).moves = false;
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
    function dragViewPort(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        document.onmouseup = closeDragViewPort;
        document.onmousemove = viewPortDrag;
    }
    function viewPortDrag(e) {
        console.log("dragging", globalX);
        e.preventDefault();
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
        currentBoxDrag = null;
    }
    function dragMouseDown(e) {
        currentBoxDrag = boxMap.get((e.target.parentNode.id));
        e.preventDefault();
        if (e.ctrlKey) {
            mouseX = e.clientX;
            mouseY = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
    }
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        currentBoxDrag.moves = true;
        currentBoxDrag = null;
    }
    function elementDrag(e) {
        e.preventDefault();
        pos1 = mouseX - e.clientX;
        pos2 = mouseY - e.clientY;
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (currentBoxDrag != null) {
            currentBoxDrag.move(-pos1 / globalScale, -pos2 / globalScale);
        }
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
    boxMap.set(String(nodeCount), new InputBox(String(nodeCount)));
    canvasMenu.toggleMenu("hide");
}
function deleteMathBox() {
    boxMap.get(String(currentBox)).remove();
    boxMap.delete(String(currentBox));
    boxMenu.toggleMenu("hide");
}
function computeBoxMotion(deltaTime) {
    for (const key1 of boxMap.keys()) {
        boxMap.get(key1).updatePagePosition();
        for (const key2 of boxMap.keys()) {
            if ((key1 !== key2) && (boxMap.get(key1).moves === true) && (boxMap.get(key2).moves === true)) {
                let a = boxMap.get(key1);
                let b = boxMap.get(key2);
                let rx = a.x - b.x;
                let ry = a.y - b.y;
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
window.requestAnimationFrame(gameLoop);
var oldTimeStamp;
var secondsPassed;
function gameLoop(timeStamp) {
    secondsPassed = (timeStamp - oldTimeStamp) / 1000;
    oldTimeStamp = timeStamp;
    computeBoxMotion(secondsPassed);
    window.requestAnimationFrame(gameLoop);
}
//# sourceMappingURL=main.js.map