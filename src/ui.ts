
class SelectionMenu {
  visible: boolean = false;
  menuElement: HTMLElement;
  menuOption: HTMLElement;


  constructor(id: string, styleClass: string) {

    this.menuElement = document.createElement("div");
    this.menuElement.className = styleClass;
    this.menuElement.id = id;
    this.menuElement.innerHTML = String("<ul class='menu-options'></ul></div>");
    document.body.appendChild(this.menuElement);
    
    this.menuOption = this.menuElement.childNodes[0] as HTMLElement;

    this.menuElement.addEventListener("mouseleave", e=> {
      this.toggleMenu("hide");
    });
  }
  addMenuOption(text: string,action: ()=>void) {
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

