import { ComponentBase } from "../../scripts/component-base.js";

export default class Card extends ComponentBase {
  static get observedAttributes() {
    return ["columns", "ratio"];
  }

  connected() {
    this.setupColumns(this.getAttribute("columns"));
  }

  setupColumns(columns) {
    this.columns = parseInt(columns, 10);
    this.area = Array.from(Array(parseInt(this.columns, 10)))
      .map(() => "1fr")
      .join(" ");
    this.style.setProperty("--card-columns", this.area);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      switch (name) {
        case "columns":
          this.setupColumns(newValue);
          break;
        case "ratio":
          this.style.setProperty("--card-ratio", newValue);
          break;
      }
    }
  }
}
