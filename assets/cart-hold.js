(function () {
  console.log('[CartHold] Initializing interception...');

  const originalFetch = window.fetch;

  window.fetch = async function (input, init) {
    let url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
    let options = init || {};

    const method    = (options.method || 'GET').toUpperCase();
    const urlString = url.toLowerCase();
    const isCartRequest = urlString.includes('/cart');

    if (isCartRequest && method === 'POST') {
      const isAdd    = urlString.includes('/add');
      const isChange = urlString.includes('/change');
      const isUpdate = urlString.includes('/update');
      const isClear  = urlString.includes('/clear');

      if (isAdd || isChange || isUpdate || isClear) {
        console.log('[CartHold] Intercepted cart POST:', url, { isAdd, isChange, isUpdate, isClear });

        try {
          let body = options.body;

          if (isClear) {
            const targets = await resolveClearTargets();
            await syncCartHold(targets, { mode: 'clear', injectProperties: false });
          } else {
            const targets = await resolveHoldTargets(body);
            await syncCartHold(targets, {
              mode: isAdd ? 'add' : (isChange ? 'change' : 'update'),
              injectProperties: isAdd,
              options,
              body,
            });
          }
        } catch (e) {
          console.error('[CartHold] Interception error:', e);
        }
      }
    }

    return originalFetch.call(this, input, options);
  };

  // ── resolveHoldTargets ─────────────────────────────────────────────────────

  async function resolveHoldTargets(body) {
    if (body == null) return [];

    if (typeof body === 'string') {
      try {
        return resolveHoldTargetsFromJson(JSON.parse(body));
      } catch (e) {
        console.error('[CartHold] JSON parse error:', e);
        return [];
      }
    }

    if (body instanceof FormData || body instanceof URLSearchParams) {
      return resolveHoldTargetsFromForm(body);
    }

    return [];
  }

  async function resolveHoldTargetsFromJson(json) {
    const targets = [];

    if (json.items && Array.isArray(json.items)) {
      for (const item of json.items) {
        const variantId = item.id || item.variant_id;
        const quantity  = item.quantity ?? 1;
        if (variantId) targets.push({ variantId, quantity, item });
      }
      return targets;
    }

    if (json.updates && typeof json.updates === 'object') {
      for (const [key, qty] of Object.entries(json.updates)) {
        targets.push({ variantId: key, quantity: qty });
      }
      return targets;
    }

    const quantity = json.quantity ?? 1;

    if (json.line != null) {
      const lineItem = await getCartLineItem(json.line);
      if (lineItem) {
        targets.push({
          line: Number(json.line),
          existingProperties: lineItem.properties || {},
          variantId: lineItem.variant_id,
          quantity: json.quantity ?? 0,
        });
      }
      return targets;
    }

    const rawId = json.id || json.variant_id;
    if (rawId != null) {
      const idStr = String(rawId);
      if (idStr.includes(':')) {
        targets.push({ variantId: idStr.split(':')[0], quantity });
      } else {
        targets.push({ variantId: rawId, quantity });
      }
      return targets;
    }

    return targets;
  }

  async function resolveHoldTargetsFromForm(body) {
    const line     = body.get('line');
    const quantity = body.get('quantity') ?? 1;
    const rawId    = body.get('id');

    if (line != null) {
      const lineItem = await getCartLineItem(line);
      if (lineItem) {
        return [{
          line: Number(line),
          existingProperties: lineItem.properties || {},
          variantId: lineItem.variant_id,
          quantity: Number(quantity) || 0,
        }];
      }
      return [];
    }

    if (rawId != null) {
      const idStr = String(rawId);
      const variantId = idStr.includes(':') ? idStr.split(':')[0] : rawId;
      return [{ variantId, quantity: Number(quantity) || 1 }];
    }

    return [];
  }

  async function resolveClearTargets() {
    const cart = await getCartData();
    if (!cart?.items?.length) return [];
    return cart.items.map((item) => ({
      variantId: item.variant_id,
      quantity: 0,
    }));
  }

  async function getCartLineItem(line) {
    const cart  = await getCartData();
    const index = Number(line) - 1;
    if (!cart?.items || index < 0 || index >= cart.items.length) return null;
    return cart.items[index];
  }

  let cartDataPromise = null;

  async function getCartData() {
    if (!cartDataPromise) {
      cartDataPromise = originalFetch('/cart.js')
        .then((res) => res.json())
        .finally(() => {
          cartDataPromise = null;
        });
    }
    return cartDataPromise;
  }

  // ── syncCartHold ───────────────────────────────────────────────────────────

  async function syncCartHold(targets, { mode, injectProperties, options, body } = {}) {
    if (!targets.length) {
      console.log('[CartHold] No hold targets resolved for request');
      return;
    }

    let jsonBody = null;
    if (typeof body === 'string' && (injectProperties || mode === 'change')) {
      try {
        jsonBody = JSON.parse(body);
      } catch (e) {
        /* not JSON */
      }
    }

    const holdPropsByVariant = new Map();

    await Promise.all(
      targets.map(async ({ line, existingProperties, variantId, quantity, item }) => {
        console.log(`[CartHold] Processing variant ${variantId}, qty ${quantity}`);
        const holdData = await postCartHold(variantId, quantity);

        if (!holdData) return;

        const holdProps = parseCartHoldResponse(holdData, variantId);
        if (!holdProps) return;
        holdPropsByVariant.set(String(variantId), holdProps);

        if (injectProperties) {
          if (jsonBody?.items && item) {
            item.properties = { ...item.properties, ...holdProps };
            console.log(`[CartHold] Injected into variant ${variantId}:`, holdProps);
          } else if (jsonBody) {
            jsonBody.properties = { ...jsonBody.properties, ...holdProps };
            console.log(`[CartHold] Injected into variant ${variantId}:`, holdProps);
          } else if (options?.body instanceof FormData || options?.body instanceof URLSearchParams) {
            injectPropertiesIntoForm(options, holdProps);
          }
        } else if (mode === 'change' && line && jsonBody) {
          const merged = { ...(existingProperties || {}), ...holdProps };
          jsonBody.properties = merged;
          console.log(`[CartHold] Updated properties for line ${line}, variant ${variantId}:`, merged);
        }
      })
    );

    if ((injectProperties || mode === 'change') && jsonBody && options) {
      options.body = JSON.stringify(jsonBody);
    }

    if (mode === 'update' && holdPropsByVariant.size > 0) {
      await applyHoldPropsAfterUpdate(holdPropsByVariant);
    }
  }

  async function applyHoldPropsAfterUpdate(holdPropsByVariant) {
    const cart = await getCartData();
    if (!cart?.items?.length) return;

    const updates = [];

    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      const holdProps = holdPropsByVariant.get(String(item.variant_id));
      if (!holdProps) continue;

      const merged = { ...(item.properties || {}), ...holdProps };
      updates.push({ line: i + 1, quantity: item.quantity, properties: merged, variantId: item.variant_id });
    }

    await Promise.all(
      updates.map(async ({ line, quantity, properties, variantId }) => {
        try {
          console.log(`[CartHold] Applying updated properties via change.js for line ${line}, variant ${variantId}`);
          await originalFetch('/cart/change.js', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ line, quantity, properties }),
          });
        } catch (e) {
          console.error('[CartHold] Failed applying properties after update:', e);
        }
      })
    );
  }

  // ── injectPropertiesIntoForm ───────────────────────────────────────────────

  function injectPropertiesIntoForm(options, props) {
    if (!props || Object.keys(props).length === 0) return;
    const formBody = options.body;
    if (formBody instanceof FormData) {
      for (const [key, value] of Object.entries(props)) {
        formBody.append(`properties[${key}]`, value);
      }
    } else if (formBody instanceof URLSearchParams) {
      for (const [key, value] of Object.entries(props)) {
        formBody.append(`properties[${key}]`, value);
      }
    }
  }

  // ── postCartHold ──────────────────────────────────────────────────────────

  async function postCartHold(variantId, quantity) {
    const shop = window.Shopify?.shop || window.location.hostname;

    let cartToken = getCartTokenFromCookie();
    if (!cartToken) {
      try {
        const cartData = await getCartData();
        cartToken = cartData?.token;
      } catch (e) {
        console.error('[CartHold] Failed to get cart token:', e);
        return null;
      }
    }

    if (!cartToken) return null;

    const cleanToken = decodeURIComponent(cartToken).split('?')[0];
    const apiUrl     = 'https://d347932ae7vrrw.cloudfront.net/api/cart-hold';
    const payload    = {
      cartToken: cleanToken,
      shop:      shop,
      variantId: Number(variantId),
      quantity:  Number(quantity) || 0,
    };

    console.log('[CartHold] API Request:', payload);

    try {
      const response = await originalFetch(apiUrl, {
        method:  'POST',
        headers: {
          'Content-Type':               'application/json',
          'Accept':                     'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) return null;
      const data = await response.json();
      console.log('[CartHold] API Response:', data);
      return data;
    } catch (error) {
      console.error('[CartHold] API call failed:', error);
      return null;
    }
  }

  // ── getCartTokenFromCookie ────────────────────────────────────────────────

  function getCartTokenFromCookie() {
    const match = document.cookie.match(/cart=([^;]+)/);
    return match ? match[1] : null;
  }

  // ── parseCartHoldResponse ─────────────────────────────────────────────────

  function parseCartHoldResponse(data, targetVariantId) {
    console.log('[CartHold] Parsing response for variant:', targetVariantId, data);
    if (!data) return null;

    const holdData = data.hold || data.data || data;
    const props    = {};

    let matchedProduct = null;

    if (Array.isArray(holdData.products) && holdData.products.length > 0) {
      if (targetVariantId) {
        matchedProduct = holdData.products.find((p) => {
          const gidTail = String(p.variantId || '').split('/').pop();
          return gidTail === String(targetVariantId);
        });

        if (!matchedProduct) {
          console.warn(
            `[CartHold] No product matched variantId ${targetVariantId} in response — falling back to products[0]`
          );
          matchedProduct = holdData.products[0];
        }
      } else {
        matchedProduct = holdData.products[0];
      }
    } else {
      matchedProduct = holdData;
    }

    if (!matchedProduct) return null;

    if (matchedProduct.sku) {
      props['_cart_hold_sku'] = matchedProduct.sku;
    }

    const locations = matchedProduct.locations || matchedProduct.inventory || matchedProduct.items;
    if (Array.isArray(locations) && locations.length > 0) {
      const summary = locations
        .map((l) => {
          const locName = l.locationName || l.name || l.location || l.warehouseType || 'Location';
          const qty     = l.availableQty ?? l.qty ?? l.available ?? l.quantity ?? 0;
          return `${locName}: ${qty}`;
        })
        .join(', ');
      props['_inventory_by_location'] = summary;
      props['_cart_hold_locations']   = JSON.stringify(locations);
    }

    const holdId =
      holdData.holdId    || holdData.hold_id    || holdData.id ||
      matchedProduct.holdId || matchedProduct.hold_id;
    if (holdId) props['_cart_hold_id'] = holdId.toString();

    if (holdData.status) props['_cart_hold_status'] = holdData.status.toString();

    console.log(`[CartHold] Properties for variant ${targetVariantId}:`, props);
    return Object.keys(props).length > 0 ? props : null;
  }

})();
