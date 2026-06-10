function createInlineButton(label, onClick, className = "secondary-btn") {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", onClick);
  return button;
}

function createIconSvg(iconName) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.classList.add("icon-btn-svg");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const paths = {
    eye: "M12 5c5.2 0 8.6 4.7 9.7 6.5.2.3.2.7 0 1C20.6 14.3 17.2 19 12 19s-8.6-4.7-9.7-6.5a1 1 0 0 1 0-1C3.4 9.7 6.8 5 12 5Zm0 2c-3.7 0-6.4 3-7.6 5 1.2 2 3.9 5 7.6 5s6.4-3 7.6-5c-1.2-2-3.9-5-7.6-5Zm0 2.5A2.5 2.5 0 1 1 12 14.5 2.5 2.5 0 0 1 12 9.5Z",
    download: "M12 3a1 1 0 0 1 1 1v8.6l2.3-2.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4l2.3 2.3V4a1 1 0 0 1 1-1Zm-7 14a1 1 0 0 1 1 1v1h12v-1a1 1 0 1 1 2 0v2a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1Z",
    more: "M6 10a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z",
  };
  path.setAttribute("d", paths[iconName] || paths.more);
  svg.appendChild(path);
  return svg;
}

function createIconButton(label, iconName, onClick, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `icon-btn ${className}`.trim();
  button.title = label;
  button.setAttribute("aria-label", label);
  button.appendChild(createIconSvg(iconName));
  button.addEventListener("click", onClick);
  return button;
}
