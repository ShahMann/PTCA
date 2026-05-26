/**
 * Cart Hold Integration
 * Intercepts all cart-related fetch requests to manage inventory holds.
 */
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
      console.log('[CartHold] Intercepted cart POST:', url);

      const isAdd    = urlString.includes('/add');
      const isChange = urlString.includes('/change');
      const isUpdate = urlString.includes('/update');
      const isClear  = urlString.includes('/clear');

      if (isAdd || isChange || isUpdate || isClear) {
        try {
          let body = options.body;

          // ── JSON body with items array ─────────────────────────────────────
          if (typeof body === 'string') {
            try {
              const json = JSON.parse(body);

              if (json.items && Array.isArray(json.items) && json.items.length > 0) {

                await Promise.all(
                  json.items.map(async (item) => {
                    const variantId = item.id || item.variant_id;
                    const quantity  = item.quantity || 1;

                    if (!variantId) {
                      console.log('[CartHold] Skipping item — no variantId:', item);
                      return;
                    }

                    console.log(`[CartHold] Processing variant ${variantId}, qty ${quantity}`);
                    const holdData = await postCartHold(variantId, quantity);

                    if (isAdd && holdData) {
                      // ✅ Pass variantId so parser finds the MATCHING product entry
                      const holdProps = parseCartHoldResponse(holdData, variantId);
                      if (holdProps) {
                        item.properties = { ...item.properties, ...holdProps };
                        console.log(`[CartHold] Injected into variant ${variantId}:`, holdProps);
                      }
                    }
                  })
                );

                options.body = JSON.stringify(json);

              } else {
                // Single-item JSON (no items array)
                const variantId = json.id || json.variant_id;
                const quantity  = json.quantity || 1;

                if (variantId) {
                  const holdData = await postCartHold(variantId, quantity);
                  if (isAdd && holdData) {
                    const holdProps = parseCartHoldResponse(holdData, variantId);
                    if (holdProps) {
                      json.properties = { ...json.properties, ...holdProps };
                      options.body = JSON.stringify(json);
                    }
                  }
                }
              }
            } catch (e) {
              console.error('[CartHold] JSON parse/process error:', e);
            }

          // ── FormData / URLSearchParams (always single-item) ───────────────
          } else if (body instanceof FormData || body instanceof URLSearchParams) {
            const variantId = body.get('id');
            const quantity  = body.get('quantity') || 1;

            if (variantId) {
              const holdData = await postCartHold(variantId, quantity);
              if (isAdd && holdData) {
                const holdProps = parseCartHoldResponse(holdData, variantId);
                if (holdProps) injectProperties(options, holdProps);
              }
            }
          }

        } catch (e) {
          console.error('[CartHold] Interception error:', e);
        }
      }
    }

    return originalFetch.apply(this, arguments);
  };

  // ── injectProperties (FormData / URLSearchParams only) ───────────────────

  function injectProperties(options, props) {
    if (!props || Object.keys(props).length === 0) return;
    const body = options.body;
    if (body instanceof FormData) {
      for (const [key, value] of Object.entries(props)) {
        body.append(`properties[${key}]`, value);
      }
    } else if (body instanceof URLSearchParams) {
      for (const [key, value] of Object.entries(props)) {
        body.append(`properties[${key}]`, value);
      }
    }
  }

  // ── postCartHold ──────────────────────────────────────────────────────────

  async function postCartHold(variantId, quantity) {
    const shop = window.Shopify?.shop || window.location.hostname;

    let cartToken = getCartTokenFromCookie();
    if (!cartToken) {
      try {
        const cartRes  = await originalFetch('/cart.js');
        const cartData = await cartRes.json();
        cartToken = cartData.token;
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
      quantity:  Number(quantity) || 1,
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
  // ✅ targetVariantId is now used to find the correct product entry by GID

  function parseCartHoldResponse(data, targetVariantId) {
    console.log('[CartHold] Parsing response for variant:', targetVariantId, data);
    if (!data) return null;

    const holdData = data.hold || data.data || data;
    const props    = {};

    // Find the product whose GID tail matches targetVariantId
    let matchedProduct = null;

    if (Array.isArray(holdData.products) && holdData.products.length > 0) {
      if (targetVariantId) {
        matchedProduct = holdData.products.find((p) => {
          // GID format: "gid://shopify/ProductVariant/45148495413357"
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
      // Response has no products array — treat holdData itself as the product
      matchedProduct = holdData;
    }

    if (!matchedProduct) return null;

    // SKU
    if (matchedProduct.sku) {
      props['_cart_hold_sku'] = matchedProduct.sku;
    }

    // Locations
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

    // Hold ID (top-level or per-product)
    const holdId =
      holdData.holdId    || holdData.hold_id    || holdData.id ||
      matchedProduct.holdId || matchedProduct.hold_id;
    if (holdId) props['_cart_hold_id'] = holdId.toString();

    if (holdData.status) props['_cart_hold_status'] = holdData.status.toString();

    console.log(`[CartHold] Properties for variant ${targetVariantId}:`, props);
    return Object.keys(props).length > 0 ? props : null;
  }
})();