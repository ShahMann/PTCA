document.addEventListener("DOMContentLoaded", () => {
  const trigger = document.querySelector(".b2b-settings-trigger");
  const dropdown = document.querySelector(".b2b-settings-dropdown");
  const toggleBtns = document.querySelectorAll(".b2b-toggle-btn");
  const toggleBtn = toggleBtns.length ? toggleBtns[0] : null;

  if (!toggleBtn) {
    console.warn("B2B toggle elements not found");
    return;
  }

  /* Get initial metafield value from window object (set by Liquid) */
  const initialMetafieldValue = window.B2B_HIDE_PRICE || "Show";
  const customerId = window.B2B_CUSTOMER_ID;
  
  // Console log customer ID and metafield value
  console.log("=== B2B User Info ===");
  console.log("Customer ID:", customerId);
  console.log("Metafield Value (hide_price):", initialMetafieldValue);
  console.log("====================");

  /* Open / close dropdown (desktop only) */
  if (trigger && dropdown) {
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdown.hidden = !dropdown.hidden;
    });

    dropdown.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    document.addEventListener("click", () => {
      dropdown.hidden = true;
    });
  }

  /* Sync state to all toggle buttons (desktop + mobile) */
  function syncAllToggleButtons(nextState) {
    toggleBtns.forEach((btn) => {
      btn.dataset.state = nextState;
      const label = btn.querySelector(".b2b-toggle-label");
      if (label) {
        label.textContent = nextState === "Show" ? "Show Price" : "Hide Price";
      }
      btn.classList.toggle("active", nextState === "Hide");
    });
  }

  /* Toggle click - bind to all toggle buttons (desktop and mobile) */
  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const customerId = window.B2B_CUSTOMER_ID;
      const currentMetafieldValue = window.B2B_HIDE_PRICE || "Show";
      
      // Console log customer ID and metafield value before update
      console.log("=== B2B Toggle Click ===");
      console.log("Customer ID:", customerId);
      console.log("Current Metafield Value:", currentMetafieldValue);
      console.log("========================");
      
      if (!customerId) {
        console.error("Customer ID not found");
        alert("Customer ID is missing. Please refresh the page.");
        return;
      }

      // Prevent double clicks (check any button)
      if (toggleBtn.classList.contains("loading")) {
        return;
      }

      const currentState = btn.dataset.state || initialMetafieldValue;
      const nextState = currentState === "Show" ? "Hide" : "Show";
      
      console.log("Current state:", currentState, "-> Next state:", nextState);

      toggleBtns.forEach((b) => {
        b.classList.add("loading");
        b.disabled = true;
      });

      try {
        // Ensure hidePrice value is "Show" or "Hide" (capitalized)
        const hidePriceValue = nextState === "Show" ? "Show" : "Hide";
        
        const requestBody = {
          customerId: customerId.toString(),
          hidePrice: hidePriceValue
        };
        
        console.log("Sending B2B toggle request:", requestBody);
        
        const response = await fetch(
          "https://premiertire.node.brainvire.dev/api/customers/update",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "ngrok-skip-browser-warning": "true"
            },
            body: JSON.stringify(requestBody)
          }
        );

        console.log("Response status:", response.status);

        let data;
        try {
          data = await response.json();
          console.log("B2B toggle response:", data);
        } catch (parseError) {
          console.error("Failed to parse response:", parseError);
          throw new Error("Invalid response from server");
        }

        if (!response.ok) {
          const errorMessage = data?.message || data?.error || `HTTP error! status: ${response.status}`;
          throw new Error(errorMessage);
        }

        // Verify the response indicates success
        if (data && (data.success === false || (data.error && !data.success))) {
          throw new Error(data.error || data.message || "Failed to update customer metafield");
        }

        // Update UI on all toggle buttons (desktop + mobile)
        syncAllToggleButtons(nextState);

        // Update window object to reflect new state
        window.B2B_HIDE_PRICE = nextState;

        console.log("Settings updated successfully. New state:", nextState);
        console.log("API Response:", data);

        // Reload after a short delay to show the change
        setTimeout(() => {
          window.location.reload();
        }, 500);

      } catch (error) {
        console.error("B2B toggle error:", error);
        alert(`Failed to update settings: ${error.message}`);
        
        // Revert UI on error
        toggleBtns.forEach((b) => {
          b.classList.remove("loading");
          b.disabled = false;
        });
      }
    });
  });

  // Initialize toggle state from metafield value for all buttons (desktop + mobile)
  const normalizedState = initialMetafieldValue === "Hide" ? "Hide" : "Show";
  syncAllToggleButtons(normalizedState);
  
  // Ensure window object has the correct value
  if (!window.B2B_HIDE_PRICE || window.B2B_HIDE_PRICE === "") {
    window.B2B_HIDE_PRICE = "Show";
  }
  
  console.log("B2B Toggle initialized with state:", normalizedState);
});