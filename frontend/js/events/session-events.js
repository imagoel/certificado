function registerSessionEvents() {
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const usernameInput = document.getElementById("login-username");
      const passwordInput = document.getElementById("login-password");
      const username = usernameInput ? usernameInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value : "";

      if (!username || !password) {
        setLoginStatus("Informe usuário e senha.", "error");
        return;
      }

      try {
        setLoginStatus("Entrando...", "info");
        const session = await apiJsonRequest("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        });
        renderSession(session);
        await refreshProtectedData({ page: 1 });
        switchSection("generator");
        if (passwordInput) passwordInput.value = "";
      } catch (error) {
        console.error(error);
        setLoginStatus(
          (error && error.message) || "Nao foi possivel fazer login.",
          "error"
        );
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await apiJsonRequest("/api/auth/logout", { method: "POST", body: "{}" });
      } catch (error) {
        console.error(error);
      } finally {
        clearSessionUi();
        setLoginStatus("Sessao encerrada.", "info");
      }
    });
  }

  if (secretariaSelect) {
    secretariaSelect.addEventListener("change", async () => {
      const secretariaId = Number(secretariaSelect.value);
      if (!secretariaId) return;

      try {
        if (editingCertificate) {
          cancelCertificateEditMode({ silent: true });
        }
        const session = await apiJsonRequest("/api/auth/select-secretaria", {
          method: "POST",
          body: JSON.stringify({ secretaria_id: secretariaId }),
        });
        renderSession(session);
        certListState.page = 1;
        await refreshProtectedData({ page: 1 });
        await renderLastCertificate();
        setBatchStatus("Secretaria ativa atualizada.", "success");
        setCertListStatus("Lista atualizada para a nova secretaria ativa.", "success");
      } catch (error) {
        console.error(error);
        if (error && error.status === 401) {
          await handleUnauthorized();
          return;
        }
        setBatchStatus(
          (error && error.message) || "Nao foi possivel trocar a secretaria.",
          "error"
        );
      }
    });
  }

  if (replyEmailSelect) {
    replyEmailSelect.addEventListener("change", () => {
      populateCertificateReplyEmailOptions(replyEmailSelect.value);
    });
  }
}
