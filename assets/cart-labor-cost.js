/**
 * Cart Labor Cost Injector
 *
 * Injects `_laborCost: "$40"` as a cart line item property when:
 *   1. Product type is tire / tires / tyre / tyres (case-insensitive).
 *   2. Line item properties do NOT include `_isPackageFlow: "Yes"`.
 *
 * Strategy:
 *   - PRIMARY: Intercept the fetch request, read product type from form's
 *     `data-product-type`, and inject _laborCost into the request body.
 *   - FALLBACK: If product type wasn't available at request time (e.g.
 *     Convermax collection pages), read the response's `product_type`,
 *     and if it qualifies, remove the item and re-add it with _laborCost.
 */
(function () {
  'use strict';

  var VALID_TYPES = ['tire', 'tires', 'tyre', 'tyres'];
  var LABOR_COST_KEY = 'properties[_laborCost]';
  var PACKAGE_FLOW_KEY = 'properties[_isPackageFlow]';
  var LABOR_COST_VALUE = '$60';
  var PACKAGE_FLOW_VALUE = 'Yes';

  // Flag to prevent infinite recursion during re-add
  var isReAdding = false;

  /* ── Click tracker ─────────────────────────────────────────────── */
  var lastClickedForm = null;

  document.addEventListener('click', function (e) {
    // Match both [data-add-to-cart] (theme) and .add-to-cart (Convermax)
    var btn = e.target.closest('[data-add-to-cart], .add-to-cart, .button-add-to-cart');
    if (btn) {
      lastClickedForm = btn.closest('form');
    }
  }, true);

  /* ── Helpers ────────────────────────────────────────────────────── */

  function isTireType(typeStr) {
    if (!typeStr) return false;
    return VALID_TYPES.indexOf(typeStr.toLowerCase().trim()) !== -1;
  }

  function getProductTypeFromForm() {
    if (lastClickedForm && lastClickedForm.hasAttribute('data-product-type')) {
      return lastClickedForm.getAttribute('data-product-type');
    }
    return '';
  }

  function getCartRootUrl() {
    var root = '/';
    if (window.theme && window.theme.routes && window.theme.routes.root) {
      root = window.theme.routes.root;
    } else if (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) {
      root = window.Shopify.routes.root;
    }
    return root.replace(/\/?$/, '/');
  }

  /* ── Request-time injection (primary path) ─────────────────────── */

  /** @returns {boolean} true if injection was handled at request time */
  function processFormData(formData) {
    var productType = getProductTypeFromForm();
    if (!isTireType(productType)) return false;

    var isPackageFlow = formData.get(PACKAGE_FLOW_KEY);
    if (isPackageFlow === PACKAGE_FLOW_VALUE) return true; // handled – skip

    formData.set(LABOR_COST_KEY, LABOR_COST_VALUE);
    return true;
  }

  /** @returns {{ body: string, handled: boolean }} */
  function processJsonBody(bodyStr) {
    var data;
    try { data = JSON.parse(bodyStr); } catch (e) { return { body: bodyStr, handled: false }; }

    var productType = getProductTypeFromForm();
    if (!isTireType(productType)) return { body: bodyStr, handled: false };

    if (data.id !== undefined) {
      if (!data.properties) data.properties = {};
      if (data.properties._isPackageFlow !== PACKAGE_FLOW_VALUE) {
        data.properties._laborCost = LABOR_COST_VALUE;
      }
      return { body: JSON.stringify(data), handled: true };
    }

    if (data.items && Array.isArray(data.items)) {
      for (var i = 0; i < data.items.length; i++) {
        if (!data.items[i].properties) data.items[i].properties = {};
        if (data.items[i].properties._isPackageFlow !== PACKAGE_FLOW_VALUE) {
          data.items[i].properties._laborCost = LABOR_COST_VALUE;
        }
      }
      return { body: JSON.stringify(data), handled: true };
    }

    return { body: bodyStr, handled: false };
  }

  /* ── Response-time fallback ────────────────────────────────────── */

  function handleResponseFallback(responseData) {
    if (!responseData) return;

    // cart/add.js may return a single item or { items: [...] }
    var items = responseData.items ? responseData.items : [responseData];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var pt = (item.product_type || '').toLowerCase().trim();
      if (VALID_TYPES.indexOf(pt) === -1) continue;

      var props = item.properties || {};
      if (props._isPackageFlow === PACKAGE_FLOW_VALUE) continue;
      if (props._laborCost) continue; // already set

      // This tire item needs _laborCost but didn't get it at request time.
      fixItemInCart(item);
    }
  }

  function fixItemInCart(item) {
    var root = getCartRootUrl();
    var key = item.key;
    var variantId = item.variant_id || item.id;
    var quantity = item.quantity || 1;

    // Merge existing properties with _laborCost
    var newProps = {};
    if (item.properties) {
      for (var k in item.properties) {
        if (item.properties.hasOwnProperty(k)) {
          newProps[k] = item.properties[k];
        }
      }
    }
    newProps._laborCost = LABOR_COST_VALUE;

    // Step 1: Remove the item
    isReAdding = true;
    originalFetch(root + 'cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: key, quantity: 0 })
    })
    .then(function () {
      // Step 2: Re-add with _laborCost property
      return originalFetch(root + 'cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ id: variantId, quantity: quantity, properties: newProps })
      });
    })
    .then(function () {
      isReAdding = false;
      // Refresh the cart UI
      if (window.cart && typeof window.cart.getCart === 'function') {
        window.cart.getCart();
      }
      document.dispatchEvent(new CustomEvent('theme:cart:update'));
    })
    .catch(function (err) {
      isReAdding = false;
      console.warn('cart-labor-cost: fallback fix failed', err);
    });
  }

  /* ── Fetch interceptor ─────────────────────────────────────────── */

  var originalFetch = window.fetch;

  window.fetch = function (url, options) {
    var urlStr = typeof url === 'string' ? url : (url && url.url ? url.url : '');
    var isCartAdd = urlStr.indexOf('cart/add') !== -1;
    var isPost = options && options.method && options.method.toUpperCase() === 'POST';

    // Skip interception for our own re-add calls
    if (isReAdding) {
      return originalFetch.apply(this, arguments);
    }

    if (isCartAdd && isPost && options.body) {
      var handled = false;

      if (options.body instanceof FormData) {
        handled = processFormData(options.body);
      } else if (typeof options.body === 'string') {
        var result = processJsonBody(options.body);
        options.body = result.body;
        handled = result.handled;
      }

      // If we couldn't determine product type at request time, check the response
      if (!handled) {
        return originalFetch.apply(this, arguments).then(function (response) {
          var clone = response.clone();
          clone.json().then(function (data) {
            handleResponseFallback(data);
          }).catch(function () {});
          return response;
        });
      }
    }

    return originalFetch.apply(this, arguments);
  };
})();
