/**
 * Syncs the schema product (theme default product) to the cart via AJAX.
 * - Added only when cart contains products whose product.type is tire, tires, tyre, or tyres.
 * - Schema product quantity = total quantity of all qualifying (tire/tyre) items.
 * - Increases when qualifying products are added, decreases or removes when reduced/removed.
 * - Removes schema product when no qualifying product types remain.
 * Listens for theme:cart:added and theme:cart:update; runs on DOMContentLoaded.
 * Uses debouncing to prevent UI lag and duplicate requests.
 * Quantity and enabled are computed from current cart (product_type) so they stay correct after AJAX updates.
 */
(function () {
  var syncPending = false;
  var debounceTimer = null;
  var DEBOUNCE_MS = 80;
  var VALID_TYPES = ['tire', 'tires', 'tyre', 'tyres'];

  function getConfig() {
    var scripts = document.querySelectorAll('script[data-cart-default-product]');
    var script = scripts.length ? scripts[scripts.length - 1] : null;
    if (!script || !script.textContent) return null;
    try {
      return JSON.parse(script.textContent.trim());
    } catch (e) {
      return null;
    }
  }

  function computeRequiredQtyAndEnabled(cartItems, schemaVariantId) {
    var requiredQty = 0;
    if (!cartItems || !cartItems.length) return { requiredQty: 0, enabled: false };
    for (var i = 0; i < cartItems.length; i++) {
      var item = cartItems[i];
      if (String(item.variant_id) === String(schemaVariantId)) continue;
      var pt = (item.product_type || '').toLowerCase().trim();
      if (VALID_TYPES.indexOf(pt) !== -1) {
        requiredQty += item.quantity || 0;
      }
    }
    return { requiredQty: requiredQty, enabled: requiredQty > 0 };
  }

  function runSync() {
    var config = getConfig();
    if (!config || !config.variantId) return;

    var variantId = config.variantId;

    fetch((window.theme && window.theme.routes ? window.theme.routes.root : (window.Shopify && window.Shopify.routes ? window.Shopify.routes.root : '/')) + 'cart.js')
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        var computed = computeRequiredQtyAndEnabled(cart.items, variantId);
        var requiredQty = computed.requiredQty;
        var enabled = computed.enabled;

        var lineIndex = 0;
        var currentQty = 0;
        if (cart.items && cart.items.length) {
          for (var i = 0; i < cart.items.length; i++) {
            if (String(cart.items[i].variant_id) === String(variantId)) {
              lineIndex = i + 1;
              currentQty = cart.items[i].quantity;
              break;
            }
          }
        }

        if (!enabled || requiredQty < 1) {
          if (lineIndex > 0) {
            changeCart(lineIndex, 0);
          } else {
            syncPending = false;
          }
          return;
        }

        if (lineIndex === 0) {
          addToCart(variantId, requiredQty);
        } else if (currentQty !== requiredQty) {
          changeCart(lineIndex, requiredQty);
        } else {
          syncPending = false;
        }
      })
      .catch(function (err) {
        console.warn('cart-default-product: cart fetch failed', err);
        syncPending = false;
      });
  }

  function addToCart(variantId, quantity) {
    var root = (window.theme && window.theme.routes && window.theme.routes.cart_add_url) ? window.theme.routes.root : (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    var cartAddUrl = (window.theme && window.theme.routes && window.theme.routes.cart_add_url) || root.replace(/\/?$/, '/cart/add.js');
    var form = new FormData();
    form.append('id', variantId);
    form.append('quantity', quantity);

    fetch(cartAddUrl, {
      method: 'POST',
      headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' },
      body: form
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.status && data.status !== 200) {
          console.warn('cart-default-product: add failed', data);
          syncPending = false;
          return;
        }
        syncPending = false;
        refreshCart();
      })
      .catch(function (err) {
        console.warn('cart-default-product: add failed', err);
        syncPending = false;
      });
  }

  function changeCart(lineIndex, quantity) {
    var root = (window.theme && window.theme.routes && window.theme.routes.cart_change_url) ? window.theme.routes.root : (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    var cartChangeUrl = (window.theme && window.theme.routes && window.theme.routes.cart_change_url) || root.replace(/\/?$/, '/cart/change.js');

    fetch(cartChangeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ line: lineIndex, quantity: quantity })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.message && data.message.indexOf('Error') !== -1) {
          console.warn('cart-default-product: change failed', data);
        }
        syncPending = false;
        refreshCart();
      })
      .catch(function (err) {
        console.warn('cart-default-product: change failed', err);
        syncPending = false;
      });
  }

  function refreshCart() {
    if (window.cart && typeof window.cart.getCart === 'function') {
      window.cart.getCart();
    } else {
      window.location.reload();
    }
  }

  function scheduleSync() {
    if (syncPending) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      syncPending = true;
      runSync();
    }, DEBOUNCE_MS);
  }

  function init() {
    var config = getConfig();
    if (!config || !config.variantId) return;
    scheduleSync();
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('theme:cart:added', function () {
    setTimeout(scheduleSync, 100);
  });
  document.addEventListener('theme:cart:update', function () {
    setTimeout(scheduleSync, 100);
  });
})();
