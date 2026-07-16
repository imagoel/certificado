function resetActionMenuPosition(menu) {
  const menuContent = menu ? menu.querySelector(".action-menu-content") : null;
  if (!menuContent) return;
  menuContent.style.left = "";
  menuContent.style.top = "";
}

function positionActionMenu(menu) {
  const trigger = menu ? menu.querySelector(".action-menu-trigger") : null;
  const menuContent = menu ? menu.querySelector(".action-menu-content") : null;
  if (!menu || !menu.open || !trigger || !menuContent) return;

  const margin = 8;
  const triggerRect = trigger.getBoundingClientRect();
  const contentRect = menuContent.getBoundingClientRect();
  const left = Math.min(
    Math.max(margin, triggerRect.right - contentRect.width),
    window.innerWidth - contentRect.width - margin
  );
  const shouldOpenAbove = triggerRect.bottom + 6 + contentRect.height > window.innerHeight;
  const top = shouldOpenAbove
    ? Math.max(margin, triggerRect.top - contentRect.height - 6)
    : Math.min(
        triggerRect.bottom + 6,
        window.innerHeight - contentRect.height - margin
      );

  menuContent.style.left = `${left}px`;
  menuContent.style.top = `${top}px`;
}

function closeOpenActionMenus(exceptMenu = null) {
  document.querySelectorAll(".action-menu[open]").forEach((menu) => {
    if (menu !== exceptMenu) {
      menu.open = false;
      resetActionMenuPosition(menu);
    }
  });
}

function positionOpenActionMenus() {
  document.querySelectorAll(".action-menu[open]").forEach((menu) => {
    positionActionMenu(menu);
  });
}

document.addEventListener("click", (event) => {
  if (event.target && event.target.closest && event.target.closest(".action-menu")) return;
  closeOpenActionMenus();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeOpenActionMenus();
});

window.addEventListener("resize", positionOpenActionMenus);
window.addEventListener("scroll", positionOpenActionMenus, true);

