// home_page.js — add deposit flow, show reference number on success
document.addEventListener("DOMContentLoaded", function () {

  // --- Load account details (unchanged) ---
  (async function loadAccountDetails() {
    const email = localStorage.getItem("authEmail");
    if (!email) { alert("Session expired. Please login again."); window.location.href = "login_page.html"; return; }
    try {
      const res = await fetch(`http://localhost:5000/api/account/details?email=${email}`);
      const data = await res.json();
      if (data.success) {
        document.getElementById("accountNumber").textContent = data.accountNumber;
        document.getElementById("acp2").textContent = "Nagavara";
        localStorage.setItem("accountNumber", data.accountNumber);
        const popupInput = document.getElementById("popupAccountNumber"); if (popupInput) popupInput.value = data.accountNumber;
        const reviewAccount = document.getElementById("reviewAccount"); if (reviewAccount) reviewAccount.textContent = data.accountNumber;
        const depositMasked = document.getElementById("depositMaskedAccount"); const reviewDepositAccount = document.getElementById("reviewDepositAccount");
        if (data.accountNumber && depositMasked && reviewDepositAccount) {
          const acct = String(data.accountNumber); const last4 = acct.slice(-4); const masked = "*".repeat(Math.max(0, acct.length - 4)) + last4;
          depositMasked.textContent = masked; reviewDepositAccount.textContent = masked;
        }
        const balanceElement = document.getElementById("checkBalance");
        if (balanceElement) {
          balanceElement.addEventListener("click", async () => {
            try {
              const balanceRes = await fetch(`http://localhost:5000/api/account/balance?email=${email}`);
              const balanceData = await balanceRes.json();
              if (balanceData.success) {
                balanceElement.textContent = `₹${balanceData.balance}`;
                balanceElement.style.color = "black"; balanceElement.style.cursor = "default"; balanceElement.style.textDecoration = "none";
              } else { balanceElement.textContent = "Error fetching balance"; balanceElement.style.color = "red"; }
            } catch (err) { console.error("Balance fetch error:", err); balanceElement.textContent = "Error fetching balance"; balanceElement.style.color = "red"; }
          });
        }
      } else { alert("⚠️ " + data.message); }
    } catch (err) { console.error("Error fetching account details:", err); alert("Server error while fetching account details."); }
  })();

  // --- Elements ---
  const modal = document.getElementById("yonoModal");
  const openBtn = document.getElementById("openYono");
  const content = modal?.querySelector(".yono-content");
  const choiceButtons = modal?.querySelectorAll(".btn-choice");
  const depositRequestBtn = modal?.querySelector(".btn-deposit-request");
  const depositBackBtn = modal?.querySelector(".btn-deposit-back");
  const depositConfirmBtn = modal?.querySelector(".btn-confirm-deposit");
  const depositAgree = modal?.querySelector("#agreeCheckDeposit");
  const withdrawNextBtns = modal?.querySelectorAll(".withdraw-next");
  const withdrawNext2Btn = modal?.querySelector(".withdraw-next-2");
  const withdrawBackBtns = modal?.querySelectorAll(".withdraw-back");
  const withdrawConfirmBtn = modal?.querySelector(".btn-confirm");
  const withdrawAgree = modal?.querySelector("#agreeCheck");
  const amountInput = modal?.querySelector("#yonoAmount");
  const reviewAmount = modal?.querySelector("#reviewAmount");
  const pinInput = modal?.querySelector("#yonoPin");
  const popupAccountInput = modal?.querySelector("#popupAccountNumber");
  const reviewAccount = modal?.querySelector("#reviewAccount");

  if (!modal || !content || !openBtn) { console.warn("YONO modal elements missing; aborting modal wiring."); return; }

  // --- Basic modal open/close + choice display ---
  function showPanel(flow, selector) {
    modal.querySelectorAll(".yono-step").forEach(el => { el.hidden = true; el.classList.remove("active"); });
    if (flow === "choice") { const el = modal.querySelector(".yono-choice"); if (el) { el.hidden = false; el.classList.add("active"); } return; }
    if (flow === "withdraw") { const el = modal.querySelector(selector || ".withdraw-step-1"); if (el) { el.hidden = false; el.classList.add("active"); } return; }
    if (flow === "deposit") { const el = modal.querySelector(selector || ".deposit-step-1"); if (el) { el.hidden = false; el.classList.add("active"); } return; }
  }
  function openModal() { modal.style.display = "block"; document.body.style.overflow = "hidden"; showPanel("choice"); content?.focus(); }
  function closeModal() { modal.style.display = "none"; document.body.style.overflow = ""; }

  window.addEventListener("click", e => { if (e.target === modal) closeModal(); });
  openBtn.addEventListener("click", (e) => { e.preventDefault(); openModal(); });

  // --- Choice actions ---
  if (choiceButtons) choiceButtons.forEach(btn => btn.addEventListener("click", () => {
    const type = btn.dataset.type;
    if (type === "withdraw") {
      const acct = localStorage.getItem("accountNumber") || popupAccountInput?.value;
      if (popupAccountInput && acct) popupAccountInput.value = acct;
      if (reviewAccount && acct) reviewAccount.textContent = acct;
      showPanel("withdraw", ".withdraw-step-1");
    } else if (type === "deposit") {
      showPanel("deposit", ".deposit-step-1");
    }
  }));

  // --- Withdraw flow: keep exactly as before (amount+pin required) ---
  if (pinInput) pinInput.addEventListener("input", () => { pinInput.value = pinInput.value.replace(/\D/g, "").slice(0, 6); });

  withdrawNextBtns.forEach(btn => btn.addEventListener("click", () => {
    const amountVal = parseInt(amountInput.value);
    if (!amountVal || amountVal <= 0) { alert("Please enter a valid amount."); return; }
    if (reviewAmount) reviewAmount.textContent = amountInput.value || "0";
    showPanel("withdraw", ".withdraw-step-2");
  }));

  if (withdrawNext2Btn) withdrawNext2Btn.addEventListener("click", () => {
    if (!pinInput || pinInput.value.length !== 6) { alert("Please enter a 6-digit PIN."); return; }
    showPanel("withdraw", ".withdraw-step-3");
  });

  withdrawBackBtns.forEach(btn => btn.addEventListener("click", () => {
    const active = modal.querySelector(".withdraw-step.active");
    if (!active) { showPanel("choice"); return; }
    if (active.classList.contains("withdraw-step-2")) showPanel("withdraw", ".withdraw-step-1");
    else if (active.classList.contains("withdraw-step-3")) showPanel("withdraw", ".withdraw-step-2");
    else if (active.classList.contains("withdraw-step-4")) showPanel("withdraw", ".withdraw-step-3");
  }));

  if (withdrawAgree && withdrawConfirmBtn) withdrawAgree.addEventListener("change", () => withdrawConfirmBtn.disabled = !withdrawAgree.checked);

  // --- Withdraw Confirm: send raw pin + amount (unchanged) and display ref on success ---
  if (withdrawConfirmBtn) {
    withdrawConfirmBtn.addEventListener("click", async () => {
      const email = localStorage.getItem("authEmail");
      const accountNumber = localStorage.getItem("accountNumber");
      const amount = amountInput.value.trim();
      const pin = pinInput.value.trim();
      if (!email) { alert("User session expired. Please log in again."); return; }
      if (!amount || !pin) { alert("Missing amount or PIN. Please fill all fields."); return; }
      const referenceNumber = Math.floor(100000 + Math.random() * 900000).toString();
      const payload = { email, accountNumber, amount, pin, referenceNumber, type: "withdraw", deliveryOption: "Virtual ATM" };
      console.log("Withdraw payload:", payload);
      try {
        const res = await fetch("http://localhost:5000/api/yono/sendReference", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        const data = await res.json();
        console.log("Withdraw response:", data);
        if (data.success) {
          // show success + reference number (replace message area)
          const successEl = modal.querySelector(".withdraw-step-4");
          if (successEl) {
            successEl.querySelector(".success-msg").textContent = "Thank you for using YONO cash service. Please use the reference number sent to your registered email and the PIN at the virtual ATM.";
          }
          showPanel("withdraw", ".withdraw-step-4");
        } else { alert(data.message || "Failed to send reference number."); }
      } catch (err) { console.error("Error sending withdraw reference:", err); alert("Server error. Please try again later."); }
    });
  }

  // --- Deposit flow: Request Now -> Review -> Confirm (no PIN required here) ---
  if (depositRequestBtn) depositRequestBtn.addEventListener("click", () => showPanel("deposit", ".deposit-step-2"));
  if (depositBackBtn) depositBackBtn.addEventListener("click", () => showPanel("deposit", ".deposit-step-1"));
  if (depositAgree && depositConfirmBtn) depositAgree.addEventListener("change", () => depositConfirmBtn.disabled = !depositAgree.checked);

  if (depositConfirmBtn) depositConfirmBtn.addEventListener("click", async () => {
    const email = localStorage.getItem("authEmail");
    const accountNumber = localStorage.getItem("accountNumber");
    if (!email) { alert("User session expired. Please log in again."); return; }
    if (!accountNumber) { alert("Account number missing."); return; }
    const referenceNumber = Math.floor(100000 + Math.random() * 900000).toString();
    const payload = { email, accountNumber, referenceNumber, type: "deposit", channel: "CDM" };
    console.log("Deposit payload:", payload);
    try {
      const res = await fetch("http://localhost:5000/api/yono/sendReference", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log("Deposit response:", data);
      if (data.success) {
        // show deposit success + reference
        const successEl = modal.querySelector(".deposit-step-3");
        if (successEl) {
          successEl.querySelector(".success-msg").textContent =  "Thank you for using YONO cash service. Your deposit Txn reference number is sent to registered mail. Use it at the Cash Deposit Machine (CDM).";
        }
        showPanel("deposit", ".deposit-step-3");
      } else { alert(data.message || "Failed to send deposit reference."); }
    } catch (err) { console.error("Error sending deposit reference:", err); alert("Server error. Please try again later."); }
  });

  
    // --- Close handlers (improved: redirect to ATM after closing success) ---
  function closeModal() {
    // hide modal
    modal.style.display = "none";
    document.body.style.overflow = "";

    // check if user closed a SUCCESS panel (withdraw-step-4 or deposit-step-3)
    const withdrawSuccessActive = modal.querySelector(".withdraw-step-4.active");
    const depositSuccessActive = modal.querySelector(".deposit-step-3.active");

    // If closing from success panel, open atm_page.html after 2s
    if (withdrawSuccessActive || depositSuccessActive) {
      setTimeout(() => {
        // adjust path if your atm page lives elsewhere
        window.location.href = "atm_page.html";
      }, 2000);
    }
  }

  // attach listeners (use the named function so removeEventListener works if needed)
  modal.querySelectorAll(".btn-close").forEach(btn => {
    btn.removeEventListener("click", closeModal);
    btn.addEventListener("click", closeModal);
  });

  // Escape key still closes modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "block") closeModal();
  });


  // expose for debugging
  window.__yono_debug = { openModal, closeModal };

});
