import React from "react";
import ReactDOM from "react-dom";
import Presentation from "./Presentation";

const rootEl = document.getElementById("root");
ReactDOM.render(<Presentation />, rootEl);

if (module.hot) {
  module.hot.accept("./Presentation", () => {
    const NextPresentation = require("./Presentation").default;
    ReactDOM.render(<NextPresentation />, rootEl);
  });
}
