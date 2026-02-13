
/*
* @license
* Palo Alto Theme (c)
*
* This file is included for advanced development by
* Shopify Agencies.  Modified versions of the theme
* code are not supported by Shopify or Presidio Creative.
*
* In order to use this file you will need to change
* theme.js to theme.dev.js in /layout/theme.liquid
*
*/

(function (scrollLock, Flickity, themeCurrency, Ajaxinate) {
    'use strict';

    (function() {
        const env = {"NODE_ENV":"production"};
        try {
            if (process) {
                process.env = Object.assign({}, process.env);
                Object.assign(process.env, env);
                return;
            }
        } catch (e) {} // avoid ReferenceError: process is not defined
        globalThis.process = { env:env };
    })();

    window.theme = window.theme || {};

    window.theme.sizes = {
      mobile: 480,
      small: 768,
      large: 1024,
      widescreen: 1440,
    };

    window.theme.keyboardKeys = {
      TAB: 'Tab',
      ENTER: 'Enter',
      NUMPADENTER: 'NumpadEnter',
      ESCAPE: 'Escape',
      SPACE: 'Space',
      LEFTARROW: 'ArrowLeft',
      RIGHTARROW: 'ArrowRight',
    };

    window.theme.focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    function debounce(fn, time) {
      let timeout;
      return function () {
        // eslint-disable-next-line prefer-rest-params
        if (fn) {
          const functionCall = () => fn.apply(this, arguments);
          clearTimeout(timeout);
          timeout = setTimeout(functionCall, time);
        }
      };
    }

    const selectors$1m = {
      body: 'body',
      main: '[data-main]',
      header: '[data-site-header]',
      preventTransparentHeader: '[data-prevent-transparent-header]',
    };
    const classes$1b = {
      supportsTransparentHeader: 'supports-transparent-header',
    };

    const attributes$Y = {
      transparent: 'data-transparent',
    };

    const initTransparentHeader = () => {
      // Determine what is the first
      const body = document.querySelector(selectors$1m.body);
      const header = body.querySelector(selectors$1m.header);

      if (!header) return;

      const headerTransparent = header.getAttribute(attributes$Y.transparent) === 'true';
      const firstSection = body.querySelector(selectors$1m.main).children[0];

      if (!firstSection) return;

      const preventTransparentHeader = firstSection.querySelector(`${selectors$1m.preventTransparentHeader}:first-of-type`);
      window.isHeaderTransparent = headerTransparent && firstSection.classList.contains(classes$1b.supportsTransparentHeader) && !preventTransparentHeader;
    };

    const selectors$1l = {
      footerParallax: '.section-footer--parallax',
      footerParallaxInner: '[data-section-type]',
      wave: ':scope > [data-wave]',
      sectionsWavy: '.wavy:not(.site-footer)',
      sectionsShadow: '.parallax-shadow:not(.site-footer)',
    };
    const classes$1a = {
      wavy: 'wavy',
      shadow: 'parallax-shadow',
      rounded: 'parallax-rounded-corners',
      footerParallax: 'section-footer--parallax',
      bodyRoundedCornersLarge: 'body--rounded-corners-large',
    };

    const attributes$X = {
      parallaxWavy: 'data-parallax-wavy',
    };

    const removeFooterWave = (section) => {
      const currentSection = section;

      const wavySections = document.querySelectorAll(selectors$1l.sectionsWavy);
      const shadowSections = document.querySelectorAll(selectors$1l.sectionsShadow);

      wavySections.forEach((wavySection) => {
        // Remove wavy class
        wavySection.classList.remove(classes$1a.wavy);

        // Remove wave
        const waves = wavySection.querySelectorAll(selectors$1l.wave);
        [...waves].map((wave) => wave.remove());
      });

      shadowSections.forEach((shadowSection) => {
        // Remove shadow class
        shadowSection.classList.remove(classes$1a.shadow);
        // Remove rounded classes
        shadowSection.classList.remove(classes$1a.rounded);
        document.body.classList.remove(classes$1a.bodyRoundedCornersLarge);

        // Remove wave if any
        const waves = shadowSection.querySelectorAll(selectors$1l.wave);
        [...waves].map((wave) => wave.remove());
      });

      const footerParallax = document.querySelectorAll(selectors$1l.footerParallax);
      if (footerParallax.length > 0) {
        const footerParallaxInner = footerParallax[0].querySelector(selectors$1l.footerParallaxInner);
        if (footerParallaxInner.hasAttribute(attributes$X.parallaxWavy)) {
          footerParallaxInner.classList.add(classes$1a.wavy);
        }
      }

      if (!currentSection.classList.contains(classes$1a.footerParallax)) {
        document.dispatchEvent(new CustomEvent('theme:footer:unload'));
      }
    };

    window.Shopify = window.Shopify || {};
    window.Shopify.theme = window.Shopify.theme || {};
    window.Shopify.theme.sections = window.Shopify.theme.sections || {};

    window.Shopify.theme.sections.registered = window.Shopify.theme.sections.registered || {};
    window.Shopify.theme.sections.instances = window.Shopify.theme.sections.instances || [];
    const registered = window.Shopify.theme.sections.registered;
    const instances = window.Shopify.theme.sections.instances;

    const attributes$W = {
      id: 'data-section-id',
      type: 'data-section-type',
    };

    class Registration {
      constructor(type = null, components = []) {
        this.type = type;
        this.components = validateComponentsArray(components);
        this.callStack = {
          onLoad: [],
          onUnload: [],
          onSelect: [],
          onDeselect: [],
          onBlockSelect: [],
          onBlockDeselect: [],
          onReorder: [],
        };
        components.forEach((comp) => {
          for (const [key, value] of Object.entries(comp)) {
            const arr = this.callStack[key];
            if (Array.isArray(arr) && typeof value === 'function') {
              arr.push(value);
            } else {
              console.warn(`Unregisted function: '${key}' in component: '${this.type}'`);
              console.warn(value);
            }
          }
        });
      }

      getStack() {
        return this.callStack;
      }
    }

    class Section {
      constructor(container, registration) {
        this.container = validateContainerElement(container);
        this.id = container.getAttribute(attributes$W.id);
        this.type = registration.type;
        this.callStack = registration.getStack();

        try {
          this.onLoad();
        } catch (e) {
          console.warn(`Error in section: ${this.id}`);
          console.warn(this);
          console.warn(e);
        }
      }

      callFunctions(key, e = null) {
        this.callStack[key].forEach((func) => {
          const props = {
            id: this.id,
            type: this.type,
            container: this.container,
          };
          if (e) {
            func.call(props, e);
          } else {
            func.call(props);
          }
        });
      }

      onLoad() {
        this.callFunctions('onLoad');
      }

      onUnload() {
        this.callFunctions('onUnload');
      }

      onSelect(e) {
        this.callFunctions('onSelect', e);
      }

      onDeselect(e) {
        this.callFunctions('onDeselect', e);
      }

      onBlockSelect(e) {
        this.callFunctions('onBlockSelect', e);
      }

      onBlockDeselect(e) {
        this.callFunctions('onBlockDeselect', e);
      }

      onReorder(e) {
        this.callFunctions('onReorder', e);
      }
    }

    function validateContainerElement(container) {
      if (!(container instanceof Element)) {
        throw new TypeError('Theme Sections: Attempted to load section. The section container provided is not a DOM element.');
      }
      if (container.getAttribute(attributes$W.id) === null) {
        throw new Error('Theme Sections: The section container provided does not have an id assigned to the ' + attributes$W.id + ' attribute.');
      }

      return container;
    }

    function validateComponentsArray(value) {
      if ((typeof value !== 'undefined' && typeof value !== 'object') || value === null) {
        throw new TypeError('Theme Sections: The components object provided is not a valid');
      }

      return value;
    }

    /*
     * @shopify/theme-sections
     * -----------------------------------------------------------------------------
     *
     * A framework to provide structure to your Shopify sections and a load and unload
     * lifecycle. The lifecycle is automatically connected to theme editor events so
     * that your sections load and unload as the editor changes the content and
     * settings of your sections.
     */

    function register(type, components) {
      if (typeof type !== 'string') {
        throw new TypeError('Theme Sections: The first argument for .register must be a string that specifies the type of the section being registered');
      }

      if (typeof registered[type] !== 'undefined') {
        throw new Error('Theme Sections: A section of type "' + type + '" has already been registered. You cannot register the same section type twice');
      }

      if (!Array.isArray(components)) {
        components = [components];
      }

      const section = new Registration(type, components);
      registered[type] = section;

      return registered;
    }

    function load(types, containers) {
      types = normalizeType(types);

      if (typeof containers === 'undefined') {
        containers = document.querySelectorAll('[' + attributes$W.type + ']');
      }

      containers = normalizeContainers(containers);

      types.forEach(function (type) {
        const registration = registered[type];

        if (typeof registration === 'undefined') {
          return;
        }

        containers = containers.filter(function (container) {
          // Filter from list of containers because container already has an instance loaded
          if (isInstance(container)) {
            return false;
          }

          // Filter from list of containers because container doesn't have data-section-type attribute
          if (container.getAttribute(attributes$W.type) === null) {
            return false;
          }

          // Keep in list of containers because current type doesn't match
          if (container.getAttribute(attributes$W.type) !== type) {
            return true;
          }

          instances.push(new Section(container, registration));

          // Filter from list of containers because container now has an instance loaded
          return false;
        });
      });
    }

    function reorder(selector) {
      var instancesToReorder = getInstances(selector);

      instancesToReorder.forEach(function (instance) {
        instance.onReorder();
      });
    }

    function unload(selector) {
      var instancesToUnload = getInstances(selector);

      instancesToUnload.forEach(function (instance) {
        var index = instances
          .map(function (e) {
            return e.id;
          })
          .indexOf(instance.id);
        instances.splice(index, 1);
        instance.onUnload();
      });
    }

    function getInstances(selector) {
      var filteredInstances = [];

      // Fetch first element if its an array
      if (NodeList.prototype.isPrototypeOf(selector) || Array.isArray(selector)) {
        var firstElement = selector[0];
      }

      // If selector element is DOM element
      if (selector instanceof Element || firstElement instanceof Element) {
        var containers = normalizeContainers(selector);

        containers.forEach(function (container) {
          filteredInstances = filteredInstances.concat(
            instances.filter(function (instance) {
              return instance.container === container;
            })
          );
        });

        // If select is type string
      } else if (typeof selector === 'string' || typeof firstElement === 'string') {
        var types = normalizeType(selector);

        types.forEach(function (type) {
          filteredInstances = filteredInstances.concat(
            instances.filter(function (instance) {
              return instance.type === type;
            })
          );
        });
      }

      return filteredInstances;
    }

    function getInstanceById(id) {
      var instance;

      for (var i = 0; i < instances.length; i++) {
        if (instances[i].id === id) {
          instance = instances[i];
          break;
        }
      }
      return instance;
    }

    function isInstance(selector) {
      return getInstances(selector).length > 0;
    }

    function normalizeType(types) {
      // If '*' then fetch all registered section types
      if (types === '*') {
        types = Object.keys(registered);

        // If a single section type string is passed, put it in an array
      } else if (typeof types === 'string') {
        types = [types];

        // If single section constructor is passed, transform to array with section
        // type string
      } else if (types.constructor === Section) {
        types = [types.prototype.type];

        // If array of typed section constructors is passed, transform the array to
        // type strings
      } else if (Array.isArray(types) && types[0].constructor === Section) {
        types = types.map(function (Section) {
          return Section.type;
        });
      }

      types = types.map(function (type) {
        return type.toLowerCase();
      });

      return types;
    }

    function normalizeContainers(containers) {
      // Nodelist with entries
      if (NodeList.prototype.isPrototypeOf(containers) && containers.length > 0) {
        containers = Array.prototype.slice.call(containers);

        // Empty Nodelist
      } else if (NodeList.prototype.isPrototypeOf(containers) && containers.length === 0) {
        containers = [];

        // Handle null (document.querySelector() returns null with no match)
      } else if (containers === null) {
        containers = [];

        // Single DOM element
      } else if (!Array.isArray(containers) && containers instanceof Element) {
        containers = [containers];
      }

      return containers;
    }

    if (window.Shopify.designMode) {
      document.addEventListener('shopify:section:load', function (event) {
        var id = event.detail.sectionId;
        var container = event.target.querySelector('[' + attributes$W.id + '="' + id + '"]');

        // The global variable `Shopify.visualPreviewMode` will return true if you're in the theme editor's visual preview, and `undefined` if not.
        if (window.Shopify.visualPreviewMode === true) {
          // Dynamically generated section ID by Shopify is sometimes missing a part of it, when generated in `shopify-visual-preview-section-list-item` preview container
          // and we cannot find the exact `container` to `load()`, eg. instead of ID of `template--20722209358146__eyJzZWN0aW9uIjoi` we get an ID of `template--20722209358146__`
          // Updating the `container` variable here is solely for the purpose of getting the proper container when this is the case
          if (container === null) {
            // This should be done only for theme editor's visual preview so that the section's JS is loaded inside it and the preview is not broken
            // Eventually, in case we still cannot get hold of the right `container`, preview should still look decent, by rendering a section's Liquid, CSS and Web Components
            container = event.target.querySelector(`[${attributes$W.id}]`);
          }
        }

        if (container !== null) {
          load(container.getAttribute(attributes$W.type), container);
        }
      });

      document.addEventListener('shopify:section:reorder', function (event) {
        var id = event.detail.sectionId;
        var container = event.target.querySelector('[' + attributes$W.id + '="' + id + '"]');
        var instance = getInstances(container)[0];

        if (typeof instance === 'object') {
          reorder(container);
        }
      });

      document.addEventListener('shopify:section:unload', function (event) {
        var id = event.detail.sectionId;
        var container = event.target.querySelector('[' + attributes$W.id + '="' + id + '"]');
        var instance = getInstances(container)[0];

        if (typeof instance === 'object') {
          unload(container);
        }
      });

      document.addEventListener('shopify:section:select', function (event) {
        var instance = getInstanceById(event.detail.sectionId);

        if (typeof instance === 'object') {
          instance.onSelect(event);
        }
      });

      document.addEventListener('shopify:section:deselect', function (event) {
        var instance = getInstanceById(event.detail.sectionId);

        if (typeof instance === 'object') {
          instance.onDeselect(event);
        }
      });

      document.addEventListener('shopify:block:select', function (event) {
        var instance = getInstanceById(event.detail.sectionId);

        if (typeof instance === 'object') {
          instance.onBlockSelect(event);
        }
      });

      document.addEventListener('shopify:block:deselect', function (event) {
        var instance = getInstanceById(event.detail.sectionId);

        if (typeof instance === 'object') {
          instance.onBlockDeselect(event);
        }
      });
    }

    const selectors$1k = {
      cardScrolling: '[data-parallax="card-scrolling"]',
    };

    const reloadCardScrolling = () => {
      setTimeout(() => {
        const shopifyInstances = window.Shopify.theme.sections.instances;
        const cardScrollingInstances = shopifyInstances.filter((instance) => {
          const isSliderSection = instance.type === 'slider';
          const isBannerImageSection = instance.type === 'banner-image';
          const hasCardScrollingEffect = instance.container.matches(selectors$1k.cardScrolling);

          const isEligible = (isSliderSection && hasCardScrollingEffect) || (isBannerImageSection && hasCardScrollingEffect);

          return isEligible;
        });

        cardScrollingInstances.forEach((instance) => {
          unload(instance.id);
          setTimeout(() => load(instance.id));
        });
      });
    };

    let screenOrientation = getScreenOrientation();

    const selectors$1j = {
      body: 'body',
      main: '[data-main]',
      collectionFilters: '[data-collection-filters]',
      footer: '[data-section-type*="footer"]',
      header: '[data-header-height]',
      stickyHeader: '[data-site-header][data-position="fixed"]',
      announcementBar: '[data-announcement-bar]',
      collectionStickyBar: '[data-collection-sticky-bar]',
      logoTextLink: '[data-logo-text-link]',
    };

    const classes$19 = {
      templateCollection: 'template-collection',
      templateSearch: 'template-search',
      supportsTransparentHeader: 'supports-transparent-header',
    };

    function readHeights() {
      const h = {};
      h.windowHeight = Math.min(window.screen.height, window.innerHeight);
      h.footerHeight = getHeight(selectors$1j.footer);
      h.headerHeight = getHeight(selectors$1j.header);
      h.stickyHeaderHeight = isHeaderSticky() ? window.stickyHeaderHeight : 0;
      h.headerInitialHeight = parseInt(document.querySelector(selectors$1j.header)?.dataset.height || document.querySelector(selectors$1j.header)?.offsetHeight) || 0;
      h.announcementBarHeight = getHeight(selectors$1j.announcementBar);
      h.collectionStickyBarHeight = getHeight(selectors$1j.collectionStickyBar);
      return h;
    }

    function setVarsOnResize() {
      document.addEventListener('theme:resize', resizeVars);
      setVars();
      document.dispatchEvent(new CustomEvent('theme:vars'), {bubbles: false});
    }

    function setVars() {
      calcVars();
    }

    function resizeVars() {
      // restrict the heights that are changed on resize to avoid iOS jump when URL bar is shown and hidden
      calcVars(true);
    }

    function calcVars(checkOrientation = false) {
      const body = document.querySelector(selectors$1j.body);
      const hasCollectionFilters = document.querySelector(selectors$1j.collectionFilters);
      const hasLogoTextLink = document.querySelector(selectors$1j.logoTextLink) !== null;

      let {windowHeight, headerHeight, headerInitialHeight, announcementBarHeight, footerHeight, collectionStickyBarHeight} = readHeights();

      if (hasLogoTextLink) headerHeight = recalcHeaderHeight();

      const contentFullHeight = window.isHeaderTransparent && checkFirstSectionTransparency() ? windowHeight - announcementBarHeight : windowHeight - headerInitialHeight - announcementBarHeight;
      let fullHeight = isHeaderSticky() ? windowHeight - window.stickyHeaderHeight : windowHeight;
      const isCollectionPage = body.classList.contains(classes$19.templateCollection);
      const isSearchPage = body.classList.contains(classes$19.templateSearch);
      const isPageWithFilters = (isCollectionPage && hasCollectionFilters) || (isSearchPage && hasCollectionFilters);

      document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
      document.documentElement.style.setProperty('--content-full', `${contentFullHeight}px`);
      document.documentElement.style.setProperty('--content-min', `${windowHeight - headerHeight - footerHeight}px`);
      document.documentElement.style.setProperty('--collection-sticky-bar-height', `${collectionStickyBarHeight}px`);

      if (isPageWithFilters) fullHeight = windowHeight;

      if (!checkOrientation) {
        document.documentElement.style.setProperty('--full-height', `${fullHeight}px`);
        return;
      }

      const currentScreenOrientation = getScreenOrientation();
      if (currentScreenOrientation !== screenOrientation) {
        // Only update the heights on screen orientation change
        document.documentElement.style.setProperty('--full-height', `${fullHeight}px`);

        // Update the screen orientation state
        screenOrientation = currentScreenOrientation;
      }
    }

    function getHeight(selector) {
      const el = document.querySelector(selector);
      if (el) {
        return el.clientHeight;
      } else {
        return 0;
      }
    }

    function checkFirstSectionTransparency() {
      const firstSection = document.querySelector(selectors$1j.main).firstElementChild;
      return firstSection.classList.contains(classes$19.supportsTransparentHeader);
    }

    function isHeaderSticky() {
      return document.querySelector(selectors$1j.stickyHeader);
    }

    function getScreenOrientation() {
      if (window.matchMedia('(orientation: portrait)').matches) {
        return 'portrait';
      }

      if (window.matchMedia('(orientation: landscape)').matches) {
        return 'landscape';
      }
    }

    function recalcHeaderHeight() {
      document.documentElement.style.setProperty('--header-height', 'auto');
      document.documentElement.style.setProperty('--header-sticky-height', 'auto');

      // Header is declared here to avoid `offsetHeight` returning zero when the element has not been rendered to the DOM yet in the Theme editor
      const header = document.querySelector(selectors$1j.header);
      const resetHeight = header.offsetHeight;

      // requestAnimationFrame method is needed to properly update the CSS variables on resize after they have been reset
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--header-height', `${resetHeight}px`);
        document.documentElement.style.setProperty('--header-sticky-height', `${resetHeight}px`);
      });

      return resetHeight;
    }

    const selectors$1i = {
      overflowBackground: '[data-overflow-background]',
      overflowFrame: '[data-overflow-frame]',
      overflowContent: '[data-overflow-content]',
      overflowContainer: '[data-overflow-container]',
      overflowWrapper: '[data-overflow-wrapper]',
    };

    function singles(frame, wrappers) {
      // sets the height of any frame passed in with the
      // tallest preventOverflowContent as well as any image in that frame
      let tallest = 0;

      wrappers.forEach((wrap) => {
        tallest = wrap.offsetHeight > tallest ? wrap.offsetHeight : tallest;
      });
      const images = frame.querySelectorAll(selectors$1i.overflowBackground);
      const frames = [frame, ...images];
      frames.forEach((el) => {
        el.style.setProperty('min-height', `calc(${tallest}px + var(--header-height))`);
      });
    }

    function doubles(section) {
      if (window.innerWidth < window.theme.sizes.small) {
        // if we are below the small breakpoint, the double section acts like two independent
        // single frames
        let singleFrames = section.querySelectorAll(selectors$1i.overflowFrame);
        singleFrames.forEach((singleframe) => {
          const wrappers = singleframe.querySelectorAll(selectors$1i.overflowContent);
          singles(singleframe, wrappers);
        });
        return;
      }

      let tallest = 0;

      const frames = section.querySelectorAll(selectors$1i.overflowFrame);
      const contentWrappers = section.querySelectorAll(selectors$1i.overflowContent);
      contentWrappers.forEach((content) => {
        if (content.offsetHeight > tallest) {
          tallest = content.offsetHeight;
        }
      });
      const images = section.querySelectorAll(selectors$1i.overflowBackground);
      let applySizes = [...frames, ...images];
      applySizes.forEach((el) => {
        el.style.setProperty('min-height', `${tallest}px`);
      });
      section.style.setProperty('min-height', `${tallest}px`);
    }

    function preventOverflow(container) {
      const singleFrames = container.querySelectorAll(selectors$1i.overflowContainer);
      if (singleFrames) {
        singleFrames.forEach((frame) => {
          const wrappers = frame.querySelectorAll(selectors$1i.overflowContent);
          singles(frame, wrappers);
          document.addEventListener('theme:resize', () => {
            singles(frame, wrappers);
          });
        });
      }

      const doubleSections = container.querySelectorAll(selectors$1i.overflowWrapper);
      if (doubleSections) {
        doubleSections.forEach((section) => {
          doubles(section);
          document.addEventListener('theme:resize', () => {
            doubles(section);
          });
        });
      }
    }

    window.lastWindowWidth = window.innerWidth;

    function dispatchResizeEvent() {
      document.dispatchEvent(
        new CustomEvent('theme:resize', {
          bubbles: true,
        })
      );

      if (window.lastWindowWidth !== window.innerWidth) {
        document.dispatchEvent(
          new CustomEvent('theme:resize:width', {
            bubbles: true,
          })
        );

        window.lastWindowWidth = window.innerWidth;
      }
    }

    function resizeListener() {
      window.addEventListener('resize', debounce(dispatchResizeEvent, 50));
    }

    let prev = window.pageYOffset;
    let up = null;
    let down = null;
    let wasUp = null;
    let wasDown = null;
    let scrollLockTimer$1 = 0;

    const classes$18 = {
      quickViewVisible: 'js-quick-view-visible',
      cartDrawerOpen: 'js-drawer-open-cart',
    };

    function dispatchScrollEvent() {
      const position = window.pageYOffset;
      if (position > prev) {
        down = true;
        up = false;
      } else if (position < prev) {
        down = false;
        up = true;
      } else {
        up = null;
        down = null;
      }
      prev = position;
      document.dispatchEvent(
        new CustomEvent('theme:scroll', {
          detail: {
            up,
            down,
            position,
          },
          bubbles: false,
        })
      );
      if (up && !wasUp) {
        document.dispatchEvent(
          new CustomEvent('theme:scroll:up', {
            detail: {position},
            bubbles: false,
          })
        );
      }
      if (down && !wasDown) {
        document.dispatchEvent(
          new CustomEvent('theme:scroll:down', {
            detail: {position},
            bubbles: false,
          })
        );
      }
      wasDown = down;
      wasUp = up;
    }

    function lock(e) {
      // Prevent body scroll lock race conditions
      setTimeout(() => {
        if (scrollLockTimer$1) {
          clearTimeout(scrollLockTimer$1);
        }

        scrollLock.disablePageScroll(e.detail, {
          allowTouchMove: (el) => el.tagName === 'TEXTAREA',
        });

        document.documentElement.setAttribute('data-scroll-locked', '');
      });
    }

    function unlock(e) {
      const timeout = e.detail;

      if (timeout) {
        scrollLockTimer$1 = setTimeout(removeScrollLock, timeout);
      } else {
        removeScrollLock();
      }
    }

    function removeScrollLock() {
      const isPopupVisible = document.body.classList.contains(classes$18.quickViewVisible) || document.body.classList.contains(classes$18.cartDrawerOpen);

      if (!isPopupVisible) {
        scrollLock.clearQueueScrollLocks();
        scrollLock.enablePageScroll();
        document.documentElement.removeAttribute('data-scroll-locked');
      }
    }

    function scrollListener() {
      let timeout;
      window.addEventListener(
        'scroll',
        function () {
          if (timeout) {
            window.cancelAnimationFrame(timeout);
          }
          timeout = window.requestAnimationFrame(function () {
            dispatchScrollEvent();
          });
        },
        {passive: true}
      );

      window.addEventListener('theme:scroll:lock', lock);
      window.addEventListener('theme:scroll:unlock', unlock);
    }

    const wrap = (toWrap, wrapperClass = '', wrapperOption) => {
      const wrapper = wrapperOption || document.createElement('div');
      wrapper.classList.add(wrapperClass);
      wrapper.setAttribute('data-scroll-lock-scrollable', '');
      toWrap.parentNode.insertBefore(wrapper, toWrap);
      return wrapper.appendChild(toWrap);
    };

    function wrapElements(container) {
      // Target tables to make them scrollable
      const tableSelectors = 'table';
      const tables = container.querySelectorAll(tableSelectors);
      tables.forEach((table) => {
        wrap(table, 'table-wrapper');
      });
    }

    function isTouchDevice() {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    }

    function isTouch() {
      if (isTouchDevice()) {
        document.documentElement.className = document.documentElement.className.replace('no-touch', 'supports-touch');
        window.theme.touch = true;
      } else {
        window.theme.touch = false;
      }
    }

    const classes$17 = {
      loading: 'is-loading',
      imgIn: 'img-in',
    };

    const selectors$1h = {
      img: 'img.is-loading',
      section: '[data-section-type]',
    };

    /*
      Catch images loaded events and add class "is-loaded" to them and their containers
    */
    function loadedImagesEventHook() {
      document.addEventListener(
        'load',
        (e) => {
          if (e.target.tagName.toLowerCase() == 'img' && e.target.classList.contains(classes$17.loading)) {
            e.target.classList.remove(classes$17.loading);
            e.target.parentNode.classList.remove(classes$17.loading);

            const section = e.target.closest(selectors$1h.section);
            if (section) section.classList.add(classes$17.imgIn);
          }
        },
        true
      );
    }

    /*
      Remove "is-loading" class to the loaded images and their containers
    */
    function removeLoadingClassFromLoadedImages(container) {
      container.querySelectorAll(selectors$1h.img).forEach((img) => {
        if (img.complete) {
          img.classList.remove(classes$17.loading);
          img.parentNode.classList.remove(classes$17.loading);

          const section = img.closest(selectors$1h.section);
          if (section) section.classList.add(classes$17.imgIn);
        }
      });
    }

    /**
     * This component prevents any HTML from being loaded,
     * until user's cursor is over the component or over specific trigger referenced by the <deferred-loading> element.
     * The main focus is for deferred loading of images.
     * Loading is triggered by a 'mouseenter' event rendering depends on a `<template>` element that should hold all of the HTML
     *
     * @example
     *  <deferred-loading data-deferred-container=".parent-container-selector" data-deferred-triggers=".button-element-selector">
     *    <template>
     *      <div data-deferred-content>
     *        // Insert deferred markup or images here:
     *        {%- render 'image', image: section.settings.image_1 -%}
     *        {%- render 'image', image: section.settings.image_2 -%}
     *      </div>
     *    </template>
     *  </deferred-loading>
     */
    const selectors$1g = {
      img: 'img',
      template: 'template',
      shopifySection: '.shopify-section',
      deferredContent: '[data-deferred-content]',
      reloadSrcsetException: '[data-product-image]',
    };

    const attributes$V = {
      srcset: 'srcset',
      loaded: 'data-loaded',
      deferredContainer: 'data-deferred-container',
    };

    class DeferredLoading extends HTMLElement {
      constructor() {
        super();

        this.container = this;
        if (this.hasAttribute(attributes$V.deferredContainer)) {
          this.container = this.closest(this.getAttribute(attributes$V.deferredContainer)) || this.closest(selectors$1g.shopifySection);
        }

        this.deferredTriggers = this.container.querySelectorAll(this.dataset.deferredTriggers);
      }

      connectedCallback() {
        if (this.deferredTriggers.length == 0) {
          this.container.addEventListener(
            'mouseenter',
            () => {
              if (this.hasAttribute(attributes$V.loaded)) return;
              this.loadTemplate();
            },
            {once: true}
          );

          return;
        }

        this.deferredTriggers.forEach((trigger) => {
          trigger.addEventListener(
            'mouseenter',
            () => {
              if (this.hasAttribute(attributes$V.loaded)) return;
              this.loadTemplate();
            },
            {once: true}
          );
        });
      }

      loadTemplate() {
        const content = document.createElement('div');
        const template = this.querySelector(selectors$1g.template);
        if (!template || !template?.content?.firstElementChild) return;

        content.appendChild(template.content.firstElementChild.cloneNode(true));

        const deferredContent = content.querySelector(selectors$1g.deferredContent);
        if (!deferredContent) return;

        this.append(deferredContent);
        this.setAttribute(attributes$V.loaded, true);

        const containsImages = deferredContent.querySelectorAll(selectors$1g.img).length > 0;
        if (containsImages) {
          this.reloadSrcset(this);
        }
      }

      // Reload srcset for correct image render on Safari - fixes 'object-fit: cover' issues
      reloadSrcset(container) {
        if (!container) return;
        container.querySelectorAll(selectors$1g.img).forEach((img) => {
          const reloadSrcsetException = img.parentNode.matches(selectors$1g.reloadSrcsetException);

          if (!reloadSrcsetException) {
            const srcset = img.getAttribute(attributes$V.srcset);
            img.setAttribute(attributes$V.srcset, '');
            img.setAttribute(attributes$V.srcset, srcset);
          }
        });
      }
    }

    /*
      Trigger event after animation completes
    */
    function waitForAnimationEnd(element) {
      return new Promise((resolve) => {
        function onAnimationEnd(event) {
          if (event.target != element) return;

          element.removeEventListener('animationend', onAnimationEnd);
          element.removeEventListener('transitionend', onAnimationEnd);
          resolve();
        }

        element?.addEventListener('animationend', onAnimationEnd);
        element?.addEventListener('transitionend', onAnimationEnd);
      });
    }

    /**
     * This component is responsible for:
     *  - animating highlighted text decorations on page load, section load and on scrolling down
     *  - adding a reversed animation on hover whenever highlighted text contains a link
     *  - including a method for triggering the highlighted text animations on events like slide change, active item swapping, etc.
     */
    const selectors$1f = {
      aos: '[data-aos]',
      link: '[data-has-highlight]',
      highlightHolder: '[data-highlight-holder]',
      path: 'path',
      sup: 'sup',
      flickityEnabled: '.flickity-enabled',
      activeSlide: '[data-slide].is-selected',
      stickyTextItem: '[data-sticky-text]',
      textCountUp: 'text-count-up',
      textRevealCropper: '.text-reveal__cropper',
    };

    const attributes$U = {
      highlightType: 'data-highlight-type',
      isActive: 'data-is-active',
    };

    const classes$16 = {
      isActive: 'is-active',
      overflowHidden: 'overflow-hidden',
    };

    const settings$b = {
      'circle-hand-drawn': {
        keyframes: [
          {strokeDashoffset: '1', opacity: '0'},
          {opacity: '1', offset: 0.01},
          {strokeDashoffset: '0', opacity: '1'},
        ],
        timing: {
          duration: 1000,
          delay: 0,
          iterations: 1,
          fill: 'forwards',
          easing: 'cubic-bezier(0.7, 0, 0.3, 1)',
        },
      },
      circle: {
        keyframes: [
          {strokeDashoffset: '506', opacity: '0'},
          {opacity: '1', offset: 0.01},
          {strokeDashoffset: '0', opacity: '1'},
        ],
        timing: {
          duration: 800,
          delay: 0,
          iterations: 1,
          fill: 'forwards',
          easing: 'cubic-bezier(0.6, 0, 0.4, 1)',
        },
      },
      highlight: {
        keyframes: [{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}],
        timing: {
          duration: 600,
          delay: 200,
          iterations: 1,
          fill: 'forwards',
          easing: 'ease',
          pseudoElement: '::before',
        },
        keyframesHover: [{transform: 'scaleY(0.1)'}, {transform: 'scaleY(1)'}],
      },
      'highlight-color': {
        keyframes: [
          {backgroundSize: '200% 100%', backgroundPosition: '100% 0'},
          {backgroundSize: '200% 100%', backgroundPosition: '0 0', offset: 0.2},
          {backgroundSize: '1100% 100%', backgroundPosition: '0 0'},
        ],
        timing: {
          duration: 2000,
          delay: 200,
          iterations: 1,
          fill: 'forwards',
          easing: 'cubic-bezier(0, 0, 0.9, 0.4)',
        },
      },
      'alternate-font': {
        keyframes: [{opacity: '0'}, {opacity: '1'}],
        timing: {
          duration: 400,
          delay: 0,
          iterations: 1,
          fill: 'forwards',
          easing: 'ease-out',
        },
        keyframesHover: [{opacity: '1'}, {opacity: '0.7'}],
      },
      squiggle: {
        keyframes: [{maskPosition: '100% 0'}, {maskPosition: '0 0'}],
        timing: {
          duration: 1200,
          delay: 200,
          iterations: 1,
          fill: 'forwards',
          easing: 'cubic-bezier(0.6, 0, 0.4, 1)',
        },
      },
      stroke: {
        keyframes: [{backgroundPosition: '100% 0'}, {backgroundPosition: '0 0'}],
        timing: {
          duration: 1200,
          delay: 0,
          iterations: 1,
          fill: 'forwards',
          easing: 'cubic-bezier(0.25, 0.1, 0.9, 0.3)',
        },
      },
      underline: {
        keyframes: [{transform: 'scaleX(0)'}, {transform: 'scaleX(1)'}],
        timing: {
          duration: 900,
          delay: 200,
          iterations: 1,
          fill: 'forwards',
          easing: 'ease',
          pseudoElement: '::before',
        },
      },
      'underline-hand-drawn': {
        keyframes: [
          {strokeDashoffset: '1', opacity: '0'},
          {opacity: '1', offset: 0.01},
          {strokeDashoffset: '0', opacity: '1'},
        ],
        timing: {
          duration: 1000,
          delay: 0,
          iterations: 1,
          fill: 'forwards',
          easing: 'cubic-bezier(0.7, 0, 0.3, 1)',
        },
      },
    };

    class TextHighlight extends HTMLElement {
      static observedAttributes = [attributes$U.isActive];

      constructor() {
        super();
        this.animation = null;
        this.bind = null;
        this.boundAnimation = null;
        this.link = this.closest(selectors$1f.link);
        this.type = this.getAttribute(attributes$U.highlightType);
        this.highlightHolder = this.querySelector(selectors$1f.highlightHolder);
        this.textCountUp = this.closest(selectors$1f.textCountUp);
        this.sup = this.querySelector(selectors$1f.sup);
        this.textRevealCropper = this.closest(selectors$1f.textRevealCropper);

        this.target = this.highlightHolder;
        if (this.type === 'circle-hand-drawn' || this.type === 'circle' || this.type === 'underline-hand-drawn') {
          this.target = this.querySelector(selectors$1f.path);
        }

        if (this.type === 'highlight-color' || this.type === 'stroke' || this.type === 'alternate-font') {
          if (this.sup) this.bind = this.sup;
        }
      }

      /**
       * Initialize animation provided that there is a target element, set of keyframes and timing objects
       *  - Create new `Animation` with the `Element` interface's `animate()` method
       *  - Pause it immediately and wait for attribute changes to trigger `play()` method
       *  - Resume playing of animation if theme animations are disabled
       *  - Include event listeners for handling mouseenter/mouseleave interactions to trigger the reversal of the animation
       *  - Attach `AbortController` to clean up event listeners on `disconnectedCallback()` method
       *  - Modify default keyframes or timing properties for special cases, like in the "Slideshow" section
       *  - Bind animation events/state for the need of animating inner elements, such as `<sup>` elements in "Promotion row" section
       *  - Clear the timeout in case it's previously set for the purpose of handling text count-up animations
       */
      connectedCallback() {
        this.timeout = null;
        this.controller = new AbortController();

        if (!this.type || !this.target) return;
        this.animation = this.target.animate(settings$b[this.type].keyframes, settings$b[this.type].timing);
        this.animation.pause();
        this.bindAnimation('init');
        this.bindAnimation('pause');

        this.modifyDefaults('slider');

        if (!this.animation) return;
        if (this.link) {
          this.listen();
        }

        if (!theme.settings.animationsEnabled) {
          this.animation.play();
          this.bindAnimation('play');
        }
      }

      disconnectedCallback() {
        this.controller.abort();
      }

      /**
       * Execute animation `play()` or `cancel()` methods
       *  - If theme animations are enabled animations are paused on creation
       *  - Resuming the playing of animation relies on the global AOS `IntersectionObserver`
       *  - When a section intersects with the viewport and anchor elements are animated, they should trigger
       *    the internal `shouldAnimate()` or `setTriggerAttribute()` methods with which to trigger attribute change of the custom element
       *  - Resetting the animation state is necessary whenever there is either a slide change or active item swapping,
       *    where the `cancel()` method, along with a reset of animation delay, is applied to each inactive slide/item
       */
      attributeChangedCallback(name, oldValue, newValue) {
        const isActiveChange = name === attributes$U.isActive;
        const initialActiveSetting = oldValue === null && isActiveChange;
        const becomesActive = newValue === 'true';
        const alreadyActive = oldValue === 'true' && newValue === 'true';

        if (isActiveChange && becomesActive && !alreadyActive) {
          this.triggerAnimation();
        }

        // Reset animation state on each inactive slide/item
        if (!initialActiveSetting && !becomesActive) {
          this.reset();
        }
      }

      triggerAnimation() {
        const parentAnimation = this.closest(selectors$1f.aos);

        if (parentAnimation) {
          this.textRevealCropper?.classList.add(classes$16.overflowHidden);

          if (this.textCountUp) {
            // Text count-up animation updates the DOM and interferes with resuming animation normally
            // Animation needs to be executed as soon as counting up has ended
            // Clear the timeout to negate triggering the animation multiple times
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
              this.textRevealCropper?.classList.remove(classes$16.overflowHidden);
              this.setAnimationDelay(0);
              this.animate();
            }, 100);
          } else {
            waitForAnimationEnd(parentAnimation).then(() => {
              const parentDelay = window.getComputedStyle(parentAnimation).getPropertyValue('animation-delay') || 0;
              const delayMs = parentDelay.replace('s', '') * 1000;
              const setDelay = Math.max(delayMs - 250, 0);

              this.textRevealCropper?.classList.remove(classes$16.overflowHidden);
              this.setAnimationDelay(setDelay);
              this.animate();
            });
          }
        } else {
          this.animate();
        }
      }

      listen() {
        this.link.addEventListener('mouseenter', (event) => this.onMouseenter(event), {signal: this.controller.signal});
        this.link.addEventListener('mouseleave', (event) => this.onMouseleave(event), {signal: this.controller.signal});
      }

      animate() {
        if (!this.animation) return;
        this.animation.play();
        this.bindAnimation('play');
        this.animation.onfinish = () => this.onFinish();
      }

      shouldAnimate() {
        requestAnimationFrame(() => {
          let shouldAnimate = true;

          const inSlider = Boolean(this.closest(selectors$1f.flickityEnabled));
          if (inSlider) shouldAnimate = Boolean(this.closest(selectors$1f.activeSlide));

          const stickyTextItem = this.closest(selectors$1f.stickyTextItem);
          if (stickyTextItem) shouldAnimate = Boolean(stickyTextItem.classList.contains(classes$16.isActive));

          this.setTriggerAttribute(shouldAnimate);
        });
      }

      setTriggerAttribute(active = true) {
        this.setAttribute(attributes$U.isActive, active);
      }

      reset() {
        if (!this.animation) return;
        this.animation.cancel();
        this.bindAnimation('cancel');
        this.setAnimationDelay(settings$b[this.type].timing.delay);
      }

      onMouseenter(event) {
        event.stopImmediatePropagation();

        this.setAnimationDelay(0);
        this.modifyDefaults('mouseenter');
        if (this.type !== 'alternate-font') {
          this.animation.reverse();
        }
        this.bindAnimation('mouseenter');
      }

      onMouseleave(event) {
        event.stopImmediatePropagation();

        this.modifyDefaults('mouseleave');
        if (this.type !== 'alternate-font') {
          this.animation.reverse();
        }
        this.bindAnimation('mouseleave');
      }

      onFinish() {
        // Update animation delay on inactive slides/items
        if (this.hasAttribute(attributes$U.isActive)) {
          const delay = this.getAttribute(attributes$U.isActive) === 'true' ? 0 : settings$b[this.type].timing.delay;
          this.setAnimationDelay(delay);
          return;
        }

        // Remove delay as soon as animation on load/scroll ends to negate delayed animations on mouseleave
        this.setAnimationDelay(0);
      }

      setAnimationDelay(number = 0) {
        if (this.animation.effect.getTiming().delay !== number) {
          this.animation.effect.updateTiming({delay: number});
          this.bindAnimation('delay');
        }
      }

      modifyDefaults(usage = 'mouseenter', animation) {
        if (!animation) animation = this.animation;

        // Modify the set of keyframes or timing properties of an existing animation on "mouseenter" event
        if (usage === 'mouseenter') {
          // Replace keyframes if the type contains a different set
          if (settings$b[this.type].keyframesHover) {
            animation.effect.setKeyframes(settings$b[this.type].keyframesHover);
          }

          if (this.type === 'highlight') {
            animation.effect.updateTiming({duration: 350, fill: 'both'});
          }
          if (this.type === 'highlight-color') {
            animation.effect.updateTiming({duration: 800});
          }
          if (this.type === 'underline') {
            animation.effect.updateTiming({duration: 400});
          }
          return;
        }

        // Modify the set of keyframes or timing properties of an existing animation on "mouseleave" event
        if (usage === 'mouseleave') {
          // Revert back to the default keyframes if previously changed on "mouseenter"
          if (settings$b[this.type].keyframesHover) {
            animation.effect.setKeyframes(settings$b[this.type].keyframes);
          }

          if (this.type === 'highlight' || this.type === 'highlight-color' || this.type === 'underline') {
            animation.effect.updateTiming({duration: settings$b[this.type].timing.duration});
          }
          return;
        }

        // Update delays when animation is executed in a Flickity slider
        if (usage === 'slider') {
          if (!theme.settings.animationsEnabled) {
            settings$b[this.type].timing.delay = 300;
            animation.effect.updateTiming({delay: settings$b[this.type].timing.delay});
          }

          if (this.closest(selectors$1f.flickityEnabled)) {
            const slideshowDelay = settings$b[this.type].timing.delay + 200;
            if (this.type === 'highlight') {
              animation.effect.updateTiming({delay: slideshowDelay});
            }
          }
        }
      }

      bindAnimation(event = false) {
        if (!this.bind || !event) return;
        if (event === 'init') this.boundAnimation = this.bind.animate(settings$b[this.type].keyframes, settings$b[this.type].timing);
        if (event === 'pause') this.boundAnimation.pause();
        if (event === 'play') this.boundAnimation.play();
        if (event === 'cancel') this.boundAnimation.cancel();
        if (event === 'mouseenter') {
          this.modifyDefaults('mouseenter', this.boundAnimation);
          this.boundAnimation.reverse();
        }
        if (event === 'mouseleave') {
          this.modifyDefaults('mouseleave', this.boundAnimation);
          this.boundAnimation.reverse();
        }
        if (event === 'delay') {
          const delay = this.animation.effect.getTiming().delay;
          if (this.boundAnimation.effect.getTiming().delay !== delay) {
            this.boundAnimation.effect.updateTiming({delay: delay});
          }
        }
      }
    }

    const selectors$1e = {
      shopifySection: '.shopify-section',
      slider: '[data-slider]',
      holder: '[data-hover-slideshow-holder]',
      item: '[data-hover-slideshow-item]',
      progress: '[data-hover-slideshow-progress]',
      flickityButton: '.flickity-button',
    };

    const classes$15 = {
      fill: 'fill',
    };

    class HoverSlideshow extends HTMLElement {
      constructor() {
        super();
      }
      get holder() {
        return this.querySelector(selectors$1e.holder);
      }
      get items() {
        return [...this.querySelectorAll(selectors$1e.item)];
      }
      get progress() {
        return this.querySelector(selectors$1e.progress);
      }

      connectedCallback() {
        if (theme.settings.productGridHover === 'slideshow' && !window.theme.touch) {
          this.init();
        }
      }

      init() {
        this.section = this.closest(selectors$1e.shopifySection);
        this.outerSliders = this.section.querySelectorAll(selectors$1e.slider);
        this.autoplaySpeed = 2200;
        this.timer = 0;
        this.flkty = new Flickity.data(this.holder);

        if (!this.flkty.isActive && this.items.length > 1) {
          this.flkty = new Flickity(this.holder, {
            draggable: !this.outerSliders.length, // Enable dragging only if there is no outer slider
            cellSelector: selectors$1e.item,
            contain: true,
            wrapAround: true,
            imagesLoaded: true,
            pageDots: false,
            prevNextButtons: false,
            adaptiveHeight: false,
            pauseAutoPlayOnHover: false,
            selectedAttraction: 0.2,
            friction: 1,
            on: {
              ready: () => {
                this.section.style.setProperty('--autoplay-speed', `${this.autoplaySpeed}ms`);
                setTimeout(() => this.flkty.resize(), 1e3);
              },
              change: () => {
                if (this.timer) clearTimeout(this.timer);

                this.progress.classList.remove(classes$15.fill);
                this.progress.offsetWidth; // Force a reflow to ensure the remove class takes effect immediately

                requestAnimationFrame(() => this.progress.classList.add(classes$15.fill));
                this.timer = setTimeout(() => this.progress.classList.remove(classes$15.fill), this.autoplaySpeed);
              },
              dragEnd: () => {
                this.flkty.playPlayer();
              },
            },
          });

          this.addEventListener('mouseenter', () => {
            this.progress.classList.add(classes$15.fill);

            if (this.timer) clearTimeout(this.timer);
            this.timer = setTimeout(() => this.progress.classList.remove(classes$15.fill), this.autoplaySpeed);

            this.flkty.options.autoPlay = this.autoplaySpeed;
            this.flkty.playPlayer();
          });

          this.addEventListener('mouseleave', () => {
            this.flkty.stopPlayer();
            if (this.timer) clearTimeout(this.timer);
            this.progress.classList.remove(classes$15.fill);
          });
        }

        // Prevent page redirect on slideshow arrow click
        this.addEventListener('click', (event) => {
          if (event.target.matches(selectors$1e.flickityButton)) {
            event.preventDefault();
          }
        });
      }
    }

    const classes$14 = {
      top: 'btn--top',
      right: 'btn--right',
      bottom: 'btn--bottom',
      left: 'btn--left',
      text: 'btn--text',
    };

    class HoverButtons extends HTMLElement {
      constructor() {
        super();
        this.button = this.parentElement;
        this.class = '';
        // Bind methods to ensure correct `this` context
        this.detectEntrySide = this.detectEntrySide.bind(this);
      }

      connectedCallback() {
        if (this.button.classList.contains(classes$14.text)) return;

        // Attach the mouse event listeners
        this.button.addEventListener('mouseenter', this.detectEntrySide);
      }

      // Detect from which side the mouse enters
      detectEntrySide(event) {
        const buttonRect = this.button.getBoundingClientRect();
        if (this.class) this.button.classList.remove(this.class);
        const x = event.clientX;
        const y = event.clientY;

        const left = buttonRect.left;
        const right = buttonRect.right;
        const top = buttonRect.top;
        const bottom = buttonRect.bottom;

        // Calculate distances from each side
        const distanceFromLeft = x - left;
        const distanceFromRight = right - x;
        const distanceFromTop = y - top;
        const distanceFromBottom = bottom - y;

        // Determine which side the cursor is closest to
        if (distanceFromLeft < distanceFromRight && distanceFromLeft < distanceFromTop && distanceFromLeft < distanceFromBottom) {
          this.class = classes$14.left;
        } else if (distanceFromRight < distanceFromLeft && distanceFromRight < distanceFromTop && distanceFromRight < distanceFromBottom) {
          this.class = classes$14.right;
        } else if (distanceFromTop < distanceFromLeft && distanceFromTop < distanceFromRight && distanceFromTop < distanceFromBottom) {
          this.class = classes$14.top;
        } else {
          this.class = classes$14.bottom;
        }
        this.button.classList.add(this.class);
      }

      disconnectedCallback() {
        // Clean up event listeners when the element is removed
        this.button.removeEventListener('mouseenter', this.detectEntrySide);
      }
    }

    const selectors$1d = {
      inputSearch: 'input[type="search"]',
      inputType: 'input[name="type"]',
      form: 'form',
      allVisibleElements: '[role="option"]',
      ariaSelected: '[aria-selected="true"]',
      selectedOption: '[aria-selected="true"] a, button[aria-selected="true"]',
      popularSearches: '[data-popular-searches]',
      popdownBody: '[data-popdown-body]',
      mainInputSearch: '[data-main-input-search]',
      predictiveSearchResults: '[data-predictive-search-results]',
      predictiveSearch: 'predictive-search',
      searchForm: 'search-form',
    };

    const classes$13 = {
      isSearched: 'is-searched',
      templateSearch: 'template-search',
    };

    class SearchForm extends HTMLElement {
      constructor() {
        super();

        this.input = this.querySelector(selectors$1d.inputSearch);
        this.form = this.querySelector(selectors$1d.form);
        this.popdownBody = this.closest(selectors$1d.popdownBody);
        this.popularSearches = this.popdownBody?.querySelector(selectors$1d.popularSearches);
        this.predictiveSearchResults = this.querySelector(selectors$1d.predictiveSearchResults);
        this.predictiveSearch = this.matches(selectors$1d.predictiveSearch);
        this.searchForm = this.matches(selectors$1d.searchForm);
        this.selectedElement = null;
        this.activeElement = null;
        this.searchTerm = '';
        this.currentSearchTerm = '';
        this.isSearchPage = document.body.classList.contains(classes$13.templateSearch);

        this.input.addEventListener(
          'input',
          debounce((event) => {
            this.onChange(event);
          }, 300).bind(this)
        );

        this.input.addEventListener('focus', this.onFocus.bind(this));
        this.input.form.addEventListener('submit', this.onFormSubmit.bind(this));
        this.addEventListener('keyup', this.onKeyup.bind(this));
        this.addEventListener('keydown', this.onKeydown.bind(this));

        if (this.isSearchPage) {
          this.mainInputType = document.querySelector(`${selectors$1d.mainInputSearch} ${selectors$1d.inputType}`);
          this.inputType = this.querySelector(selectors$1d.inputType);
          this.inputType.value = this.mainInputType.value;
        }
      }

      getQuery() {
        return this.input.value.trim();
      }

      onFocus() {
        this.currentSearchTerm = this.getQuery();
      }

      onChange() {
        this.classList.toggle(classes$13.isSearched, !this.isFormCleared());
        this.searchTerm = this.getQuery();
      }

      isFormCleared() {
        return this.input.value.length === 0;
      }

      submit() {
        this.form.submit();
      }

      reset() {
        this.input.val = '';
      }

      onFormSubmit(event) {
        if (!this.getQuery().length || this.querySelector(selectors$1d.selectedLink)) event.preventDefault();
      }

      onKeydown(event) {
        // Prevent the cursor from moving in the input when using the up and down arrow keys
        if (event.code === 'ArrowUp' || event.code === 'ArrowDown') {
          event.preventDefault();
        }
      }

      onKeyup(event) {
        if (!this.getQuery().length && this.predictiveSearch) {
          this.close(true);
        }
        event.preventDefault();

        switch (event.code) {
          case 'ArrowUp':
            this.switchOption('up');
            break;
          case 'ArrowDown':
            this.switchOption('down');
            break;
          case 'Enter':
            this.selectOption();
            break;
        }
      }

      switchOption(direction) {
        const moveUp = direction === 'up';
        const predictiveSearchOpened = this.classList.contains(classes$13.isSearched) && this.predictiveSearchResults;

        const visibleElementsContainer = predictiveSearchOpened ? this.predictiveSearchResults : this.popularSearches;

        if (!visibleElementsContainer) return;
        this.selectedElement = visibleElementsContainer.querySelector(selectors$1d.ariaSelected);

        // Filter out hidden elements
        const allVisibleElements = Array.from(visibleElementsContainer.querySelectorAll(selectors$1d.allVisibleElements)).filter((element) => element.offsetParent !== null);

        let activeElementIndex = 0;

        if (moveUp && !this.selectedElement) return;

        let selectedElementIndex = -1;
        let i = 0;

        while (selectedElementIndex === -1 && i <= allVisibleElements.length) {
          if (allVisibleElements[i] === this.selectedElement) {
            selectedElementIndex = i;
          }
          i++;
        }

        if (!moveUp && this.selectedElement) {
          activeElementIndex = selectedElementIndex === allVisibleElements.length - 1 ? 0 : selectedElementIndex + 1;
        } else if (moveUp) {
          activeElementIndex = selectedElementIndex === 0 ? allVisibleElements.length - 1 : selectedElementIndex - 1;
        }

        if (activeElementIndex === selectedElementIndex) return;

        this.activeElement = allVisibleElements[activeElementIndex];
        this.handleFocusableDescendants();
      }

      selectOption() {
        const selectedOption = this.querySelector(selectors$1d.selectedOption);

        if (selectedOption) selectedOption.click();
      }

      handleFocusableDescendants(reset = false) {
        const selected = this.selectedElement ? this.selectedElement : this.querySelector(selectors$1d.ariaSelected);
        if (selected) selected.setAttribute('aria-selected', false);

        if (!this.activeElement || reset) {
          this.selectedElement = null;
          this.activeElement?.setAttribute('aria-selected', false);
          this.input.setAttribute('aria-expanded', false);
          this.input.setAttribute('aria-activedescendant', '');
          return;
        }

        this.activeElement.setAttribute('aria-selected', true);
        this.input.setAttribute('aria-activedescendant', this.activeElement.id);
      }
    }

    customElements.define('search-form', SearchForm);

    const selectors$1c = {
      predictiveSearch: 'predictive-search',
      sectionPredictiveSearch: '#shopify-section-api-predictive-search',
      predictiveSearchResults: '[data-predictive-search-results]',
      predictiveSearchStatus: '[data-predictive-search-status]',
      searchResultsLiveRegion: '[data-predictive-search-live-region-count-value]',
      searchResultsWrapper: '[data-search-results-wrapper]',
    };

    const classes$12 = {
      reset: 'reset',
    };

    const attributes$T = {
      aosAnchor: 'data-aos-anchor',
      ariaHidden: 'aria-hidden',
      open: 'open',
      loading: 'loading',
      loadingText: 'data-loading-text',
      results: 'results',
    };

    class PredictiveSearch extends SearchForm {
      constructor() {
        super();

        this.abortController = new AbortController();
        this.allPredictiveSearchInstances = document.querySelectorAll(selectors$1c.predictiveSearch);
        this.predictiveSearchResults = this.querySelector(selectors$1c.predictiveSearchResults);
        this.cachedResults = {};
      }

      connectedCallback() {
        this.predictiveSearchResults.addEventListener('transitionend', (event) => {
          if (event.target === this.predictiveSearchResults && !this.getQuery().length) {
            this.classList.remove(classes$12.reset);
            requestAnimationFrame(() => this.clearResultsHTML());
          }
        });
      }

      onChange() {
        super.onChange();
        this.classList.remove(classes$12.reset);

        if (!this.searchTerm.length) {
          this.classList.add(classes$12.reset);
          return;
        }

        requestAnimationFrame(() => this.getSearchResults(this.searchTerm));
      }

      onFocus() {
        super.onFocus();

        if (!this.currentSearchTerm.length) return;

        if (this.searchTerm !== this.currentSearchTerm) {
          // Search term was changed from other search input, treat it as a user change
          this.onChange();
        } else if (this.getAttribute(attributes$T.results) === 'true') {
          this.open();
        } else {
          this.getSearchResults(this.searchTerm);
        }
      }

      getSearchResults(searchTerm) {
        const queryKey = searchTerm.replace(' ', '-').toLowerCase();
        const suggestionsResultsLimit = parseInt(window.theme.settings.suggestionsResultsLimit);
        let resources = 'query';
        resources += window.theme.settings.suggestArticles ? ',article' : '';
        resources += window.theme.settings.suggestCollections ? ',collection' : '';
        resources += window.theme.settings.suggestProducts ? ',product' : '';
        resources += window.theme.settings.suggestPages ? ',page' : '';

        this.setLiveRegionLoadingState();

        if (this.cachedResults[queryKey]) {
          this.renderSearchResults(this.cachedResults[queryKey]);
          return;
        }

        fetch(`${theme.routes.predictiveSearchUrl}?q=${encodeURIComponent(searchTerm)}&resources[type]=${resources}&resources[limit]=${suggestionsResultsLimit}&section_id=api-predictive-search`, {
          signal: this.abortController.signal,
        })
          .then((response) => {
            if (!response.ok) {
              var error = new Error(response.status);
              this.close();
              throw error;
            }

            return response.text();
          })
          .then((text) => {
            const resultsMarkup = new DOMParser().parseFromString(text, 'text/html').querySelector(selectors$1c.sectionPredictiveSearch).innerHTML;
            // Save bandwidth keeping the cache in all instances synced
            this.allPredictiveSearchInstances.forEach((predictiveSearchInstance) => {
              predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
            });
            this.renderSearchResults(resultsMarkup);
          })
          .catch((error) => {
            if (error?.code === 20) {
              // Code 20 means the call was aborted
              return;
            }
            this.close();
            throw error;
          });
      }

      switchOption(direction) {
        super.switchOption(direction);

        if (this.statusElement) this.statusElement.textContent = '';
      }

      setLiveRegionLoadingState() {
        this.statusElement = this.statusElement || this.querySelector(selectors$1c.predictiveSearchStatus);
        this.loadingText = this.loadingText || this.getAttribute(attributes$T.loadingText);

        this.setLiveRegionText(this.loadingText);
        this.setAttribute(attributes$T.loading, true);
      }

      setLiveRegionText(statusText) {
        this.statusElement.setAttribute(attributes$T.ariaHidden, 'false');
        this.statusElement.textContent = statusText;

        setTimeout(() => {
          this.statusElement.setAttribute(attributes$T.ariaHidden, 'true');
        }, 1000);
      }

      renderSearchResults(resultsMarkup) {
        this.predictiveSearchResults.innerHTML = resultsMarkup;

        // Change results container id to fix animations
        const parentId = this.predictiveSearchResults.parentElement.id;
        const el = this.predictiveSearchResults.querySelector(selectors$1c.searchResultsWrapper);
        const tempId = el.id;

        el.id = `${tempId}--${parentId}`;
        el.setAttribute(attributes$T.aosAnchor, `#${el.id}`);

        this.setAttribute(attributes$T.results, true);

        this.setLiveRegionResults();
        this.open();
      }

      setLiveRegionResults() {
        this.removeAttribute(attributes$T.loading);
        this.setLiveRegionText(this.querySelector(selectors$1c.searchResultsLiveRegion).textContent);
      }

      open() {
        this.setAttribute(attributes$T.open, true);
      }

      close(clearSearchTerm = false) {
        this.closeResults(clearSearchTerm);
      }

      closeResults(clearSearchTerm = false) {
        if (clearSearchTerm) {
          this.reset();
          this.removeAttribute(attributes$T.results);
          this.classList.remove(classes$12.reset);
        }

        this.removeAttribute(attributes$T.loading);
        this.removeAttribute(attributes$T.open);
      }

      clearResultsHTML() {
        this.predictiveSearchResults.innerHTML = '';
      }
    }

    customElements.define('predictive-search', PredictiveSearch);

    class LoadingOverlay extends HTMLElement {
      constructor() {
        super();

        document.addEventListener('DOMContentLoaded', () => {
          // Hide loading overlay
          document.documentElement.classList.remove('page-loading');
        });
      }
    }

    function getWindowWidth() {
      return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    }

    function isDesktop() {
      return getWindowWidth() >= window.theme.sizes.small;
    }

    function isMobile() {
      return getWindowWidth() < window.theme.sizes.small;
    }

    const selectors$1b = {
      aos: '[data-aos]:not(.aos-animate)',
      aosAnchor: '[data-aos-anchor]',
      animatable: '[data-aos], [data-aos-anchor]',
      watchMutations: '[id^="api-cart-items-"], [data-collection-filters], [data-collection-products], #AjaxinateLoop, [data-tab="resultsProducts"]',
      textHighlight: 'text-highlight',
      counterUps: 'text-count-up',
      flickitySlider: '.flickity-slider',
      slide: '[data-slide]',
      carouselMobile: '.carousel--mobile',
    };

    const classes$11 = {
      aosAnimate: 'aos-animate',
      isLoading: 'is-loading',
      isSelected: '.is-selected',
    };

    const attributes$S = {
      aos: 'data-aos',
      aosAnchor: 'data-aos-anchor',
      aosIntersection: 'data-aos-intersection',
      aosDebounce: 'data-aos-debounce',
      aosCustomInit: 'data-aos-custom-init',
      aosWatchAnchors: 'data-aos-watch-anchors',
      aosTrigger: 'data-aos-trigger',
      aosCarouselMobile: 'data-aos-carousel-mobile',
      aosCarouselDesktop: 'data-aos-carousel-desktop',
    };

    const settings$a = {
      intersectionRatio: 0.1,
      debounceTime: 0,
    };

    let anchorObserversCollection = new Set();

    /*
      Observe animated elements that have attribute [data-aos]
    */
    function anchorsIntersectionObserver() {
      const anchors = document.querySelectorAll(selectors$1b.aosAnchor);

      // Get all anchors and attach observers
      initAnchorObservers(anchors);
    }

    function initAnchorObservers(anchors) {
      if (!anchors.length) return;

      // Prepare a Set with all anchor containers
      anchors.forEach((anchor) => {
        const containerId = anchor.dataset.aosAnchor;
        let container;
        if (containerId != '') container = document.querySelector(containerId);
        if (container && !anchorObserversCollection.has(anchor)) {
          anchorObserversCollection.add(container);
        }
      });

      // Add anchor containers to the set of target elements being watched by the `IntersectionObserver`
      anchorObserversCollection.forEach((container) => {
        aosAnchorObserver.observe(container);
      });
    }

    /*
      Observe anchor elements
    */
    const aosAnchorObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          const target = entry.target;
          const intersectionRatio = entry.intersectionRatio;
          const isIntersecting = entry.isIntersecting;

          // Tells how much of the target element should be visible when animations are executed
          let intersectAt = settings$a.intersectionRatio;
          if (target.hasAttribute(attributes$S.aosIntersection)) {
            intersectAt = Number(target.getAttribute(attributes$S.aosIntersection));
          }

          // Determines whether elements should be animated as soon as the `target` has been intersected or after a given delay
          let timeout;
          let debounceTime = settings$a.debounceTime;
          if (target.hasAttribute(attributes$S.aosDebounce)) {
            debounceTime = Number(target.getAttribute(attributes$S.aosDebounce));
          }

          if (isIntersecting && intersectionRatio > intersectAt) {
            if (debounceTime !== 0) {
              if (timeout) clearTimeout(timeout);
              timeout = setTimeout(() => onIntersecting(target), debounceTime);
            } else {
              onIntersecting(target);
            }

            // Stop observing anchor element
            observer.unobserve(target);
            // Remove target element from the Set
            anchorObserversCollection.delete(target);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.5, 0.75, 1],
      }
    );

    function onIntersecting(target) {
      if (!target) return;

      // Animate anchor
      animate(target);

      // Trigger all elements' animations at once, if they are located in a layout with a slider on desktop, by making them dependent on the last active slide's animation execution
      if (target.hasAttribute(attributes$S.aosCarouselDesktop) && isDesktop()) {
        const slider = target.querySelector(selectors$1b.flickitySlider);
        if (slider) {
          const slide = target.querySelectorAll(selectors$1b.slide);
          const activeSlides = [...slide].filter((slide) => {
            if (slide.matches(classes$11.isSelected)) return slide;
          });
          const inactiveSlides = [...slide].filter((slide) => {
            if (!slide.matches(classes$11.isSelected)) return slide;
          });

          if (activeSlides.length > 0) {
            const triggerId = activeSlides[activeSlides.length - 1].id;
            activeSlides[activeSlides.length - 1].setAttribute(attributes$S.aosTrigger, `#${triggerId}`);
            inactiveSlides.forEach((slide) => {
              slide.querySelectorAll(selectors$1b.animatable).forEach((element) => {
                element.setAttribute(attributes$S.aosAnchor, `#${triggerId}`);
              });
            });
          }
        }
      }

      // Animate all anchors at once when there is a carousel with native scrolling on mobile
      if (target.hasAttribute(attributes$S.aosCarouselMobile) && isMobile()) {
        const slider = target.querySelector(selectors$1b.carouselMobile);

        if (slider) {
          const slides = [...slider.children];
          const triggerId = slides[0].id;

          if (slides.length > 1) {
            slides[0].setAttribute(attributes$S.aosTrigger, `#${triggerId}`);
            slides.forEach((slide) => {
              slide.querySelectorAll(selectors$1b.animatable).forEach((element) => {
                element.setAttribute(attributes$S.aosAnchor, `#${triggerId}`);
              });
            });
          }
        }
      }

      // Trigger animations on other elements
      if (target.hasAttribute(attributes$S.aosTrigger)) {
        const triggerId = target.getAttribute(attributes$S.aosTrigger);
        const elementsToTrigger = document.querySelectorAll(`[${attributes$S.aosAnchor}="${triggerId}"]`);
        elementsToTrigger.forEach((element) => animate(element));
      }

      // Animate children
      let elementsToAnimate = target.querySelectorAll(selectors$1b.aos);

      // Watch for other anchor elements inside current `target` container to prevent executing their animations until their intersecting
      if (target.hasAttribute(attributes$S.aosWatchAnchors)) {
        // Trigger animations only for elements that match with current `target` anchor
        const filteredElements = [...elementsToAnimate].filter((element) => {
          const anchor = element.hasAttribute(attributes$S.aosAnchor) ? element.getAttribute(attributes$S.aosAnchor) : false;
          if (anchor && `#${target.id}` === anchor) return element;
        });

        elementsToAnimate = filteredElements;
      }

      elementsToAnimate.forEach((item) => {
        // Prevents animations execution and relies on initialising them outside this module with the help of dispatching a CustomEvent
        let customInit = item.hasAttribute(attributes$S.aosCustomInit);
        if (customInit) {
          target.dispatchEvent(new CustomEvent('theme:target:animate', {bubbles: true, detail: item}));
          return;
        }

        // Execute animations as soon as anchor element has been intersected
        animate(item);
      });
    }

    function animate(element) {
      requestAnimationFrame(() => element.classList.add(classes$11.aosAnimate));

      animateTextHighlights(element);
      animateCounterUps(element);
    }

    function animateTextHighlights(element) {
      const textHighlight = element.querySelectorAll(selectors$1b.textHighlight);
      textHighlight.forEach((highlight) => highlight.shouldAnimate());
    }

    function animateCounterUps(element) {
      const counterUps = element.querySelectorAll(selectors$1b.counterUps);
      counterUps.forEach((countUp) => countUp.shouldAnimate());
    }

    /*
      Watch for mutations in the body and start observing the newly added animated elements and anchors
    */
    function bodyMutationObserver() {
      const isNode = (element) => element instanceof HTMLElement;

      const bodyObserver = new MutationObserver((mutationList) => {
        for (const mutation of mutationList) {
          if (!mutation.type === 'childList') return;

          const target = mutation.target;
          const addedNodes = [...mutation.addedNodes];
          const removedNodes = [...mutation.removedNodes];
          const watchMutations =
            target.matches(selectors$1b.watchMutations) ||
            addedNodes.some((item) => (isNode(item) ? item.matches(selectors$1b.watchMutations) : false)) ||
            removedNodes.some((item) => (isNode(item) ? item.matches(selectors$1b.watchMutations) : false));
          const isAnimatableElement = target.matches(selectors$1b.animatable) || addedNodes.some((item) => (isNode(item) ? item.matches(selectors$1b.animatable) : false));
          const hasElementToAnimate = target.querySelector(`[${attributes$S.aosAnchor}="#${target.id}"]`) !== null;

          if (isAnimatableElement || hasElementToAnimate || watchMutations) {
            const anchors = target.querySelectorAll(selectors$1b.aosAnchor);

            // Get all anchors and attach observers
            initAnchorObservers(anchors);
          }
        }
      });

      bodyObserver.observe(document.body, {
        attributes: false,
        childList: true,
        subtree: true,
      });
    }

    function initAnimations() {
      anchorsIntersectionObserver();
      bodyMutationObserver();
    }

    const counterUp = ( el, options = {} ) => {
    	const {
    		action = 'start',
    		duration = 1000,
    		delay = 16,
    	} = options;

    	// Allow people to use this as a stop method.
    	if ( action === 'stop' ) {
    		stopCountUp( el );
    		return
    	}

    	stopCountUp( el );

    	// If no number, don't do anything.
    	if ( ! /[0-9]/.test( el.innerHTML ) ) {
    		return
    	}

    	const nums = divideNumbers( el.innerHTML, {
    		duration: duration || el.getAttribute( 'data-duration' ),
    		delay: delay || el.getAttribute( 'data-delay' ),
    	} );

    	// Remember the contents.
    	el._countUpOrigInnerHTML = el.innerHTML;

    	// Start counting.
    	el.innerHTML = nums[ 0 ] || '&nbsp;'; // Use a non-breaking space to prevent layout shift.
    	el.style.visibility = 'visible';

    	// Function for displaying output with the set time and delay.
    	const output = function() {
    		el.innerHTML = nums.shift() || '&nbsp;'; // Use a non-breaking space to prevent layout shift.
    		if ( nums.length ) {
    			clearTimeout( el.countUpTimeout );
    			el.countUpTimeout = setTimeout( output, delay );
    		} else {
    			el._countUpOrigInnerHTML = undefined;
    		}
    	};
    	el.countUpTimeout = setTimeout( output, delay );
    };

    const stopCountUp = el => {
    	clearTimeout( el.countUpTimeout );
    	if ( el._countUpOrigInnerHTML ) {
    		el.innerHTML = el._countUpOrigInnerHTML;
    		el._countUpOrigInnerHTML = undefined;
    	}
    	el.style.visibility = '';
    };

    const divideNumbers = ( numToDivide, options = {} ) => {
    	const {
    		duration = 1000,
    		delay = 16,
    	} = options;

    	// Number of times the number will change.
    	const divisions = duration / delay;

    	// Split numbers and html tags.
    	const splitValues = numToDivide.toString().split( /(<[^>]+>|[0-9.][,.0-9]*[0-9]*)/ );

    	// Contains all numbers to be displayed.
    	const nums = [];

    	// Set blank strings to ready the split values.
    	for ( let k = 0; k < divisions; k++ ) {
    		nums.push( '' );
    	}

    	// Loop through all numbers and html tags.
    	for ( let i = 0; i < splitValues.length; i++ ) {
    		// If number split it into smaller numbers and insert it to nums.
    		if ( /([0-9.][,.0-9]*[0-9]*)/.test( splitValues[ i ] ) && ! /<[^>]+>/.test( splitValues[ i ] ) ) {
    			let num = splitValues[ i ];

    			// Find all the occurances of . and ,
    			const symbols = [ ...num.matchAll( /[.,]/g ) ]
    				// Get all the locations of the characters so we can re-place them later on.
    				.map( m => ( { char: m[0], i: num.length - m.index - 1 } ) )
    				// Make sure we go through the characters from right to left
    				.sort( ( a, b ) => a.i - b.i );

    			// Remove commas and dots for computation purposes.
    			num = num.replace( /[.,]/g, '' );

    			// Start adding numbers from the end.
    			let k = nums.length - 1;

    			// Create small numbers we'll the count over.
    			for ( let val = divisions; val >= 1; val-- ) {
    				let newNum = parseInt( num / divisions * val, 10 );

    				// Re-insert the symbols in the indices they were at.
    				newNum = symbols.reduce( ( num, { char, i } ) => {
    					return num.length <= i ? num // If we don't have enough numbers, don't insert the symbol.
    						: num.slice( 0, -i ) + char + num.slice( -i )
    				}, newNum.toString() );

    				// Insert all small numbers.
    				nums[ k-- ] += newNum;
    			}
    		} else {
    			// Insert all non-numbers in the same place.
    			for ( let k = 0; k < divisions; k++ ) {
    				nums[ k ] += splitValues[ i ];
    			}
    		}
    	}

    	// The last value of the element should be the original one.
    	nums[ nums.length ] = numToDivide.toString();

    	return nums
    };

    const attributes$R = {
      countUpDuration: 'data-count-up-duration',
      countUpInit: 'data-count-up-init',
    };

    class TextCountUp extends HTMLElement {
      static observedAttributes = [attributes$R.countUpInit];

      constructor() {
        super();
        this.container = this;
        this.countUpDuration = this.getAttribute(attributes$R.countUpDuration);
        this.duration = 1000 * (100 / parseInt(this.countUpDuration, 10));
      }

      connectedCallback() {
        if (!theme.settings.animationsEnabled) {
          this.startCountUp();
        }
      }

      attributeChangedCallback(name, oldValue, newValue) {
        const countUpInitChange = name === attributes$R.countUpInit;
        const initialActiveSetting = oldValue === null && countUpInitChange;
        const becomesActive = newValue === 'true';

        if (initialActiveSetting && becomesActive) {
          this.startCountUp();
        }
      }

      shouldAnimate() {
        requestAnimationFrame(() => this.setTriggerAttribute());
      }

      setTriggerAttribute(active = true) {
        this.setAttribute(attributes$R.countUpInit, active);
      }

      startCountUp() {
        // Number of times the number will change is calculated by: `divisions = duration / delay`
        // Using `delay: 16` as a frame of reference, `0.016 * this.duration` gives us the same number of divisions for all durations coming from section settings
        counterUp(this, {
          duration: this.duration,
          delay: 0.016 * this.duration,
        });
      }
    }

    // Safari requestIdleCallback polyfill
    window.requestIdleCallback =
      window.requestIdleCallback ||
      function (cb) {
        var start = Date.now();
        return setTimeout(function () {
          cb({
            didTimeout: false,
            timeRemaining: function () {
              return Math.max(0, 50 - (Date.now() - start));
            },
          });
        }, 1);
      };
    window.cancelIdleCallback =
      window.cancelIdleCallback ||
      function (id) {
        clearTimeout(id);
      };

    resizeListener();
    scrollListener();
    isTouch();
    loadedImagesEventHook();

    const headerFunctions = debounce(() => {
      // Recheck sticky header settings if section is set to hidden
      initTransparentHeader();
    }, 300);

    window.addEventListener('DOMContentLoaded', () => {
      setVarsOnResize();
      preventOverflow(document);
      wrapElements(document);
      removeLoadingClassFromLoadedImages(document);

      if (window.theme.settings.animationsEnabled) {
        initAnimations();
      }
    });

    document.addEventListener('shopify:section:load', (e) => {
      const container = e.target;

      window.dispatchEvent(new Event('resize'), {bubbles: true});

      preventOverflow(container);
      wrapElements(container);
      setVarsOnResize();

      headerFunctions();
      removeFooterWave(container);
      reloadCardScrolling();

      if (window.theme.settings.animationsEnabled) {
        initAnimations();
      }
    });

    document.addEventListener('shopify:section:reorder', (e) => {
      const container = e.target;

      headerFunctions();
      removeFooterWave(container);
      reloadCardScrolling();

      if (window.theme.settings.animationsEnabled) {
        initAnimations();
      }
    });

    document.addEventListener('shopify:section:unload', (e) => {
      const container = e.target;

      headerFunctions();
      removeFooterWave(container);
      reloadCardScrolling();
    });

    if (!customElements.get('text-highlight')) {
      customElements.define('text-highlight', TextHighlight);
    }

    if (!customElements.get('deferred-loading')) {
      customElements.define('deferred-loading', DeferredLoading);
    }

    if (!customElements.get('loading-overlay')) {
      customElements.define('loading-overlay', LoadingOverlay);
    }

    if (!customElements.get('text-count-up')) {
      customElements.define('text-count-up', TextCountUp);
    }

    if (!customElements.get('hover-slideshow')) {
      customElements.define('hover-slideshow', HoverSlideshow);
    }

    if (!customElements.get('hover-button')) {
      customElements.define('hover-button', HoverButtons);
    }

    (function () {
      function n(n) {
        var i = window.innerWidth || document.documentElement.clientWidth,
          r = window.innerHeight || document.documentElement.clientHeight,
          t = n.getBoundingClientRect();
        return t.top >= 0 && t.bottom <= r && t.left >= 0 && t.right <= i;
      }
      function t(n) {
        var i = window.innerWidth || document.documentElement.clientWidth,
          r = window.innerHeight || document.documentElement.clientHeight,
          t = n.getBoundingClientRect(),
          u = (t.left >= 0 && t.left <= i) || (t.right >= 0 && t.right <= i),
          f = (t.top >= 0 && t.top <= r) || (t.bottom >= 0 && t.bottom <= r);
        return u && f;
      }
      function i(n, i) {
        function r() {
          var r = t(n);
          r != u && ((u = r), typeof i == 'function' && i(r, n));
        }
        var u = t(n);
        window.addEventListener('load', r);
        window.addEventListener('resize', r);
        window.addEventListener('scroll', r);
      }
      function r(t, i) {
        function r() {
          var r = n(t);
          r != u && ((u = r), typeof i == 'function' && i(r, t));
        }
        var u = n(t);
        window.addEventListener('load', r);
        window.addEventListener('resize', r);
        window.addEventListener('scroll', r);
      }
      window.visibilityHelper = {isElementTotallyVisible: n, isElementPartiallyVisible: t, inViewportPartially: i, inViewportTotally: r};
    })();

    const throttle = (fn, wait) => {
      let prev, next;
      return function invokeFn(...args) {
        const now = Date.now();
        next = clearTimeout(next);
        if (!prev || now - prev >= wait) {
          // eslint-disable-next-line prefer-spread
          fn.apply(null, args);
          prev = now;
        } else {
          next = setTimeout(invokeFn.bind(null, ...args), wait - (now - prev));
        }
      };
    };

    function FetchError(object) {
      this.status = object.status || null;
      this.headers = object.headers || null;
      this.json = object.json || null;
      this.body = object.body || null;
    }
    FetchError.prototype = Error.prototype;

    const selectors$1a = {
      collapsible: '[data-collapsible]',
      toggleEllipsis: 'toggle-ellipsis',
      content: '[data-content]',
      actions: '[data-actions]',
      height: '[data-height]',
      collapsibleContent: '[data-collapsible-content]',
      collapsibleContainer: '[data-collapsible-container]',
      single: '[data-collapsible-single]', // Add this attribute when we want only one item expanded at the same time
      trigger: '[data-collapsible-trigger]',
    };

    const classes$10 = {
      isExpanded: 'is-expanded',
      isOpen: 'is-open',
    };

    const attributes$Q = {
      expanded: 'aria-expanded',
      controls: 'aria-controls',
      triggerMobile: 'data-collapsible-trigger-mobile',
      transitionOverride: 'data-collapsible-transition-override',
    };

    const settings$9 = {
      animationDelay: 500,
    };

    const sections$J = {};

    class Collapsible {
      constructor(container) {
        this.container = container;
        this.single = this.container.querySelector(selectors$1a.single);
        this.triggers = this.container.querySelectorAll(selectors$1a.trigger);
        this.resetHeightTimer = 0;
        this.isTransitioning = false;
        this.transitionOverride = this.container.hasAttribute(attributes$Q.transitionOverride);
        this.collapsibleToggleEvent = (event) => throttle(this.collapsibleToggle(event), 1250);
        this.onResizeEvent = () => this.onResize();

        this.init();
      }

      init() {
        window.addEventListener('theme:resize:width', this.onResizeEvent);

        this.triggers.forEach((trigger) => {
          trigger.addEventListener('click', this.collapsibleToggleEvent);
          trigger.addEventListener('keyup', this.collapsibleToggleEvent);
        });

        this.container.addEventListener('theme:ellipsis:toggle', (event) => {
          this.handleEllipsisToggle(event);
        });
      }

      handleEllipsisToggle(event) {
        const {dropdownHeight = 0, isExpanded = false} = event.detail;
        const productAccordion = event.target.closest(selectors$1a.collapsible);

        if (!productAccordion) return;

        const trigger = productAccordion.querySelector(selectors$1a.trigger);
        if (!trigger) return;

        const dropdownId = trigger.getAttribute(attributes$Q.controls);
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) return;

        const heightElement = productAccordion.querySelector(selectors$1a.height);
        const ellipsisClosedHeight = heightElement ? parseInt(heightElement.dataset.height, 10) || 0 : 0;

        this.setDropdownHeight(dropdown, isExpanded ? dropdownHeight : ellipsisClosedHeight);
      }

      collapsibleToggle(e) {
        e.preventDefault();

        const trigger = e.target.matches(selectors$1a.trigger) ? e.target : e.target.closest(selectors$1a.trigger);
        const dropdownId = trigger.getAttribute(attributes$Q.controls);
        const dropdown = document.getElementById(dropdownId);
        const triggerMobile = trigger.hasAttribute(attributes$Q.triggerMobile);
        const isExpanded = trigger.classList.contains(classes$10.isExpanded);
        const isSpace = e.code === theme.keyboardKeys.SPACE;
        const isEscape = e.code === theme.keyboardKeys.ESCAPE;
        const isMobile = window.innerWidth < theme.sizes.small;

        // Do nothing if transitioning
        if (this.isTransitioning && !this.transitionOverride) {
          return;
        }

        // Do nothing if any different than ESC and Space key pressed
        if (e.code && !isSpace && !isEscape) {
          return;
        }

        // Do nothing if ESC key pressed and not expanded or mobile trigger clicked and screen not mobile
        if ((!isExpanded && isEscape) || (triggerMobile && !isMobile)) {
          return;
        }

        this.isTransitioning = true;
        trigger.disabled = true;

        // Close other expanded items when single expansion is enabled
        if (this.single) {
          this.closeOtherItems(trigger);
        }

        // requestAnimationFrame fixes content jumping when item is sliding down
        requestAnimationFrame(() => {
          isExpanded ? this.closeItem(dropdown, trigger) : this.openItem(dropdown, trigger);
        });
      }

      closeOtherItems(trigger) {
        const triggerContainer = trigger.closest(selectors$1a.single);

        this.triggers.forEach((otherTrigger) => {
          // Skip if it's the same trigger or not expanded
          if (trigger === otherTrigger || !otherTrigger.classList.contains(classes$10.isExpanded)) {
            return;
          }

          // Skip if triggers are in different parent containers
          const otherTriggerContainer = otherTrigger.closest(selectors$1a.single);
          if (triggerContainer !== otherTriggerContainer) {
            return;
          }

          // Close the expanded item
          const dropdown = document.getElementById(otherTrigger.getAttribute(attributes$Q.controls));
          requestAnimationFrame(() => this.closeItem(dropdown, otherTrigger));
        });
      }

      openItem(dropdown, trigger) {
        const dropdownHeight = dropdown.querySelector(selectors$1a.collapsibleContent).offsetHeight;
        this.setDropdownHeight(dropdown, dropdownHeight);
        this.handleTransitioning(dropdown, true);
        this.updateAttributes(trigger, dropdown, true);

        trigger.dispatchEvent(
          new CustomEvent('theme:form:sticky', {
            bubbles: true,
            detail: {
              element: 'accordion',
            },
          })
        );
      }

      closeItem(dropdown, trigger) {
        let dropdownHeight = dropdown.querySelector(selectors$1a.collapsibleContent).offsetHeight;
        this.setDropdownHeight(dropdown, dropdownHeight);
        this.handleTransitioning(dropdown, false);
        this.updateAttributes(trigger, dropdown, false);

        requestAnimationFrame(() => {
          dropdownHeight = 0;
          this.setDropdownHeight(dropdown, 0);
        });
      }

      setDropdownHeight(dropdown, height) {
        dropdown.style.height = `${height}px`;
      }

      handleTransitioning(dropdown, isExpanded = false) {
        if (this.resetHeightTimer) clearTimeout(this.resetHeightTimer);

        if (isExpanded) {
          this.resetHeightTimer = setTimeout(() => {
            const toggleEllipsis = dropdown.querySelector(selectors$1a.toggleEllipsis);
            if (!toggleEllipsis) dropdown.style.height = 'auto';
            this.isTransitioning = false;
          }, settings$9.animationDelay);
        } else {
          this.isTransitioning = false;
          this.resetHeightTimer = setTimeout(() => {
            dropdown.style.height = '';
          }, settings$9.animationDelay);
        }
      }

      updateAttributes(trigger, dropdown, isExpanded) {
        dropdown.setAttribute(attributes$Q.expanded, isExpanded);
        dropdown.classList.toggle(classes$10.isExpanded, isExpanded);
        trigger.setAttribute(attributes$Q.expanded, isExpanded);
        trigger.classList.toggle(classes$10.isExpanded, isExpanded);

        // Always remove trigger disabled attribute after animation completes
        setTimeout(() => {
          trigger.disabled = false;
        }, settings$9.animationDelay);
      }

      onResize() {
        if (!this.container.querySelector(`.${classes$10.isExpanded}`)) return;

        const expandedDropdowns = Array.from(document.querySelectorAll(`${selectors$1a.collapsible}:has(.${classes$10.isExpanded})`));
        const openedEllipsis = document.querySelectorAll(`${selectors$1a.collapsible}:has(${selectors$1a.toggleEllipsis}.${classes$10.isOpen})`);

        expandedDropdowns.forEach((dropdown) => {
          const toggleEllipsis = dropdown.querySelector(selectors$1a.toggleEllipsis);
          if (toggleEllipsis?.classList.contains(classes$10.isOpen)) {
            this.updateDropdownHeight(dropdown);
          }
        });

        openedEllipsis.forEach((accordion) => {
          if (!expandedDropdowns.includes(accordion)) {
            this.updateDropdownHeight(accordion, true);
          }
        });
      }

      updateDropdownHeight = (dropdown, ellipsis = false) => {
        const container = dropdown.querySelector(selectors$1a.collapsibleContainer);
        const toggleEllipsis = dropdown.querySelector(selectors$1a.toggleEllipsis);
        const actions = toggleEllipsis.querySelector(selectors$1a.actions);
        const content = toggleEllipsis.querySelector(selectors$1a.content);
        const dropdownHeight = content.offsetHeight + actions.offsetHeight * 2;

        if (!ellipsis) {
          this.setDropdownHeight(container, dropdownHeight);
        }

        toggleEllipsis.style.setProperty('--height', `${dropdownHeight}px`);
      };

      onUnload() {
        this.triggers.forEach((trigger) => {
          trigger.removeEventListener('click', this.collapsibleToggleEvent);
          trigger.removeEventListener('keyup', this.collapsibleToggleEvent);
        });
        window.removeEventListener('theme:resize:width', this.onResizeEvent);
      }
    }

    const collapsible = {
      onLoad() {
        sections$J[this.id] = new Collapsible(this.container);
      },
      onUnload() {
        sections$J[this.id].onUnload();
      },
    };

    const a11y = {
      /**
       * A11y Helpers
       * -----------------------------------------------------------------------------
       * A collection of useful functions that help make your theme more accessible
       */

      state: {
        firstFocusable: null,
        lastFocusable: null,
        trigger: null,
        mainTrigger: null,
      },

      trapFocus: function (options) {
        var focusableElements = Array.from(options.container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex^="-"])')).filter(function (element) {
          var width = element.offsetWidth;
          var height = element.offsetHeight;

          return width !== 0 && height !== 0 && getComputedStyle(element).getPropertyValue('display') !== 'none';
        });

        focusableElements = focusableElements.filter(function (element) {
          return !element.classList.contains('deferred-media__poster');
        });

        this.state.firstFocusable = focusableElements[0];
        this.state.lastFocusable = focusableElements[focusableElements.length - 1];

        if (!options.elementToFocus) {
          options.elementToFocus = this.state.firstFocusable || options.container;
        }
        this._setupHandlers();

        document.addEventListener('focusin', this._onFocusInHandler);
        document.addEventListener('focusout', this._onFocusOutHandler);

        options.container.setAttribute('tabindex', '-1');
        options.elementToFocus.focus();
      },

      removeTrapFocus: function (options) {
        const focusVisible = !document.body.classList.contains('no-outline');
        if (options && options.container) {
          options.container.removeAttribute('tabindex');
        }
        document.removeEventListener('focusin', this._onFocusInHandler);

        if (this.state.trigger && focusVisible) {
          this.state.trigger.focus();
        }
      },

      _manageFocus: function (evt) {
        if (evt.code !== theme.keyboardKeys.TAB) {
          return;
        }

        /**
         * On the last focusable element and tab forward,
         * focus the first element.
         */
        if (evt.target === this.state.lastFocusable && !evt.shiftKey) {
          evt.preventDefault();
          this.state.firstFocusable.focus();
        }

        /**
         * On the first focusable element and tab backward,
         * focus the last element.
         */
        if (evt.target === this.state.firstFocusable && evt.shiftKey) {
          evt.preventDefault();
          this.state.lastFocusable.focus();
        }
      },

      _onFocusOut: function () {
        document.removeEventListener('keydown', this._manageFocusHandler);
      },

      _onFocusIn: function (evt) {
        if (evt.target !== this.state.lastFocusable && evt.target !== this.state.firstFocusable) {
          return;
        }

        document.addEventListener('keydown', this._manageFocusHandler);
      },

      _setupHandlers: function () {
        if (!this._onFocusInHandler) {
          this._onFocusInHandler = this._onFocusIn.bind(this);
        }

        if (!this._onFocusOutHandler) {
          this._onFocusOutHandler = this._onFocusIn.bind(this);
        }

        if (!this._manageFocusHandler) {
          this._manageFocusHandler = this._manageFocus.bind(this);
        }
      },
    };

    function getScript(url, callback, callbackError) {
      let head = document.getElementsByTagName('head')[0];
      let done = false;
      let script = document.createElement('script');
      script.src = url;

      // Attach handlers for all browsers
      script.onload = script.onreadystatechange = function () {
        if (!done && (!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete')) {
          done = true;
          callback();
        } else {
          callbackError();
        }
      };

      head.appendChild(script);
    }

    const loaders = {};
    window.isYoutubeAPILoaded = false;
    window.isVimeoAPILoaded = false;

    function loadScript(options = {}) {
      if (!options.type) {
        options.type = 'json';
      }

      if (options.url) {
        if (loaders[options.url]) {
          return loaders[options.url];
        } else {
          return getScriptWithPromise(options.url, options.type);
        }
      } else if (options.json) {
        if (loaders[options.json]) {
          return Promise.resolve(loaders[options.json]);
        } else {
          return window
            .fetch(options.json)
            .then((response) => {
              return response.json();
            })
            .then((response) => {
              loaders[options.json] = response;
              return response;
            });
        }
      } else if (options.name) {
        const key = ''.concat(options.name, options.version);
        if (loaders[key]) {
          return loaders[key];
        } else {
          return loadShopifyWithPromise(options);
        }
      } else {
        return Promise.reject();
      }
    }

    function getScriptWithPromise(url, type) {
      const loader = new Promise((resolve, reject) => {
        if (type === 'text') {
          fetch(url)
            .then((response) => response.text())
            .then((data) => {
              resolve(data);
            })
            .catch((error) => {
              reject(error);
            });
        } else {
          getScript(
            url,
            function () {
              resolve();
            },
            function () {
              reject();
            }
          );
        }
      });

      loaders[url] = loader;
      return loader;
    }

    function loadShopifyWithPromise(options) {
      const key = ''.concat(options.name, options.version);
      const loader = new Promise((resolve, reject) => {
        try {
          window.Shopify.loadFeatures([
            {
              name: options.name,
              version: options.version,
              onLoad: (err) => {
                onLoadFromShopify(resolve, reject, err);
              },
            },
          ]);
        } catch (err) {
          reject(err);
        }
      });
      loaders[key] = loader;
      return loader;
    }

    function onLoadFromShopify(resolve, reject, err) {
      if (err) {
        return reject(err);
      } else {
        return resolve();
      }
    }

    const selectors$19 = {
      videoIframe: '[data-video-id]',
    };

    const classes$$ = {
      loaded: 'loaded',
    };

    const attributes$P = {
      dataEnableSound: 'data-enable-sound',
      dataEnableBackground: 'data-enable-background',
      dataEnableAutoplay: 'data-enable-autoplay',
      dataEnableLoop: 'data-enable-loop',
      dataVideoId: 'data-video-id',
      dataVideoType: 'data-video-type',
    };

    class LoadVideoVimeo {
      constructor(container) {
        this.container = container;
        this.player = this.container.querySelector(selectors$19.videoIframe);

        if (this.player) {
          this.videoID = this.player.getAttribute(attributes$P.dataVideoId);
          this.videoType = this.player.getAttribute(attributes$P.dataVideoType);
          this.enableBackground = this.player.getAttribute(attributes$P.dataEnableBackground) === 'true';
          this.disableSound = this.player.getAttribute(attributes$P.dataEnableSound) === 'false';
          this.enableAutoplay = this.player.getAttribute(attributes$P.dataEnableAutoplay) !== 'false';
          this.enableLoop = this.player.getAttribute(attributes$P.dataEnableLoop) !== 'false';

          if (this.videoType == 'vimeo') {
            this.init();
          }
        }
      }

      init() {
        this.loadVimeoPlayer();
      }

      loadVimeoPlayer() {
        const oembedUrl = 'https://vimeo.com/api/oembed.json';
        const vimeoUrl = 'https://vimeo.com/' + this.videoID;
        let paramsString = '';
        const state = this.player;

        const params = {
          url: vimeoUrl,
          background: this.enableBackground,
          muted: this.disableSound,
          autoplay: this.enableAutoplay,
          loop: this.enableLoop,
        };

        for (let key in params) {
          paramsString += encodeURIComponent(key) + '=' + encodeURIComponent(params[key]) + '&';
        }

        fetch(`${oembedUrl}?${paramsString}`)
          .then((response) => response.json())
          .then(function (data) {
            state.innerHTML = data.html;

            setTimeout(function () {
              state.parentElement.classList.add(classes$$.loaded);
            }, 1000);
          })
          .catch(function () {
            console.log('error');
          });
      }
    }

    const selectors$18 = {
      videoIframe: '[data-video-id]',
      videoWrapper: '.video-wrapper',
      youtubeWrapper: '[data-youtube-wrapper]',
    };

    const attributes$O = {
      dataSectionId: 'data-section-id',
      dataEnableSound: 'data-enable-sound',
      dataHideOptions: 'data-hide-options',
      dataCheckPlayerVisibility: 'data-check-player-visibility',
      dataVideoId: 'data-video-id',
      dataVideoType: 'data-video-type',
    };

    const classes$_ = {
      loaded: 'loaded',
    };

    const players = [];

    class LoadVideoYT {
      constructor(container) {
        this.container = container;
        this.player = this.container.querySelector(selectors$18.videoIframe);

        if (this.player) {
          this.videoOptionsVars = {};
          this.videoID = this.player.getAttribute(attributes$O.dataVideoId);
          this.videoType = this.player.getAttribute(attributes$O.dataVideoType);
          if (this.videoType == 'youtube') {
            this.checkPlayerVisibilityFlag = this.player.getAttribute(attributes$O.dataCheckPlayerVisibility) === 'true';
            this.playerID = this.player.querySelector(selectors$18.youtubeWrapper) ? this.player.querySelector(selectors$18.youtubeWrapper).id : this.player.id;
            if (this.player.hasAttribute(selectors$18.dataHideOptions)) {
              this.videoOptionsVars = {
                cc_load_policy: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                playsinline: 1,
                autohide: 0,
                controls: 0,
                branding: 0,
                showinfo: 0,
                rel: 0,
                fs: 0,
                wmode: 'opaque',
              };
            }

            this.init();

            this.container.addEventListener(
              'touchstart',
              function (e) {
                if (e.target.matches(selectors$18.videoWrapper) || e.target.closest(selectors$18.videoWrapper)) {
                  const playerID = e.target.querySelector(selectors$18.videoIframe).id;
                  players[playerID].playVideo();
                }
              },
              {passive: true}
            );
          }
        }
      }

      init() {
        if (window.isYoutubeAPILoaded) {
          this.loadYoutubePlayer();
        } else {
          // Load Youtube API if not loaded yet
          loadScript({url: 'https://www.youtube.com/iframe_api'}).then(() => this.loadYoutubePlayer());
        }
      }

      loadYoutubePlayer() {
        const defaultYoutubeOptions = {
          height: '720',
          width: '1280',
          playerVars: this.videoOptionsVars,
          events: {
            onReady: (event) => {
              const eventIframe = event.target.getIframe();
              const id = eventIframe.id;
              const enableSound = document.querySelector(`#${id}`).getAttribute(attributes$O.dataEnableSound) === 'true';

              if (enableSound) {
                event.target.unMute();
              } else {
                event.target.mute();
              }
              event.target.playVideo();

              if (this.checkPlayerVisibilityFlag) {
                this.checkPlayerVisibility(id);

                window.addEventListener(
                  'scroll',
                  throttle(() => {
                    this.checkPlayerVisibility(id);
                  }, 150)
                );
              }
            },
            onStateChange: (event) => {
              // Loop video if state is ended
              if (event.data == 0) {
                event.target.playVideo();
              }
              if (event.data == 1) {
                // video is playing
                event.target.getIframe().parentElement.classList.add(classes$_.loaded);
              }
            },
          },
        };

        const currentYoutubeOptions = {...defaultYoutubeOptions};
        currentYoutubeOptions.videoId = this.videoID;
        if (this.videoID.length) {
          YT.ready(() => {
            players[this.playerID] = new YT.Player(this.playerID, currentYoutubeOptions);
          });
        }
        window.isYoutubeAPILoaded = true;
      }

      checkPlayerVisibility(id) {
        let playerID;
        if (typeof id === 'string') {
          playerID = id;
        } else if (id.data != undefined) {
          playerID = id.data.id;
        } else {
          return;
        }

        const playerElement = document.getElementById(playerID + '-container');
        if (!playerElement) {
          return;
        }
        const player = players[playerID];
        const box = playerElement.getBoundingClientRect();
        let isVisible = visibilityHelper.isElementPartiallyVisible(playerElement) || visibilityHelper.isElementTotallyVisible(playerElement);

        // Fix the issue when element height is bigger than the viewport height
        if (box.top < 0 && playerElement.clientHeight + box.top >= 0) {
          isVisible = true;
        }

        if (isVisible && player && typeof player.playVideo === 'function') {
          player.playVideo();
        } else if (!isVisible && player && typeof player.pauseVideo === 'function') {
          player.pauseVideo();
        }
      }

      onUnload() {
        const playerID = 'youtube-' + this.container.getAttribute(attributes$O.dataSectionId);
        if (!players[playerID]) {
          return;
        }
        players[playerID].destroy();
      }
    }

    const selectors$17 = {
      notificationForm: '[data-notification-form]',
      notification: '[data-notification]',
      popupClose: '[data-popup-close]',
    };

    const classes$Z = {
      popupSuccess: 'pswp--success',
      notificationPopupVisible: 'notification-popup-visible',
    };

    class LoadNotification {
      constructor(popup, pswpElement) {
        this.popup = popup;
        this.pswpElement = pswpElement;
        this.notificationForm = null;
        this.notificationStopSubmit = true;
        this.sessionStorage = window.sessionStorage;
        const notificationWrapper = this.pswpElement.querySelector(selectors$17.notification);
        this.outerCloseEvent = (e) => {
          if (!notificationWrapper.contains(e.target)) {
            this.popup.close();
          }
        };

        this.init();
      }

      init() {
        this.popup.listen('preventDragEvent', (e, isDown, preventObj) => {
          preventObj.prevent = false;
        });

        const notificationFormSuccess = window.location.search.indexOf('?contact_posted=true') !== -1;
        this.notificationForm = this.pswpElement.querySelector(selectors$17.notificationForm);
        const closeBtn = this.pswpElement.querySelector(selectors$17.popupClose);
        document.body.classList.add(classes$Z.notificationPopupVisible);

        this.pswpElement.addEventListener('mousedown', () => {
          this.popup.framework.unbind(window, 'pointermove pointerup pointercancel', this.popup);
        });

        if (notificationFormSuccess) {
          this.pswpElement.classList.add(classes$Z.popupSuccess);
        }

        this.notificationForm.addEventListener('submit', (e) => this.notificationSubmitEvent(e));

        // Custom closing events
        this.pswpElement.addEventListener('click', this.outerCloseEvent);

        closeBtn.addEventListener('click', () => {
          this.popup.close();
        });

        this.popup.listen('destroy', () => {
          this.notificationRemoveStorage();
          this.pswpElement.removeEventListener('click', this.outerCloseEvent);
          document.body.classList.remove(classes$Z.notificationPopupVisible);
        });
      }

      notificationSubmitEvent(e) {
        if (this.notificationStopSubmit) {
          e.preventDefault();

          this.notificationRemoveStorage();
          this.notificationWriteStorage();
          this.notificationStopSubmit = false;
          this.notificationForm.submit();
        }
      }

      notificationWriteStorage() {
        if (this.sessionStorage !== undefined) {
          this.sessionStorage.setItem('notification_form_id', this.notificationForm.id);
        }
      }

      notificationRemoveStorage() {
        this.sessionStorage.removeItem('notification_form_id');
      }
    }

    // iOS smooth scrolling fix
    function flickitySmoothScrolling(slider) {
      const flkty = Flickity.data(slider);

      if (!flkty) {
        return;
      }

      flkty.on('dragStart', (event, pointer) => {
        document.ontouchmove = function (e) {
          e.preventDefault();
        };
      });

      flkty.on('dragEnd', (event, pointer) => {
        document.ontouchmove = function (e) {
          return true;
        };
      });
    }

    const hosts = {
      html5: 'html5',
      youtube: 'youtube',
      vimeo: 'vimeo',
    };

    const selectors$16 = {
      deferredMedia: '[data-deferred-media]',
      deferredMediaButton: '[data-deferred-media-button]',
      productMediaWrapper: '[data-product-single-media-wrapper]',
      mediaContainer: '[data-video]',
      mediaHidden: '.media--hidden',
    };

    const classes$Y = {
      mediaHidden: 'media--hidden',
    };

    const attributes$N = {
      loaded: 'loaded',
      sectionId: 'data-section-id',
      dataAutoplayVideo: 'data-autoplay-video',
      mediaId: 'data-media-id',
    };

    class ProductVideo {
      constructor(container) {
        this.container = container;
        this.id = this.container.getAttribute(attributes$N.sectionId);
        this.autoplayVideo = this.container.getAttribute(attributes$N.dataAutoplayVideo) === 'true';
        this.players = {};
        this.pauseContainerMedia = (mediaId, container = this.container) => this.pauseOtherMedia(mediaId, container);
        this.init();
      }

      init() {
        const mediaContainers = this.container.querySelectorAll(selectors$16.mediaContainer);

        mediaContainers.forEach((mediaContainer) => {
          const deferredMediaButton = mediaContainer.querySelector(selectors$16.deferredMediaButton);

          if (deferredMediaButton) {
            deferredMediaButton.addEventListener('click', this.loadContent.bind(this, mediaContainer));
          }

          if (this.autoplayVideo) {
            this.loadContent(mediaContainer);
          }
        });
      }

      loadContent(mediaContainer) {
        if (mediaContainer.querySelector(selectors$16.deferredMedia).getAttribute(attributes$N.loaded)) {
          return;
        }

        const content = document.createElement('div');
        content.appendChild(mediaContainer.querySelector('template').content.firstElementChild.cloneNode(true));
        const mediaId = mediaContainer.dataset.mediaId;
        const element = content.querySelector('video, iframe');
        const host = this.hostFromVideoElement(element);
        const deferredMedia = mediaContainer.querySelector(selectors$16.deferredMedia);
        deferredMedia.appendChild(element);
        deferredMedia.setAttribute('loaded', true);

        this.players[mediaId] = {
          mediaId: mediaId,
          sectionId: this.id,
          container: mediaContainer,
          element: element,
          host: host,
          ready: () => {
            this.createPlayer(mediaId);
          },
        };

        const video = this.players[mediaId];

        switch (video.host) {
          case hosts.html5:
            this.loadVideo(video, hosts.html5);
            break;
          case hosts.vimeo:
            if (window.isVimeoAPILoaded) {
              this.loadVideo(video, hosts.vimeo);
            } else {
              loadScript({url: 'https://player.vimeo.com/api/player.js'}).then(() => this.loadVideo(video, hosts.vimeo));
            }
            break;
          case hosts.youtube:
            if (window.isYoutubeAPILoaded) {
              this.loadVideo(video, hosts.youtube);
            } else {
              loadScript({url: 'https://www.youtube.com/iframe_api'}).then(() => this.loadVideo(video, hosts.youtube));
            }
            break;
        }
      }

      hostFromVideoElement(video) {
        if (video.tagName === 'VIDEO') {
          return hosts.html5;
        }

        if (video.tagName === 'IFRAME') {
          if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.?be)\/.+$/.test(video.src)) {
            return hosts.youtube;
          } else if (video.src.includes('vimeo.com')) {
            return hosts.vimeo;
          }
        }

        return null;
      }

      loadVideo(video, host) {
        if (video.host === host) {
          video.ready();
        }
      }

      createPlayer(mediaId) {
        const video = this.players[mediaId];

        switch (video.host) {
          case hosts.html5:
            video.element.addEventListener('play', () => {
              video.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
            });

            video.element.addEventListener('pause', () => {
              video.container.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
            });

            if (this.autoplayVideo) {
              this.observeVideo(video, mediaId);
            }

            break;
          case hosts.vimeo:
            video.player = new Vimeo.Player(video.element);
            video.player.play(); // Force video play on iOS
            video.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});

            window.isVimeoAPILoaded = true;

            video.player.on('play', () => {
              video.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
            });

            video.player.on('pause', () => {
              video.container.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
            });

            if (this.autoplayVideo) {
              this.observeVideo(video, mediaId);
            }

            break;
          case hosts.youtube:
            if (video.host == hosts.youtube && video.player) {
              return;
            }

            YT.ready(() => {
              const videoId = video.container.dataset.videoId;

              video.player = new YT.Player(video.element, {
                videoId: videoId,
                events: {
                  onReady: (event) => {
                    event.target.playVideo(); // Force video play on iOS
                    video.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
                  },
                  onStateChange: (event) => {
                    // Playing
                    if (event.data == 1) {
                      video.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
                    }

                    // Paused
                    if (event.data == 2) {
                      video.container.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
                    }

                    // Ended
                    if (event.data == 0) {
                      video.container.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
                    }
                  },
                },
              });

              window.isYoutubeAPILoaded = true;

              if (this.autoplayVideo) {
                this.observeVideo(video, mediaId);
              }
            });

            break;
        }

        video.container.addEventListener('theme:media:visible', (event) => this.onVisible(event));
        video.container.addEventListener('theme:media:hidden', (event) => this.onHidden(event));
        video.container.addEventListener('xrLaunch', (event) => this.onHidden(event));
      }

      observeVideo(video) {
        let observer = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              const outsideViewport = entry.intersectionRatio == 0;
              const isVisible = !video.element.closest(selectors$16.mediaHidden);

              if (outsideViewport) {
                this.pauseVideo(video);
              } else if (isVisible) {
                this.playVideo(video);
              }
            });
          },
          {
            rootMargin: '200px',
            threshold: [0, 0.25, 0.75, 1],
          }
        );
        observer.observe(video.element);
      }

      playVideo(video) {
        if (video.player && video.player.playVideo) {
          video.player.playVideo();
        } else if (video.element && video.element.play) {
          video.element.play();
        } else if (video.player && video.player.play) {
          video.player.play();
        }

        video.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
      }

      pauseVideo(video) {
        if (video.player && video.player.pauseVideo) {
          // Youtube
          if (video.player.playerInfo.playerState == '1') {
            // If Youtube video is playing
            // There is no need to trigger the 'pause' event since we are listening for it when initializing the YT Video
            video.player.pauseVideo();
          }
        } else if (video.player && video.player.pause) {
          // Vimeo
          video.player.pause();
        } else if (video.element && !video.element.paused) {
          // HTML5
          // If HTML5 video is playing (we used .paused because there is no 'playing' property)
          if (typeof video.element.pause === 'function') {
            video.element?.pause();
          }
        }
      }

      onHidden(event) {
        if (typeof event.target.dataset.mediaId !== 'undefined') {
          const mediaId = event.target.dataset.mediaId;
          const video = this.players[mediaId];
          this.pauseVideo(video);
        }
      }

      onVisible(event) {
        if (typeof event.target.dataset.mediaId !== 'undefined') {
          const mediaId = event.target.dataset.mediaId;
          const video = this.players[mediaId];

          // Using a timeout so the video "play" event can triggers after the previous video "pause" event
          // because both events change the "draggable" option of the slider and we need to time it right
          setTimeout(() => {
            this.playVideo(video);
          }, 50);

          this.pauseContainerMedia(mediaId);
        }
      }

      pauseOtherMedia(mediaId, container) {
        const currentMedia = `[${attributes$N.mediaId}="${mediaId}"]`;
        const otherMedia = container.querySelectorAll(`${selectors$16.productMediaWrapper}:not(${currentMedia})`);

        if (otherMedia.length) {
          otherMedia.forEach((media) => {
            media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
            media.classList.add(classes$Y.mediaHidden);
          });
        }
      }
    }

    function getSearchParams(searchForm, filtersForm, deleteParams = [], type = false) {
      const searchFormData = new FormData(searchForm);
      const searchFormParams = new URLSearchParams(searchFormData);

      if (!filtersForm) return searchFormParams.toString();

      const filtersFormData = new FormData(filtersForm);
      const filtersFormParams = new URLSearchParams(filtersFormData);

      // Get keys with empty values from the search-form and filters-form's FormData objects and delete them
      const emptyParams = [];
      for (const pair of searchFormData.entries()) {
        if (pair[1] === '') emptyParams.push(pair[0]);
      }
      for (const pair of filtersFormData.entries()) {
        if (pair[1] === '') emptyParams.push(pair[0]);
      }
      for (let index = 0; index < emptyParams.length; index++) {
        const param = emptyParams[index];
        if (searchFormParams.has(param)) searchFormParams.delete(param);
        if (filtersFormParams.has(param)) filtersFormParams.delete(param);
      }

      // Delete duplicated keys gotten from the filters FormData object
      for (const key of searchFormParams.keys()) {
        if (filtersFormParams.has(key)) filtersFormParams.delete(key);
      }

      // Delete keys from deleteParams array
      if (deleteParams.length > 0) {
        for (let index = 0; index < deleteParams.length; index++) {
          const param = deleteParams[index];
          if (searchFormParams.has(param)) searchFormParams.delete(param);
          if (filtersFormParams.has(param)) filtersFormParams.delete(param);
        }
      }

      // Replace type key if necessary
      if (type) {
        if (filtersFormParams.has('type')) filtersFormParams.delete('type');
        searchFormParams.set('type', type);
      }

      return `${searchFormParams.toString()}&${filtersFormParams.toString()}`;
    }

    const selectors$15 = {
      scrollbar: '[data-custom-scrollbar]',
      scrollbarItems: '[data-custom-scrollbar-items]',
      scrollbarThumb: '[data-custom-scrollbar-thumb]',
      current: '.current',
    };

    class CustomScrollbar {
      constructor(container) {
        this.container = container;
        this.scrollbarItems = container.querySelector(selectors$15.scrollbarItems);
        this.scrollbar = container.querySelector(selectors$15.scrollbar);
        this.scrollbarThumb = container.querySelector(selectors$15.scrollbarThumb);
        this.trackWidth = 0;
        this.calcScrollbarEvent = () => this.calculateScrollbar();
        this.onScrollbarChangeEvent = (e) => this.onScrollbarChange(e);

        if (this.scrollbar && this.scrollbarItems) {
          this.events();
          this.calculateScrollbar();
          if (this.scrollbarItems.children.length) {
            this.calculateTrack(this.scrollbarItems.querySelector(selectors$15.current));
          }
        }
      }

      calculateTrack(element) {
        if (!element) {
          this.scrollbar.style.setProperty('--thumb-scale', 0);
          this.scrollbar.style.setProperty('--thumb-position', '0px');
          return;
        }

        const thumbScale = element.clientWidth / this.scrollbarThumb.parentElement.clientWidth;
        const thumbPosition = element.offsetLeft / this.scrollbarThumb.parentElement.clientWidth;
        this.scrollbar.style.setProperty('--thumb-scale', thumbScale);
        this.scrollbar.style.setProperty('--thumb-position', `${this.trackWidth * thumbPosition}px`);
      }

      calculateScrollbar() {
        if (this.scrollbarItems.children.length) {
          const childrenArr = [...this.scrollbarItems.children];
          this.trackWidth = 0;

          childrenArr.forEach((element) => {
            this.trackWidth += element.getBoundingClientRect().width + parseInt(window.getComputedStyle(element).marginRight);
          });
          this.scrollbar.style.setProperty('--track-width', `${this.trackWidth}px`);
        }
      }

      onScrollbarChange(e) {
        if (e && e.detail && e.detail.element && this.container.contains(e.detail.element)) {
          this.calculateTrack(e.detail.element);
        }
      }

      events() {
        document.addEventListener('theme:resize:width', this.calcScrollbarEvent);
        document.addEventListener('theme:custom-scrollbar:change', this.onScrollbarChangeEvent);
      }

      unload() {
        document.removeEventListener('theme:resize:width', this.calcScrollbarEvent);
        document.removeEventListener('theme:custom-scrollbar:change', this.onScrollbarChangeEvent);
      }
    }

    const selectors$14 = {
      tooltip: '[data-tooltip]',
      tooltipContainer: '[data-tooltip-container]',
      tooltipArrow: '[data-tooltip-arrow]',
      aos: '[data-aos]',
    };

    const classes$X = {
      root: 'tooltip-default',
      isAnimating: 'is-animating',
      visible: 'is-visible',
      hiding: 'is-hiding',
    };

    const attributes$M = {
      aos: 'data-aos',
      tooltip: 'data-tooltip',
      tooltipContainer: 'data-tooltip-container',
      tooltipStopMouseEnter: 'data-tooltip-stop-mouseenter',
    };

    const sections$I = {};

    class Tooltip {
      constructor(el) {
        this.tooltip = el;
        if (!this.tooltip.hasAttribute(attributes$M.tooltip)) {
          return;
        }

        this.rootClass = classes$X.root;
        this.isAnimatingClass = classes$X.isAnimating;
        this.label = this.tooltip.getAttribute(attributes$M.tooltip);
        this.transitionSpeed = 200;
        this.hideTransitionTimeout = 0;
        this.animatedContainer = this.tooltip.closest(selectors$14.aos);
        this.addPinEvent = () => this.addPin();
        this.addPinMouseEvent = () => this.addPin(true);
        this.removePinEvent = (event) => throttle(this.removePin(event), 50);
        this.removePinMouseEvent = (event) => this.removePin(event, true, true);
        this.init();
      }

      init() {
        if (!document.querySelector(selectors$14.tooltipContainer)) {
          const tooltipTemplate = `<div class="${this.rootClass}__arrow"></div><div class="${this.rootClass}__inner"><div class="${this.rootClass}__text label-typography"></div></div>`;
          const tooltipElement = document.createElement('div');
          tooltipElement.className = `${this.rootClass} ${this.isAnimatingClass}`;
          tooltipElement.setAttribute(attributes$M.tooltipContainer, '');
          tooltipElement.innerHTML = tooltipTemplate;
          document.body.appendChild(tooltipElement);
        }

        this.tooltip.addEventListener('mouseenter', this.addPinMouseEvent);
        this.tooltip.addEventListener('mouseleave', this.removePinMouseEvent);
        this.tooltip.addEventListener('theme:tooltip:init', this.addPinEvent);
        document.addEventListener('theme:tooltip:close', this.removePinEvent);

        const tooltipTarget = document.querySelector(selectors$14.tooltipContainer);

        if (theme.settings.animationsEnabled && this.animatedContainer) {
          if (this.animatedContainer.getAttribute(attributes$M.aos) === 'hero') {
            // Used for PDP and Featured product section
            this.animatedContainer.addEventListener('animationend', () => {
              tooltipTarget.classList.remove(classes$X.isAnimating);
            });
          } else {
            this.animatedContainer.addEventListener('transitionend', (event) => {
              // This will fire the event when the last transition end
              if (event.propertyName === 'transform') {
                tooltipTarget.classList.remove(classes$X.isAnimating);
              }
            });
          }
        }
      }

      addPin(stopMouseEnter = false) {
        const tooltipTarget = document.querySelector(selectors$14.tooltipContainer);

        if (tooltipTarget && ((stopMouseEnter && !this.tooltip.hasAttribute(attributes$M.tooltipStopMouseEnter)) || !stopMouseEnter)) {
          const tooltipTargetArrow = tooltipTarget.querySelector(`.${this.rootClass}__arrow`);
          const tooltipTargetInner = tooltipTarget.querySelector(`.${this.rootClass}__inner`);
          const tooltipTargetText = tooltipTarget.querySelector(`.${this.rootClass}__text`);

          if (this.label.includes('ß')) {
            this.label = this.label.replace(/ß/g, '<span style="text-transform: lowercase;">ß</span>');
          }
          tooltipTargetText.innerHTML = this.label;

          const tooltipTargetWidth = tooltipTargetInner.offsetWidth;
          const tooltipRect = this.tooltip.getBoundingClientRect();
          const tooltipTop = tooltipRect.top;
          const tooltipWidth = tooltipRect.width;
          const tooltipHeight = tooltipRect.height;
          const tooltipTargetPositionTop = tooltipTop + tooltipHeight + window.scrollY;
          let tooltipTargetPositionLeft = tooltipRect.left - tooltipTargetWidth / 2 + tooltipWidth / 2;
          const tooltipLeftWithWidth = tooltipTargetPositionLeft + tooltipTargetWidth;
          const sideOffset = 24;
          const tooltipTargetWindowDifference = tooltipLeftWithWidth - getWindowWidth() + sideOffset;

          if (tooltipTargetWindowDifference > 0) {
            tooltipTargetPositionLeft -= tooltipTargetWindowDifference;
          }

          if (tooltipTargetPositionLeft < 0) {
            tooltipTargetPositionLeft = 0;
          }

          tooltipTargetArrow.style.left = `${tooltipRect.left + tooltipWidth / 2}px`;
          tooltipTarget.style.setProperty('--tooltip-top', `${tooltipTargetPositionTop}px`);

          tooltipTargetInner.style.transform = `translateX(${tooltipTargetPositionLeft}px)`;

          tooltipTarget.classList.remove(classes$X.hiding);
          const onTooltipHiding = (event) => {
            if (event.target !== tooltipTargetInner) return;
            if (event.propertyName === 'transform' || event.propertyName === 'opacity') {
              requestAnimationFrame(() => (tooltipTarget.style.transform = 'translate(0, -100%)'));
            }
            tooltipTarget.removeEventListener('transitionend', onTooltipHiding);
          };
          tooltipTarget.addEventListener('transitionend', onTooltipHiding);

          tooltipTarget.classList.add(classes$X.visible);

          document.addEventListener('theme:scroll', this.removePinEvent);
        }
      }

      removePin(event, stopMouseEnter = false, hideTransition = false) {
        const tooltipTarget = document.querySelector(selectors$14.tooltipContainer);
        const tooltipVisible = tooltipTarget.classList.contains(classes$X.visible);

        if (tooltipTarget && ((stopMouseEnter && !this.tooltip.hasAttribute(attributes$M.tooltipStopMouseEnter)) || !stopMouseEnter)) {
          if (tooltipVisible && (hideTransition || event.detail.hideTransition)) {
            tooltipTarget.classList.add(classes$X.hiding);

            if (this.hideTransitionTimeout) {
              clearTimeout(this.hideTransitionTimeout);
            }

            this.hideTransitionTimeout = setTimeout(() => {
              tooltipTarget.classList.remove(classes$X.hiding);
            }, this.transitionSpeed);
          }

          tooltipTarget.classList.remove(classes$X.visible);

          document.removeEventListener('theme:scroll', this.removePinEvent);
        }
      }

      unload() {
        this.tooltip.removeEventListener('mouseenter', this.addPinMouseEvent);
        this.tooltip.removeEventListener('mouseleave', this.removePinMouseEvent);
        this.tooltip.removeEventListener('theme:tooltip:init', this.addPinEvent);
        document.removeEventListener('theme:tooltip:close', this.removePinEvent);
        document.removeEventListener('theme:scroll', this.removePinEvent);
      }
    }

    const tooltip = {
      onLoad() {
        sections$I[this.id] = [];
        const tooltips = this.container.querySelectorAll(selectors$14.tooltip);
        tooltips.forEach((tooltip) => {
          sections$I[this.id].push(new Tooltip(tooltip));
        });
      },
      onUnload() {
        sections$I[this.id].forEach((tooltip) => {
          if (typeof tooltip.unload === 'function') {
            tooltip.unload();
          }
        });
      },
    };

    const selectors$13 = {
      rangeSlider: '[data-range-slider]',
      rangeDotLeft: '[data-range-left]',
      rangeDotRight: '[data-range-right]',
      rangeLine: '[data-range-line]',
      rangeHolder: '[data-range-holder]',
      dataMin: 'data-se-min',
      dataMax: 'data-se-max',
      dataMinValue: 'data-se-min-value',
      dataMaxValue: 'data-se-max-value',
      dataStep: 'data-se-step',
      dataFilterUpdate: 'data-range-filter-update',
      priceMin: '[data-field-price-min]',
      priceMax: '[data-field-price-max]',
    };

    const classes$W = {
      isInitialized: 'is-initialized',
    };

    class RangeSlider {
      constructor(container) {
        this.container = container;
        this.init();
        this.initListener = () => this.init();

        document.addEventListener('theme:filters:init', this.initListener);
      }

      init() {
        this.slider = this.container.querySelector(selectors$13.rangeSlider);

        if (!this.slider) {
          return;
        }

        this.resizeFilters = debounce(this.reset.bind(this), 50);

        this.onMoveEvent = (event) => this.onMove(event);
        this.onStopEvent = (event) => this.onStop(event);
        this.onStartEvent = (event) => this.onStart(event);
        this.startX = 0;
        this.x = 0;

        // retrieve touch button
        this.touchLeft = this.slider.querySelector(selectors$13.rangeDotLeft);
        this.touchRight = this.slider.querySelector(selectors$13.rangeDotRight);
        this.lineSpan = this.slider.querySelector(selectors$13.rangeLine);

        // get some properties
        this.min = parseFloat(this.slider.getAttribute(selectors$13.dataMin));
        this.max = parseFloat(this.slider.getAttribute(selectors$13.dataMax));

        this.step = 0.0;

        // normalize flag
        this.normalizeFact = 20;

        // retrieve default values
        let defaultMinValue = this.min;
        if (this.slider.hasAttribute(selectors$13.dataMinValue)) {
          defaultMinValue = parseFloat(this.slider.getAttribute(selectors$13.dataMinValue));
        }
        let defaultMaxValue = this.max;

        if (this.slider.hasAttribute(selectors$13.dataMaxValue)) {
          defaultMaxValue = parseFloat(this.slider.getAttribute(selectors$13.dataMaxValue));
        }

        // check values are correct
        if (defaultMinValue < this.min) {
          defaultMinValue = this.min;
        }

        if (defaultMaxValue > this.max) {
          defaultMaxValue = this.max;
        }

        if (defaultMinValue > defaultMaxValue) {
          defaultMinValue = defaultMaxValue;
        }

        if (this.slider.getAttribute(selectors$13.dataStep)) {
          this.step = Math.abs(parseFloat(this.slider.getAttribute(selectors$13.dataStep)));
        }

        // initial reset
        this.reset();
        window.addEventListener('theme:resize', this.resizeFilters);

        // usefull values, min, max, normalize fact is the width of both touch buttons
        this.maxX = this.slider.offsetWidth - this.touchRight.offsetWidth;
        this.selectedTouch = null;
        this.initialValue = this.lineSpan.offsetWidth - this.normalizeFact;

        // set defualt values
        this.setMinValue(defaultMinValue);
        this.setMaxValue(defaultMaxValue);

        // link events
        this.touchLeft.addEventListener('mousedown', this.onStartEvent);
        this.touchRight.addEventListener('mousedown', this.onStartEvent);
        this.touchLeft.addEventListener('touchstart', this.onStartEvent, {passive: true});
        this.touchRight.addEventListener('touchstart', this.onStartEvent, {passive: true});

        // initialize
        this.slider.classList.add(classes$W.isInitialized);
      }

      reset() {
        this.touchLeft.style.left = '0px';
        this.touchRight.style.left = this.slider.offsetWidth - this.touchLeft.offsetWidth + 'px';
        this.lineSpan.style.marginLeft = '0px';
        this.lineSpan.style.width = this.slider.offsetWidth - this.touchLeft.offsetWidth + 'px';
        this.startX = 0;
        this.x = 0;

        this.maxX = this.slider.offsetWidth - this.touchRight.offsetWidth;
        this.initialValue = this.lineSpan.offsetWidth - this.normalizeFact;
      }

      setMinValue(minValue) {
        const ratio = (minValue - this.min) / (this.max - this.min);
        this.touchLeft.style.left = Math.ceil(ratio * (this.slider.offsetWidth - (this.touchLeft.offsetWidth + this.normalizeFact))) + 'px';
        this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
        this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + 'px';
        this.slider.setAttribute(selectors$13.dataMinValue, minValue);
      }

      setMaxValue(maxValue) {
        const ratio = (maxValue - this.min) / (this.max - this.min);
        this.touchRight.style.left = Math.ceil(ratio * (this.slider.offsetWidth - (this.touchLeft.offsetWidth + this.normalizeFact)) + this.normalizeFact) + 'px';
        this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
        this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + 'px';
        this.slider.setAttribute(selectors$13.dataMaxValue, maxValue);
      }

      onStart(event) {
        // Prevent default dragging of selected content
        event.preventDefault();
        let eventTouch = event;

        if (event.touches) {
          eventTouch = event.touches[0];
        }

        if (event.currentTarget === this.touchLeft) {
          this.x = this.touchLeft.offsetLeft;
        } else if (event.currentTarget === this.touchRight) {
          this.x = this.touchRight.offsetLeft;
        }

        this.startX = eventTouch.pageX - this.x;
        this.selectedTouch = event.currentTarget;
        document.addEventListener('mousemove', this.onMoveEvent);
        document.addEventListener('mouseup', this.onStopEvent);
        document.addEventListener('touchmove', this.onMoveEvent, {passive: true});
        document.addEventListener('touchend', this.onStopEvent, {passive: true});
      }

      onMove(event) {
        let eventTouch = event;

        if (event.touches) {
          eventTouch = event.touches[0];
        }

        this.x = eventTouch.pageX - this.startX;

        if (this.selectedTouch === this.touchLeft) {
          if (this.x > this.touchRight.offsetLeft - this.selectedTouch.offsetWidth + 10) {
            this.x = this.touchRight.offsetLeft - this.selectedTouch.offsetWidth + 10;
          } else if (this.x < 0) {
            this.x = 0;
          }

          this.selectedTouch.style.left = this.x + 'px';
        } else if (this.selectedTouch === this.touchRight) {
          if (this.x < this.touchLeft.offsetLeft + this.touchLeft.offsetWidth - 10) {
            this.x = this.touchLeft.offsetLeft + this.touchLeft.offsetWidth - 10;
          } else if (this.x > this.maxX) {
            this.x = this.maxX;
          }
          this.selectedTouch.style.left = this.x + 'px';
        }

        // update line span
        this.lineSpan.style.marginLeft = this.touchLeft.offsetLeft + 'px';
        this.lineSpan.style.width = this.touchRight.offsetLeft - this.touchLeft.offsetLeft + 'px';

        // write new value
        this.calculateValue();

        // call on change
        if (this.slider.getAttribute('on-change')) {
          const fn = new Function('min, max', this.slider.getAttribute('on-change'));
          fn(this.slider.getAttribute(selectors$13.dataMinValue), this.slider.getAttribute(selectors$13.dataMaxValue));
        }

        this.onChange(this.slider.getAttribute(selectors$13.dataMinValue), this.slider.getAttribute(selectors$13.dataMaxValue));
      }

      onStop(event) {
        document.removeEventListener('mousemove', this.onMoveEvent);
        document.removeEventListener('mouseup', this.onStopEvent);
        document.removeEventListener('touchmove', this.onMoveEvent, {passive: true});
        document.removeEventListener('touchend', this.onStopEvent, {passive: true});

        this.selectedTouch = null;

        // write new value
        this.calculateValue();

        // call did changed
        this.onChanged(this.slider.getAttribute(selectors$13.dataMinValue), this.slider.getAttribute(selectors$13.dataMaxValue));
      }

      onChange(min, max) {
        const rangeHolder = this.slider.closest(selectors$13.rangeHolder);
        if (rangeHolder) {
          const priceMin = rangeHolder.querySelector(selectors$13.priceMin);
          const priceMax = rangeHolder.querySelector(selectors$13.priceMax);

          if (priceMin && priceMax) {
            priceMin.value = parseInt(min);
            priceMax.value = parseInt(max);
          }
        }
      }

      onChanged(min, max) {
        if (this.slider.hasAttribute(selectors$13.dataFilterUpdate)) {
          this.slider.dispatchEvent(new CustomEvent('theme:filter:range-update', {bubbles: true}));
        }
      }

      calculateValue() {
        const newValue = (this.lineSpan.offsetWidth - this.normalizeFact) / this.initialValue;
        let minValue = this.lineSpan.offsetLeft / this.initialValue;
        let maxValue = minValue + newValue;

        minValue = minValue * (this.max - this.min) + this.min;
        maxValue = maxValue * (this.max - this.min) + this.min;

        if (this.step !== 0.0) {
          let multi = Math.floor(minValue / this.step);
          minValue = this.step * multi;

          multi = Math.floor(maxValue / this.step);
          maxValue = this.step * multi;
        }

        if (this.selectedTouch === this.touchLeft) {
          this.slider.setAttribute(selectors$13.dataMinValue, minValue);
        }

        if (this.selectedTouch === this.touchRight) {
          this.slider.setAttribute(selectors$13.dataMaxValue, maxValue);
        }
      }

      unload() {
        document.removeEventListener('theme:filters:init', this.initListener);
        window.removeEventListener('theme:resize', this.resizeFilters);
      }
    }

    function Listeners() {
      this.entries = [];
    }

    Listeners.prototype.add = function (element, event, fn) {
      this.entries.push({element: element, event: event, fn: fn});
      element.addEventListener(event, fn);
    };

    Listeners.prototype.removeAll = function () {
      this.entries = this.entries.filter(function (listener) {
        listener.element.removeEventListener(listener.event, listener.fn);
        return false;
      });
    };

    /**
     * Convert the Object (with 'name' and 'value' keys) into an Array of values, then find a match & return the variant (as an Object)
     * @param {Object} product Product JSON object
     * @param {Object} collection Object with 'name' and 'value' keys (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
     * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
     */
    function getVariantFromSerializedArray(product, collection) {
      _validateProductStructure(product);

      // If value is an array of options
      var optionArray = _createOptionArrayFromOptionCollection(product, collection);
      return getVariantFromOptionArray(product, optionArray);
    }

    /**
     * Find a match in the project JSON (using Array with option values) and return the variant (as an Object)
     * @param {Object} product Product JSON object
     * @param {Array} options List of submitted values (e.g. ['36', 'Black'])
     * @returns {Object || null} The variant object once a match has been successful. Otherwise null will be returned
     */
    function getVariantFromOptionArray(product, options) {
      _validateProductStructure(product);
      _validateOptionsArray(options);

      var result = product.variants.filter(function (variant) {
        return options.every(function (option, index) {
          return variant.options[index] === option;
        });
      });

      return result[0] || null;
    }

    /**
     * Creates an array of selected options from the object
     * Loops through the project.options and check if the "option name" exist (product.options.name) and matches the target
     * @param {Object} product Product JSON object
     * @param {Array} collection Array of object (e.g. [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }])
     * @returns {Array} The result of the matched values. (e.g. ['36', 'Black'])
     */
    function _createOptionArrayFromOptionCollection(product, collection) {
      _validateProductStructure(product);
      _validateSerializedArray(collection);

      var optionArray = [];

      collection.forEach(function (option) {
        for (var i = 0; i < product.options.length; i++) {
          var name = product.options[i].name || product.options[i];
          if (name.toLowerCase() === option.name.toLowerCase()) {
            optionArray[i] = option.value;
            break;
          }
        }
      });

      return optionArray;
    }

    /**
     * Check if the product data is a valid JS object
     * Error will be thrown if type is invalid
     * @param {object} product Product JSON object
     */
    function _validateProductStructure(product) {
      if (typeof product !== 'object') {
        throw new TypeError(product + ' is not an object.');
      }

      if (Object.keys(product).length === 0 && product.constructor === Object) {
        throw new Error(product + ' is empty.');
      }
    }

    /**
     * Validate the structure of the array
     * It must be formatted like jQuery's serializeArray()
     * @param {Array} collection Array of object [{ name: "Size", value: "36" }, { name: "Color", value: "Black" }]
     */
    function _validateSerializedArray(collection) {
      if (!Array.isArray(collection)) {
        throw new TypeError(collection + ' is not an array.');
      }

      if (collection.length === 0) {
        throw new Error(collection + ' is empty.');
      }

      if (collection[0].hasOwnProperty('name')) {
        if (typeof collection[0].name !== 'string') {
          throw new TypeError('Invalid value type passed for name of option ' + collection[0].name + '. Value should be string.');
        }
      } else {
        throw new Error(collection[0] + 'does not contain name key.');
      }
    }

    /**
     * Validate the structure of the array
     * It must be formatted as list of values
     * @param {Array} collection Array of object (e.g. ['36', 'Black'])
     */
    function _validateOptionsArray(options) {
      if (Array.isArray(options) && typeof options[0] === 'object') {
        throw new Error(options + 'is not a valid array of options.');
      }
    }

    var selectors$12 = {
      idInput: '[name="id"]',
      planInput: '[name="selling_plan"]',
      optionInput: '[name^="options"]',
      quantityInput: '[name="quantity"]',
      propertyInput: '[name^="properties"]',
    };

    // Public Methods
    // -----------------------------------------------------------------------------

    /**
     * Returns a URL with a variant ID query parameter. Useful for updating window.history
     * with a new URL based on the currently select product variant.
     * @param {string} url - The URL you wish to append the variant ID to
     * @param {number} id  - The variant ID you wish to append to the URL
     * @returns {string} - The new url which includes the variant ID query parameter
     */

    function getUrlWithVariant(url, id) {
      if (/variant=/.test(url)) {
        return url.replace(/(variant=)[^&]+/, '$1' + id);
      } else if (/\?/.test(url)) {
        return url.concat('&variant=').concat(id);
      }

      return url.concat('?variant=').concat(id);
    }

    /**
     * Constructor class that creates a new instance of a product form controller.
     *
     * @param {Element} element - DOM element which is equal to the <form> node wrapping product form inputs
     * @param {Object} product - A product object
     * @param {Object} options - Optional options object
     * @param {Function} options.onOptionChange - Callback for whenever an option input changes
     * @param {Function} options.onPlanChange - Callback for changes to name=selling_plan
     * @param {Function} options.onQuantityChange - Callback for whenever an quantity input changes
     * @param {Function} options.onPropertyChange - Callback for whenever a property input changes
     * @param {Function} options.onFormSubmit - Callback for whenever the product form is submitted
     */
    class ProductForm {
      constructor(element, product, options) {
        this.element = element;
        this.form = this.element.tagName == 'FORM' ? this.element : this.element.querySelector('form');
        this.product = this._validateProductObject(product);
        this.variantElement = this.element.querySelector(selectors$12.idInput);

        options = options || {};

        this._listeners = new Listeners();
        this._listeners.add(this.element, 'submit', this._onSubmit.bind(this, options));

        this.optionInputs = this._initInputs(selectors$12.optionInput, options.onOptionChange);

        this.planInputs = this._initInputs(selectors$12.planInput, options.onPlanChange);

        this.quantityInputs = this._initInputs(selectors$12.quantityInput, options.onQuantityChange);

        this.propertyInputs = this._initInputs(selectors$12.propertyInput, options.onPropertyChange);
      }

      /**
       * Cleans up all event handlers that were assigned when the Product Form was constructed.
       * Useful for use when a section needs to be reloaded in the theme editor.
       */
      destroy() {
        this._listeners.removeAll();
      }

      /**
       * Getter method which returns the array of currently selected option values
       *
       * @returns {Array} An array of option values
       */
      options() {
        return this._serializeInputValues(this.optionInputs, function (item) {
          var regex = /(?:^(options\[))(.*?)(?:\])/;
          item.name = regex.exec(item.name)[2]; // Use just the value between 'options[' and ']'
          return item;
        });
      }

      /**
       * Getter method which returns the currently selected variant, or `null` if variant
       * doesn't exist.
       *
       * @returns {Object|null} Variant object
       */
      variant() {
        const opts = this.options();
        if (opts.length) {
          return getVariantFromSerializedArray(this.product, opts);
        } else {
          return this.product.variants[0];
        }
      }

      /**
       * Getter method which returns the current selling plan, or `null` if plan
       * doesn't exist.
       *
       * @returns {Object|null} Variant object
       */
      plan(variant) {
        let plan = {
          allocation: null,
          group: null,
          detail: null,
        };
        const formData = new FormData(this.form);
        const id = formData.get('selling_plan');

        if (id && variant) {
          plan.allocation = variant.selling_plan_allocations.find(function (item) {
            return item.selling_plan_id.toString() === id.toString();
          });
        }
        if (plan.allocation) {
          plan.group = this.product.selling_plan_groups.find(function (item) {
            return item.id.toString() === plan.allocation.selling_plan_group_id.toString();
          });
        }
        if (plan.group) {
          plan.detail = plan.group.selling_plans.find(function (item) {
            return item.id.toString() === id.toString();
          });
        }

        if (plan && plan.allocation && plan.detail && plan.allocation) {
          return plan;
        } else return null;
      }

      /**
       * Getter method which returns a collection of objects containing name and values
       * of property inputs
       *
       * @returns {Array} Collection of objects with name and value keys
       */
      properties() {
        return this._serializeInputValues(this.propertyInputs, function (item) {
          var regex = /(?:^(properties\[))(.*?)(?:\])/;
          item.name = regex.exec(item.name)[2]; // Use just the value between 'properties[' and ']'
          return item;
        });
      }

      /**
       * Getter method which returns the current quantity or 1 if no quantity input is
       * included in the form
       *
       * @returns {Array} Collection of objects with name and value keys
       */
      quantity() {
        return this.quantityInputs[0] ? Number.parseInt(this.quantityInputs[0].value, 10) : 1;
      }

      getFormState() {
        const variant = this.variant();
        return {
          options: this.options(),
          variant: variant,
          properties: this.properties(),
          quantity: this.quantity(),
          plan: this.plan(variant),
        };
      }

      // Private Methods
      // -----------------------------------------------------------------------------
      _setIdInputValue(variant) {
        if (variant && variant.id) {
          this.variantElement.value = variant.id.toString();
        } else {
          this.variantElement.value = '';
        }

        this.variantElement.dispatchEvent(new Event('change'));
      }

      _onSubmit(options, event) {
        event.dataset = this.getFormState();
        if (options.onFormSubmit) {
          options.onFormSubmit(event);
        }
      }

      _onOptionChange(event) {
        this._setIdInputValue(event.dataset.variant);
      }

      _onFormEvent(cb) {
        if (typeof cb === 'undefined') {
          return Function.prototype.bind();
        }

        return function (event) {
          event.dataset = this.getFormState();
          this._setIdInputValue(event.dataset.variant);
          cb(event);
        }.bind(this);
      }

      _initInputs(selector, cb) {
        var elements = Array.prototype.slice.call(this.element.querySelectorAll(selector));

        return elements.map(
          function (element) {
            this._listeners.add(element, 'change', this._onFormEvent(cb));
            return element;
          }.bind(this)
        );
      }

      _serializeInputValues(inputs, transform) {
        return inputs.reduce(function (options, input) {
          if (
            input.checked || // If input is a checked (means type radio or checkbox)
            (input.type !== 'radio' && input.type !== 'checkbox') // Or if its any other type of input
          ) {
            options.push(transform({name: input.name, value: input.value}));
          }

          return options;
        }, []);
      }

      _validateProductObject(product) {
        if (typeof product !== 'object') {
          throw new TypeError(product + ' is not an object.');
        }

        if (typeof product.variants[0].options === 'undefined') {
          throw new TypeError('Product object is invalid. Make sure you use the product object that is output from {{ product | json }} or from the http://[your-product-url].js route');
        }
        return product;
      }
    }

    function fetchProduct(handle) {
      const requestRoute = `${theme.routes.root}products/${handle}.js`;

      return window
        .fetch(requestRoute)
        .then((response) => {
          return response.json();
        })
        .catch((e) => {
          console.error(e);
        });
    }

    const defaults$1 = {
      color: 'ash',
    };

    const selectors$11 = {
      swatch: '[data-swatch]',
      swatchColor: '[data-swatch-color]',
      productBlock: '[data-product-block]',
      productImage: '[data-product-image]',
      productImageSecondary: '[data-product-image-secondary]',
      productImageHover: '[data-product-image-hover]',
      quickView: '[data-button-quick-view]',
      gridImage: '[data-grid-image]',
      link: '[data-grid-link]',
      swatchesMore: '[data-swatches-more]',
      sectionType: '[data-section-type]',
      swatchesContainer: '[data-swatches-container]',
      swatchesLabel: '[data-swatches-label]',
      swatchesButton: '[data-swatches-button]',
      selectorWrapper: '[data-option-position]',
      slider: '[data-slider]',
      selectorVisible: 'selector-wrapper--visible',
      hiddenLabels: '.variant__labels--hide',
    };

    const classes$V = {
      mediaVisible: 'product__media--featured-visible',
      mediaHoverVisible: 'product__media__hover-img--visible',
      noImage: 'swatch__link--no-image',
      noOutline: 'no-outline',
      isVisible: 'is-visible',
      selectorLarge: 'selector-wrapper--large',
    };

    const attributes$L = {
      swatch: 'data-swatch',
      handle: 'data-swatch-handle',
      label: 'data-swatch-label',
      image: 'data-swatch-image',
      imageId: 'data-swatch-image-id',
      variant: 'data-swatch-variant',
      variantId: 'data-variant-id',
      variantSecondaryId: 'data-variant-secondary-id',
      loaded: 'data-loaded',
      href: 'href',
    };

    let swatches = {};
    const sections$H = {};

    class ColorMatch {
      constructor(options = {}) {
        this.settings = {
          ...defaults$1,
          ...options,
        };

        this.match = this.init();
      }

      getColor() {
        return this.match;
      }

      init() {
        const getColors = loadScript({json: theme.assets.swatches});
        return getColors
          .then((colors) => {
            return this.matchColors(colors, this.settings.color);
          })
          .catch((e) => {
            console.log('failed to load swatch colors script');
            console.log(e);
          });
      }

      matchColors(colors, name) {
        let bg = '#E5E5E5';
        let img = null;
        const path = theme.assets.base || '/';
        const comparisonName = name.toLowerCase().replace(/\s/g, '');
        const array = colors.colors;

        if (array) {
          let indexArray = null;

          const hexColorArr = array.filter((colorObj, index) => {
            const neatName = Object.keys(colorObj).toString().toLowerCase().replace(/\s/g, '');

            if (neatName === comparisonName) {
              indexArray = index;

              return colorObj;
            }
          });

          if (hexColorArr.length && indexArray !== null) {
            const value = Object.values(array[indexArray])[0];
            bg = value;

            if (value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png') || value.includes('.svg')) {
              img = `${path}${value}`;
              bg = '#888888';
            }
          }
        }

        return {
          color: this.settings.color,
          path: img,
          hex: bg,
        };
      }
    }

    class Swatch {
      constructor(element) {
        this.element = element;
        this.swatchLink = this.element.nextElementSibling;
        this.colorString = element.getAttribute(attributes$L.swatch);
        this.image = this.element.getAttribute(attributes$L.image);
        this.imageId = this.element.getAttribute(attributes$L.imageId);
        this.variant = this.element.getAttribute(attributes$L.variant);
        this.outer = this.element.closest(selectors$11.productBlock);
        this.hoverImages = [];

        const matcher = new ColorMatch({color: this.colorString});
        matcher.getColor().then((result) => {
          this.colorMatch = result;
          this.init();
        });
      }

      init() {
        this.setStyles();

        if (this.variant && this.outer) {
          this.handleClicks();
        }

        if (!this.image && this.swatchLink) {
          this.swatchLink.classList.add(classes$V.noImage);
        }
      }

      setStyles() {
        const isNativeSwatch = window.theme.settings.colorSwatchesType == 'native';
        if (isNativeSwatch) return;

        if (this.colorMatch && this.colorMatch.hex) {
          this.element.style.setProperty('--swatch', `${this.colorMatch.hex}`);
        }

        if (this.colorMatch && this.colorMatch.path) {
          this.element.style.setProperty('background-image', `url(${this.colorMatch.path})`);
        }
      }

      handleClicks() {
        // Change PGI featured image on swatch click
        this.swatchLink.addEventListener('click', (event) => {
          const isFocusEnabled = !document.body.classList.contains(classes$V.noOutline);
          const variantId = this.swatchLink.getAttribute(attributes$L.variant);

          if (!isFocusEnabled) {
            event.preventDefault();
            this.updateImagesAndLinksOnEvent(variantId);
          }
        });

        this.swatchLink.addEventListener('keyup', (event) => {
          const isFocusEnabled = !document.body.classList.contains(classes$V.noOutline);
          const variantId = this.swatchLink.getAttribute(attributes$L.variant);

          if (event.code !== theme.keyboardKeys.ENTER && event.code !== theme.keyboardKeys.NUMPADENTER) {
            return;
          }

          if (!isFocusEnabled) {
            event.preventDefault();
            this.swatchLink.dispatchEvent(new Event('mouseenter', {bubbles: true}));
            this.updateImagesAndLinksOnEvent(variantId);
          }
        });
      }

      updateImagesAndLinksOnEvent(variantId) {
        this.updateLinks();
        this.replaceImages(variantId);
      }

      updateLinks() {
        this.linkElements = this.outer.querySelectorAll(selectors$11.link);
        this.quickView = this.outer.querySelector(selectors$11.quickView);

        // Update links
        if (this.linkElements.length) {
          this.linkElements.forEach((element) => {
            const destination = getUrlWithVariant(element.getAttribute('href'), this.variant);
            element.setAttribute('href', destination);
          });
        }

        // Change quickview variant with swatch one
        if (this.quickView && theme.settings.quickBuy === 'quick_buy') {
          this.quickView.setAttribute(attributes$L.variantId, this.variant);
        }
      }

      replaceImages(id) {
        const imageSecondary = this.outer.querySelector(`[${attributes$L.variantSecondaryId}="${id}"]`);
        const gridImage = this.outer.querySelector(`[${attributes$L.variantId}="${id}"]`);
        const gridImages = this.outer.querySelectorAll(selectors$11.gridImage);
        const currentGridImage = [...gridImages].find((image) => image.classList.contains(classes$V.mediaVisible));

        // Add new loaded image and sync with the secondary image for smooth animation
        if (gridImage && this.imageId) {
          if (!imageSecondary || !currentGridImage) return;

          const onAnimationEnd = () => {
            requestAnimationFrame(() => {
              currentGridImage.classList.remove(classes$V.mediaVisible);
              gridImage.classList.add(classes$V.mediaVisible);

              requestAnimationFrame(() => {
                imageSecondary.classList.remove(classes$V.mediaVisible);
              });
            });

            imageSecondary.removeEventListener('animationend', onAnimationEnd);
          };

          requestAnimationFrame(() => {
            imageSecondary.classList.add(classes$V.mediaVisible);
          });

          imageSecondary.addEventListener('animationend', onAnimationEnd);
        }

        // Change all hover images classes
        if (theme.settings.productGridHover === 'image') {
          this.hoverImages = this.outer.querySelectorAll(selectors$11.productImageHover);
        }

        if (this.hoverImages.length > 1) {
          this.hoverImages.forEach((hoverImage) => {
            hoverImage.classList.remove(classes$V.mediaHoverVisible);

            if (hoverImage.getAttribute(attributes$L.variantId) === this.variant) {
              hoverImage.classList.add(classes$V.mediaHoverVisible);
            } else {
              this.hoverImages[0].classList.add(classes$V.mediaHoverVisible);
            }
          });
        }
      }
    }

    class GridSwatch extends HTMLElement {
      constructor() {
        super();

        this.handle = this.getAttribute(attributes$L.handle);
        this.label = this.getAttribute(attributes$L.label).trim().toLowerCase();

        fetchProduct(this.handle).then((product) => {
          this.product = product;
          this.colorOption = product.options.find((element) => {
            return element.name.toLowerCase() === this.label || null;
          });

          if (this.colorOption) {
            this.swatches = this.colorOption.values;
            this.init();
          }
        });
      }

      init() {
        this.swatchElements = this.querySelectorAll(selectors$11.swatch);

        this.swatchElements.forEach((el) => {
          new Swatch(el);
        });

        this.handleShowMore();
      }

      handleShowMore() {
        this.initialHeight = this.offsetHeight;
        this.expandedHeight = this.initialHeight;
        const section = this.closest(selectors$11.sectionType);
        const moreLink = this.querySelector(selectors$11.swatchesMore);

        if (!moreLink) return;

        moreLink?.addEventListener('click', () => {
          this.classList.add(classes$V.isVisible);
        });

        section?.addEventListener('touchstart', (e) => {
          if (!this.contains(e.target)) {
            this.classList.remove(classes$V.isVisible);
            this.dispatchEvent(new Event('mouseleave', {bubbles: true}));
          }
        });

        this.addEventListener('mouseenter', () => {
          const onAnimationStart = (event) => {
            this.expandedHeight = this.offsetHeight;
            const slider = event.target.closest(selectors$11.slider);
            const heightDiffers = this.expandedHeight > this.initialHeight;

            if (heightDiffers && slider) {
              requestAnimationFrame(() => slider.dispatchEvent(new CustomEvent('theme:slider:resize', {bubbles: false})));
            }

            this.removeEventListener('animationstart', onAnimationStart);
          };

          this.addEventListener('animationstart', onAnimationStart);
        });

        this.addEventListener('mouseleave', () => {
          const onAnimationStart = (event) => {
            const slider = event.target.closest(selectors$11.slider);
            const heightDiffers = this.expandedHeight > this.initialHeight;

            if (heightDiffers && slider) {
              requestAnimationFrame(() => slider.dispatchEvent(new CustomEvent('theme:slider:resize', {bubbles: false})));
            }

            this.removeEventListener('animationstart', onAnimationStart);
          };

          this.addEventListener('animationstart', onAnimationStart);
        });
      }
    }

    class SwatchesContainer {
      constructor(container) {
        this.container = container;
        this.swatchesContainers = this.container.querySelectorAll(selectors$11.swatchesContainer);

        this.swatchesContainers.forEach((swatchesContainer) => {
          this.checkSwatchesHeightOnResize = () => this.checkSwatchesHeight(swatchesContainer);
          this.checkSwatchesHeight(swatchesContainer);
          document.addEventListener('theme:resize:width', this.checkSwatchesHeightOnResize);
        });
      }

      checkSwatchesHeight(swatchesContainer) {
        const label = swatchesContainer.querySelector(selectors$11.swatchesLabel);
        const hiddenLabels = Boolean(label.closest(selectors$11.hiddenLabels));
        const labelHeight = hiddenLabels ? 1 : label.offsetHeight; // 1px due to CSS Safari fix
        const swatch = swatchesContainer.querySelector(selectors$11.swatchesButton);
        const containerPaddingTop = parseInt(window.getComputedStyle(swatchesContainer).getPropertyValue('padding-top'));
        const labelMargin = hiddenLabels ? 0 : parseInt(window.getComputedStyle(label).getPropertyValue('margin-bottom'));
        const swatchMargin = parseInt(window.getComputedStyle(swatch).getPropertyValue('margin-bottom'));
        const selectorWrapper = swatchesContainer.closest(selectors$11.selectorWrapper);

        selectorWrapper.classList.remove(classes$V.selectorLarge, classes$V.selectorVisible);
        swatchesContainer.style.removeProperty('--swatches-max-height');

        requestAnimationFrame(() => {
          if (swatchesContainer.offsetHeight - containerPaddingTop > labelHeight + labelMargin + swatch.offsetHeight * 2 + swatchMargin * 2) {
            swatchesContainer.style.setProperty('--swatches-max-height', `${swatchesContainer.offsetHeight}px`);
            selectorWrapper.classList.add(classes$V.selectorLarge);
          }
        });
      }

      onUnload() {
        this.swatchesContainers.forEach((swatchesContainer) => {
          document.removeEventListener('theme:resize:width', this.checkSwatchesHeightOnResize);
        });
      }
    }

    const makeSwatches = (container) => {
      swatches = [];
      const els = container.querySelectorAll(selectors$11.swatch);
      els.forEach((el) => {
        swatches.push(new Swatch(el));
      });
    };

    const swatchSection = {
      onLoad() {
        makeSwatches(this.container);
      },
    };

    const swatchesContainer = {
      onLoad() {
        sections$H[this.id] = new SwatchesContainer(this.container);
      },
      onUnload() {
        sections$H[this.id].onUnload();
      },
    };

    const selectors$10 = {
      popupProduct: '[data-product]',
      popupClose: '[data-popup-close]',
    };

    const classes$U = {
      quickViewVisible: 'js-quick-view-visible',
    };

    const sections$G = {};

    class ProductGrid {
      constructor(container) {
        this.container = container;
        this.body = document.body;

        new QuickViewPopup(this.container);
      }

      /**
       * Quickview popup close function
       */
      popupClose() {
        const popupProduct = document.querySelector(selectors$10.popupProduct);
        if (popupProduct) {
          const popupClose = popupProduct.querySelector(selectors$10.popupClose);
          popupClose.dispatchEvent(new Event('click'));
        }
      }

      /**
       * Event callback for Theme Editor `shopify:block:select` event
       */
      onBlockSelect() {
        if (this.body.classList.contains(classes$U.quickViewVisible)) {
          this.popupClose();
        }
      }

      /**
       * Event callback for Theme Editor `shopify:section:deselect` event
       */
      onDeselect() {
        if (this.body.classList.contains(classes$U.quickViewVisible)) {
          this.popupClose();
        }
      }

      /**
       * Event callback for Theme Editor `shopify:section:unload` event
       */
      onUnload() {
        if (this.body.classList.contains(classes$U.quickViewVisible)) {
          this.popupClose();
        }
      }
    }

    const productGrid = {
      onLoad() {
        sections$G[this.id] = new ProductGrid(this.container);
      },
      onBlockSelect() {
        sections$G[this.id].onBlockSelect();
      },
      onDeselect() {
        sections$G[this.id].onDeselect();
      },
      onUnload() {
        sections$G[this.id].onUnload();
      },
    };

    const selectors$$ = {
      ajaxinateContainer: '#AjaxinateLoop',
      ajaxinatePagination: '#AjaxinatePagination',
      productItem: '[data-product-block]',
      promo: '[data-promo]',
    };

    const attributes$K = {
      ajaxinateId: 'data-ajaxinate-id',
      columnsTablet: 'data-columns-tablet',
      columnsMobile: 'data-columns-mobile',
    };

    const classes$T = {
      isLoaded: 'is-loaded',
      loadedItem: 'loaded-item',
      promoFull: 'collection-promo--full',
      promoTwoColumns: 'collection-promo--two-columns',
      promoGridSecond: 'collection-promo--grid-second',
      promoGridThird: 'collection-promo--grid-third',
      promoGridEven: 'collection-promo--grid-even',
      promoOneColumn: 'collection-promo--one-column',
    };

    let sections$F = {};

    class Ajaxify {
      constructor(container) {
        this.container = container;
        this.endlessScroll = [];

        if (theme.settings.enableInfinityScroll) {
          this.init();
        }
      }

      init() {
        this.loadMoreFix();

        this.ajaxinateContainer = this.container.querySelectorAll(selectors$$.ajaxinateContainer);

        this.ajaxinateContainer.forEach((element) => {
          const ajaxinateContainer = `${selectors$$.ajaxinateContainer}[${attributes$K.ajaxinateId}="${element.dataset.ajaxinateId}"]`;
          const ajaxinatePagination = `${selectors$$.ajaxinatePagination}[${attributes$K.ajaxinateId}="${element.dataset.ajaxinateId}"]`;
          const hasChildren = element.children.length > 0;

          if (hasChildren) {
            const endlessScroll = new Ajaxinate({
              container: ajaxinateContainer,
              pagination: ajaxinatePagination,
              method: 'scroll',
            });

            const promos = element.querySelectorAll(selectors$$.promo);
            const columnsTablet = Number(element.getAttribute(attributes$K.columnsTablet));
            const columnsMobile = Number(element.getAttribute(attributes$K.columnsMobile));

            if (columnsTablet >= 3) {
              let tabletCounter = 0;
              promos.forEach((promo) => {
                if (promo.classList.contains(classes$T.promoFull)) {
                  if (promo.classList.contains(classes$T.promoGridThird)) {
                    tabletCounter += 1;
                  } else if (promo.classList.contains(classes$T.promoGridSecond)) {
                    tabletCounter += 2;
                  } else {
                    tabletCounter += 3;
                  }
                } else if (promo.classList.contains(classes$T.promoTwoColumns)) {
                  if (promo.classList.contains(classes$T.promoGridThird)) {
                    tabletCounter += 1;
                  } else {
                    tabletCounter += 2;
                  }
                } else {
                  tabletCounter += 1;
                }
              });

              if (tabletCounter > 0) {
                let emptySpacesTablet = columnsTablet - (tabletCounter % columnsTablet);
                if (emptySpacesTablet === columnsTablet) {
                  emptySpacesTablet = 0;
                }
                element.classList.add(`grid--empty-items-tablet-${emptySpacesTablet}`);
              }
            }

            if (columnsMobile === 2) {
              let mobileCounter = 0;
              promos.forEach((promo) => {
                if (promo.classList.contains(classes$T.promoGridEven) || promo.classList.contains(classes$T.promoOneColumn)) {
                  mobileCounter += 1;
                }
              });

              if (mobileCounter > 0) {
                let emptySpacesMobile = columnsMobile - (mobileCounter % columnsMobile);
                if (emptySpacesMobile === columnsMobile) {
                  emptySpacesMobile = 0;
                }
                element.classList.add(`grid--empty-items-mobile-${emptySpacesMobile}`);
              }
            }

            element.classList.add(classes$T.isLoaded);

            this.endlessScroll.push(endlessScroll);
          }
        });
      }

      update(id) {
        // Get the elements again, since fetching contents from Filtering or Tabs bring newly rendered DOM elements
        this.ajaxinateContainer = this.container.querySelectorAll(selectors$$.ajaxinateContainer);

        const instanceIDMatch = (instance) => instance.settings.container === id;
        const elementIDMatch = (element) => `${selectors$$.ajaxinateContainer}[${attributes$K.ajaxinateId}="${element.dataset.ajaxinateId}"]` === id;

        // Compare `Ajaxinate` instances, destroy already initialised ones and remove them from `this.endlessScroll` array
        const instanceExists = this.endlessScroll.find(instanceIDMatch);
        if (instanceExists) {
          const index = this.endlessScroll.findIndex(instanceIDMatch);
          this.endlessScroll.splice(index, 1);
          // Revert back the method from 'click' to 'scroll' to prevent Ajaxinate JS errors with removing event listeners on destroy
          instanceExists.settings.method = 'scroll';
          instanceExists.destroy();
        }

        // Find whether the DOM elements match the ID passed to the `update()` method and init new `Ajaxinate` instance
        const element = [...this.ajaxinateContainer].find(elementIDMatch);

        if (!element) return;

        const ajaxinateContainer = `${selectors$$.ajaxinateContainer}[${attributes$K.ajaxinateId}="${element.dataset.ajaxinateId}"]`;
        const ajaxinatePagination = `${selectors$$.ajaxinatePagination}[${attributes$K.ajaxinateId}="${element.dataset.ajaxinateId}"]`;
        const hasChildren = element.children.length > 0;

        if (!hasChildren) return;

        const endlessScroll = new Ajaxinate({
          container: ajaxinateContainer,
          pagination: ajaxinatePagination,
          method: 'scroll',
        });

        element.classList.add(classes$T.isLoaded);
        this.endlessScroll.push(endlessScroll);
      }

      loadMoreFix() {
        // Fix ajaxinate in theme editor
        Ajaxinate.prototype.loadMore = function loadMore() {
          this.request = new XMLHttpRequest();

          this.request.onreadystatechange = function success() {
            if (!this.request.responseXML) {
              return;
            }
            if (!this.request.readyState === 4 || !this.request.status === 200) {
              return;
            }

            const newContainer = this.request.responseXML.querySelector(this.settings.container);
            const newPagination = this.request.responseXML.querySelector(this.settings.pagination);

            // Add .loaded-item class to newly added items
            const newProducts = newContainer.querySelectorAll(selectors$$.productItem);
            newProducts.forEach((item) => item.classList.add(classes$T.loadedItem));

            this.containerElement.insertAdjacentHTML('beforeend', newContainer.innerHTML);

            if (typeof newPagination === 'undefined' || newPagination === null) {
              this.removePaginationElement();
            } else {
              this.paginationElement.innerHTML = newPagination.innerHTML;

              if (this.settings.callback && typeof this.settings.callback === 'function') {
                this.settings.callback(this.request.responseXML);
              }

              this.initialize();
            }
          }.bind(this);

          this.request.open('GET', this.nextPageUrl, true);
          this.request.responseType = 'document';
          this.request.send();
        };
      }

      unload() {
        if (this.endlessScroll.length > 0) {
          this.endlessScroll.forEach((instance) => {
            instance.settings.method = 'scroll';
            instance.destroy();
          });
          this.ajaxinateContainer.forEach((element) => element.classList.remove(classes$T.isLoaded));
        }
      }
    }

    const ajaxify = {
      onLoad() {
        sections$F = new Ajaxify(this.container);
      },
      onUnload: function () {
        if (typeof sections$F.unload === 'function') {
          sections$F.unload();
        }
      },
    };

    const settings$8 = {
      loadingTimeout: 300,
    };

    const selectors$_ = {
      buttons: 'button',
      toggleFilters: '[data-toggle-filters]',
      closeFilters: '[data-close-filters]',
      openFilters: '[data-open-filters]',
      collectionWrapper: '[data-collection-wrapper]',
      collapsibleTrigger: '[data-collapsible-trigger]',
      sortToggle: '[data-sort-toggle]',
      collectionSortOptions: '[data-collection-sort-options]',
      inputs: 'input, select, label, textarea',
      inputSort: '[data-input-sort]',
      filters: '[data-collection-filters]',
      filtersWrapper: '[data-collection-filters-wrapper]',
      filtersList: '[data-collection-filters-list]',
      filtersStickyBar: '[data-collection-sticky-bar]',
      filter: '[data-collection-filter]',
      filterTag: '[data-collection-filter-tag]',
      filterTagButton: '[data-collection-filter-tag-button]',
      filtersForm: '[data-collection-filters-form]',
      filterResetButton: '[data-filter-reset-button]',
      filterTagClearButton: '[data-filter-tag-reset-button]',
      popupsSection: '[data-section-type="popups"]',
      productGrid: '[data-collection-products]',
      productsCount: '[data-products-count]',
      priceMin: '[data-field-price-min]',
      priceMax: '[data-field-price-max]',
      rangeMin: '[data-se-min-value]',
      rangeMax: '[data-se-max-value]',
      rangeMinValue: 'data-se-min-value',
      rangeMaxValue: 'data-se-max-value',
      rangeMinDefault: 'data-se-min',
      rangeMaxDefault: 'data-se-max',
      tooltip: '[data-tooltip]',
      tooltipContainer: '[data-tooltip-container]',
      showMore: '[data-show-more]',
      showMoreActions: '[data-show-more-actions]',
      showMoreContainer: '[data-show-more-container]',
      showMoreTrigger: '[data-show-more-trigger]',
      searchPerformed: '[data-search-performed]',
      searchForm: '[data-search-form]',
      scrollable: '[data-custom-scrollbar]',
    };

    const classes$S = {
      isActive: 'is-active',
      isExpanded: 'is-expanded',
      isVisible: 'is-visible',
      isLoading: 'is-loading',
      popupVisible: 'popup--visible',
      collectionFiltersVisible: 'collection__filters--visible',
      collectionSortOptionWrapperVisible: 'collection__sort__option-wrapper--visible',
      hidden: 'is-hidden',
    };

    const attributes$J = {
      filterActive: 'data-filter-active',
      preventScrollLock: 'data-prevent-scroll-lock',
      filtersDefaultState: 'data-filters-default-state',
      tabIndex: 'tabindex',
      ariaExpanded: 'aria-expanded',
      currentType: 'data-current-type',
    };

    const sections$E = {};

    class Filters {
      constructor(container) {
        this.container = container;
        this.sectionId = container.dataset.sectionId;
        this.enableFilters = container.dataset.enableFilters === 'true';
        this.enableSorting = container.dataset.enableSorting === 'true';
        this.filterMode = container.dataset.filterMode;
        this.collectionHandle = this.container.dataset.collection;
        this.isSearchPage = container.closest(selectors$_.searchPerformed) != null;
        this.productGrid = this.container.querySelector(selectors$_.productGrid);
        this.productsCount = this.container.querySelector(selectors$_.productsCount);
        this.groupTagFilters = this.container.querySelectorAll(selectors$_.filter);
        this.filters = this.container.querySelector(selectors$_.filters);
        this.filterTriggers = this.container.querySelectorAll(selectors$_.collapsibleTrigger);
        this.filtersStickyBar = this.container.querySelector(selectors$_.filtersStickyBar);
        this.filtersForm = this.container.querySelector(selectors$_.filtersForm);
        this.inputSort = this.container.querySelectorAll(selectors$_.inputSort);
        this.sortToggle = this.container.querySelector(selectors$_.sortToggle);
        this.collectionSortOptions = this.container.querySelector(selectors$_.collectionSortOptions);
        this.a11y = a11y;
        this.filterData = [];
        this.rangeSlider = null;
        this.sortDropdownEvent = () => this.sortDropdownToggle();
        this.onTabHandlerEvent = (event) => this.onTabHandler(event);
        this.updateCollectionFormSortEvent = (event) => this.updateCollectionFormSort(event);
        this.bodyClickEvent = (event) => this.bodyClick(event);
        this.onFilterResetClick = this.onFilterResetClick.bind(this);
        this.onFilterTagResetClick = this.onFilterTagResetClick.bind(this);
        this.onFilterTagClearClick = this.onFilterTagClearClick.bind(this);
        this.onFilterToggleClick = this.onFilterToggleClick.bind(this);
        this.onKeyUpHandler = this.onKeyUpHandler.bind(this);
        this.updateRangeEvent = this.updateRange.bind(this);
        this.debouncedSubmitEvent = debounce((event) => {
          this.onSubmitHandler(event);
        }, 500);
        this.debouncedSortEvent = debounce((event) => {
          this.onSortChange(event);
        }, 500);
        this.productGridEvents = {};

        if (this.filters) {
          this.hideFiltersDrawer = this.hideFiltersDrawer.bind(this);
          this.showFiltersDrawer = this.showFiltersDrawer.bind(this);
          this.resizeEvent = debounce(() => {
            this.filtersResizeEvents();
          }, 500);
          this.filtersResizeEvents();
          document.addEventListener('theme:resize:width', this.resizeEvent);
        }

        this.initTagFilters();
        this.initFacetedFilters();
        this.bindToggleButtonsEvents();
        this.bindFilterButtonsEvents();
        this.initProductGridEvents(theme.settings.enableInfinityScroll);

        makeSwatches(this.container);
        this.collapsible = new Collapsible(this.container);

        // Update css variable for collection sticky bar height
        setVars();

        window.addEventListener('popstate', this.onHistoryChange.bind(this));

        this.sortToggle?.addEventListener('click', this.sortDropdownEvent);

        document.addEventListener('click', this.bodyClickEvent);

        this.filterShowMore();
      }

      /*
       * Init faceted filters
       */
      initFacetedFilters() {
        if (this.filterMode == 'tag' || this.filterMode == 'group' || !this.enableFilters) {
          return;
        }

        this.rangeSlider = new RangeSlider(this.container);
      }

      /*
       * Init tooltips for swatches
       */
      initTooltips() {
        this.tooltips = this.container.querySelectorAll(selectors$_.tooltip);

        if (window.innerWidth < theme.sizes.small) {
          this.tooltips = this.productGrid?.querySelectorAll(selectors$_.tooltip);
        }

        this.tooltips?.forEach((tooltip) => {
          new Tooltip(tooltip);
        });

        this.handleVisibleTooltips();
      }

      handleVisibleTooltips() {
        if (this.tooltips.length > 0) {
          const tooltipTarget = document.querySelector(selectors$_.tooltipContainer);
          if (tooltipTarget.classList.contains(classes$S.isVisible)) {
            tooltipTarget.classList.remove(classes$S.isVisible);
          }
        }
      }

      /*
       * Price range slider update
       */
      updateRange() {
        const rangeMin = this.filtersForm.querySelector(selectors$_.rangeMin);
        const rangeMax = this.filtersForm.querySelector(selectors$_.rangeMax);
        const priceMin = this.filtersForm.querySelector(selectors$_.priceMin);
        const priceMax = this.filtersForm.querySelector(selectors$_.priceMax);

        if (rangeMin.hasAttribute(selectors$_.rangeMinValue) && rangeMax.hasAttribute(selectors$_.rangeMaxValue)) {
          const priceMinValue = parseFloat(priceMin.placeholder, 10);
          const priceMaxValue = parseFloat(priceMax.placeholder, 10);
          const rangeMinValue = parseFloat(rangeMin.getAttribute(selectors$_.rangeMinValue), 10);
          const rangeMaxValue = parseFloat(rangeMax.getAttribute(selectors$_.rangeMaxValue), 10);

          if (priceMinValue !== rangeMinValue || priceMaxValue !== rangeMaxValue) {
            priceMin.value = parseInt(rangeMinValue);
            priceMax.value = parseInt(rangeMaxValue);

            this.filtersForm.dispatchEvent(new Event('input', {bubbles: true}));
          }
        }
      }

      /*
       * Render product grid and filters on form submission
       */
      onSubmitHandler(event) {
        event.preventDefault();
        const formData = new FormData(this.filtersForm);
        const searchParams = new URLSearchParams(formData);
        const deleteParams = [];
        let searchParamsString = '';

        if (this.isSearchPage) {
          this.searchForm = this.container.querySelector(selectors$_.searchForm);
          this.currentType = this.container.getAttribute(attributes$J.currentType);
        }

        // if submitted price equal to price range min and max remove price parameters
        const rangeMin = this.filtersForm.querySelector(selectors$_.rangeMin);
        const rangeMax = this.filtersForm.querySelector(selectors$_.rangeMax);
        const priceMin = this.filtersForm.querySelector(selectors$_.priceMin);
        const priceMax = this.filtersForm.querySelector(selectors$_.priceMax);
        const checkElements = rangeMin && rangeMax && priceMin && priceMax;

        if (checkElements && rangeMin.hasAttribute(selectors$_.rangeMinDefault) && rangeMax.hasAttribute(selectors$_.rangeMaxDefault)) {
          const rangeMinDefault = parseFloat(rangeMin.getAttribute(selectors$_.rangeMinDefault), 10);
          const rangeMaxDefault = parseFloat(rangeMax.getAttribute(selectors$_.rangeMaxDefault), 10);
          const priceMinValue = !priceMin.value ? rangeMinDefault : parseFloat(priceMin.value, 10);
          const priceMaxValue = !priceMax.value ? rangeMaxDefault : parseFloat(priceMax.value, 10);

          if (priceMinValue <= rangeMinDefault && priceMaxValue >= rangeMaxDefault) {
            deleteParams.push('filter.v.price.gte');
            deleteParams.push('filter.v.price.lte');
            searchParams.delete('filter.v.price.gte');
            searchParams.delete('filter.v.price.lte');
          }
        }

        searchParamsString = searchParams.toString();

        if (this.isSearchPage) {
          searchParamsString = getSearchParams(this.searchForm, this.filtersForm, deleteParams);

          let typeString = '';
          if (this.currentType === 'all') typeString = '&type=product';
          if (searchParamsString.indexOf('&type=product') > -1) typeString = '';
          searchParamsString += typeString;
        }

        this.renderSection(searchParamsString, event);
      }

      /*
       * Call renderSection on history change
       */
      onHistoryChange(event) {
        if (!this.filters) return;

        let searchParams = event.state?.searchParams || '';

        if (this.isSearchPage) {
          if (!event.state) searchParams = window.location.search;
          const shouldRenderSearchResults = searchParams.indexOf('type=product') > -1;

          if (!shouldRenderSearchResults) return;
        }

        this.renderSection(searchParams, null, false);
      }

      /*
       * Render section on history change or filter/sort change event
       */
      renderSection(searchParams, event, updateURLHash = true) {
        this.startLoading();
        const url = `${window.location.pathname}?section_id=${this.sectionId}&${searchParams}`;
        const filterDataUrl = (element) => element.url === url;
        this.filterData.some(filterDataUrl) ? this.renderSectionFromCache(filterDataUrl, event) : this.renderSectionFromFetch(url, event);

        if (updateURLHash) {
          this.updateURLHash(searchParams);
        }
      }

      /*
       * Render section from fetch call
       */
      renderSectionFromFetch(url) {
        fetch(url)
          .then((response) => response.text())
          .then((responseText) => {
            const html = responseText;
            this.filterData = [...this.filterData, {html, url}];
            this.inputSort = this.container.querySelectorAll(selectors$_.inputSort);
            this.renderFilters(html);
            this.bindFilterButtonsEvents();
            this.hideFiltersOnMobile();
            this.renderProductGrid(html);
            this.updateProductsCount(html);
            this.finishLoading();
            this.mobileFiltersScrollLock();
            this.handleSearchPageActiveTab();
          });
      }

      /*
       * Render section from Cache
       */
      renderSectionFromCache(filterDataUrl, event) {
        const html = this.filterData.find(filterDataUrl).html;
        this.renderFilters(html, event);
        this.hideFiltersOnMobile();
        this.renderProductGrid(html);
        this.updateProductsCount(html);
        this.finishLoading();
        this.mobileFiltersScrollLock();
        this.handleSearchPageActiveTab();
      }

      handleSearchPageActiveTab() {
        if (!this.isSearchPage) return;

        this.scrollable = this.container.querySelector(selectors$_.scrollable);
        if (!this.scrollable || this.customScrollbar) return;
        this.customScrollbar = new CustomScrollbar(this.container);
      }

      /*
       * Render product grid items on fetch call
       */
      renderProductGrid(html) {
        const newProductGrid = new DOMParser().parseFromString(html, 'text/html').querySelector(selectors$_.productGrid);

        if (!newProductGrid) {
          return;
        }

        this.productGrid.innerHTML = newProductGrid.innerHTML;

        this.initProductGridEvents(theme.settings.enableInfinityScroll);
        this.filterShowMore();
      }

      /*
       * Update total number of products on fetch call
       */
      updateProductsCount(html) {
        const newProductsCount = new DOMParser().parseFromString(html, 'text/html').querySelector(selectors$_.productsCount);

        if (!newProductsCount) {
          return;
        }

        this.productsCount.innerHTML = newProductsCount.innerHTML;
      }

      /*
       * Render filters on fetch call
       */
      renderFilters(html) {
        const newFilters = new DOMParser().parseFromString(html, 'text/html').querySelector(selectors$_.filters);

        if (!newFilters) {
          return;
        }

        this.filters.innerHTML = newFilters.innerHTML;
        this.filtersForm = document.querySelector(selectors$_.filtersForm);
        this.bindFilterButtonsEvents();
        this.bindToggleButtonsEvents();
        makeSwatches(this.container);
        this.collapsible = new Collapsible(this.container);

        // Init price range slider
        document.dispatchEvent(new CustomEvent('theme:filters:init', {bubbles: true}));
      }

      /*
       * Update URL when filter/sort is changed
       */
      updateURLHash(searchParams) {
        history.pushState({searchParams}, '', `${window.location.pathname}${searchParams && '?'.concat(searchParams)}`);
      }

      /*
       * Bind filter buttons events
       */
      bindFilterButtonsEvents() {
        if (this.inputSort.length > 0) {
          this.inputSort.forEach((input) => {
            input.addEventListener('change', this.updateCollectionFormSortEvent);
          });
        }

        if (this.filtersForm) {
          this.filtersForm.addEventListener('input', this.debouncedSubmitEvent.bind(this));

          this.filtersForm.addEventListener('theme:filter:range-update', this.updateRangeEvent);
        }

        if (this.collectionSortOptions) {
          this.collectionSortOptions.addEventListener('keyup', this.onTabHandlerEvent);
        }

        if (this.filterMode == 'tag' || this.filterMode == 'group' || !this.enableFilters) {
          return;
        }

        this.container.querySelectorAll(selectors$_.filterResetButton).forEach((button) => {
          button.addEventListener('click', this.onFilterResetClick, {once: true});
        });
      }

      /*
       * Render products on specific filter click event
       */
      onFilterResetClick(event) {
        event.preventDefault();
        this.renderSection(new URL(event.currentTarget.href).searchParams.toString());
      }

      /*
       * Bind filter title click events to toggle options visibility
       */
      bindToggleButtonsEvents() {
        this.container.querySelectorAll(selectors$_.toggleFilters).forEach((button) => {
          button.addEventListener('click', this.onFilterToggleClick);
        });
        this.container.querySelectorAll(selectors$_.closeFilters).forEach((button) => {
          button.addEventListener('click', this.hideFiltersDrawer);
        });
        this.container.querySelectorAll(selectors$_.openFilters).forEach((button) => {
          button.addEventListener('click', this.showFiltersDrawer);
        });

        this.container.querySelector(selectors$_.collectionWrapper)?.addEventListener('keyup', this.onKeyUpHandler);
      }

      onTabHandler(event) {
        if (event.code === theme.keyboardKeys.SPACE || event.code === theme.keyboardKeys.ENTER || event.code === theme.keyboardKeys.NUMPADENTER) {
          const newSortValue = event.target.previousElementSibling.value;

          this.filtersForm.querySelectorAll(selectors$_.inputSort).forEach((input) => {
            if (input.checked) {
              input.checked = false;
            }
            if (input.value === newSortValue) {
              input.checked = true;
            }
          });

          this.filtersForm.dispatchEvent(new Event('input', {bubbles: true}));
          event.target.dispatchEvent(new Event('click', {bubbles: true}));
        }
      }

      /*
       * Event handler on user ESC key press
       */
      onKeyUpHandler(event) {
        if (event.code === theme.keyboardKeys.ESCAPE) {
          this.hideFiltersDrawer();
        }
      }

      /*
       * Toggle filter options on title click
       */
      onFilterToggleClick(event) {
        event.preventDefault();
        setVars(); // Update css variables for correct filters drawer height

        const filtersVisible = this.filters.classList.contains(classes$S.collectionFiltersVisible);

        filtersVisible ? this.hideFiltersDrawer() : this.showFiltersDrawer();
      }

      sortDropdownToggle() {
        if (!this.collectionSortOptions) return;

        this.collectionSortOptions.classList.toggle(classes$S.collectionSortOptionWrapperVisible);
      }

      /*
       * Close the sort dropdown on button click outside the dropdown (for desktop)
       */
      bodyClick(event) {
        if (!this.collectionSortOptions) return;

        const isSortBar = this.sortToggle.contains(event.target);
        const isVisible = this.collectionSortOptions.classList.contains(classes$S.collectionSortOptionWrapperVisible);

        if (isVisible && !isSortBar) {
          this.sortDropdownToggle();
        }
      }

      updateCollectionFormSort(event) {
        const target = event.target;
        const newSortValue = target.value;
        const secondarySortBy = target.closest(selectors$_.collectionSortOptions);

        this.container.querySelectorAll(selectors$_.inputSort).forEach((input) => {
          if (input.value === newSortValue) {
            input.checked = true;
          }
        });

        if (secondarySortBy !== null) {
          this.filtersForm.dispatchEvent(new Event('input', {bubbles: true}));
        }
      }

      /*
       * Scroll down and open collection filters if they are hidden
       */
      showFiltersDrawer() {
        const instance = this;

        this.a11y.state.trigger = document.querySelector(selectors$_.toggleFilters);

        // Trap focus
        this.a11y.trapFocus({
          container: instance.filters,
        });

        this.mobileFiltersScrollLock();
      }

      /*
       * Scroll lock activation for filters drawer (on mobile)
       */
      mobileFiltersScrollLock() {
        // Open filters and scroll lock if only they are hidden on lower sized screens
        if (window.innerWidth < theme.sizes.small) {
          const scrollableElement = document.querySelector(selectors$_.filtersList);

          if (!this.filters.classList.contains(classes$S.collectionFiltersVisible)) {
            this.filters.classList.add(classes$S.collectionFiltersVisible);
          }

          document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: scrollableElement}));
        }
      }

      /*
       * Hide filter accordion elements on mobile
       */
      hideFiltersOnMobile() {
        const filterTriggers = this.container.querySelectorAll(`${selectors$_.collapsibleTrigger}:not(${selectors$_.showMoreTrigger})`);

        if (window.innerWidth < theme.sizes.small) {
          requestAnimationFrame(() => {
            filterTriggers.forEach((element) => {
              const isFilterActive = element.getAttribute(attributes$J.filterActive) === 'true';

              if (element.classList.contains(classes$S.isExpanded) && !isFilterActive) {
                element.dispatchEvent(new Event('click'));
              }
            });
          });
        }
      }

      /*
       * Show filter accordion elements on desktop if they should be opened by default
       */
      showFiltersOnDesktop() {
        const filterTriggers = this.container.querySelectorAll(`${selectors$_.collapsibleTrigger}:not(${selectors$_.showMoreTrigger})`);

        // "Default filter layout" states
        const filtersDefaultState = this.container.getAttribute(attributes$J.filtersDefaultState);
        const openFirstFilterOnly = filtersDefaultState === 'first-open';
        const openAllFilters = filtersDefaultState === 'open';
        const closeAllFilters = filtersDefaultState === 'closed';
        // When sorting is enabled the first `${filterTrigger}` element on mobile is a 'Sort by' button
        const firstTriggerIndex = this.enableSorting ? 1 : 0;

        filterTriggers.forEach((element, index) => {
          const isCurrentFilterExpanded = element.classList.contains(classes$S.isExpanded);
          const isCurrentFilterActive = element.getAttribute(attributes$J.filterActive) === 'true';
          // 'first-open' state conditions
          const isFirstClosed = !isCurrentFilterExpanded && index === firstTriggerIndex;
          const allElseExpanded = isCurrentFilterExpanded && index !== firstTriggerIndex;
          const shouldOpenFirst = openFirstFilterOnly && isFirstClosed;
          const shouldCloseAllExceptFirst = openFirstFilterOnly && allElseExpanded;
          // 'open' state conditions
          const shouldOpenAllClosedOnes = openAllFilters && !isCurrentFilterExpanded;
          const shouldOpenActiveOnes = isCurrentFilterActive && !isCurrentFilterExpanded && openAllFilters;
          // 'close' state conditions
          const shouldCloseExpandedOnes = closeAllFilters && isCurrentFilterExpanded;

          if (isCurrentFilterActive && !shouldOpenActiveOnes) return;

          if (shouldCloseExpandedOnes || shouldOpenFirst || shouldCloseAllExceptFirst || shouldOpenAllClosedOnes || shouldOpenActiveOnes) {
            element.dispatchEvent(new Event('click'));
          }
        });
      }

      /*
       * Hide filters drawer
       */
      hideFiltersDrawer() {
        let filtersVisible = this.filters.classList.contains(classes$S.collectionFiltersVisible);
        let loading = this.container.classList.contains(classes$S.isLoading);

        if (filtersVisible) {
          this.filters.classList.remove(classes$S.collectionFiltersVisible);
          this.a11y.removeTrapFocus();
        }

        // Enable page scroll if no loading state
        if (!loading) {
          document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true, detail: settings$8.loadingTimeout}));
        }
      }

      /*
       * Hiding the filters drawer on desktop & hiding the filters on mobile (showing only filter title)
       */
      filtersResizeEvents() {
        if (window.innerWidth >= theme.sizes.small) {
          this.showFiltersOnDesktop();
          this.hideFiltersDrawer();
        } else {
          this.hideFiltersOnMobile();
        }
      }

      /*
       * Show more functionality
       */
      filterShowMore() {
        this.showMore = this.container.querySelectorAll(selectors$_.showMore);
        if (this.showMore.length === 0) return;

        this.showMore.forEach((element) => {
          const filterCollapsibleTrigger = element.querySelector(selectors$_.collapsibleTrigger);
          const showMoreActions = element.querySelector(selectors$_.showMoreActions);

          if (!showMoreActions) return;

          const showMoreTrigger = showMoreActions.querySelector(selectors$_.showMoreTrigger);
          const showMoreContainer = showMoreActions.querySelector(selectors$_.showMoreContainer);
          const focusable = showMoreContainer.querySelectorAll(window.theme.focusable);
          const isShowMoreContainerExpanded = showMoreContainer.getAttribute(attributes$J.ariaExpanded) === 'true';

          if (!isShowMoreContainerExpanded) {
            focusable.forEach((item) => {
              item.setAttribute(attributes$J.tabIndex, '-1');
            });
          }

          showMoreTrigger.addEventListener('keyup', (event) => {
            if (event.code === theme.keyboardKeys.SPACE || event.code === theme.keyboardKeys.ENTER || event.code === theme.keyboardKeys.NUMPADENTER) {
              this.updateShowMoreFocusableElements(event, focusable);
            }
          });
          showMoreTrigger.addEventListener('click', (event) => {
            this.updateShowMoreFocusableElements(event, focusable);
          });

          filterCollapsibleTrigger.addEventListener('keyup', (event) => {
            if (event.code === theme.keyboardKeys.SPACE || event.code === theme.keyboardKeys.ENTER || event.code === theme.keyboardKeys.NUMPADENTER) {
              this.updateCollapsedContainerFocusableElements(filterCollapsibleTrigger, showMoreTrigger, focusable);
            }
          });
          filterCollapsibleTrigger.addEventListener('click', () => {
            this.updateCollapsedContainerFocusableElements(filterCollapsibleTrigger, showMoreTrigger, focusable);
          });
        });
      }

      /*
       * A11y: Update tabindex for all focusable elements in show-more collapsible containers,
       * on opening and closing events of their parent collapsible container
       * Solves wrongful tabbing in cases where a collapsible content is opened,
       * but it is located in another parent collapsible container that is closed
       */
      updateCollapsedContainerFocusableElements(filterCollapsibleTrigger, showMoreTrigger, focusable) {
        requestAnimationFrame(() => {
          const isFilterExpanded = filterCollapsibleTrigger.getAttribute(attributes$J.ariaExpanded) === 'true';
          const isShowMoreExpanded = showMoreTrigger.getAttribute(attributes$J.ariaExpanded) === 'true';

          focusable.forEach((item) => {
            if (!isFilterExpanded && isShowMoreExpanded) {
              item.setAttribute(attributes$J.tabIndex, '-1');
            }

            if (isFilterExpanded && isShowMoreExpanded) {
              item.removeAttribute(attributes$J.tabIndex);
            }
          });
        });
      }

      /*
       * A11y: Update tabindex for all focusable elements in show-more collapsible containers on opening and closing events
       * Double requestAnimationFrame method is used to make sure the collapsible content has already been expanded
       */
      updateShowMoreFocusableElements(event, focusable) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const isExpanded = event.target.getAttribute(attributes$J.ariaExpanded) === 'true';

            focusable.forEach((item, index) => {
              if (isExpanded) {
                item.removeAttribute(attributes$J.tabIndex);

                if (index === 0) item.focus();
                return;
              }
              item.setAttribute(attributes$J.tabIndex, '-1');
            });
          });
        });
      }

      /*
       * Init functions required when "Filter by tag/group" is selected from Collection page -> Collection pages -> Filter mode
       */
      initTagFilters() {
        if ((this.filterMode != 'tag' && this.filterMode != 'group') || !this.enableFilters) {
          return;
        }

        this.tags = this.container.dataset.tags.split('+').filter((item) => item);
        this.bindFilterTagButtonsEvents();
        this.bindSortChangeEvent();
      }

      /*
       * Render products when tag filter is selected
       */
      renderTagFiltersProducts(url) {
        this.startLoading();

        if (typeof this.endlessCollection === 'object') {
          this.endlessCollection.unload();
        }

        fetch(url)
          .then((response) => response.text())
          .then((responseText) => {
            const html = responseText;
            const parsedData = new DOMParser().parseFromString(html, 'text/html');
            const productsHTML = parsedData.querySelector(selectors$_.productGrid).innerHTML;
            const filtersHTML = parsedData.querySelector(selectors$_.filters).innerHTML;

            this.productGrid.innerHTML = productsHTML;
            this.filters.innerHTML = filtersHTML;
            this.inputSort = this.container.querySelectorAll(selectors$_.inputSort);
            this.filtersForm = document.querySelector(selectors$_.filtersForm);
            this.filterData = [...this.filterData, {html, url}];
            this.alreadyClicked = false;

            this.bindFilterTagButtonsEvents();
            this.bindFilterButtonsEvents();
            this.bindSortChangeEvent();
            this.bindToggleButtonsEvents();
            this.initProductGridEvents(theme.settings.enableInfinityScroll);
            this.updateProductsCount(html);
            this.mobileFiltersScrollLock();
            this.hideFiltersOnMobile();
            makeSwatches(this.container);
            this.collapsible = new Collapsible(this.container);
            this.filterShowMore();

            // Update page URL if supported by the browser
            if (history.replaceState) {
              window.history.pushState({path: url}, '', url);
            }
          })
          .catch((error) => {
            this.finishLoading();
            console.log(`Error: ${error}`);
          });
      }

      /*
       * Bind Filter by tag buttons
       */
      bindFilterTagButtonsEvents() {
        this.container.querySelectorAll(selectors$_.filterTagButton).forEach((button) => {
          button.addEventListener('click', this.onFilterTagButtonClick.bind(this));
        });

        this.container.querySelectorAll(selectors$_.filterTagClearButton).forEach((button) => {
          button.addEventListener('click', this.onFilterTagClearClick);
        });

        this.container.querySelectorAll(selectors$_.filterResetButton).forEach((button) => {
          button.addEventListener('click', this.onFilterTagResetClick);
        });
      }

      /*
       * Bind input Sort by change event for "filters by tag/group" only
       */
      bindSortChangeEvent() {
        this.container.querySelectorAll(selectors$_.inputSort).forEach((input) => {
          input.addEventListener('input', this.debouncedSortEvent.bind(this));
        });
      }

      /*
       * Filter by tag buttons click event
       */
      onFilterTagButtonClick(event) {
        event.preventDefault();
        if (this.alreadyClicked) {
          return;
        }
        this.alreadyClicked = true;
        const button = event.currentTarget;
        const selectedTag = button.dataset.tag;
        let isTagSelected = button.parentNode.classList.contains(classes$S.isActive);

        if (isTagSelected) {
          let tagIndex = this.tags.indexOf(selectedTag);

          button.parentNode.classList.remove(classes$S.isActive);

          if (tagIndex > -1) {
            this.tags.splice(tagIndex, 1);
          }
        } else {
          button.parentNode.classList.add(classes$S.isActive);

          this.tags.push(selectedTag);
        }

        let url = this.collectionHandle + '/' + this.tags.join('+') + '?sort_by=' + this.getSortValue();

        // Close filters dropdown on tag select
        this.container.querySelector(selectors$_.filter).classList.remove(classes$S.isExpanded);
        this.container.querySelector(selectors$_.filter).setAttribute(attributes$J.ariaExpanded, false);
        this.container.setAttribute('data-tags', '[' + this.tags + ']');
        this.renderTagFiltersProducts(url);
      }

      /*
       * Remove a specific tag filter
       */
      onFilterTagClearClick(event) {
        event.preventDefault();
        if (this.alreadyClicked) {
          return;
        }
        this.alreadyClicked = true;
        const button = event.currentTarget;
        const selectedTag = button.dataset.tag;
        const tagIndex = this.tags.indexOf(selectedTag);

        if (tagIndex > -1) {
          this.tags.splice(tagIndex, 1);
        }
        const url = this.collectionHandle + '/' + this.tags.join('+') + '?sort_by=' + this.getSortValue();

        this.container.setAttribute('data-tags', '[' + this.tags + ']');
        this.renderTagFiltersProducts(url);
      }

      /*
       * Re-render products with the new sort option selected
       */
      onSortChange() {
        let url = this.collectionHandle + '/' + this.tags.join('+') + '?sort_by=' + this.getSortValue();

        this.renderTagFiltersProducts(url);
      }

      /*
       * Get the selected sort option value
       */
      getSortValue() {
        let sortValue = '';
        this.inputSort.forEach((input) => {
          if (input.checked) {
            sortValue = input.value;
          }
        });

        return sortValue;
      }

      /*
       * Filter by tag reset button click event
       */
      onFilterTagResetClick(event) {
        event?.preventDefault();

        if (this.alreadyClicked) {
          return;
        }
        this.alreadyClicked = true;

        this.container.querySelectorAll(selectors$_.filterTag).forEach((element) => {
          element.classList.remove(classes$S.isActive);
        });

        this.container.querySelectorAll(selectors$_.filter).forEach((element) => {
          element.classList.remove(classes$S.isExpanded);
          element.setAttribute(attributes$J.ariaExpanded, false);
        });

        // Reset saved tags
        this.tags = [];
        this.container.setAttribute('data-tags', '');

        let url = this.collectionHandle + '/?sort_by=' + this.getSortValue();

        this.renderTagFiltersProducts(url);
      }

      /*
       * Get products container top position
       */
      getProductsOffsetTop() {
        return this.productGrid.getBoundingClientRect().top - document.body.getBoundingClientRect().top - this.filtersStickyBar.offsetHeight;
      }

      /*
       * Get collection page sticky bar top position
       */
      getStickyBarOffsetTop() {
        return this.filtersStickyBar.getBoundingClientRect().top - document.body.getBoundingClientRect().top;
      }

      /*
       * Init all the events required on product grid items
       */
      initProductGridEvents(infinityScroll) {
        if (infinityScroll) {
          this.initInfinityScroll();
          this.initProductGridEvents(false);
          return;
        }

        this.productGridEvents = new ProductGrid(this.container);

        this.initTooltips();

        // Stop loading animation
        setTimeout(() => {
          this.finishLoading();
        }, settings$8.loadingTimeout * 1.5);
      }

      /*
       * Init Infinity scroll functionality
       */
      initInfinityScroll() {
        const callback = () => this.initProductGridEvents(false);

        // For Search page filters, infinity scroll is mostly handled in Tabs
        if (this.isSearchPage) {
          if (!this.enableFilters) return;

          document.dispatchEvent(
            new CustomEvent('theme:tab:ajaxinate', {
              bubbles: true,
              detail: 'product',
            })
          );

          return;
        }

        if (typeof this.endlessCollection === 'object') {
          this.endlessCollection.unload();
        }
        this.endlessCollection = new Ajaxify(this.container);

        if (this.endlessCollection.endlessScroll.length === 0) return;
        this.endlessCollection.endlessScroll[0].settings.callback = callback;
      }

      /*
       * Show loading animation and lock body scroll
       */
      startLoading() {
        this.container.classList.add(classes$S.isLoading);

        if (window.innerWidth >= theme.sizes.small) {
          document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));
        }

        let productsTop = this.getProductsOffsetTop();

        window.scrollTo({
          top: productsTop,
          left: 0,
          behavior: 'smooth',
        });
      }

      /*
       * Hide loading animation and unlock body scroll
       */
      finishLoading() {
        const popups = document.querySelectorAll(`${selectors$_.popupsSection} .${classes$S.popupVisible}`);
        const isPopupActive = popups.length > 0;

        this.container.classList.remove(classes$S.isLoading);

        // Unlock the scroll unless there is a visible popup or there are only popups of types 'bar' and 'cookie'
        if (isPopupActive) {
          let preventScrollPopupsCount = 0;
          [...popups].forEach((popup) => {
            if (popup.hasAttribute(attributes$J.preventScrollLock)) {
              preventScrollPopupsCount += 1;
            }
          });

          if (preventScrollPopupsCount === popups.length) {
            document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true, detail: settings$8.loadingTimeout}));
          }
        } else if (window.innerWidth >= theme.sizes.small) {
          document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true, detail: settings$8.loadingTimeout}));
        }
      }

      /*
       * On block:deselect event
       */
      onDeselect() {
        if (this.productGridEvents) {
          this.productGridEvents.onDeselect();
        }
      }

      /*
       * On section:unload event
       */
      onUnload() {
        if (typeof this.endlessCollection === 'object') {
          this.endlessCollection.unload();
        }

        if (this.productGridEvents) {
          this.productGridEvents.onUnload();
        }

        if (this.collapsible) {
          this.collapsible.onUnload();
        }

        if (this.rangeSlider) {
          this.rangeSlider.unload();
        }

        if (this.filters) {
          document.removeEventListener('theme:resize:width', this.resizeEvent);
        }
        document.removeEventListener('click', this.bodyClickEvent);

        if (this.groupTagFilters.length > 0) {
          this.onFilterTagResetClick();
        }

        this.finishLoading();
      }
    }

    const filters = {
      onLoad() {
        sections$E[this.id] = new Filters(this.container);
      },
      onDeselect() {
        sections$E[this.id].onDeselect();
      },
      onUnload() {
        sections$E[this.id].onUnload();
      },
    };

    const selectors$Z = {
      aosItem: '[data-aos]',
      aosAnchor: '[data-aos-anchor]',
      tabsLink: '[data-tabs-link]',
      tab: '[data-tab]',
      tabRef: '[data-tab-ref]',
      scrollable: '[data-custom-scrollbar]',
      scrollableHolder: '[data-custom-scrollbar-holder]',
      slider: '[data-slider]',
      tabsContents: '[data-tabs-contents]',
      searchForm: '[data-search-form]',
      allTypesContainer: '[data-all-types-container]',
      filtersForm: '[data-collection-filters-form]',
      currentPage: '[data-current-page]',
      tooltip: '[data-tooltip]',
      productGrid: '[data-collection-products]',
      ajaxinateContainer: '#AjaxinateLoop',
      ajaxinatePagination: '#AjaxinatePagination',
    };

    const classes$R = {
      current: 'current',
      hide: 'hide',
      alt: 'alt',
      aosAnimate: 'aos-animate',
      isLoaded: 'is-loaded',
    };

    const attributes$I = {
      tabsLink: 'data-tabs-link',
      tab: 'data-tab',
      tabRef: 'data-tab-ref',
      tabStartIndex: 'data-start-index',
      searchPerformed: 'data-search-performed',
      type: 'data-type',
      currentType: 'data-current-type',
      allTypes: 'data-all-types',
      currentPage: 'data-current-page',
      ajaxinateId: 'data-ajaxinate-id',
    };

    const sections$D = {};

    class Tabs {
      constructor(container) {
        this.container = container;
        this.tabsContents = container.querySelector(selectors$Z.tabsContents);
        this.animateElementsTimer = null;
        this.isSearchPage = container.closest(`[${attributes$I.searchPerformed}="true"]`) != null;

        if (this.container) {
          this.scrollable = this.container.querySelector(selectors$Z.scrollable);
          this.tabRef = this.container.querySelectorAll(selectors$Z.tabRef);
          this.tabsLink = this.container.querySelectorAll(selectors$Z.tabsLink);
          this.tab = this.container.querySelectorAll(selectors$Z.tab);

          this.assignSearchPageArguments();

          this.init();
          this.initCustomScrollbar();

          if (!this.isSearchPage) {
            this.initTooltips();
          }

          this.inactiveTabsAnimationsCallback = debounce(() => this.handleInactiveTabsAnimations(), 200);
          document.addEventListener('theme:scroll', this.inactiveTabsAnimationsCallback);

          this.container.addEventListener('mouseenter', () => {
            this.handleInactiveTabsAnimations();
          });
        }
      }

      /**
       * Arguments and methods related specifically to Search page tabs
       */
      assignSearchPageArguments() {
        if (!this.isSearchPage) return;

        this.searchForm = this.container.querySelector(selectors$Z.searchForm);
        this.searchFormData = new FormData(this.searchForm);
        this.searchTerm = encodeURIComponent(this.searchFormData.get('q'));
        this.currentType = this.container.getAttribute(attributes$I.currentType);
        this.sectionId = this.container.dataset.sectionId;
        this.searchForAllTypes = this.container.getAttribute(attributes$I.allTypes) === 'true';
        this.fetchURL = '';
        this.searchParams = '';
        this.cachedResults = {};

        this.handleTabsHistory();

        this.infiniteScrollListener();
        this.initInfinityScroll(this.currentType);
      }

      /**
       * Initialise
       */
      init() {
        const tabsNavList = this.container.querySelectorAll(selectors$Z.tabsLink);
        const firstTabsLink = this.container.querySelector(
          `[${attributes$I.tabsLink}="${this.container.hasAttribute(attributes$I.tabStartIndex) ? this.container.getAttribute(attributes$I.tabStartIndex) : 0}"]`
        );
        const firstTab = this.container.querySelector(`[${attributes$I.tab}="${this.container.hasAttribute(attributes$I.tabStartIndex) ? this.container.getAttribute(attributes$I.tabStartIndex) : 0}"]`);

        firstTab?.classList.add(classes$R.current);
        firstTabsLink?.classList.add(classes$R.current);

        this.checkVisibleTabsLinks();

        tabsNavList.forEach((element) => {
          this.handleTabsNavListeners(element);
        });
      }

      /**
       * Use a `theme:tab:open-from-history` custom event to change the active tab on history change
       */
      handleTabsHistory() {
        window.addEventListener('popstate', this.onHistoryChange.bind(this));

        this.openTabFromHistoryEvent = (event) => this.openTabFromHistory(event);

        this.tabsLink.forEach((element) => {
          element.addEventListener('theme:tab:open-from-history', this.openTabFromHistoryEvent);
        });
      }

      /**
       * Handle tabs navigations listeners
       */
      handleTabsNavListeners(element) {
        const tabId = element.getAttribute(attributes$I.tabsLink);
        const tab = this.container.querySelector(`[${attributes$I.tab}="${tabId}"]`);

        if (!tab) return;

        element.addEventListener('click', (event) => {
          if (this.isSearchPage) this.handleURLSearchParams(event, true);
          this.tabChange(element, tab);
        });

        element.addEventListener('keyup', (event) => {
          if (event.code === theme.keyboardKeys.SPACE || event.code === theme.keyboardKeys.ENTER || event.code === theme.keyboardKeys.NUMPADENTER) {
            if (this.isSearchPage) this.handleURLSearchParams(event, true);
            this.tabChange(element, tab);
          }
        });
      }

      /**
       * Open active tab on history change
       */
      openTabFromHistory(event) {
        const target = event.target;
        const element = this.container.querySelector(event.detail.element);
        const tabId = element.getAttribute(attributes$I.tabsLink);
        const tab = this.container.querySelector(`[${attributes$I.tab}="${tabId}"]`);

        if (!tab) return;

        this.handleURLSearchParams(event, false);
        this.tabChange(target, tab);
      }

      /**
       * Update URL and Search parameters
       */
      handleURLSearchParams(event, updateHistory = true) {
        const target = event.target.matches(selectors$Z.tabsLink) ? event.target : event.target.closest(selectors$Z.tabsLink);
        const type = target.getAttribute(attributes$I.type);
        const tabId = target.getAttribute(attributes$I.tabsLink);
        const tab = this.container.querySelector(`[${attributes$I.tab}="${tabId}"]`);
        const currentPage = tab.querySelector(selectors$Z.currentPage);
        const filtersForm = document.querySelector(selectors$Z.filtersForm);
        let currentPageStr = currentPage ? `&page=${currentPage.getAttribute(attributes$I.currentPage)}` : '';

        this.searchParams = getSearchParams(this.searchForm, filtersForm, [], type);
        if (type === 'product') {
          // Remove duplicate parameter if filters have been applied before 'all-search-types' container is removed
          const sanitized = this.searchParams.replace('&type=product', '');
          this.searchParams = `${sanitized}&type=product`;
        } else {
          // Prevent erroneous search results by removing excess filters form's parameters if search filters have already been applied
          this.searchParams = `q=${this.searchTerm}&type=${type}`;
        }
        // Include current page into the URL
        if (!theme.settings.enableInfinityScroll && currentPageStr !== '') {
          this.searchParams += currentPageStr;
        }

        // Build the URL for fetching tab contents
        this.fetchURL = `${theme.routes.searchUrl}?${this.searchParams}&section_id=${this.sectionId}`;

        // Update URL on each tab change
        // Prevented when using the 'theme:tab:open-from-history' custom event to avoid endless cycle of wrong history updates
        if (updateHistory) {
          history.pushState({searchParams: this.searchParams}, '', `${window.location.pathname}${this.searchParams && '?'.concat(this.searchParams)}`);
        }
      }

      /**
       * Fetch tab content and handle tab change events
       */
      tabChangeFetchContent(element, tab) {
        const type = element.getAttribute(attributes$I.type);
        const tabId = element.getAttribute(attributes$I.tabsLink);
        const tabContainer = this.container.querySelector(`[${attributes$I.tab}="${tabId}"]`);
        const typeRendered = this.currentType === type;

        if (this.cachedResults[tabId] || typeRendered) {
          if (type === 'product' && !this.searchFilters) {
            this.searchFilters = new Filters(this.container);
          }

          requestAnimationFrame(() => {
            this.handleActiveTabClasses(element, tab);
            this.scrollToCurrentTabLink(element);
            this.triggerTabAnimations(tab);
            this.checkVisibleTabsLinks();
            this.updateAjaxify(tab, type);
          });

          return;
        }

        fetch(this.fetchURL)
          .then((response) => {
            if (!response.ok) {
              const error = new Error(response.status);
              throw error;
            }

            return response.text();
          })
          .then((text) => {
            const parsed = new DOMParser().parseFromString(text, 'text/html');
            const resultsMarkup = parsed.querySelector(`[${attributes$I.tab}="${tabId}"]`).innerHTML;

            // Remove the container with search results with all search types
            if (this.searchForAllTypes) {
              this.container.querySelector(selectors$Z.allTypesContainer)?.remove();
            }

            // Keep the cache for all tabs
            this.cachedResults[tabId] = resultsMarkup;
            // Render tab contents
            tabContainer.innerHTML = resultsMarkup;

            if (type === 'product' && !this.searchFilters) {
              this.searchFilters = new Filters(this.container);
            }

            requestAnimationFrame(() => {
              this.handleActiveTabClasses(element, tab);
              this.scrollToCurrentTabLink(element);
              this.triggerTabAnimations(tab);
              this.checkVisibleTabsLinks();
              this.initInfinityScroll(type);
            });
          })
          .catch((error) => {
            throw error;
          });
      }

      /**
       * Handle history change using `theme:tab:open-from-history` custom events
       */
      onHistoryChange(event) {
        const searchParams = event.state?.searchParams || window.location.search;
        const productResults = searchParams.indexOf('type=product') > -1;
        const articleResults = searchParams.indexOf('type=article') > -1;
        const pageResults = searchParams.indexOf('type=page') > -1;
        const shouldOpenTab = productResults || articleResults || pageResults;
        const typeProduct = this.container.querySelector(`${selectors$Z.tabsLink}[${attributes$I.type}="product"]`);
        const typeArticle = this.container.querySelector(`${selectors$Z.tabsLink}[${attributes$I.type}="article"]`);
        const typePage = this.container.querySelector(`${selectors$Z.tabsLink}[${attributes$I.type}="page"]`);

        if (!shouldOpenTab) {
          // Go to initial search page results if the 'all-search-types' container is removed
          window.location = searchParams;
          return;
        }

        if (productResults) {
          typeProduct?.dispatchEvent(
            new CustomEvent('theme:tab:open-from-history', {
              bubbles: true,
              detail: {
                element: `[${attributes$I.type}="product"]`,
              },
            })
          );
        }

        if (articleResults) {
          typeArticle?.dispatchEvent(
            new CustomEvent('theme:tab:open-from-history', {
              bubbles: true,
              detail: {
                element: `[${attributes$I.type}="article"]`,
              },
            })
          );
        }

        if (pageResults) {
          typePage?.dispatchEvent(
            new CustomEvent('theme:tab:open-from-history', {
              bubbles: true,
              detail: {
                element: `[${attributes$I.type}="page"]`,
              },
            })
          );
        }
      }

      /**
       * Initialise Custom scrollbar
       */
      initCustomScrollbar() {
        if (!this.scrollable || this.customScrollbar) return;

        this.customScrollbar = new CustomScrollbar(this.container);
      }

      /**
       * Use a `theme:tab:ajaxinate` custom event for Infinity Scroll in Filters
       */
      infiniteScrollListener() {
        if (!theme.settings.enableInfinityScroll) return;

        this.ajaxifyFromFiltersEvent = (event) => this.ajaxifyFromFilters(event);

        document.addEventListener('theme:tab:ajaxinate', this.ajaxifyFromFiltersEvent);
      }

      /**
       * Initialise Infinity Scroll with a custom event from Filters
       */
      ajaxifyFromFilters(event) {
        this.initInfinityScroll(event.detail);
      }

      /**
       * Initialise Infinity Scroll
       */
      initInfinityScroll(type) {
        if (!theme.settings.enableInfinityScroll) return;

        // Find all ajaxinate containers
        const ajaxinateContainer = this.container.querySelectorAll(selectors$Z.ajaxinateContainer);
        if (ajaxinateContainer.length === 0) return;

        // Find the current active tab's ajaxinate container
        const activeTab = this.container.querySelector(`${selectors$Z.tab}.${classes$R.current}`);
        const tabAjaxinateContainer = activeTab?.querySelector(selectors$Z.ajaxinateContainer);
        const isLoaded = tabAjaxinateContainer?.classList.contains(classes$R.isLoaded);

        // Whenever the search page with all types is loaded, there is no active tab
        if (!activeTab) {
          this.initAjaxyfy(type);
          return;
        }

        // Fix issues when opening a tab without any results but scrolling still loads more content in other tabs with Ajaxinate
        if (!tabAjaxinateContainer && this.endlessCollection) {
          this.updateAjaxinateInstancesSettings(type);
        }

        // Initialise on load or on tab change events, if the tab content is updated from fetch method
        if (!tabAjaxinateContainer || isLoaded) return;
        this.initAjaxyfy(type);
      }

      /**
       * Update the callback and method settings in Ajaxinate instances
       * The timeout is used to make sure the Ajaxinate instances are present when callbacks are inserted
       */
      updateAjaxinateInstancesSettings(type) {
        setTimeout(() => {
          if (this.endlessCollection.endlessScroll.length === 0) return;

          // Update method to 'click' instead of 'scroll' to prevent Ajaxinate loading on other closed tabs with more results
          [...this.endlessCollection.endlessScroll].forEach((instance) => {
            const containerElement = instance.containerElement;
            const activeTabPresent = [...this.tab].find((tab) => tab.classList.contains(classes$R.current));
            const isInActiveTab = containerElement.closest(`${selectors$Z.tab}.${classes$R.current}`) !== null;

            if (!isInActiveTab && activeTabPresent) instance.settings.method = 'click';
          });

          // Use `initProductGridEvents()` method as a callback when the new pages content is appended
          const callback = () => this.initProductGridEvents();

          if (type === 'product' || type === 'all') {
            const instanceIDCheck = (instance) => {
              return instance.settings.container.indexOf('resultsProducts') > -1 || instance.settings.container.indexOf('allTypes') > -1;
            };
            const productAjaxinateInstance = [...this.endlessCollection.endlessScroll].find(instanceIDCheck);

            if (!productAjaxinateInstance) return;

            productAjaxinateInstance.settings.callback = callback;
          }
        });
      }

      /**
       * Initialise new Ajaxinate instances
       */
      initAjaxyfy(type) {
        if (typeof this.endlessCollection !== 'object') {
          this.endlessCollection = new Ajaxify(this.container);
          this.updateAjaxinateInstancesSettings(type);
          return;
        }

        if (this.endlessCollection.endlessScroll.length > 0) {
          this.endlessCollection.unload();

          this.endlessCollection = new Ajaxify(this.container);
          this.updateAjaxinateInstancesSettings(type);
        }
      }

      /**
       * Update Ajaxinate instances with removing duplicated ones
       */
      updateAjaxify(tab, type) {
        if (this.endlessCollection?.endlessScroll.length === 0) return;

        const ajaxinateContainer = tab.querySelector(selectors$Z.ajaxinateContainer);
        const id = `${selectors$Z.ajaxinateContainer}[${attributes$I.ajaxinateId}="${ajaxinateContainer?.dataset.ajaxinateId}"]`;

        if (!ajaxinateContainer) return;

        this.endlessCollection.update(id);
        this.updateAjaxinateInstancesSettings(type);
      }

      /**
       * Init all the events required on product grid items
       */
      initProductGridEvents() {
        this.productGridEvents = new ProductGrid(this.container);
        this.initTooltips();
      }

      /**
       * Init tooltips for swatches
       */
      initTooltips() {
        this.tooltips = this.container.querySelectorAll(selectors$Z.tooltip);
        this.productGrid = this.container.querySelector(selectors$Z.productGrid);

        if (window.innerWidth < theme.sizes.small) {
          this.tooltips = this.productGrid?.querySelectorAll(selectors$Z.tooltip);
        }

        this.tooltips?.forEach((tooltip) => {
          new Tooltip(tooltip);
        });
      }

      /**
       * Tab change event
       */
      tabChange(element, tab) {
        if (element.classList.contains(classes$R.current)) return;

        if (this.isSearchPage) {
          this.tabChangeFetchContent(element, tab);
          return;
        }

        this.handleActiveTabClasses(element, tab);
        this.scrollToCurrentTabLink(element);
        this.triggerTabAnimations(tab);
        this.handleTabSliders(tab);
        this.checkVisibleTabsLinks();
      }

      /**
       * Handle active tab classes
       */
      handleActiveTabClasses(element, tab) {
        const lastActiveTab = this.container.querySelector(`${selectors$Z.tab}.${classes$R.current}`);
        const lastActiveTabsLink = this.container.querySelector(`${selectors$Z.tabsLink}.${classes$R.current}`);

        // Update active tab's classes
        lastActiveTab?.classList.remove(classes$R.current);
        lastActiveTabsLink?.classList.remove(classes$R.current);
        element.classList.add(classes$R.current);
        tab.classList.add(classes$R.current);

        if (element.classList.contains(classes$R.hide)) {
          tab.classList.add(classes$R.hide);
        }

        // Update tab's referenced elements' classes
        this.tabRef?.forEach((refElement) => {
          const isActive = refElement.classList.contains(classes$R.current);
          const shouldBeActive = refElement.getAttribute(attributes$I.tabRef) === tab.getAttribute(attributes$I.tab);

          refElement.classList.toggle(classes$R.current, !isActive && shouldBeActive);
        });
      }

      /**
       * Scroll to current tab link
       */
      scrollToCurrentTabLink(element) {
        const parent = element.closest(selectors$Z.scrollableHolder) ? element.closest(selectors$Z.scrollableHolder) : element.parentElement;
        const parentPadding = parseInt(window.getComputedStyle(parent).getPropertyValue('padding-left'));

        parent.scrollTo({
          top: 0,
          left: element.offsetLeft - parent.offsetWidth / 2 + element.offsetWidth / 2 + parentPadding,
          behavior: 'smooth',
        });

        element.dispatchEvent(
          new CustomEvent('theme:custom-scrollbar:change', {
            bubbles: true,
            detail: {
              element: element,
            },
          })
        );
      }

      /**
       * Refresh animations if they are enabled
       */
      triggerTabAnimations(tab) {
        if (theme.settings.animationsEnabled == 'false') return;

        document.dispatchEvent(new CustomEvent('theme:scroll')); // Update all scrollable-parallax elements scroll positions

        const productTab = this.tabsContents.querySelector(`[${attributes$I.tab}="resultsProducts"]`);

        // Product tab is current
        if (productTab && productTab.classList.contains(classes$R.current)) {
          const anchors = this.tabsContents.querySelectorAll(selectors$Z.aosAnchor);
          // Get all anchors and attach observers
          initAnchorObservers(anchors);
          return;
        }

        this.tabsContents.querySelectorAll(selectors$Z.aosItem).forEach((element) => {
          element.classList.remove(classes$R.aosAnimate);
        });

        if (this.animateElementsTimer) {
          clearTimeout(this.animateElementsTimer);
        }

        this.animateElementsTimer = setTimeout(() => {
          tab.querySelectorAll(selectors$Z.aosItem).forEach((element) => {
            element.classList.add(classes$R.aosAnimate);
          });
        }, 150);
      }

      /**
       * When the page is scrolled AOS classes are auto updated regardless of each tab visibility
       * Removing them for inactive tabs solves issues with animations refresh on tab opening
       */
      handleInactiveTabsAnimations() {
        this.tab.forEach((tab) => {
          if (!tab.classList.contains(classes$R.current)) {
            tab.querySelectorAll(selectors$Z.aosItem).forEach((element) => {
              requestAnimationFrame(() => element.classList.remove(classes$R.aosAnimate));
            });
          }
        });
      }

      /**
       * Trigger `theme:tab:change` custom event to reset the selected tab slider position
       */
      handleTabSliders(tab) {
        const slider = tab.querySelector(selectors$Z.slider);
        if (slider) slider.dispatchEvent(new CustomEvent('theme:tab:change', {bubbles: false}));
      }

      /**
       * Check visible tab links
       */
      checkVisibleTabsLinks() {
        const tabsNavList = this.container.querySelectorAll(selectors$Z.tabsLink);
        const tabsNavListHidden = this.container.querySelectorAll(`${selectors$Z.tabsLink}.${classes$R.hide}`);
        const difference = tabsNavList.length - tabsNavListHidden.length;

        if (difference < 2) {
          this.container.classList.add(classes$R.alt);
        } else {
          this.container.classList.remove(classes$R.alt);
        }
      }

      /**
       * Event callback for Theme Editor `shopify:block:select` event
       */
      onBlockSelect(event) {
        const element = event.target;
        if (element) {
          element.dispatchEvent(new Event('click'));

          element.parentNode.scrollTo({
            top: 0,
            left: element.offsetLeft - element.clientWidth,
            behavior: 'smooth',
          });
        }
      }

      /**
       * Event callback for Theme Editor `shopify:section:unload` event
       */
      onUnload() {
        if (this.customScrollbar) {
          this.customScrollbar.unload();
        }

        if (this.isSearchPage && theme.settings.enableInfinityScroll) {
          document.removeEventListener('theme:tab:ajaxinate', this.ajaxifyFromFiltersEvent);
        }

        document.removeEventListener('theme:scroll', this.inactiveTabsAnimationsCallback);
      }
    }

    const tabs = {
      onLoad() {
        sections$D[this.id] = new Tabs(this.container);
      },
      onBlockSelect(e) {
        sections$D[this.id].onBlockSelect(e);
      },
      onUnload() {
        sections$D[this.id].onUnload();
      },
    };

    const selectors$Y = {
      drawer: '[data-drawer]',
      drawerToggle: '[data-drawer-toggle]',
      scroller: '[data-scroll]',
      quickviewItem: '[data-quick-view-item]',
      tabsLink: '[data-tabs-link]',
      quickViewFocus: '[data-quick-view-focus]',
      mobileMenu: '[data-mobile-menu]',
      navCompress: '[data-nav-items-compress]',
      popdownToggle: '[data-popdown-toggle]',
      navSearchOpen: '[data-nav-search-open]',
      navLinkMobile: '[data-nav-link-mobile]',
      mobileMenuTrigger: '[data-mobile-menu-trigger]',
      mobileNavDropdownTrigger: '[data-collapsible-trigger]',
    };

    const classes$Q = {
      open: 'is-open',
      drawerOpen: 'js-drawer-open',
      drawerOpenSize: 'js-drawer-open--size',
      drawerOpenSizeQV: 'js-drawer-open--size-qv',
      contentVisibilityHidden: 'cv-h',
      header: 'site-header',
      productSingle: 'product-single',
      shopifySectionMobileMenu: 'shopify-section-mobile-menu',
    };

    const attributes$H = {
      drawer: 'data-drawer',
      drawerHeader: 'data-drawer-header',
      drawerSection: 'data-drawer-section',
      quickViewItem: 'data-quick-view-item',
      ariaExpanded: 'aria-expanded',
      ariaHidden: 'aria-hidden',
      ariaControls: 'aria-controls',
      ariaHidden: 'aria-hidden',
      mobileMenuTrigger: 'data-mobile-menu-trigger',
      mobileMenuBlock: 'data-mobile-menu-block',
    };

    let sections$C = {};

    class Drawer {
      constructor(container) {
        this.container = container;
        this.body = document.body;
        this.drawers = this.container.querySelectorAll(selectors$Y.drawer);
        this.drawerToggleButtons = this.container.querySelectorAll(selectors$Y.drawerToggle);
        this.a11y = a11y;

        if (this.container.hasAttribute(attributes$H.drawer)) {
          this.drawers = [this.container];
        }

        this.drawerToggleEvent = throttle((event) => {
          this.toggle(event);
        }, 150);

        // Define drawer open event
        this.drawerOpenEvent = (event) => {
          this.open(event);
        };

        this.keyPressCloseEvent = throttle((event) => {
          if (event.code === theme.keyboardKeys.ESCAPE) {
            this.close(event);
          }
        }, 150);

        // Define drawer close event
        this.drawerCloseEvent = (event) => {
          const activeDrawer = document.querySelector(`${selectors$Y.drawer}.${classes$Q.open}`);
          let isDrawerToggle = false;

          if (!activeDrawer) {
            return;
          }

          if (event.type === 'click') {
            isDrawerToggle = event.target.matches(selectors$Y.drawerToggle);
          }
          const isDrawerChild = activeDrawer ? activeDrawer.contains(event.target) : false;
          const quickviewItem = activeDrawer.closest(selectors$Y.quickviewItem);
          const isQuickviewChild = quickviewItem ? quickviewItem.contains(event.target) : false;

          if (!isDrawerToggle && !isDrawerChild && !isQuickviewChild) {
            this.close();
          }
        };

        this.initListeners();
      }

      initListeners() {
        // Toggle event for each drawer button
        this.drawerToggleButtons.forEach((button) => {
          button.addEventListener('click', this.drawerToggleEvent);
        });

        // Close drawers if escape key pressed
        this.drawers.forEach((drawer) => {
          drawer.addEventListener('keyup', this.keyPressCloseEvent);

          // Init collapsible mobile dropdowns
          this.collapsible = new Collapsible(drawer);
          this.tabs = new Tabs(drawer);
        });

        // Close drawers on click outside
        document.addEventListener('click', this.drawerCloseEvent);

        // Close drawers on closing event
        document.addEventListener('theme:drawer:closing', this.drawerCloseEvent);

        // Open drawers on opening event
        document.addEventListener('theme:drawer:opening', this.drawerOpenEvent);
      }

      toggle(e) {
        e.preventDefault();
        const drawer = document.querySelector(`#${e.target.getAttribute(attributes$H.ariaControls)}`);
        if (!drawer) {
          return;
        }

        const isDrawerOpen = drawer.classList.contains(classes$Q.open);

        if (isDrawerOpen) {
          this.close();
        } else {
          this.open(e);
        }
      }

      open(e) {
        let drawerOpenButton = e.detail.element;
        if (!drawerOpenButton) {
          drawerOpenButton = e.target;
        }

        const drawerOpenButtonControls = drawerOpenButton.getAttribute(attributes$H.ariaControls);
        let drawer;
        if (drawerOpenButton.hasAttribute(attributes$H.mobileMenuTrigger)) {
          const headerMobileDrawer = document.querySelector(`mobile-menu[${attributes$H.drawerHeader}]`);
          const sectionMobileDrawer = document.querySelector(`mobile-menu[${attributes$H.drawerSection}]`);
          drawer = theme.settings.mobileMenuType === 'new' ? sectionMobileDrawer || headerMobileDrawer : headerMobileDrawer;
        } else {
          drawer = document.querySelector(`#${drawerOpenButtonControls}`);
        }

        if (!drawer) {
          return;
        }
        const drawerScroller = drawer.querySelector(selectors$Y.scroller) || drawer;

        // Disable page scroll right away
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: drawerScroller}));
        document.dispatchEvent(new CustomEvent('theme:drawer:open', {bubbles: true}));
        this.body.classList.add(classes$Q.drawerOpen);

        if (drawerOpenButtonControls?.includes('size-chart')) {
          this.body.classList.add(classes$Q.drawerOpenSize); // modifier for the size chart

          if (drawerOpenButtonControls.includes('quickview')) {
            this.body.classList.add(classes$Q.drawerOpenSizeQV); // modifier for the size chart from Quick View - used only in JS
          }
        }

        drawer.classList.add(classes$Q.open);
        drawer.setAttribute(attributes$H.ariaHidden, false);
        drawer.classList.remove(classes$Q.contentVisibilityHidden);
        drawerOpenButton.setAttribute(attributes$H.ariaExpanded, true);

        const onDrawerTransitionEnd = (event) => {
          const eventProperty = event.propertyName === 'transform' || event.propertyName === 'top';
          if (event.target !== drawer || !eventProperty) return;

          this.a11y.state.trigger = drawerOpenButton;
          this.a11y.trapFocus({
            container: drawer,
          });

          drawer.removeEventListener('transitionend', onDrawerTransitionEnd);
        };

        drawer.addEventListener('transitionend', onDrawerTransitionEnd);
      }

      close(event = false) {
        if (!this.body.classList.contains(classes$Q.drawerOpen)) {
          return;
        }

        const drawer = document.querySelector(`${selectors$Y.drawer}.${classes$Q.open}`);

        this.drawerToggleButtons.forEach((button) => {
          button.setAttribute(attributes$H.ariaExpanded, false);
        });

        this.a11y.removeTrapFocus({
          container: drawer,
        });

        drawer?.classList.remove(classes$Q.open);

        const onDrawerTransitionEnd = (event) => {
          if (event.target !== drawer) return;

          requestAnimationFrame(() => {
            drawer?.classList.add(classes$Q.contentVisibilityHidden);
            document.dispatchEvent(new CustomEvent('theme:drawer:close', {bubbles: true}));
            document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
            this.a11y.state.trigger.focus();
            drawer?.setAttribute(attributes$H.ariaHidden, true);
          });

          drawer?.removeEventListener('transitionend', onDrawerTransitionEnd);
        };

        drawer?.addEventListener('transitionend', onDrawerTransitionEnd);

        this.body.classList.remove(classes$Q.drawerOpen);
        this.body.classList.remove(classes$Q.drawerOpenSize);

        if (this.body.classList.contains(classes$Q.drawerOpenSizeQV)) {
          this.body.classList.remove(classes$Q.drawerOpenSizeQV);

          if (event && event.code === theme.keyboardKeys.ESCAPE) {
            // If Esc pressed - close all drawers and focus the main trigger
            this.a11y.state.trigger = this.a11y.state.mainTrigger;
            this.a11y.state.trigger.focus();
            return;
          }

          // Trap focus in QV drawer
          const quickViewFocus = this.a11y.state.trigger.closest(selectors$Y.quickViewFocus);
          this.a11y.trapFocus({
            container: quickViewFocus,
            elementToFocus: this.a11y.state.trigger,
          });
          this.a11y.state.trigger = this.a11y.state.mainTrigger;
        }
      }

      onUnload() {
        // Close drawer
        this.close();

        // Unbind all event listeners for drawers
        this.drawerToggleButtons.forEach((button) => {
          button.removeEventListener('click', this.drawerToggleEvent);
        });
        this.drawers.forEach((drawer) => {
          drawer.removeEventListener('keyup', this.keyPressCloseEvent);
        });
        document.removeEventListener('click', this.drawerCloseEvent);
        document.removeEventListener('theme:drawer:closing', this.drawerCloseEvent);
        document.removeEventListener('theme:drawer:opening', this.drawerOpenEvent);

        if (this.collapsible) {
          this.collapsible.onUnload();
        }

        if (this.tabs) {
          this.tabs.onUnload();
        }
      }
    }

    const drawer = {
      onLoad() {
        sections$C[this.id] = new Drawer(this.container);
      },
      onUnload() {
        sections$C[this.id].onUnload();
      },
    };

    // Mobile menu extender
    class MobileMenu extends HTMLElement {
      constructor() {
        super();
        this.container = this; // The custom element itself is the container
        this.drawerInstance = null;

        this.showDrawerOnSelect = this.showDrawerOnSelect.bind(this);
        this.hideDrawerOnDeselect = this.hideDrawerOnDeselect.bind(this);
      }

      connectedCallback() {
        // Initialize the Drawer functionality when the custom element is added to the DOM
        this.drawerInstance = new Drawer(this.container);
        this.initMobileNav();

        document.addEventListener('shopify:block:select', this.showDrawerOnSelect);
        document.addEventListener('shopify:section:load', this.showDrawerOnSelect);
        document.addEventListener('shopify:section:select', this.showDrawerOnSelect);
        document.addEventListener('shopify:section:deselect', this.hideDrawerOnDeselect);
      }

      initMobileNav() {
        // Search popdown link
        const drawerToggle = this.container.querySelector(selectors$Y.drawerToggle);
        const navSearchOpen = this.container.querySelectorAll(selectors$Y.navSearchOpen);

        navSearchOpen?.forEach((element) => {
          element.addEventListener('click', (event) => {
            event.preventDefault();

            const mobileMenu = document.querySelector(selectors$Y.mobileMenu);
            const navCompress = document.querySelector(selectors$Y.navCompress);

            let isTouch = matchMedia('(pointer:coarse)').matches;
            const viewportMobile = window.innerWidth < theme.sizes.small;

            if (viewportMobile && window.Shopify.designMode) {
              isTouch = true;
            }
            const popdownToggle = isTouch ? mobileMenu?.querySelector(selectors$Y.popdownToggle) : navCompress?.querySelector(selectors$Y.popdownToggle);

            drawerToggle.dispatchEvent(new Event('click', {bubbles: true}));

            const onDrawerTransitionEnd = (e) => {
              if (e.target !== this.container) return;
              requestAnimationFrame(() => popdownToggle?.dispatchEvent(new Event('click', {bubbles: true})));
              this.container.removeEventListener('transitionend', onDrawerTransitionEnd);
            };

            this.container.addEventListener('transitionend', onDrawerTransitionEnd);
          });
        });

        // First item in dropdown menu
        if (theme.settings.mobileMenuBehaviour === 'link') return;

        const navMobileLinks = this.container.querySelectorAll(selectors$Y.navLinkMobile);
        if (navMobileLinks.length) {
          navMobileLinks.forEach((link) => {
            link.addEventListener('click', (e) => {
              const hasDropdown = link.parentNode.querySelectorAll(selectors$Y.mobileNavDropdownTrigger).length;
              const dropdownTrigger = link.nextElementSibling;

              if (hasDropdown) {
                e.preventDefault();
                dropdownTrigger.dispatchEvent(new Event('click'), {bubbles: true});
              }
            });
          });
        }
      }

      showDrawerOnSelect(e) {
        if (e.target.classList.contains(classes$Q.shopifySectionMobileMenu) || e.target.hasAttribute(attributes$H.mobileMenuBlock)) {
          const mobileMenu = e.target.querySelector('mobile-menu') || e.target.closest('mobile-menu');

          if (!mobileMenu || theme.settings.mobileMenuType === 'old') return; // Don't show menu if menu setting is old style ( there are no menu blocks in header section )

          const mobileMenuTrigger = document.querySelector(selectors$Y.mobileMenuTrigger);
          if (!document.body.classList.contains(classes$Q.drawerOpen)) {
            document.dispatchEvent(new CustomEvent('theme:drawer:opening', {bubbles: true, detail: {element: mobileMenuTrigger}}));
          }
        }
      }

      hideDrawerOnDeselect(e) {
        if (e.target.classList.contains(classes$Q.shopifySectionMobileMenu) || e.target.hasAttribute(attributes$H.mobileMenuBlock)) {
          const mobileMenu = e.target.querySelector('mobile-menu') || e.target.closest('mobile-menu');

          if (!mobileMenu) return;

          if (document.body.classList.contains(classes$Q.drawerOpen)) {
            document.dispatchEvent(new CustomEvent('theme:drawer:closing', {bubbles: true}));
          }
        }
      }

      disconnectedCallback() {
        // Clean up when the element is removed from the DOM
        if (this.drawerInstance) {
          this.drawerInstance.onUnload();
          this.drawerInstance = null;
        }

        document.removeEventListener('shopify:block:select', this.showDrawerOnSelect);
        document.removeEventListener('shopify:section:load', this.showDrawerOnSelect);
        document.removeEventListener('shopify:section:select', this.showDrawerOnSelect);
        document.removeEventListener('shopify:section:deselect', this.hideDrawerOnDeselect);
      }
    }

    // Define the custom element 'mobile-drawer' if it hasn't been defined already
    if (!customElements.get('mobile-menu')) {
      customElements.define('mobile-menu', MobileMenu);
    }

    const showElement = (elem, removeProp = false, prop = 'block') => {
      if (elem) {
        if (removeProp) {
          elem.style.removeProperty('display');
        } else {
          elem.style.display = prop;
        }
      }
    };

    const hideElement = (elem) => {
      if (elem) {
        elem.style.display = 'none';
      }
    };

    const scrollTo = (elementTop) => {
      const {stickyHeaderHeight} = readHeights();

      window.scrollTo({
        top: elementTop + Math.round(window.scrollY) - stickyHeaderHeight,
        left: 0,
        behavior: 'smooth',
      });
    };

    const selectors$X = {
      list: '[data-store-availability-list]',
    };

    const defaults = {
      close: '.js-modal-close',
      open: '.js-modal-open-store-availability-modal',
      openClass: 'modal--is-active',
      openBodyClass: 'modal--is-visible',
      closeModalOnClick: false,
      scrollIntoView: false,
    };

    class Modals {
      constructor(id, options) {
        this.modal = document.getElementById(id);

        if (!this.modal) return false;

        this.nodes = {
          parents: [document.querySelector('html'), document.body],
        };
        this.config = Object.assign(defaults, options);
        this.modalIsOpen = false;
        this.focusOnOpen = this.config.focusOnOpen ? document.getElementById(this.config.focusOnOpen) : this.modal;
        this.openElement = document.querySelector(this.config.open);
        this.a11y = a11y;

        this.init();
      }

      init() {
        this.openElement.addEventListener('click', this.open.bind(this));
        this.modal.querySelector(this.config.close).addEventListener('click', this.closeModal.bind(this));
      }

      open(evt) {
        // Keep track if modal was opened from a click, or called by another function
        let externalCall = false;
        // Prevent following href if link is clicked
        if (evt) {
          evt.preventDefault();
        } else {
          externalCall = true;
        }

        if (this.modalIsOpen && !externalCall) {
          this.closeModal();
          return;
        }

        this.modal.classList.add(this.config.openClass);
        this.nodes.parents.forEach((node) => {
          node.classList.add(this.config.openBodyClass);
        });
        this.modalIsOpen = true;

        const scrollableElement = document.querySelector(selectors$X.list);
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: scrollableElement}));

        if (this.config.scrollIntoView) {
          this.scrollIntoView();
        }
        this.bindEvents();

        this.a11y.trapFocus({
          container: this.modal,
        });
      }

      closeModal() {
        if (!this.modalIsOpen) return;
        document.activeElement.blur();
        this.modal.classList.remove(this.config.openClass);
        var self = this;
        this.nodes.parents.forEach(function (node) {
          node.classList.remove(self.config.openBodyClass);
        });
        this.modalIsOpen = false;
        this.openElement.focus();
        this.unbindEvents();

        this.a11y.removeTrapFocus({
          container: this.modal,
        });

        // Enable page scroll right after the closing animation ends
        const timeout = 400;
        document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true, detail: timeout}));
      }

      bindEvents() {
        this.keyupHandler = this.keyupHandler.bind(this);
        this.clickHandler = this.clickHandler.bind(this);
        document.body.addEventListener('keyup', this.keyupHandler);
        document.body.addEventListener('click', this.clickHandler);
      }

      unbindEvents() {
        document.body.removeEventListener('keyup', this.keyupHandler);
        document.body.removeEventListener('click', this.clickHandler);
      }

      keyupHandler(event) {
        if (event.code === theme.keyboardKeys.ESCAPE) {
          this.closeModal();
        }
      }

      clickHandler(event) {
        if (this.config.closeModalOnClick && !this.modal.contains(event.target) && !event.target.matches(this.config.open)) {
          this.closeModal();
        }
      }

      scrollIntoView() {
        this.focusOnOpen.scrollIntoView({
          behavior: 'smooth',
        });
      }
    }

    const selectors$W = {
      body: 'body',
      storeAvailabilityModal: '[data-store-availability-modal]',
      storeAvailabilityModalOpen: '[data-store-availability-modal-open]',
      storeAvailabilityModalClose: '[data-store-availability-modal-close]',
      storeAvailabilityModalProductTitle: '[data-store-availability-modal-product__title]',
    };

    const classes$P = {
      openClass: 'store-availabilities-modal--active',
    };

    class StoreAvailability {
      constructor(container) {
        this.container = container;
      }

      updateContent(variantId, productTitle) {
        this._fetchStoreAvailabilities(variantId, productTitle);
      }

      clearContent() {
        this.container.innerHTML = '';
      }

      _initModal() {
        return new Modals('StoreAvailabilityModal', {
          close: selectors$W.storeAvailabilityModalClose,
          open: selectors$W.storeAvailabilityModalOpen,
          closeModalOnClick: true,
          openClass: classes$P.openClass,
          scrollIntoView: false,
        });
      }

      _fetchStoreAvailabilities(variantId, productTitle) {
        const variantSectionUrl = '/variants/' + variantId + '/?section_id=store-availability';
        this.clearContent();

        const self = this;
        fetch(variantSectionUrl)
          .then(function (response) {
            return response.text();
          })
          .then(function (storeAvailabilityHTML) {
            const body = document.querySelector(selectors$W.body);
            let storeAvailabilityModal = body.querySelector(selectors$W.storeAvailabilityModal);
            if (storeAvailabilityModal) {
              storeAvailabilityModal.remove();
            }

            self.container.innerHTML = storeAvailabilityHTML;
            self.container.innerHTML = self.container.firstElementChild.innerHTML;

            if (self.container.firstElementChild.innerHTML.trim() === '') {
              self.clearContent();
              return;
            }

            const storeAvailabilityModalOpen = self.container.querySelector(selectors$W.storeAvailabilityModalOpen);
            // Only create modal if open modal element exists
            if (!storeAvailabilityModalOpen) {
              return;
            }

            self.modal = self._initModal();
            self._updateProductTitle(productTitle);

            storeAvailabilityModal = self.container.querySelector(selectors$W.storeAvailabilityModal);
            if (storeAvailabilityModal) {
              body.appendChild(storeAvailabilityModal);
            }
          });
      }

      _updateProductTitle(productTitle) {
        const storeAvailabilityModalProductTitle = this.container.querySelector(selectors$W.storeAvailabilityModalProductTitle);
        storeAvailabilityModalProductTitle.textContent = productTitle;
      }
    }

    /**
     * Variant Sellout Precrime Click Preview
     * I think of this like the precrime machine in Minority report.  It gives a preview
     * of every possible click action, given the current form state.  The logic is:
     *
     * for each clickable name=options[] variant selection element
     * find the value of the form if the element were clicked
     * lookup the variant with those value in the product json
     * clear the classes, add .unavailable if it's not found,
     * and add .sold-out if it is out of stock
     *
     * Caveat: we rely on the option position so we don't need
     * to keep a complex map of keys and values.
     */

    const selectors$V = {
      form: '[data-product-form]',
      optionPosition: '[data-option-position]',
      optionInput: '[name^="options"], [data-popout-option]',
    };

    const classes$O = {
      soldOut: 'sold-out',
      unavailable: 'unavailable',
    };

    const attributes$G = {
      optionPosition: 'data-option-position',
      selectOptionValue: 'data-value',
    };

    class SelloutVariants {
      constructor(container, productJSON) {
        this.container = container;
        this.productJSON = productJSON;
        this.form = this.container.querySelector(selectors$V.form);
        this.formData = new FormData(this.form);
        this.optionElements = this.container.querySelectorAll(selectors$V.optionInput);

        if (this.productJSON && this.form) {
          this.init();
        }
      }

      init() {
        this.update();
      }

      update() {
        this.getCurrentState();

        this.optionElements.forEach((el) => {
          const val = el.value || el.getAttribute(attributes$G.selectOptionValue);
          const optionSelector = el.closest(selectors$V.optionPosition);

          if (!optionSelector) {
            return;
          }

          const positionString = optionSelector.getAttribute(attributes$G.optionPosition);
          // subtract one because option.position in liquid does not count form zero, but JS arrays do
          const position = parseInt(positionString, 10) - 1;

          let newVals = [...this.selections];
          newVals[position] = val;

          const found = this.productJSON.variants.find((element) => {
            // only return true if every option matches our hypothetical selection
            let perfectMatch = true;
            for (let index = 0; index < newVals.length; index++) {
              if (element.options[index] !== newVals[index]) {
                perfectMatch = false;
              }
            }
            return perfectMatch;
          });

          el.parentElement.classList.remove(classes$O.soldOut, classes$O.unavailable);
          if (typeof found === 'undefined') {
            el.parentElement.classList.add(classes$O.unavailable);
          } else if (found?.available === false) {
            el.parentElement.classList.add(classes$O.soldOut);
          }
        });
      }

      getCurrentState() {
        this.formData = new FormData(this.form);
        this.selections = [];
        for (var value of this.formData.entries()) {
          if (value[0].includes('options[')) {
            // push the current state of the form, dont worry about the group name
            // we will be using the array position instead of the name to match values
            this.selections.push(value[1]);
          }
        }
      }
    }

    const settings$7 = {
      templateIndex: 1,
    };

    const classes$N = {
      popupNotification: 'pswp--notification pswp--not-close-btn',
    };

    const attributes$F = {
      notificationPopup: 'data-notification-popup',
    };

    const options$1 = {
      history: false,
      focus: false,
      mainClass: classes$N.popupNotification,
      closeOnVerticalDrag: false,
    };

    class NotificationPopup {
      constructor(button) {
        this.button = button;
        this.a11y = a11y;
        this.notificationPopupHtml = this.button.getAttribute(attributes$F.notificationPopup);

        if (this.notificationPopupHtml.trim() !== '') {
          this.init();
        }
      }

      init() {
        const items = [
          {
            html: this.notificationPopupHtml,
          },
        ];

        this.a11y.state.trigger = this.button;

        new LoadPhotoswipe(items, options$1, settings$7.templateIndex);
      }
    }

    const selectors$U = {
      product: '[data-product]',
      productForm: '[data-product-form]',
      addToCart: '[data-add-to-cart]',
      addToCartText: '[data-add-to-cart-text]',
      buyItNow: '[data-buy-it-now]',
      comparePrice: '[data-compare-price]',
      formWrapper: '[data-form-wrapper]',
      header: '[data-site-header]',
      itemCountForVariant: '[data-item-count-for-variant]',
      maxInventory: '[data-max-inventory]',
      originalSelectorId: '[data-product-select]',
      preOrderTag: '_preorder',
      priceWrapper: '[data-price-wrapper]',
      priceOffWrap: '[data-price-off]',
      priceOffAmount: '[data-price-off-amount]',
      productSlide: '[data-product-slide]',
      productImage: '[data-product-image]',
      productMediaSlider: '[data-product-single-media-slider]',
      productJson: '[data-product-json]',
      productPrice: '[data-product-price]',
      unitPrice: '[data-product-unit-price]',
      unitBase: '[data-product-base]',
      unitWrapper: '[data-product-unit]',
      subPrices: '[data-subscription-watch-price]',
      subSelectors: '[data-subscription-selectors]',
      subsToggle: '[data-toggles-group]',
      subsChild: 'data-group-toggle',
      subDescription: '[data-plan-description]',
      remainingCount: '[data-remaining-count]',
      remainingWrapper: '[data-remaining-wrapper]',
      remainingJSON: '[data-product-remaining-json]',
      idInput: '[name="id"]',
      storeAvailabilityContainer: '[data-store-availability-container]',
      upsellButton: '[data-upsell-btn]',
      sectionNode: '.shopify-section',
      quickViewItem: '[data-quick-view-item]',
      notificationButtonText: '[data-notification-button-text]',
      swatchesContainer: '[data-swatches-container]',
      swatchesMore: '[data-swatches-more]',
      selectorWrapper: '[data-option-position]',
      variantButtons: '[data-variant-buttons]',
      variantOptionImage: '[data-variant-option-image]',
      disabled: '[disabled]',
      shopifyPaymentButton: '.shopify-payment-button__button--unbranded',
      variantFinalSaleMeta: '[data-variant-final-sale-metafield]',
      finalSaleBadge: '[data-final-sale-badge]',
    };

    const classes$M = {
      hidden: 'hidden',
      variantSoldOut: 'variant--soldout',
      variantUnavailable: 'variant--unavailabe',
      productPriceSale: 'product__price--sale',
      priceWrapperHidden: 'product__price--hidden',
      remainingLow: 'count-is-low',
      remainingIn: 'count-is-in',
      remainingOut: 'count-is-out',
      remainingUnavailable: 'count-is-unavailable',
      selectorVisible: 'selector-wrapper--visible',
    };

    const attributes$E = {
      productImageId: 'data-image-id',
      tallLayout: 'data-tall-layout',
      dataEnableHistoryState: 'data-enable-history-state',
      notificationPopup: 'data-notification-popup',
      swatchVariant: 'data-swatch-variant',
      addToCartButton: 'data-atc-button',
      disabled: 'disabled',
      maxInventoryReached: 'data-max-inventory-reached',
      errorMessagePosition: 'data-error-message-position',
      variantTitle: 'data-variant-title',
      finalSale: 'data-final-sale',
    };

    let sections$B = {};

    class ProductAddForm {
      constructor(container) {
        this.container = container;
        this.product = this.container.querySelector(selectors$U.product);
        this.productForm = this.container.querySelector(selectors$U.productForm);
        this.tallLayout = this.container.getAttribute(attributes$E.tallLayout) === 'true';
        this.addToCartButton = this.container.querySelector(selectors$U.addToCart);
        this.buyItNow = this.container.querySelector(selectors$U.buyItNow);
        this.hasPaymentButton = this.buyItNow !== null;
        this.variantOptionImages = this.container.querySelectorAll(selectors$U.variantOptionImage);
        this.hasVariantOptionWithImage = this.variantOptionImages.length > 0;

        // Stop parsing if we don't have the product
        if (!this.product || !this.productForm) return;

        this.storeAvailabilityContainer = this.container.querySelector(selectors$U.storeAvailabilityContainer);
        this.enableHistoryState = this.container.getAttribute(attributes$E.dataEnableHistoryState) === 'true';
        this.hasUnitPricing = this.container.querySelector(selectors$U.unitWrapper);
        this.subSelectors = this.container.querySelector(selectors$U.subSelectors);
        this.subPrices = this.container.querySelector(selectors$U.subPrices);
        this.priceOffWrap = this.container.querySelector(selectors$U.priceOffWrap);
        this.priceOffAmount = this.container.querySelector(selectors$U.priceOffAmount);
        this.planDecription = this.container.querySelector(selectors$U.subDescription);
        this.swatchesContainer = this.container.querySelector(selectors$U.swatchesContainer);
        this.latestVariantId = '';
        this.latestVariantName = '';
        this.latestVariantTitle = '';
        this.sellout = null;

        this.sessionStorage = window.sessionStorage;

        this.remainingWrapper = this.container.querySelector(selectors$U.remainingWrapper);

        if (this.remainingWrapper) {
          this.remainingMaxInt = parseInt(this.remainingWrapper.dataset.remainingMax, 10);
          this.remainingCount = this.container.querySelector(selectors$U.remainingCount);
          this.remainingJSONWrapper = this.container.querySelector(selectors$U.remainingJSON);
          this.remainingJSON = null;

          if (this.remainingJSONWrapper && this.remainingJSONWrapper.innerHTML !== '') {
            this.remainingJSON = JSON.parse(this.remainingJSONWrapper.innerHTML);
          }
        }

        if (this.storeAvailabilityContainer) {
          this.storeAvailability = new StoreAvailability(this.storeAvailabilityContainer);
        }

        this.init();

        if (this.hasVariantOptionWithImage) {
          this.onResizeCallback = () => this.resizeEvents();
          window.addEventListener('theme:resize:width', this.onResizeCallback);
        }

        if (this.hasPaymentButton) {
          this.mutationObserver = null;
          this.observeContainer();
        }
      }

      init() {
        let productJSON = null;
        const productElemJSON = this.container.querySelector(selectors$U.productJson);

        if (productElemJSON) {
          productJSON = productElemJSON.innerHTML;
        }
        if (productJSON) {
          this.productJSON = JSON.parse(productJSON);
          this.linkForm();
          this.sellout = new SelloutVariants(this.container, this.productJSON);
        } else {
          console.error('Missing product JSON');
        }

        if (this.hasVariantOptionWithImage) {
          this.variantButtonsContainer = this.variantOptionImages[0].closest(selectors$U.variantButtons);
          this.equalizeImageOptionContainers();
        }
      }

      resizeEvents() {
        if (this.hasVariantOptionWithImage) this.equalizeImageOptionContainers();
      }

      linkForm() {
        this.productForm = new ProductForm(this.productForm, this.productJSON, {
          onOptionChange: this.onOptionChange.bind(this),
          onPlanChange: this.onPlanChange.bind(this),
          onQuantityChange: this.onQuantityChange.bind(this),
        });
        const formState = this.productForm.getFormState();
        this.pushState(formState, true);
        this.subsToggleListeners();

        // Swatches show more functionality
        if (this.swatchesContainer) {
          this.observeSwatch(formState);

          const selectorWrapper = this.swatchesContainer.closest(selectors$U.selectorWrapper);
          const moreLink = selectorWrapper.querySelector(selectors$U.swatchesMore);
          moreLink?.addEventListener('click', (event) => {
            event.preventDefault();
            if (selectorWrapper.classList.contains(classes$M.selectorVisible)) {
              selectorWrapper.classList.remove(classes$M.selectorVisible);
            } else {
              selectorWrapper.classList.add(classes$M.selectorVisible);
            }
          });
        }

        this.checkLiveCartInfoCallback = () => this.checkLiveCartInfo();
        document.addEventListener('theme:cart:close', this.checkLiveCartInfoCallback);
      }

      onOptionChange(evt) {
        this.pushState(evt.dataset);
        this.updateProductImage(evt);
      }

      onPlanChange(evt) {
        if (this.subPrices) {
          this.pushState(evt.dataset);
        }
      }

      onQuantityChange(evt) {
        this.pushState(evt.dataset);
      }

      pushState(formState, init = false) {
        this.productState = this.setProductState(formState);
        this.updateAddToCartState(formState);
        this.updateProductPrices(formState);
        this.updateSaleText(formState);
        this.updateSubscriptionText(formState);
        this.updateTitleAttr(formState);
        this.fireHookEvent(formState);
        this.updateRemaining(formState);
        this.checkLiveCartInfo(formState);
        this.sellout?.update(formState);

        if (this.enableHistoryState && !init) {
          this.updateHistoryState(formState);
        }

        if (this.storeAvailability) {
          if (formState.variant) {
            this.storeAvailability.updateContent(formState.variant.id, this.productForm.product.title);
          } else {
            this.storeAvailability.clearContent();
          }
        }
      }

      updateTitleAttr(formState) {
        const variant = formState.variant;
        if (!variant) return;
        let titleText = this.productForm.product.title;
        if (variant.public_title) {
          titleText += ` - ${variant.title}`;
        }
        this.productForm.element.setAttribute(attributes$E.variantTitle, titleText);
      }

      updateAddToCartState(formState) {
        const variant = formState.variant;
        const priceWrapper = this.container.querySelectorAll(selectors$U.priceWrapper);
        const addToCart = this.container.querySelectorAll(selectors$U.addToCart);
        const addToCartText = this.container.querySelectorAll(selectors$U.addToCartText);
        const formWrapper = this.container.querySelectorAll(selectors$U.formWrapper);
        const buyItNow = this.container.querySelector(selectors$U.buyItNow);
        let addText = theme.strings.add_to_cart;

        if (theme.settings.atcButtonShowPrice) {
          addText = `${addText}<span data-product-price class="product__price--regular"></span> <s data-compare-price class="product__price--compare"></s>`; // Show price on ATC button
        }

        if (this.productJSON.tags.includes(selectors$U.preOrderTag)) {
          addText = theme.strings.preorder;
        }

        // Price wrapper elements
        priceWrapper?.forEach((element) => {
          // Hide price if there is no variant
          if (element.hasAttribute(attributes$E.addToCartButton)) return; // Skip if the price is on the ATC button
          element.classList.toggle(classes$M.priceWrapperHidden, !variant);
        });

        // ATC Button elements
        addToCart?.forEach((element) => {
          // Skip the upsell "add to cart" button
          if (element.matches(selectors$U.upsellButton)) return;

          element.disabled = true;
          buyItNow?.classList.add(classes$M.hidden);

          // No variant
          if (!variant) return;

          // Available variant
          element.disabled = false;
          if (variant.available) {
            buyItNow?.classList.remove(classes$M.hidden);
          }

          // Notification popup
          if (!element.hasAttribute(attributes$E.notificationPopup)) return;

          const notificationFormId = element.id.replace('AddToCart', 'NotificationForm');
          const formID = this.sessionStorage.getItem('notification_form_id');
          let notificationFormSubmitted = false;
          let variantId = variant.id;
          let variantName = variant.name;
          let variantTitle = variant.title;

          if (formID) {
            const sessionId = formID.substring(0, formID.lastIndexOf('--'));
            const sessionVariantId = formID.split('--').slice(-1)[0];
            notificationFormSubmitted = notificationFormId === sessionId;

            if (notificationFormSubmitted) {
              this.latestVariantId = variantId;
              this.latestVariantName = variantName;
              this.latestVariantTitle = variantTitle;
              variantId = Number(sessionVariantId);

              this.productJSON.variants.forEach((variant) => {
                if (variant.id === variantId) {
                  variantName = variant.name;
                  variantTitle = variant.title;
                }
              });
            }
          }

          let notificationPopupHtml = element.getAttribute(attributes$E.notificationPopup);
          const notificationButtonText = new DOMParser().parseFromString(notificationPopupHtml, 'text/html').querySelector(selectors$U.notificationButtonText)?.innerHTML;

          if (this.latestVariantId != '' && this.latestVariantTitle != '') {
            notificationPopupHtml = notificationPopupHtml.replaceAll(this.latestVariantId, variantId);
            notificationPopupHtml = notificationPopupHtml.replaceAll(
              `<p class='product__notification__subtitle'>${this.latestVariantTitle}</p>`,
              `<p class='product__notification__subtitle'>${variantTitle}</p>`
            );
            notificationPopupHtml = notificationPopupHtml.replaceAll(`value='${this.latestVariantName}'>`, `value='${variantName}'>`);

            // Prevent updating of the "Notify me" button's text if the variant title matches part of it
            const updatedNotificationButtonText = new DOMParser().parseFromString(notificationPopupHtml, 'text/html').querySelector(selectors$U.notificationButtonText)?.innerHTML;
            notificationPopupHtml = notificationPopupHtml.replace(updatedNotificationButtonText, notificationButtonText);
          }

          element.setAttribute(attributes$E.notificationPopup, notificationPopupHtml);

          if (notificationFormSubmitted) {
            this.scrollToForm(this.product.closest(selectors$U.sectionNode));
            new NotificationPopup(element);
          }

          this.latestVariantId = variantId;
          this.latestVariantName = variantName;
          this.latestVariantTitle = variantTitle;
        });

        // ATC Buttons' text elements
        addToCartText?.forEach((element) => {
          // No variant
          if (!variant) {
            element.innerHTML = theme.strings.unavailable;
            return;
          }

          // Unavailable variant
          if (!variant.available) {
            element.innerHTML = theme.strings.sold_out;

            if (element.parentNode.hasAttribute(attributes$E.notificationPopup)) {
              if (element.closest(selectors$U.quickViewItem)) return; // Disable 'notify me' text change for Quickview

              element.innerHTML = `${theme.strings.sold_out} - ${theme.strings.newsletter_product_availability}`;
            }

            return;
          }

          // Available variant
          element.innerHTML = addText;
        });

        // Form wrapper elements
        formWrapper?.forEach((element) => {
          // No variant
          if (!variant) {
            element.classList.add(classes$M.variantUnavailable);
            element.classList.remove(classes$M.variantSoldOut);
            return;
          }

          const formSelect = element.querySelector(selectors$U.originalSelectorId);
          if (formSelect) {
            formSelect.value = variant.id;
          }

          // Unavailable variant
          if (!variant.available) {
            element.classList.add(classes$M.variantSoldOut);
            element.classList.remove(classes$M.variantUnavailable);
            return;
          }

          // Available variant
          element.classList.remove(classes$M.variantSoldOut, classes$M.variantUnavailable);
        });
      }

      updateHistoryState(formState) {
        const variant = formState.variant;
        const plan = formState.plan;
        const location = window.location.href;
        if (variant && location.includes('/product')) {
          const url = new window.URL(location);
          const params = url.searchParams;
          params.set('variant', variant.id);
          if (plan && plan.detail && plan.detail.id && this.productState.hasPlan) {
            params.set('selling_plan', plan.detail.id);
          } else {
            params.delete('selling_plan');
          }
          url.search = params.toString();
          const urlString = url.toString();
          window.history.replaceState({path: urlString}, '', urlString);
        }
      }

      updateRemaining(formState) {
        const variant = formState.variant;
        const remainingClasses = [classes$M.remainingIn, classes$M.remainingOut, classes$M.remainingUnavailable, classes$M.remainingLow];

        if (variant && this.remainingWrapper && this.remainingJSON) {
          const remaining = this.remainingJSON[variant.id];

          if (remaining === 'out' || remaining < 1) {
            this.remainingWrapper.classList.remove(...remainingClasses);
            this.remainingWrapper.classList.add(classes$M.remainingOut);
          }

          if (remaining === 'in' || remaining >= this.remainingMaxInt) {
            this.remainingWrapper.classList.remove(...remainingClasses);
            this.remainingWrapper.classList.add(classes$M.remainingIn);
          }

          if (remaining === 'low' || (remaining > 0 && remaining < this.remainingMaxInt)) {
            this.remainingWrapper.classList.remove(...remainingClasses);
            this.remainingWrapper.classList.add(classes$M.remainingLow);

            if (this.remainingCount) {
              this.remainingCount.innerHTML = remaining;
            }
          }
        } else if (!variant && this.remainingWrapper) {
          this.remainingWrapper.classList.remove(...remainingClasses);
          this.remainingWrapper.classList.add(classes$M.remainingUnavailable);
        }
      }

      checkLiveCartInfo(formState) {
        const state = formState ? formState : this.productForm.getFormState();
        const variant = state.variant;
        if (!variant) return;

        const productUrl = `${theme.routes.root}products/${this.productJSON.handle}?section_id=api-live-cart-info&variant=${variant.id}`;

        fetch(productUrl)
          .then((response) => response.text())
          .then((data) => {
            const markup = new DOMParser().parseFromString(data, 'text/html');
            const itemCountForVariant = Number(markup.querySelector(selectors$U.itemCountForVariant).innerHTML);
            const maxInventory = markup.querySelector(selectors$U.maxInventory).innerHTML;
            const maxInventoryCount = Number(maxInventory);
            const addingMoreThanAvailable = Boolean(this.productForm.quantity() + itemCountForVariant > maxInventoryCount);
            const maxInventoryReached = maxInventory !== '' ? addingMoreThanAvailable : false;
            const errorMessagePosition = maxInventory !== '' && itemCountForVariant === maxInventoryCount ? 'form' : 'cart';

            this.productForm.element.setAttribute(attributes$E.maxInventoryReached, maxInventoryReached);
            this.productForm.element.setAttribute(attributes$E.errorMessagePosition, errorMessagePosition);
          })
          .catch((error) => console.log('error: ', error));
      }

      equalizeImageOptionContainers() {
        if (this.variantOptionImages.length <= 1) return;

        const heights = [...this.variantOptionImages].map((item) => Math.floor(item.offsetHeight));
        const widths = [...this.variantOptionImages].map((item) => Math.floor(item.offsetWidth));
        const widest = Math.max(...widths);
        const tallest = Math.max(...heights);

        this.variantButtonsContainer.style.setProperty('--option-image-width', widest + 'px');
        this.variantButtonsContainer.style.setProperty('--option-image-height', tallest + 'px');
      }

      getBaseUnit(variant) {
        return variant.unit_price_measurement.reference_value === 1
          ? variant.unit_price_measurement.reference_unit
          : variant.unit_price_measurement.reference_value + variant.unit_price_measurement.reference_unit;
      }

      subsToggleListeners() {
        const toggles = this.container.querySelectorAll(selectors$U.subsToggle);

        toggles.forEach((toggle) => {
          toggle.addEventListener(
            'change',
            function (e) {
              const val = e.target.value.toString();
              const selected = this.container.querySelector(`[${selectors$U.subsChild}="${val}"]`);
              const groups = this.container.querySelectorAll(`[${selectors$U.subsChild}]`);
              if (selected) {
                selected.classList.remove(classes$M.hidden);
                const first = selected.querySelector('[name="selling_plan"]');
                first.checked = true;
                first.dispatchEvent(new Event('change'));
              }
              groups.forEach((group) => {
                if (group !== selected) {
                  group.classList.add(classes$M.hidden);
                  const plans = group.querySelectorAll('[name="selling_plan"]');
                  plans.forEach((plan) => {
                    plan.checked = false;
                    plan.dispatchEvent(new Event('change'));
                  });
                }
              });
            }.bind(this)
          );
        });
      }

      updateSaleText(formState) {
        if (this.productState.planSale) {
          this.updateSaleTextSubscription(formState);
        } else if (this.productState.onSale) {
          this.updateSaleTextStandard(formState);
        } else if (this.priceOffWrap) {
          this.priceOffWrap.classList.add(classes$M.hidden);
        }
      }

      isVariantFinalSale(variant) {
        const metafieldsData = document.querySelector(selectors$U.variantFinalSaleMeta)?.textContent;
        if (!metafieldsData) return;

        const variantsMetafields = JSON.parse(metafieldsData);
        let variantIsFinalSale = false;

        variantsMetafields.forEach((variantMetafield) => {
          if (Number(variantMetafield.variant_id) === variant.id) {
            variantIsFinalSale = variantMetafield.metafield_value === 'true';
          }
        });

        return variantIsFinalSale;
      }

      updateSaleTextStandard(formState) {
        if (!this.priceOffWrap) {
          return;
        }

        const variant = formState.variant;
        const finalSaleBadge = this.priceOffWrap?.querySelector(selectors$U.finalSaleBadge);
        const comparePrice = variant?.compare_at_price;
        const salePrice = variant?.price;

        if (window.theme.settings.showSavingBadge) {
          if (window.theme.settings.savingBadgeType && window.theme.settings.savingBadgeType === 'percentage') {
            const discountFloat = (comparePrice - salePrice) / comparePrice;
            const discountInt = Math.floor(discountFloat * 100);
            this.priceOffAmount.innerHTML = `${discountInt}%`;
          } else {
            const discount = comparePrice - salePrice;
            this.priceOffAmount.innerHTML = themeCurrency.formatMoney(discount, theme.moneyFormat);
          }
        }

        // Display or hide the final sale badge
        const isFinalSale = this.priceOffWrap?.hasAttribute(attributes$E.finalSale) || this.isVariantFinalSale(variant);
        if (finalSaleBadge) {
          finalSaleBadge.classList.toggle(classes$M.hidden, !isFinalSale);
        }

        this.priceOffWrap.classList.remove(classes$M.hidden);
      }

      updateSaleTextSubscription(formState) {
        const variant = formState.variant;
        const variantFirstPlan = this.productForm.product.selling_plan_groups.find((plan) => plan.id === variant.selling_plan_allocations[0].selling_plan_group_id);
        const adjustment = formState.plan ? formState.plan.detail.price_adjustments[0] : variantFirstPlan.selling_plans[0].price_adjustments[0];
        const discount = adjustment.value || 0;
        const saleText = adjustment.value_type === 'percentage' ? `${discount}%` : themeCurrency.formatMoney(variant.price - discount, theme.moneyFormat);

        this.priceOffAmount.innerHTML = saleText;
        this.priceOffWrap.classList.remove(classes$M.hidden);
      }

      updateSubscriptionText(formState) {
        if (formState.plan && this.planDecription && formState.plan.detail.description !== null) {
          this.planDecription.innerHTML = formState.plan.detail.description;
          this.planDecription.classList.remove(classes$M.hidden);
        } else if (this.planDecription) {
          this.planDecription.classList.add(classes$M.hidden);
        }
      }

      updateProductPrices(formState) {
        const variant = formState.variant;
        const plan = formState.plan;
        const priceWrappers = this.container.querySelectorAll(selectors$U.priceWrapper);

        priceWrappers.forEach((wrap) => {
          const comparePriceEl = wrap.querySelector(selectors$U.comparePrice);
          const productPriceEl = wrap.querySelector(selectors$U.productPrice);

          let comparePrice = '';
          let price = '';

          if (this.productState.available) {
            comparePrice = variant.compare_at_price;
            price = variant.price;
          }

          if (this.productState.hasPlan) {
            const allocationPrice = plan ? plan.allocation.price : variant.selling_plan_allocations[0].per_delivery_price;
            price = allocationPrice;
          }

          if (this.productState.planSale) {
            const allocationPrice = plan ? plan.allocation.price : variant.selling_plan_allocations[0].per_delivery_price;
            const allocationPriceCompare = plan ? plan.allocation.compare_at_price : variant.selling_plan_allocations[0].compare_at_price;
            comparePrice = allocationPriceCompare;
            price = allocationPrice;
          }

          if (comparePriceEl) {
            if (this.productState.onSale || this.productState.planSale) {
              comparePriceEl.classList.remove(classes$M.hidden);
              productPriceEl.classList.add(classes$M.productPriceSale);
            } else {
              comparePriceEl.classList.add(classes$M.hidden);
              productPriceEl.classList.remove(classes$M.productPriceSale);
            }
            comparePriceEl.innerHTML = theme.settings.currency_code_enable ? themeCurrency.formatMoney(comparePrice, theme.moneyWithCurrencyFormat) : themeCurrency.formatMoney(comparePrice, theme.moneyFormat);
          }

          if (productPriceEl) {
            if (wrap.hasAttribute(attributes$E.addToCartButton)) {
              const multiplier = this.productForm.quantity();
              price *= multiplier;
            }

            if (price === 0) {
              productPriceEl.innerHTML = window.theme.strings.free;
            } else {
              productPriceEl.innerHTML = theme.settings.currency_code_enable ? themeCurrency.formatMoney(price, theme.moneyWithCurrencyFormat) : themeCurrency.formatMoney(price, theme.moneyFormat);
            }
          }
        });

        if (this.hasUnitPricing) {
          this.updateProductUnits(formState);
        }
      }

      updateProductUnits(formState) {
        const variant = formState.variant;
        const plan = formState.plan;
        let unitPrice = null;

        if ((variant && variant.unit_price) || (!plan && !variant.requires_selling_plan)) {
          unitPrice = variant.unit_price;
        }
        if (plan && plan?.allocation && plan?.allocation.unit_price) {
          unitPrice = plan.allocation.unit_price;
        }
        if (!plan && variant.requires_selling_plan && variant.selling_plan_allocations) {
          if (variant.selling_plan_allocations.length > 0) {
            const allocationUnitPrice = variant.selling_plan_allocations[0].unit_price;
            unitPrice = allocationUnitPrice;
          }
        }

        if (unitPrice) {
          const base = this.getBaseUnit(variant);
          const formattedPrice = unitPrice === 0 ? window.theme.strings.free : themeCurrency.formatMoney(unitPrice, theme.moneyFormat);
          this.container.querySelector(selectors$U.unitPrice).innerHTML = formattedPrice;
          this.container.querySelector(selectors$U.unitBase).innerHTML = base;
          showElement(this.container.querySelector(selectors$U.unitWrapper));
        } else {
          hideElement(this.container.querySelector(selectors$U.unitWrapper));
        }
      }

      fireHookEvent(formState) {
        const variant = formState.variant;

        // Hook for product variant change event
        this.container.dispatchEvent(
          new CustomEvent('theme:variant:change', {
            detail: {
              variant: variant,
            },
            bubbles: true,
          })
        );
      }

      /**
       * Tracks aspects of the product state that are relevant to UI updates
       * @param {object} evt - variant change event
       * @return {object} productState - represents state of variant + plans
       *  productState.available - current variant and selling plan options result in valid offer
       *  productState.soldOut - variant is sold out
       *  productState.onSale - variant is on sale
       *  productState.showUnitPrice - variant has unit price
       *  productState.requiresPlan - all the product variants requires a selling plan
       *  productState.hasPlan - there is a valid selling plan
       *  productState.planSale - plan has a discount to show next to price
       *  productState.planPerDelivery - plan price does not equal per_delivery_price - a prepaid subscribtion
       */
      setProductState(dataset) {
        const variant = dataset.variant;
        const plan = dataset.plan;

        const productState = {
          available: true,
          soldOut: false,
          onSale: false,
          showUnitPrice: false,
          requiresPlan: false,
          hasPlan: false,
          planPerDelivery: false,
          planSale: false,
        };

        if (!variant) {
          productState.available = false;
        } else {
          const requiresPlan = variant.requires_selling_plan || false;

          if (!variant.available) {
            productState.soldOut = true;
          }

          if (variant.compare_at_price > variant.price) {
            productState.onSale = true;
          }

          if (variant.unit_price) {
            productState.showUnitPrice = true;
          }

          if (this.product && this.product.requires_selling_plan) {
            productState.requiresPlan = true;
          }

          if (plan && this.subPrices) {
            productState.hasPlan = true;
            if (plan.allocation.per_delivery_price !== plan.allocation.price) {
              productState.planPerDelivery = true;
            }
            if (variant.price > plan.allocation.price) {
              productState.planSale = true;
            }
          }

          if (!plan && requiresPlan) {
            productState.hasPlan = true;
            if (variant.selling_plan_allocations[0].per_delivery_price !== variant.selling_plan_allocations[0].price) {
              productState.planPerDelivery = true;
            }
            if (variant.price > variant.selling_plan_allocations[0].price) {
              productState.planSale = true;
            }
          }
        }
        return productState;
      }

      updateProductImage(evt) {
        const variant = evt.dataset.variant;

        if (!variant || !variant?.featured_media) {
          return;
        }

        // Update variant image, if one is set
        const newImg = this.container.querySelector(`${selectors$U.productImage}[${attributes$E.productImageId}="${variant.featured_media.id}"]`);
        const newImageParent = newImg?.closest(selectors$U.productSlide);

        if (newImageParent) {
          const newImagePos = parseInt([...newImageParent.parentElement.children].indexOf(newImageParent));
          const imgSlider = this.container.querySelector(selectors$U.productMediaSlider);
          const flkty = Flickity.data(imgSlider);

          // Activate image slide in mobile view
          if (flkty && flkty.isActive) {
            const variantSlide = imgSlider.querySelector(`[data-id="${variant.featured_media.id}"]`);

            if (variantSlide) {
              const slideIndex = parseInt([...variantSlide.parentNode.children].indexOf(variantSlide));
              flkty.select(slideIndex);
            }
            return;
          }

          if (this.tallLayout) {
            // We know its a tall layout, if it's sticky
            // scroll to the images
            // Scroll to/reorder image unless it's the first photo on load
            const newImgTop = newImg.getBoundingClientRect().top;

            if (newImagePos === 0 && newImgTop + window.scrollY > window.pageYOffset) return;

            // Scroll to variant image
            document.dispatchEvent(
              new CustomEvent('theme:tooltip:close', {
                bubbles: false,
                detail: {
                  hideTransition: false,
                },
              })
            );

            scrollTo(newImgTop);
          }
        }
      }

      observeSwatch(formState) {
        const swatch = this.swatchesContainer.querySelector(`[${attributes$E.swatchVariant}*="${formState.variant.id}"]`);
        this.swatchesContainer.closest(selectors$U.selectorWrapper).classList.remove(classes$M.selectorVisible);

        let observer = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              const notVisible = entry.intersectionRatio == 0;

              if (notVisible) {
                this.swatchesContainer.closest(selectors$U.selectorWrapper).classList.add(classes$M.selectorVisible);
              }
            });
          },
          {
            root: this.container,
            threshold: [0.95, 1],
          }
        );
        observer.observe(swatch);
      }

      observeContainer() {
        let button = this.buyItNow.querySelector(selectors$U.shopifyPaymentButton);
        if (button) {
          // Add Buy It Now button styles
          button.classList.add(window.theme.settings.buynowButtonColor);
          button.classList.add(window.theme.settings.buynowButtonStyle);
          button.classList.add(window.theme.settings.buynowButtonSize);

          // Check if button is loaded and add the hover-button element
          this.insertHoverElement(button);
          return;
        }

        this.mutationObserver = new MutationObserver((mutationList) => {
          for (const mutation of mutationList) {
            if (mutation.type === 'childList') {
              // Find the payment button and add the hover-button element
              const button = mutation.target.querySelector(selectors$U.shopifyPaymentButton);
              if (button) {
                this.insertHoverElement(button);

                this.mutationObserver?.disconnect(); // Stop observing once the button is found and modified
                this.mutationObserver = null;
              }
            }
          }
        });

        // Start observing the 'data-buy-it-now' for the childList changes
        this.mutationObserver.observe(this.buyItNow, {
          childList: true, // Look for added nodes
          subtree: true, // Observe all descendants
        });
      }

      insertHoverElement(button) {
        // Wrap the inner of the payment button in hover-button custom element
        const buttonInner = button.innerHTML;
        button.innerHTML = `<hover-button>${buttonInner}</hover-button>`;
      }

      /**
       * Scroll to the last submitted notification form
       */
      scrollToForm(section) {
        const headerHeight = document.querySelector(selectors$U.header)?.dataset.height;
        const isVisible = visibilityHelper.isElementPartiallyVisible(section) || visibilityHelper.isElementTotallyVisible(section);

        if (!isVisible) {
          setTimeout(() => {
            const rect = section.getBoundingClientRect();
            const sectionTop = rect.top - headerHeight;

            window.scrollTo({
              top: sectionTop,
              left: 0,
              behavior: 'smooth',
            });
          }, 400);
        }
      }

      onUnload() {
        if (this.productForm) this.productForm.destroy();
        if (this.hasVariantOptionWithImage) window.removeEventListener('theme:resize:width', this.onResizeCallback);
        document.removeEventListener('theme:cart:close', this.checkLiveCartInfoCallback);
      }
    }

    const productFormSection = {
      onLoad() {
        sections$B[this.id] = new ProductAddForm(this.container);
      },
      onUnload() {
        sections$B[this.id].onUnload();
      },
    };

    const selectors$T = {
      addToCart: '[data-add-to-cart]',
      deferredMedia: '[data-deferred-media]',
      deferredMediaButton: '[data-deferred-media-button]',
      popupClose: '[data-popup-close]',
      quickViewInner: '[data-quick-view-inner]',
      quickViewItemHolder: '[data-quick-view-item-holder]',
      product: '[data-product]',
      productForm: '[data-product-form]',
      productMediaSlider: '[data-product-single-media-slider]',
      productMediaWrapper: '[data-product-single-media-wrapper]',
      productModel: '[data-model]',
      productJSON: '[data-product-json]',
      quickViewFootInner: '[data-quick-view-foot-inner]',
      shopTheLookThumb: '[data-shop-the-look-thumb]',
      tooltip: '[data-tooltip]',
      drawerToggle: '[data-drawer-toggle]',
      quickViewFocus: '[data-quick-view-focus]',
    };

    const classes$L = {
      hasMediaActive: 'has-media-active',
      isActive: 'is-active',
      isLoading: 'is-loading',
      mediaHidden: 'media--hidden',
      noOutline: 'no-outline',
      notificationPopupVisible: 'notification-popup-visible',
      popupQuickViewAnimateIn: 'popup-quick-view--animate-in',
      popupQuickViewAnimateOut: 'popup-quick-view--animate-out',
      popupQuickViewAnimated: 'popup-quick-view--animated',
      popupQuickView: 'popup-quick-view',
      jsQuickViewVisible: 'js-quick-view-visible',
      jsQuickViewFromCart: 'js-quick-view-from-cart',
      drawerOpen: 'js-drawer-open',
    };

    const attributes$D = {
      id: 'id',
      mediaId: 'data-media-id',
      sectionId: 'data-section-id',
      handle: 'data-handle',
      loaded: 'loaded',
      quickViewOnboarding: 'data-quick-view-onboarding',
      hotspot: 'data-hotspot',
      hotspotRef: 'data-hotspot-ref',
    };

    const ids = {
      addToCartFormId: 'AddToCartForm--',
      addToCartId: 'AddToCart--',
    };

    class LoadQuickview {
      constructor(popup, pswpElement) {
        this.popup = popup;
        this.pswpElement = pswpElement;
        this.quickViewFoot = this.pswpElement.querySelector(selectors$T.quickViewFootInner);
        this.quickViewInner = this.pswpElement.querySelector(selectors$T.quickViewInner);
        this.product = this.pswpElement.querySelectorAll(selectors$T.product);
        this.flkty = [];
        this.videos = [];
        this.productForms = [];
        this.deferredMedias = this.pswpElement.querySelectorAll(selectors$T.deferredMedia);
        this.buttonsShopTheLookThumb = this.pswpElement.querySelectorAll(selectors$T.shopTheLookThumb);
        this.quickViewItemHolders = this.pswpElement.querySelectorAll(selectors$T.quickViewItemHolder);
        this.popupCloseButtons = this.quickViewInner.querySelectorAll(selectors$T.popupClose);
        this.a11y = a11y;

        this.prevent3dModelSubmitEvent = (event) => this.prevent3dModelSubmit(event);
        this.closeOnAnimationEndEvent = (event) => this.closeOnAnimationEnd(event);
        this.closeOnEscapeEvent = (event) => this.closeOnEscape(event);

        this.outerCloseEvent = (event) => {
          if (!this.quickViewInner.contains(event.target)) {
            // Check if quickview has drawer
            const drawer = this.quickViewInner.nextElementSibling;
            if (drawer && drawer.contains(event.target)) return;

            this.closePopup(event);
          }
        };

        this.product.forEach((item, index) => {
          const isQuickViewOnboarding = item.hasAttribute(attributes$D.quickViewOnboarding);

          if (!isQuickViewOnboarding) {
            this.initItems(item, index);
          }
        });

        this.init();
        this.initTooltips();

        // Check swatches containers height
        this.swatchesContainer = new SwatchesContainer(this.pswpElement);
      }

      /*
       * Init tooltips for swatches
       */
      initTooltips() {
        this.tooltips = this.pswpElement.querySelectorAll(selectors$T.tooltip);
        this.tooltips.forEach((tooltip) => {
          new Tooltip(tooltip);
        });
      }

      handleDraggable(slider, draggableStatus) {
        if (!slider) return;

        slider.options.draggable = Boolean(draggableStatus);
        slider.updateDraggable();
      }

      initItems(item, index) {
        this.addFormSuffix(item);
        this.initProductSlider(item, index);
        this.initProductVideo(item);
        this.initProductModel(item);
        this.initShopifyXrLaunch(item);

        // Init swatches
        makeSwatches(item);

        // Init drawer
        const drawerToggles = this.pswpElement.querySelectorAll(selectors$T.drawerToggle);
        if (drawerToggles.length) {
          new Drawer(item);
        }

        // Wrap tables
        wrapElements(item);

        const productForm = new ProductAddForm(item.parentNode);
        this.productForms.push(productForm);

        if (Shopify.PaymentButton) {
          Shopify.PaymentButton.init();
        }

        item.classList.remove(classes$L.isLoading);
      }

      init() {
        // Prevent 3d models button redirecting to cart page when enabling/disabling the model a couple of times
        document.addEventListener('submit', this.prevent3dModelSubmitEvent);

        // Custom closing events
        this.popupCloseButtons.forEach((popupClose) => {
          popupClose.addEventListener('keyup', (event) => {
            if (event.code === theme.keyboardKeys.ENTER || event.code === theme.keyboardKeys.NUMPADENTER || event.code === theme.keyboardKeys.SPACE) {
              this.closePopup(event);
            }
          });

          popupClose.addEventListener('click', (event) => {
            this.closePopup(event);
          });
        });

        this.pswpElement.addEventListener('click', this.outerCloseEvent);

        document.dispatchEvent(new CustomEvent('theme:popup:open', {bubbles: true}));

        this.popup.listen('preventDragEvent', (e, isDown, preventObj) => {
          preventObj.prevent = false;
        });

        this.pswpElement.addEventListener('mousedown', () => {
          this.popup.framework.unbind(window, 'pointermove pointerup pointercancel', this.popup);
        });

        // Opening event
        this.popup.listen('initialZoomInEnd', () => {
          document.body.classList.add(classes$L.jsQuickViewVisible);
          const multipleItems = this.quickViewItemHolders.length > 0;
          const quickViewFocus = this.quickViewInner.querySelector(selectors$T.quickViewFocus);
          const activeItem = this.quickViewInner.querySelector(`${selectors$T.quickViewItemHolder}.${classes$L.isActive}`);
          const quickView = multipleItems ? activeItem.querySelector(selectors$T.quickViewFocus) : quickViewFocus;

          this.a11y.trapFocus({
            container: quickView,
          });
        });

        this.pswpElement.addEventListener('animationend', this.closeOnAnimationEndEvent);

        this.popup.listen('destroy', () => {
          if (this.flkty.length > 0) {
            requestAnimationFrame(() => {
              this.flkty.forEach((slider) => slider.pausePlayer());
            });
          }
          document.body.classList.remove(classes$L.jsQuickViewVisible);
          document.removeEventListener('keyup', this.closeOnEscapeEvent);
          document.addEventListener('keyup', this.closeOnEscapeEvent);
          this.pswpElement.removeEventListener('click', this.outerCloseEvent);
          this.pswpElement.removeEventListener('animationend', this.closeOnAnimationEndEvent);
          document.removeEventListener('submit', this.prevent3dModelSubmitEvent);

          this.deferredMedias.forEach((deferredMedia) => {
            // Remove the 'loaded' attribute so the videos will can load properly when we reopening the quickview
            deferredMedia.removeAttribute(attributes$D.loaded);

            // Pause videos on closing the popup
            const media = deferredMedia.closest(selectors$T.productMediaWrapper);
            media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
            media.classList.add(classes$L.mediaHidden);
          });
        });

        document.addEventListener('keyup', this.closeOnEscapeEvent);
        document.addEventListener('theme:cart:added', () => {
          if (this.pswpElement.classList.contains(classes$L.popupQuickView)) {
            this.pswpElement.classList.add(classes$L.popupQuickViewAnimateOut);
          }
        });

        this.animateInQuickview();

        // 'Shop the look' thumbnails nav
        this.initShopTheLookListeners();
      }

      initShopTheLookListeners() {
        this.buttonsShopTheLookThumb?.forEach((button) => {
          button.addEventListener('click', (event) => {
            event.preventDefault();

            const thumb = event.target.matches(selectors$T.shopTheLookThumb) ? event.target : event.target.closest(selectors$T.shopTheLookThumb);
            const holder = this.pswpElement.querySelector(`[${attributes$D.hotspot}="${thumb.getAttribute(attributes$D.hotspotRef)}"]`);
            const quickView = holder.querySelector(selectors$T.quickViewFocus);

            if (thumb.classList.contains(classes$L.isActive) || !holder) return;

            // Handle sliders
            if (this.flkty.length > 0) {
              requestAnimationFrame(() => {
                this.flkty.forEach((slider) => {
                  slider.resize();

                  const allMediaItems = this.quickViewInner.querySelectorAll(selectors$T.productMediaWrapper);

                  // Pause all media
                  if (allMediaItems.length) {
                    allMediaItems.forEach((media) => {
                      media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
                      media.classList.add(classes$L.mediaHidden);
                    });
                  }
                });
              });
            }

            // Active Quick View item class toggle
            holder.classList.add(classes$L.isActive);

            this.quickViewItemHolders.forEach((element) => {
              if (element !== holder) {
                element.classList.remove(classes$L.isActive);
              }
            });

            this.a11y.trapFocus({
              container: quickView,
            });
          });
        });
      }

      // Prevents the 3d model buttons submitting the form
      prevent3dModelSubmit(event) {
        if (event.submitter.closest(selectors$T.deferredMedia) && event.submitter.closest(selectors$T.productForm)) {
          event.preventDefault();
        }
      }

      closeQuickviewOnMobile() {
        if (window.innerWidth < window.theme.sizes.large && document.body.classList.contains(classes$L.jsQuickViewVisible)) {
          this.popup.close();
        }
      }

      animateInQuickview() {
        this.pswpElement.classList.add(classes$L.popupQuickViewAnimateIn);

        this.quickViewFoot.addEventListener('animationend', (event) => {
          this.handleAnimatedState(event);
        });

        // Mobile
        this.pswpElement.addEventListener('animationend', (event) => {
          this.handleAnimatedState(event, true);
        });
      }

      handleAnimatedState(event, isMobileAnimation = false) {
        if (event.animationName == 'quickViewAnimateInUp') {
          if (isMobileAnimation && window.innerWidth >= window.theme.sizes.small) {
            // Checks mobile animation but it's not mobile screen size
            return;
          }

          this.pswpElement.classList.add(classes$L.popupQuickViewAnimated);
          this.pswpElement.classList.remove(classes$L.popupQuickViewAnimateIn);
          document.body.classList.remove(classes$L.jsQuickViewFromCart); // Clear the class that we are adding in quick-view-popup.js when the animation ends

          removeLoadingClassFromLoadedImages(this.pswpElement); // Remove loading class from images
        }
      }

      closePopup(event) {
        event?.preventDefault();
        const isNavDrawerOpen = document.body.classList.contains(classes$L.drawerOpen);

        if (isNavDrawerOpen) {
          document.dispatchEvent(new CustomEvent('theme:drawer:closing', {bubbles: true}));
        }

        this.pswpElement.classList.add(classes$L.popupQuickViewAnimateOut); // Adding this class triggers the 'animationend' event which calls closeOnAnimationEndEvent()

        this.swatchesContainer.onUnload();
      }

      closeOnAnimationEnd(event) {
        if (event.animationName == 'quickViewAnimateOutRight' || event.animationName == 'quickViewAnimateOutDown') {
          this.popup.template.classList.remove(classes$L.popupQuickViewAnimateOut, classes$L.popupQuickViewAnimated);
          this.popup.close();

          if (this.productForms.length > 0) {
            this.productForms.forEach((form) => form.onUnload());
          }
        }
      }

      closeOnEscape(event) {
        const isQuickViewVisible = document.body.classList.contains(classes$L.jsQuickViewVisible);
        const isNotificationVisible = document.body.classList.contains(classes$L.notificationPopupVisible);

        if (event.code === theme.keyboardKeys.ESCAPE && isQuickViewVisible && !isNotificationVisible) {
          this.closePopup(event);
        }
      }

      initProductSlider(item, index) {
        const slider = item.querySelector(selectors$T.productMediaSlider);
        const mediaItems = item.querySelectorAll(selectors$T.productMediaWrapper);

        if (mediaItems.length > 1) {
          const itemSlider = new Flickity(slider, {
            wrapAround: true,
            cellAlign: 'left',
            pageDots: false,
            prevNextButtons: true,
            adaptiveHeight: false,
            pauseAutoPlayOnHover: false,
            selectedAttraction: 0.2,
            friction: 1,
            autoPlay: false,
            on: {
              ready: () => {
                // This resize should happen when the show animation of the PhotoSwipe starts and after PhotoSwipe adds the custom 'popup--quickview' class with the mainClass option.
                // This class is changing the slider width with CSS and looks like this is happening after the slider loads which is breaking it. That's why we need to call the resize() method here.
                requestAnimationFrame(() => {
                  itemSlider.resize();
                });
              },
              settle: () => {
                const currentSlide = itemSlider.selectedElement;
                const mediaId = currentSlide.getAttribute(attributes$D.mediaId);

                this.switchMedia(item, mediaId);
              },
            },
          });

          this.flkty.push(itemSlider);

          // Toggle flickity draggable functionality based on media play/pause state
          if (mediaItems.length) {
            mediaItems.forEach((element) => {
              element.addEventListener('theme:media:play', () => {
                this.handleDraggable(this.flkty[index], false);
                element.closest(selectors$T.productMediaSlider).classList.add(classes$L.hasMediaActive);
              });

              element.addEventListener('theme:media:pause', () => {
                this.handleDraggable(this.flkty[index], true);
                element.closest(selectors$T.productMediaSlider).classList.remove(classes$L.hasMediaActive);
              });
            });
          }

          // iOS smooth scrolling fix
          flickitySmoothScrolling(slider);
        }
      }

      switchMedia(item, mediaId) {
        const allMediaItems = this.quickViewInner.querySelectorAll(selectors$T.productMediaWrapper);
        const selectedMedia = item.querySelector(`${selectors$T.productMediaWrapper}[${attributes$D.mediaId}="${mediaId}"]`);
        const isFocusEnabled = !document.body.classList.contains(classes$L.noOutline);

        // Pause other media
        if (allMediaItems.length) {
          allMediaItems.forEach((media) => {
            media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
            media.classList.add(classes$L.mediaHidden);
          });
        }

        if (isFocusEnabled) {
          selectedMedia.focus();
        }

        selectedMedia.closest(selectors$T.productMediaSlider).classList.remove(classes$L.hasMediaActive);
        selectedMedia.classList.remove(classes$L.mediaHidden);
        selectedMedia.dispatchEvent(new CustomEvent('theme:media:visible'), {bubbles: true});

        // If media is not loaded, trigger poster button click to load it
        const deferredMedia = selectedMedia.querySelector(selectors$T.deferredMedia);
        if (deferredMedia && deferredMedia.getAttribute(attributes$D.loaded) !== 'true') {
          selectedMedia.querySelector(selectors$T.deferredMediaButton).dispatchEvent(new Event('click'));
        }
      }

      initProductVideo(item) {
        const videos = new ProductVideo(item);

        this.videos.push(videos);
      }

      initProductModel(item) {
        const sectionId = item.getAttribute(attributes$D.sectionId);
        const modelItems = item.querySelectorAll(selectors$T.productModel);

        if (modelItems.length) {
          modelItems.forEach((element) => {
            theme.ProductModel.init(element, sectionId);
          });
        }
      }

      initShopifyXrLaunch(item) {
        document.addEventListener('shopify_xr_launch', () => {
          const currentMedia = item.querySelector(`${selectors$T.productModel}:not(.${classes$L.mediaHidden})`);
          currentMedia.dispatchEvent(new CustomEvent('xrLaunch'));
        });
      }

      addFormSuffix(item) {
        const sectionId = item.getAttribute(attributes$D.sectionId);
        const productObject = JSON.parse(item.querySelector(selectors$T.productJSON).innerHTML);

        const formSuffix = `${sectionId}-${productObject.handle}`;
        const productForm = item.querySelector(selectors$T.productForm);
        const addToCart = item.querySelector(selectors$T.addToCart);

        productForm.setAttribute(attributes$D.id, ids.addToCartFormId + formSuffix);
        addToCart.setAttribute(attributes$D.id, ids.addToCartId + formSuffix);
      }
    }

    const settings$6 = {
      unlockScrollDelay: 400,
    };

    const selectors$S = {
      popupContainer: '.pswp',
      popupCloseBtn: '.pswp__custom-close',
      popupIframe: 'iframe, video',
      popupCustomIframe: '.pswp__custom-iframe',
      popupThumbs: '.pswp__thumbs',
      popupButtons: '.pswp__button, .pswp__caption-close',
      product: '[data-product]',
      productJSON: '[data-product-json]',
    };

    const classes$K = {
      current: 'is-current',
      customLoader: 'pswp--custom-loader',
      customOpen: 'pswp--custom-opening',
      loader: 'pswp__loader',
      opened: 'pswp--open',
      popupCloseButton: 'pswp__button--close',
      notificationPopup: 'pswp--notification',
      quickviewPopup: 'popup-quick-view',
      isCartDrawerOpen: 'js-drawer-open-cart',
      quickViewAnimateOut: 'popup-quick-view--animate-out',
    };

    const attributes$C = {
      dataOptionClasses: 'data-pswp-option-classes',
      dataVideoType: 'data-video-type',
    };

    const loaderHTML = `<div class="${classes$K.loader}"><div class="loader loader--image"><div class="loader__image"></div></div></div>`;

    class LoadPhotoswipe {
      constructor(items, options = '', templateIndex = 0, triggerButton = null) {
        this.items = items;
        this.triggerBtn = triggerButton;
        this.pswpElements = document.querySelectorAll(selectors$S.popupContainer);
        this.pswpElement = this.pswpElements[templateIndex];
        this.popup = null;
        this.popupThumbs = null;
        this.popupThumbsContainer = this.pswpElement.querySelector(selectors$S.popupThumbs);
        this.closeBtn = this.pswpElement.querySelector(selectors$S.popupCloseBtn);
        const defaultOptions = {
          history: false,
          focus: false,
          mainClass: '',
        };
        this.options = options !== '' ? options : defaultOptions;
        this.onCloseCallback = () => this.onClose();
        this.dispatchPopupInitEventCallback = () => this.dispatchPopupInitEvent();
        this.setCurrentThumbCallback = () => this.setCurrentThumb();
        this.loadingStateCallback = (event) => this.loadingState(event);
        this.a11y = a11y;

        this.init();
      }

      init() {
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));

        this.pswpElement.classList.add(classes$K.customOpen);

        this.initLoader();

        loadScript({url: window.theme.assets.photoswipe})
          .then(() => this.loadPopup())
          .catch((e) => console.error(e));
      }

      initLoader() {
        if (this.pswpElement.classList.contains(classes$K.customLoader) && this.options !== '' && this.options.mainClass) {
          this.pswpElement.setAttribute(attributes$C.dataOptionClasses, this.options.mainClass);
          let loaderElem = document.createElement('div');
          loaderElem.innerHTML = loaderHTML;
          loaderElem = loaderElem.firstChild;
          this.pswpElement.appendChild(loaderElem);
        } else {
          this.pswpElement.setAttribute(attributes$C.dataOptionClasses, '');
        }
      }

      loadPopup() {
        const PhotoSwipe = window.themePhotoswipe.PhotoSwipe.default;
        const PhotoSwipeUI = window.themePhotoswipe.PhotoSwipeUI.default;

        this.pswpElement.classList.remove(classes$K.customOpen);

        this.popup = new PhotoSwipe(this.pswpElement, PhotoSwipeUI, this.items, this.options);

        this.popup.listen('afterInit', this.dispatchPopupInitEventCallback);
        this.popup.listen('imageLoadComplete', this.setCurrentThumbCallback);
        this.popup.listen('imageLoadComplete', this.loadingStateCallback);
        this.popup.listen('beforeChange', this.setCurrentThumbCallback);
        this.popup.listen('close', this.onCloseCallback);

        this.popup.init();

        this.initPopupCallback();
      }

      loadingState(event) {
        if (event === this.options.index && this.pswpElement.classList.contains(classes$K.customLoader)) {
          this.pswpElement.classList.remove(classes$K.customLoader);
        }
      }

      initPopupCallback() {
        if (this.isVideo) {
          this.hideUnusedButtons();
        }

        this.initVideo();
        this.thumbsActions();

        this.a11y.trapFocus({
          container: this.pswpElement,
        });

        if (this.pswpElement.classList.contains(classes$K.quickviewPopup)) {
          new LoadQuickview(this.popup, this.pswpElement);
        }

        if (this.pswpElement.classList.contains(classes$K.notificationPopup)) {
          new LoadNotification(this.popup, this.pswpElement);
        }

        this.closePopup = () => {
          if (this.pswpElement.classList.contains(classes$K.quickviewPopup)) {
            this.pswpElement.classList.add(classes$K.quickViewAnimateOut); // Close the Quickview popup accordingly
          } else {
            this.popup.close();
          }
        };

        if (this.closeBtn) {
          this.closeBtn.addEventListener('click', this.closePopup);
        }

        // Close Quick view popup when product added to cart
        document.addEventListener('theme:cart:added', this.closePopup);
      }

      dispatchPopupInitEvent() {
        if (this.triggerBtn) {
          this.triggerBtn.dispatchEvent(new CustomEvent('theme:popup:init', {bubbles: true}));
        }
      }

      initVideo() {
        const videoContainer = this.pswpElement.querySelector(selectors$S.popupCustomIframe);
        if (videoContainer) {
          const videoType = videoContainer.getAttribute(attributes$C.dataVideoType);
          this.isVideo = true;

          if (videoType == 'youtube') {
            new LoadVideoYT(videoContainer.parentElement);
          } else if (videoType == 'vimeo') {
            new LoadVideoVimeo(videoContainer.parentElement);
          }
        }
      }

      thumbsActions() {
        if (this.popupThumbsContainer && this.popupThumbsContainer.firstChild) {
          this.popupThumbsContainer.addEventListener('wheel', (e) => this.stopDisabledScroll(e));
          this.popupThumbsContainer.addEventListener('mousewheel', (e) => this.stopDisabledScroll(e));
          this.popupThumbsContainer.addEventListener('DOMMouseScroll', (e) => this.stopDisabledScroll(e));

          this.popupThumbs = this.pswpElement.querySelectorAll(`${selectors$S.popupThumbs} > *`);
          this.popupThumbs.forEach((element, i) => {
            element.addEventListener('click', (e) => {
              e.preventDefault();
              element.parentElement.querySelector(`.${classes$K.current}`).classList.remove(classes$K.current);
              element.classList.add(classes$K.current);
              this.popup.goTo(i);
            });
          });
        }
      }

      hideUnusedButtons() {
        const buttons = this.pswpElement.querySelectorAll(selectors$S.popupButtons);
        buttons.forEach((element) => {
          if (!element.classList.contains(classes$K.popupCloseButton)) {
            element.style.display = 'none';
          }
        });
      }

      stopDisabledScroll(e) {
        e.stopPropagation();
      }

      onClose() {
        const popupIframe = this.pswpElement.querySelector(selectors$S.popupIframe);
        if (popupIframe) {
          popupIframe.parentNode.removeChild(popupIframe);
        }

        if (this.popupThumbsContainer && this.popupThumbsContainer.firstChild) {
          while (this.popupThumbsContainer.firstChild) {
            this.popupThumbsContainer.removeChild(this.popupThumbsContainer.firstChild);
          }
        }

        this.pswpElement.setAttribute(attributes$C.dataOptionClasses, '');
        const loaderElem = this.pswpElement.querySelector(`.${classes$K.loader}`);
        if (loaderElem) {
          this.pswpElement.removeChild(loaderElem);
        }

        if (!document.body.classList.contains(classes$K.isCartDrawerOpen)) {
          this.a11y.removeTrapFocus();
        }

        document.removeEventListener('theme:cart:added', this.closePopup);

        // Unlock scroll if only cart drawer is closed and there are no more popups opened
        setTimeout(() => {
          const recentlyOpenedPopups = this.recentlyOpenedPopupsCount();
          const isCartDrawerOpen = document.body.classList.contains(classes$K.isCartDrawerOpen);

          if (recentlyOpenedPopups === 0 && !isCartDrawerOpen) {
            document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
          }
        }, settings$6.unlockScrollDelay);
      }

      recentlyOpenedPopupsCount() {
        let count = 0;

        this.pswpElements.forEach((popup) => {
          const isOpened = popup.classList.contains(classes$K.opened);

          if (isOpened) {
            count += 1;
          }
        });

        return count;
      }

      setCurrentThumb() {
        const hasThumbnails = this.popupThumbsContainer && this.popupThumbsContainer.firstChild;

        if (hasThumbnails) return;

        const lastCurrentThumb = this.pswpElement.querySelector(`${selectors$S.popupThumbs} > .${classes$K.current}`);
        if (lastCurrentThumb) {
          lastCurrentThumb.classList.remove(classes$K.current);
        }

        if (!this.popupThumbs) {
          return;
        }
        const currentThumb = this.popupThumbs[this.popup.getCurrentIndex()];
        currentThumb.classList.add(classes$K.current);
        this.scrollThumbs(currentThumb);
      }

      scrollThumbs(currentThumb) {
        const thumbsContainerLeft = this.popupThumbsContainer.scrollLeft;
        const thumbsContainerWidth = this.popupThumbsContainer.offsetWidth;
        const thumbsContainerPos = thumbsContainerLeft + thumbsContainerWidth;
        const currentThumbLeft = currentThumb.offsetLeft;
        const currentThumbWidth = currentThumb.offsetWidth;
        const currentThumbPos = currentThumbLeft + currentThumbWidth;

        if (thumbsContainerPos <= currentThumbPos || thumbsContainerPos > currentThumbLeft) {
          const currentThumbMarginLeft = parseInt(window.getComputedStyle(currentThumb).marginLeft);
          this.popupThumbsContainer.scrollTo({
            top: 0,
            left: currentThumbLeft - currentThumbMarginLeft,
            behavior: 'smooth',
          });
        }
      }
    }

    const settings$5 = {
      templateIndex: 0,
    };

    const selectors$R = {
      buttonQuickView: '[data-button-quick-view]',
      quickViewItemsTemplate: '[data-quick-view-items-template]',
      cartDrawer: '[data-cart-drawer]',
      shopTheLookQuickViewButton: '[data-shop-the-look-quick-view-button]',
      shopTheLookThumb: '[data-shop-the-look-thumb]',
      quickViewItemHolder: '[data-quick-view-item-holder]',
    };

    const classes$J = {
      loading: 'is-loading',
      isActive: 'is-active',
      quickViewFromCart: 'js-quick-view-from-cart',
      mainClass: 'popup-quick-view pswp--not-close-btn',
      shopTheLookPopupClass: 'popup-quick-view popup-quick-view--shop-the-look pswp--not-close-btn',
    };

    const attributes$B = {
      loaded: 'data-loaded',
      handle: 'data-handle',
      variantId: 'data-variant-id',
      shopTheLookQuickView: 'data-shop-the-look-quick-view',
      hotspot: 'data-hotspot',
      quickButtonInit: 'data-initialized',
    };

    const options = {
      history: false,
      focus: false,
      mainClass: classes$J.mainClass,
      showHideOpacity: false, // we need that off to control the animation ourselves
      closeOnVerticalDrag: false,
      closeOnScroll: false,
      modal: false,
      escKey: false,
    };

    class QuickViewPopup {
      constructor(container) {
        this.container = container;
        this.a11y = a11y;
        this.buttonsQuickView = this.container.querySelectorAll(selectors$R.buttonQuickView);
        this.buttonsShopTheLookQuickView = this.container.querySelectorAll(selectors$R.shopTheLookQuickViewButton);
        this.popupInitCallback = (trigger) => this.popupInit(trigger);

        this.buttonsQuickView?.forEach((button) => {
          if (!button.hasAttribute(attributes$B.quickButtonInit)) {
            button.addEventListener('click', (event) => this.initPhotoswipe(event));
            button.addEventListener('theme:popup:init', () => {
              button.classList.remove(classes$J.loading);

              if (button.hasAttribute(attributes$B.shopTheLookQuickView)) {
                this.popupInitCallback(button);
              }
            });
            button.setAttribute(attributes$B.quickButtonInit, '');
          }
        });

        this.buttonsShopTheLookQuickView?.forEach((button) => {
          button.addEventListener('click', () => {
            const firstHotspotButton = [...this.buttonsQuickView].find((btn) => btn.hasAttribute(attributes$B.shopTheLookQuickView));
            firstHotspotButton?.dispatchEvent(new Event('click'));
          });
        });
      }

      popupInit(trigger) {
        // Handle active Quick View item
        const holder = this.loadPhotoswipe.pswpElement.querySelector(`[${attributes$B.hotspot}="${trigger.getAttribute(attributes$B.hotspot)}"]`);
        const quickViewItemHolders = this.loadPhotoswipe.pswpElement.querySelectorAll(selectors$R.quickViewItemHolder);

        holder.classList.add(classes$J.isActive);

        quickViewItemHolders.forEach((element) => {
          if (element !== holder) {
            element.classList.remove(classes$J.isActive);
          }
        });

        // Handle pointer events
        this.toggleQuickViewButtonsLoadingClasses(true);
        this.toggleQuickViewThumbsLoadingClasses(true);

        const onAnimationInEnd = (event) => {
          // Animation on open
          if (event.animationName === 'quickViewAnimateInUp') {
            requestAnimationFrame(() => {
              this.toggleQuickViewThumbsLoadingClasses(false);
            });
          }

          // Animation on close
          if (event.animationName === 'quickViewAnimateOutDown') {
            this.loadPhotoswipe.pswpElement.removeEventListener('animationend', onAnimationInEnd);
          }
        };

        this.loadPhotoswipe.pswpElement.addEventListener('animationend', onAnimationInEnd);

        this.loadPhotoswipe?.popup?.listen('destroy', () => {
          this.toggleQuickViewButtonsLoadingClasses(false);
          this.toggleQuickViewThumbsLoadingClasses(false);
        });
      }

      toggleQuickViewButtonsLoadingClasses(isLoading = true) {
        if (isLoading) {
          this.buttonsQuickView?.forEach((element) => {
            element.classList.add(classes$J.loading);
          });
          return;
        }

        this.buttonsQuickView?.forEach((element) => {
          element.classList.remove(classes$J.loading);
        });
      }

      toggleQuickViewThumbsLoadingClasses(isLoading = true) {
        this.buttonsShopTheLookThumb = this.loadPhotoswipe?.pswpElement.querySelectorAll(selectors$R.shopTheLookThumb);

        if (isLoading) {
          this.buttonsShopTheLookThumb?.forEach((element) => {
            element.classList.add(classes$J.loading);
          });
          return;
        }

        this.buttonsShopTheLookThumb?.forEach((element) => {
          element.classList.remove(classes$J.loading);
        });
      }

      initPhotoswipe(event) {
        event.preventDefault();

        const button = event.target.matches(selectors$R.buttonQuickView) ? event.target : event.target.closest(selectors$R.buttonQuickView);
        const isMobile = window.innerWidth < theme.sizes.small;
        let quickViewVariant = '';
        let isShopTheLookPopupTrigger = false;

        if (button.hasAttribute(attributes$B.shopTheLookQuickView)) {
          if (!isMobile) return;
          isShopTheLookPopupTrigger = true;
        }

        options.mainClass = classes$J.mainClass;
        button.classList.add(classes$J.loading);

        // Add class js-quick-view-from-cart to change the default Quick view animation
        if (button.closest(selectors$R.cartDrawer)) {
          document.body.classList.add(classes$J.quickViewFromCart);
        }

        // Set the trigger element before calling trapFocus
        this.a11y.state.trigger = button;
        // Set main trigger element for inner popups (Size chart)
        this.a11y.state.mainTrigger = this.a11y.state.trigger;

        if (button.hasAttribute(attributes$B.variantId)) {
          quickViewVariant = `&variant=${button.getAttribute(attributes$B.variantId)}`;
        }

        const productUrl = `${theme.routes.root}products/${button.getAttribute(attributes$B.handle)}?section_id=api-quickview${quickViewVariant}`;

        if (isShopTheLookPopupTrigger) {
          options.mainClass = classes$J.shopTheLookPopupClass;

          this.buttonsQuickView.forEach((element) => {
            element.classList.add(classes$J.loading);
          });

          const XMLS = new XMLSerializer();
          const quickViewItemsTemplate = this.container.querySelector(selectors$R.quickViewItemsTemplate).content.firstElementChild.cloneNode(true);

          const itemsData = XMLS.serializeToString(quickViewItemsTemplate);

          this.loadPhotoswipeWithTemplate(itemsData, button);
        } else {
          this.loadPhotoswipeFromFetch(productUrl, button);
        }
      }

      loadPhotoswipeWithTemplate(data, button) {
        const items = [
          {
            html: data,
          },
        ];

        this.loadPhotoswipe = new LoadPhotoswipe(items, options, settings$5.templateIndex, button);
      }

      loadPhotoswipeFromFetch(url, button) {
        fetch(url)
          .then((response) => {
            return response.text();
          })
          .then((data) => {
            const items = [
              {
                html: data,
              },
            ];

            this.loadPhotoswipe = new LoadPhotoswipe(items, options, settings$5.templateIndex, button);
          })
          .catch((error) => console.log('error: ', error));
      }
    }

    const settings$4 = {
      cartDrawerEnabled: window.theme.settings.cartType === 'drawer',
      timers: {
        addProductTimeout: 1000,
      },
      animations: {
        data: 'data-aos',
        method: 'fade-up',
      },
    };

    const selectors$Q = {
      outerSection: '[data-section-id]',
      aos: '[data-aos]',
      additionalCheckoutButtons: '[data-additional-checkout-button]',
      apiContent: '[data-api-content]',
      apiLineItems: '[data-api-line-items]',
      apiUpsellItems: '[data-api-upsell-items]',
      apiCartPrice: '[data-api-cart-price]',
      buttonAddToCart: '[data-add-to-cart]',
      upsellButtonByHandle: '[data-handle]',
      cartCloseError: '[data-cart-error-close]',
      cartDrawer: '[data-cart-drawer]',
      cartDrawerTemplate: '[data-cart-drawer-template]',
      cartDrawerToggle: '[data-cart-drawer-toggle]',
      cartDrawerBody: '[data-cart-drawer-body]',
      cartErrors: '[data-cart-errors]',
      cartForm: '[data-cart-form]',
      cartTermsCheckbox: '[data-cart-acceptance-checkbox]',
      cartCheckoutButtonWrapper: '[data-cart-checkout-buttons]',
      cartCheckoutButton: '[data-cart-checkout-button]',
      cartItemRemove: '[data-item-remove]',
      cartItemsQty: '[data-cart-items-qty]',
      cartTotal: '[data-cart-total]',
      cartTotalPrice: '[data-cart-total-price]',
      cartMessage: '[data-cart-message]',
      cartMessageDefault: '[data-message-default]',
      cartPage: '[data-cart-page]',
      cartProgress: '[data-cart-message-progress]',
      emptyMessage: '[data-empty-message]',
      emptyMessageBottom: '[data-empty-message-bottom]',
      buttonHolder: '[data-foot-holder]',
      item: '[data-cart-item]',
      itemsHolder: '[data-items-holder]',
      itemsWrapper: '[data-items-wrapper]',
      formCloseError: '[data-close-error]',
      formErrorsContainer: '[data-cart-errors-container]',
      upsellHolder: '[data-upsell-holder]',
      errorMessage: '[data-error-message]',
      termsErrorMessage: '[data-terms-error-message]',
      pairProductsHolder: '[data-pair-products-holder]',
      cartNoteHolder: '[data-cart-notes-holder]',
      pairProducts: '[data-pair-products]',
      priceHolder: '[data-cart-price-holder]',
      leftToSpend: '[data-left-to-spend]',
      quickBuyForm: '[data-quickbuy-form]',
      qtyInput: '[data-quantity-field]',
      productItem: '[data-product-block]',
      productMediaContainer: '[data-product-media-container]',
      formWrapper: '[data-form-wrapper]',
      productForm: '[data-product-form], [data-product-form-upsell]',
      popupQuickView: '.popup-quick-view',
      popupClose: '[data-popup-close]',
      error: '[data-error]',
      quickViewOnboarding: '[data-quick-view-onboarding]',
      flickityEnabled: '.flickity-enabled',
      noscript: 'noscript',
      qtySelect: '[data-quantity-select]',
    };

    const classes$I = {
      hidden: 'hidden',
      added: 'is-added',
      isHidden: 'is-hidden',
      cartDrawerOpen: 'js-drawer-open-cart',
      open: 'is-open',
      visible: 'is-visible',
      expanded: 'is-expanded',
      loading: 'is-loading',
      disabled: 'is-disabled',
      success: 'is-success',
      error: 'has-error',
      cartItems: 'cart__toggle--has-items',
      variantSoldOut: 'variant--soldout',
      removed: 'is-removed',
      aosAnimate: 'aos-animate',
      updated: 'is-updated',
      noOutline: 'no-outline',
      productGridImageError: 'product-grid-item__image--error',
      contentVisibilityHidden: 'cv-h',
    };

    const attributes$A = {
      shippingMessageLimit: 'data-limit',
      cartMessageValue: 'data-cart-message',
      cartTotal: 'data-cart-total',
      ariaExpanded: 'aria-expanded',
      disabled: 'disabled',
      name: 'name',
      value: 'value',
      dataId: 'data-id',
      item: 'data-item',
      itemIndex: 'data-item-index',
      itemTitle: 'data-item-title',
      atcTrigger: 'data-atc-trigger',
      upsellButton: 'data-upsell-btn',
      notificationPopup: 'data-notification-popup',
      sectionId: 'data-section-id',
      recipientError: 'data-recipient-errors',
      maxInventoryReached: 'data-max-inventory-reached',
      errorMessagePosition: 'data-error-message-position',
      variantTitle: 'data-variant-title',
      qtyMax: 'data-quantity-max',
    };

    let sections$A = {};

    class CartDrawer {
      constructor() {
        if (window.location.pathname === '/password') {
          return;
        }

        this.init();
      }

      init() {
        // DOM Elements
        this.cartToggleButtons = document.querySelectorAll(selectors$Q.cartDrawerToggle);
        this.cartPage = document.querySelector(selectors$Q.cartPage);
        this.cartDrawer = document.querySelector(selectors$Q.cartDrawer);
        this.cart = this.cartDrawer || this.cartPage;

        this.cartCount = this.getCartItemCount();

        this.assignArguments();

        this.recipientErrors = this.form?.getAttribute(attributes$A.recipientError) === 'true';
        this.flktyUpsell = null;
        this.form = null;
        this.variantTitle = null;
        this.collapsible = null;
        this.a11y = a11y;

        this.build = this.build.bind(this);

        // AJAX request
        this.addToCart = this.addToCart.bind(this);
        this.updateCart = this.updateCart.bind(this);

        // Cart events
        this.openCartDrawer = this.openCartDrawer.bind(this);
        this.closeCartDrawer = this.closeCartDrawer.bind(this);
        this.toggleCartDrawer = this.toggleCartDrawer.bind(this);
        this.formSubmitHandler = throttle(this.formSubmitHandler.bind(this), 50);
        this.closeCartError = () => {
          this.cartErrorHolder.classList.remove(classes$I.expanded);
        };
        this.cartDrawerCloseEvent = null;

        // Checking
        this.hasItemsInCart = this.hasItemsInCart.bind(this);
        this.isCartPage = Boolean(this.cart && this.cartDrawer === null);

        // Set classes
        this.toggleClassesOnContainers = this.toggleClassesOnContainers.bind(this);

        // Flags
        this.totalItems = 0;
        this.isCartDrawerOpen = false;
        this.isCartDrawerLoaded = false;
        this.cartDiscounts = 0;
        this.cartDrawerEnabled = settings$4.cartDrawerEnabled;
        this.cartUpdateFailed = false;
        this.showCannotAddMoreInCart = false;

        // Cart Events
        this.cartEvents();
        this.cartAddEvent();
        this.cartDrawerToggleEvents();

        // Init cart update for fields
        this.initCartUpdate();

        // Init collapsible function for the cart accordions
        if (this.buttonHolder) {
          this.collapsible = new Collapsible(this.buttonHolder);
        }

        if (this.isCartPage) {
          this.renderPairProducts();
        }

        document.addEventListener('theme:popup:open', this.closeCartDrawer);
      }

      /**
       * Assign cart constructor arguments on page load or after cart drawer is loaded
       *
       * @return  {Void}
       */
      assignArguments() {
        this.outerSection = this.cart?.closest(selectors$Q.outerSection);
        this.cartDrawerBody = document.querySelector(selectors$Q.cartDrawerBody);
        this.emptyMessage = document.querySelector(selectors$Q.emptyMessage);
        this.emptyMessageBottom = document.querySelector(selectors$Q.emptyMessageBottom);
        this.buttonHolder = document.querySelector(selectors$Q.buttonHolder);
        this.itemsHolder = document.querySelector(selectors$Q.itemsHolder);
        this.cartItemsQty = document.querySelector(selectors$Q.cartItemsQty);
        this.itemsWrapper = document.querySelector(selectors$Q.itemsWrapper);
        this.items = document.querySelectorAll(selectors$Q.item);
        this.cartTotal = document.querySelector(selectors$Q.cartTotal);
        this.cartTotalPrice = document.querySelector(selectors$Q.cartTotalPrice);
        this.cartMessage = document.querySelectorAll(selectors$Q.cartMessage);
        this.cartOriginalTotal = document.querySelector(selectors$Q.cartOriginalTotal);
        this.cartErrorHolder = document.querySelector(selectors$Q.cartErrors);
        this.cartCloseErrorMessage = document.querySelector(selectors$Q.cartCloseError);
        this.pairProductsHolder = document.querySelector(selectors$Q.pairProductsHolder);
        this.cartNoteHolder = document.querySelector(selectors$Q.cartNoteHolder);
        this.pairProducts = document.querySelector(selectors$Q.pairProducts);
        this.priceHolder = document.querySelector(selectors$Q.priceHolder);
        this.upsellHolders = document.querySelectorAll(selectors$Q.upsellHolder);
        this.cartTermsCheckbox = document.querySelector(selectors$Q.cartTermsCheckbox);
        this.cartCheckoutButtonWrapper = document.querySelector(selectors$Q.cartCheckoutButtonWrapper);
        this.cartCheckoutButton = document.querySelector(selectors$Q.cartCheckoutButton);
        this.cartForm = document.querySelector(selectors$Q.cartForm);
        this.cartItemCount = 0;
        this.subtotal = window.theme.subtotal;
        this.button = null;

        const {headerInitialHeight, announcementBarHeight} = readHeights();
        this.headerInitialHeight = headerInitialHeight;
        this.announcementBarHeight = announcementBarHeight;

        if (this.cartMessage.length > 0) {
          this.cartFreeLimitShipping = Number(this.cartMessage[0].getAttribute(attributes$A.shippingMessageLimit)) * 100 * window.Shopify.currency.rate;
        }

        this.updateProgress();
      }

      /**
       * Init cart item update functionality
       *
       * @return  {Void}
       */

      initCartUpdate() {
        this.items = document.querySelectorAll(selectors$Q.item);

        this.items?.forEach((item) => {
          this.cartUpdateEvent(item);
        });
      }

      /**
       * Custom event who change the cart
       *
       * @return  {Void}
       */

      cartUpdateEvent(item) {
        item.addEventListener('theme:cart:update', (event) => {
          this.updateCart(
            {
              id: event.detail.id,
              quantity: event.detail.quantity,
            },
            item
          );
        });
      }

      /**
       * Cart events
       *
       * @return  {Void}
       */

      cartEvents() {
        const cartItemRemove = document.querySelectorAll(selectors$Q.cartItemRemove);
        this.totalItems = cartItemRemove.length;

        cartItemRemove?.forEach((button) => {
          const item = button.closest(selectors$Q.item);
          button.addEventListener('click', (event) => {
            event.preventDefault();

            if (button.classList.contains(classes$I.disabled)) return;

            this.updateCart(
              {
                id: item.getAttribute(attributes$A.dataId),
                quantity: 0,
              },
              item
            );
          });
        });

        if (this.cartCloseErrorMessage) {
          this.cartCloseErrorMessage.removeEventListener('click', this.closeCartError);
          this.cartCloseErrorMessage.addEventListener('click', this.closeCartError);
        }

        if (this.cartTermsCheckbox) {
          this.cartTermsCheckbox.removeEventListener('change', this.formSubmitHandler);
          this.cartCheckoutButtonWrapper.removeEventListener('click', this.formSubmitHandler);
          this.cartForm.removeEventListener('submit', this.formSubmitHandler);

          this.cartTermsCheckbox.addEventListener('change', this.formSubmitHandler);
          this.cartCheckoutButtonWrapper.addEventListener('click', this.formSubmitHandler);
          this.cartForm.addEventListener('submit', this.formSubmitHandler);
        }
      }

      /**
       * Cart event add product to cart
       *
       * @return  {Void}
       */

      cartAddEvent() {
        document.addEventListener('click', (event) => {
          const clickedElement = event.target;
          const isButtonATC = clickedElement?.matches(selectors$Q.buttonAddToCart);
          const getButtonATC = clickedElement?.closest(selectors$Q.buttonAddToCart);

          if (isButtonATC || getButtonATC) {
            event.preventDefault();

            this.button = isButtonATC ? clickedElement : getButtonATC;
            this.form = clickedElement.closest('form');
            this.recipientErrors = this.form?.getAttribute(attributes$A.recipientError) === 'true';
            this.formWrapper = this.button.closest(selectors$Q.formWrapper);
            const isVariantSoldOut = this.formWrapper?.classList.contains(classes$I.variantSoldOut);
            const isButtonDisabled = this.button.hasAttribute(attributes$A.disabled);
            const isQuickViewOnboarding = this.button.closest(selectors$Q.quickViewOnboarding);
            const hasDataAtcTrigger = this.button.hasAttribute(attributes$A.atcTrigger);
            const hasNotificationPopup = this.button.hasAttribute(attributes$A.notificationPopup);
            const hasFileInput = this.form?.querySelector('[type="file"]');

            if (isButtonDisabled || hasFileInput || isQuickViewOnboarding) return;

            // Notification popup
            if (isVariantSoldOut && hasNotificationPopup) {
              new NotificationPopup(this.button);
              return;
            }

            if (hasDataAtcTrigger) {
              this.a11y.state.trigger = this.button;
            }

            let formData = new FormData(this.form);

            const hasInputsInNoScript = [...this.form.elements].some((el) => el.closest(selectors$Q.noscript));
            if (hasInputsInNoScript) {
              formData = this.handleFormDataDuplicates([...this.form.elements], formData);
            }
            const maxInventoryReached = this.form.getAttribute(attributes$A.maxInventoryReached);
            const errorMessagePosition = this.form.getAttribute(attributes$A.errorMessagePosition);
            this.variantTitle = this.form.getAttribute(attributes$A.variantTitle);
            this.showCannotAddMoreInCart = false;
            if (maxInventoryReached === 'true' && errorMessagePosition === 'cart') {
              this.showCannotAddMoreInCart = true;
            }

            this.addToCart(formData);

            // Hook for cart/add.js event
            document.dispatchEvent(
              new CustomEvent('theme:cart:add', {
                bubbles: true,
                detail: {
                  selector: clickedElement,
                },
              })
            );
          }
        });
      }

      /**
       * Modify the `formData` object in case there are key/value pairs with an overlapping `key`
       *  - the presence of form input fields inside a `noscript` tag leads to a duplicate `key`, which overwrites the existing `value` when the `FormData` is constructed
       *  - such key/value pairs discrepancies occur in the Theme editor, when any setting is updated, and right before one presses the "Save" button
       *
       * @param   {Array}  A list of all `HTMLFormElement.elements` DOM nodes
       * @param   {Object}  `FormData` object, created with the `FormData()` constructor
       *
       * @return  {Object} Updated `FormData` object that does not contain any duplicate keys
       */
      handleFormDataDuplicates(elements, formData) {
        if (!elements.length || typeof formData !== 'object') return formData;

        elements.forEach((element) => {
          if (element.closest(selectors$Q.noscript)) {
            const key = element.getAttribute(attributes$A.name);
            const value = element.value;

            if (key) {
              const values = formData.getAll(key);
              if (values.length > 1) values.splice(values.indexOf(value), 1);

              formData.delete(key);
              formData.set(key, values[0]);
            }
          }
        });

        return formData;
      }

      /**
       * Get response from the cart
       *
       * @return  {Void}
       */

      getCart() {
        // Render cart drawer if it exists but it's not loaded yet
        if (this.cartDrawer && !this.isCartDrawerLoaded) {
          const alwaysOpen = false;
          this.renderCartDrawer(alwaysOpen);
        }

        fetch(theme.routes.cart_url + '?section_id=api-cart-items')
          .then(this.handleErrors)
          .then((response) => response.text())
          .then((response) => {
            const element = document.createElement('div');
            element.innerHTML = response;

            const cleanResponse = element.querySelector(selectors$Q.apiContent);
            this.build(cleanResponse);
          })
          .catch((error) => console.log(error));
      }

      /**
       * Add item(s) to the cart and show the added item(s)
       *
       * @param   {String}  data
       * @param   {DOM Element}  button
       *
       * @return  {Void}
       */

      addToCart(data) {
        if (this.cartDrawerEnabled && this.button) {
          this.button.classList.add(classes$I.loading);
          this.button.setAttribute(attributes$A.disabled, true);
        }

        fetch(theme.routes.cart_add_url, {
          method: 'POST',
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
            Accept: 'application/javascript',
          },
          body: data,
        })
          .then((response) => response.json())
          .then((response) => {
            this.button.disabled = true;
            this.addLoadingClass();

            if (response.status) {
              this.addToCartError(response);
              this.removeLoadingClass();
              if (!this.showCannotAddMoreInCart) return;
            }

            this.hideAddToCartErrorMessage();

            if (this.cartDrawerEnabled) {
              this.getCart();
              if (this.showCannotAddMoreInCart) this.updateErrorText(this.variantTitle);
              this.scrollToCartTop();
            } else {
              window.location = theme.routes.cart_url;
            }
          })
          .catch((error) => console.log(error));
      }

      /**
       * Update cart
       *
       * @param   {Object}  updateData
       *
       * @return  {Void}
       */

      updateCart(updateData = {}, currentItem = null) {
        let updatedQuantity = updateData.quantity;
        if (currentItem !== null) {
          if (updatedQuantity) {
            currentItem.classList.add(classes$I.loading);
          } else {
            currentItem.classList.add(classes$I.removed);
          }
        }
        this.disableCartButtons();
        this.addLoadingClass();

        const newItem = this.cart.querySelector(`[${attributes$A.item}="${updateData.id}"]`) || currentItem;
        const lineIndex = newItem?.hasAttribute(attributes$A.itemIndex) ? parseInt(newItem.getAttribute(attributes$A.itemIndex)) : 0;
        const itemTitle = newItem?.hasAttribute(attributes$A.itemTitle) ? newItem.getAttribute(attributes$A.itemTitle) : null;

        if (lineIndex === 0) return;

        const data = {
          line: lineIndex,
          quantity: updatedQuantity,
        };

        fetch(theme.routes.cart_change_url, {
          method: 'post',
          headers: {'Content-Type': 'application/json', Accept: 'application/json'},
          body: JSON.stringify(data),
        })
          .then((response) => {
            if (response.status === 400) {
              const error = new Error(response.status);
              this.cartDrawerEnabled ? this.getCart() : (window.location = theme.routes.cart_url);
              throw error;
            }

            return response.text();
          })
          .then((state) => {
            const parsedState = JSON.parse(state);

            if (parsedState.errors) {
              this.cartUpdateFailed = true;
              this.updateErrorText(itemTitle);
              this.toggleErrorMessage();
              this.resetLineItem(currentItem);
              this.enableCartButtons();
              this.removeLoadingClass();
              this.scrollToCartTop();

              return;
            }

            this.getCart();
          })
          .catch((error) => {
            console.log(error);
            this.enableCartButtons();
            this.removeLoadingClass();
          });
      }

      /**
       * Reset line item initial state
       *
       * @return  {Void}
       */
      resetLineItem(item) {
        const qtyInput = item.querySelector(selectors$Q.qtyInput);
        const qtySelect = item.querySelector(selectors$Q.qtySelect);
        let qty = qtyInput.getAttribute(attributes$A.value);
        const qtyMax = qtyInput.getAttribute(attributes$A.qtyMax);

        if (qtyInput) {
          if (qtyInput.value > qtyMax) {
            qty = qtyMax;
          }

          qtyInput.value = qty;

          if (qtySelect) qtySelect.innerText = qty;
        }
        item.classList.remove(classes$I.loading);
      }

      /**
       * Disable cart buttons and inputs
       *
       * @return  {Void}
       */
      disableCartButtons() {
        const inputs = this.cart.querySelectorAll('input');
        const buttons = this.cart.querySelectorAll(`button, ${selectors$Q.cartItemRemove}`);

        if (inputs.length) {
          inputs.forEach((item) => {
            item.classList.add(classes$I.disabled);
            item.blur();
            item.disabled = true;
          });
        }

        if (buttons.length) {
          buttons.forEach((item) => {
            item.setAttribute(attributes$A.disabled, true);
          });
        }
      }

      /**
       * Enable cart buttons and inputs
       *
       * @return  {Void}
       */
      enableCartButtons() {
        const inputs = this.cart.querySelectorAll('input');
        const buttons = this.cart.querySelectorAll(`button, ${selectors$Q.cartItemRemove}`);

        if (inputs.length) {
          inputs.forEach((item) => {
            item.classList.remove(classes$I.disabled);
            item.disabled = false;
          });
        }

        if (buttons.length) {
          buttons.forEach((item) => {
            item.removeAttribute(attributes$A.disabled);
          });
        }
      }

      /**
       * Update error text
       *
       * @param   {String}  itemTitle
       *
       * @return  {Void}
       */

      updateErrorText(itemTitle) {
        this.cartErrorHolder.querySelector(selectors$Q.errorMessage).innerText = itemTitle;
      }

      /**
       * Toggle error message
       *
       * @return  {Void}
       */

      toggleErrorMessage() {
        if (!this.cartErrorHolder) return;

        this.cartErrorHolder.classList.toggle(classes$I.expanded, this.cartUpdateFailed || this.showCannotAddMoreInCart);

        if (this.cartUpdateFailed) {
          const cartCloseError = this.cartErrorHolder.querySelector(selectors$Q.cartCloseError);
          this.focusOnErrorMessage(this.cartErrorHolder, cartCloseError);
        }

        // Reset cart error events flag
        this.showCannotAddMoreInCart = false;
        this.cartUpdateFailed = false;
      }

      /**
       * Handle errors
       *
       * @param   {Object}  response
       *
       * @return  {Object}
       */

      handleErrors(response) {
        if (!response.ok) {
          return response.json().then(function (json) {
            const e = new FetchError({
              status: response.statusText,
              headers: response.headers,
              json: json,
            });
            throw e;
          });
        }
        return response;
      }

      /**
       * Add to cart error handle
       *
       * @param   {Object}  data
       * @param   {DOM Element/Null} button
       *
       * @return  {Void}
       */

      addToCartError(data) {
        const buttonQuickBuyForm = this.button.closest(selectors$Q.quickBuyForm);
        const buttonUpsellHolder = this.button.closest(selectors$Q.upsellHolder);
        const isFocusEnabled = !document.body.classList.contains(classes$I.noOutline);
        // holder: Product form containers or Upsell products in Cart form
        let holder = this.button.closest(selectors$Q.productForm) ? this.button.closest(selectors$Q.productForm) : this.button.closest(selectors$Q.upsellHolder);
        let errorContainer = holder.querySelector(selectors$Q.formErrorsContainer);

        // Upsell products in Cart form
        if (buttonUpsellHolder) {
          errorContainer = buttonUpsellHolder.querySelector(selectors$Q.formErrorsContainer);
        }

        if (this.cartDrawerEnabled && this.button && this.button.closest(selectors$Q.cartDrawer) !== null && !this.button.closest(selectors$Q.cartDrawer)) {
          this.closeCartDrawer();
        }

        this.button.classList.remove(classes$I.loading);
        this.button.removeAttribute(attributes$A.disabled);

        // Error message content
        const closeErrorButton = buttonQuickBuyForm
          ? ''
          : `
      <button type="button" class="errors__button-close" data-close-error>
        ${theme.icons.close}
      </button>
    `;

        let errorMessages = `${data.message}: ${data.description}`;

        if (data.message === data.description) errorMessages = data.message;

        if (this.recipientErrors && data.description && typeof data.description === 'object') {
          errorMessages = Object.entries(data.description)
            .map(([key, value]) => `${value}`)
            .join('<br>');
        }

        errorContainer.innerHTML = `
      <div class="errors" data-error autofocus>
        ${errorMessages}
        ${closeErrorButton}
      </div>
    `;

        // Quick buy in PGI errors
        if (buttonQuickBuyForm) {
          const productItem = errorContainer.closest(selectors$Q.productItem);
          if (!productItem) return;
          const productMediaContainer = productItem.querySelector(selectors$Q.productMediaContainer);
          if (!productMediaContainer) return;

          productMediaContainer.classList.add(classes$I.productGridImageError);

          errorContainer.querySelector(selectors$Q.error).addEventListener('animationend', () => {
            productMediaContainer.classList.remove(classes$I.productGridImageError);
            errorContainer.innerHTML = '';

            if (!isFocusEnabled) {
              document.activeElement.blur();
            }
          });
        } else {
          // PDP form, Quick view popup forms and Upsell sliders errors
          errorContainer.classList.add(classes$I.visible);
          errorContainer.addEventListener('transitionend', () => {
            this.resizeSliders(errorContainer);
            errorContainer.scrollIntoView({behavior: 'smooth', block: 'end'});
          });

          this.handleCloseErrorMessages(errorContainer);
        }
      }

      /**
       * Handle close buttons in error messages containers
       *
       * @param   {Object}  The error container that holds the close button
       * @return  {Void}
       */
      handleCloseErrorMessages(container) {
        const formErrorClose = container.querySelector(selectors$Q.formCloseError);

        formErrorClose?.addEventListener('click', (event) => {
          const clickedElement = event.target;
          const isFormCloseError = clickedElement.matches(selectors$Q.formCloseError) || clickedElement.closest(selectors$Q.formCloseError);

          if (!isFormCloseError) return;

          event.preventDefault();
          container.classList.remove(classes$I.visible);
          container.querySelector(selectors$Q.error).addEventListener('transitionend', () => {
            container.innerHTML = '';
            this.resizeSliders(clickedElement);
          });
        });

        this.focusOnErrorMessage(container, formErrorClose);
      }

      /**
       * Focus on the error container's close button so that the alert message is read outloud on voiceover assistive technologies
       *
       * @param   {Object}  The error container that holds the error message
       * @param   {Object}  The button that closes the error message
       * @return  {Void}
       */
      focusOnErrorMessage(container, button) {
        const isFocusEnabled = !document.body.classList.contains(classes$I.noOutline);

        if (!isFocusEnabled) return;

        container.addEventListener('transitionend', () => {
          requestAnimationFrame(() => button?.focus({focusVisible: true}));
        });
      }

      /**
       * Hide error message container as soon as an item is successfully added to the cart
       */
      hideAddToCartErrorMessage() {
        const holder = this.button.closest(selectors$Q.upsellHolder) ? this.button.closest(selectors$Q.upsellHolder) : this.button.closest(selectors$Q.productForm);
        const errorContainer = holder?.querySelector(selectors$Q.formErrorsContainer);
        errorContainer?.classList.remove(classes$I.visible);
      }

      /**
       * Resize sliders height
       *
       * @param   {Object}  Element within the slider container that would be resized
       * @return  {Void}
       */
      resizeSliders(element) {
        const slider = element.closest(selectors$Q.flickityEnabled);

        if (!slider) return;

        const flkty = Flickity.data(slider);
        requestAnimationFrame(() => flkty.resize());
      }

      /**
       * Render cart and define all elements after cart drawer is open for a first time
       *
       * @return  {Void}
       */
      renderCartDrawer(alwaysOpen = true) {
        const cartDrawerTemplate = document.querySelector(selectors$Q.cartDrawerTemplate);

        if (!cartDrawerTemplate) {
          return;
        }

        // Append cart items HTML to the cart drawer container
        this.cartDrawer.innerHTML = cartDrawerTemplate.innerHTML;
        this.assignArguments();

        // Bind cart update event
        this.initCartUpdate();

        // Bind cart events
        this.cartEvents();

        // Init collapsible function for the cart drawer accordions
        if (this.cartDrawerBody) {
          this.collapsible = new Collapsible(this.cartDrawerBody);
        }

        // Bind cart drawer close button event
        this.cartDrawerToggle = this.cartDrawer.querySelector(selectors$Q.cartDrawerToggle);
        this.cartDrawerToggle.addEventListener('click', this.cartDrawerToggleClickEvent);

        this.isCartDrawerLoaded = true;

        this.renderPairProducts();

        // Hook for cart drawer loaded event
        document.dispatchEvent(new CustomEvent('theme:cart:loaded', {bubbles: true}));

        // Open cart drawer after cart items and events are loaded
        if (alwaysOpen) {
          this.openCartDrawer();
        }
      }

      /**
       * Open cart dropdown and add class on body
       *
       * @return  {Void}
       */

      openCartDrawer() {
        if (this.isCartDrawerOpen) {
          return;
        }

        if (!this.isCartDrawerLoaded) {
          this.renderCartDrawer();
          return;
        }

        // Hook for cart drawer open event
        document.dispatchEvent(new CustomEvent('theme:cart:open', {bubbles: true}));
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.cartDrawer}));
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.cartDrawerBody}));

        this.scrollToCartTop();

        document.body.classList.add(classes$I.cartDrawerOpen);
        this.cartDrawer.classList.add(classes$I.open);
        this.cartDrawer.classList.remove(classes$I.contentVisibilityHidden);

        // Reinit animations on Cart drawer open
        requestAnimationFrame(() => this.animateCartItems('in'));

        this.cartToggleButtons.forEach((button) => {
          button.setAttribute(attributes$A.ariaExpanded, true);
        });

        this.a11y.trapFocus({
          container: this.cartDrawer,
        });

        // Observe Additional Checkout Buttons
        this.observeAdditionalCheckoutButtons();
        this.isCartDrawerOpen = true;
      }

      /**
       * Animate cart items on cart drawer open/close or cart update
       *
       * @return  {Void}
       */
      animateCartItems(state = 'in') {
        const items = this.cart.querySelectorAll(selectors$Q.aos);

        // Init
        if (state === 'in') {
          items.forEach((item) => requestAnimationFrame(() => item.classList.add(classes$I.aosAnimate)));
        }

        // Reset
        if (state === 'out') {
          items.forEach((item) => item.classList.remove(classes$I.aosAnimate));
        }
      }

      /**
       * Close cart dropdown and remove class on body
       *
       * @return  {Void}
       */

      closeCartDrawer() {
        if (!this.isCartDrawerOpen) {
          return;
        }

        // Hook for cart drawer close event
        document.dispatchEvent(new CustomEvent('theme:cart:close', {bubbles: true}));

        this.cartErrorHolder.classList.remove(classes$I.expanded);

        this.a11y.removeTrapFocus();

        this.cartToggleButtons.forEach((button) => {
          button.setAttribute(attributes$A.ariaExpanded, false);
        });

        document.body.classList.remove(classes$I.cartDrawerOpen);
        this.cartDrawer.classList.remove(classes$I.open);
        this.itemsHolder.classList.remove(classes$I.updated);

        const onCartDrawerTransitionEnd = (event) => {
          if (event.target !== this.cartDrawer) return;

          this.animateCartItems('out');

          this.cartDrawer.removeEventListener('transitionend', onCartDrawerTransitionEnd);
        };

        this.cartDrawer.addEventListener('transitionend', onCartDrawerTransitionEnd);

        // Fixes header background update on cart-drawer close
        const isFocusEnabled = !document.body.classList.contains(classes$I.noOutline);
        if (!isFocusEnabled) {
          requestAnimationFrame(() => {
            document.activeElement.blur();
          });
        }

        // Enable page scroll right after the closing animation ends
        const timeout = 400;
        document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true, detail: timeout}));

        this.isCartDrawerOpen = false;
      }

      /**
       * Toggle cart dropdown
       *
       * @return  {Void}
       */

      toggleCartDrawer() {
        if (this.isCartDrawerOpen) {
          this.closeCartDrawer();
        } else {
          this.openCartDrawer();
        }
      }

      /**
       * Cart drawer toggle events
       *
       * @return  {Void}
       */

      cartDrawerToggleEvents() {
        if (!this.cartDrawer) return;

        // Close cart drawer on ESC key pressed
        this.cartDrawer.addEventListener('keyup', (event) => {
          if (event.code === theme.keyboardKeys.ESCAPE) {
            this.closeCartDrawer();
          }
        });

        // Define cart drawer toggle button click event
        this.cartDrawerToggleClickEvent = (event) => {
          event.preventDefault();
          const button = event.target;

          if (button.getAttribute(attributes$A.ariaExpanded) === 'false') {
            this.a11y.state.trigger = button;
          }

          this.toggleCartDrawer();
        };

        // Define cart drawer close event
        this.cartDrawerCloseEvent = (event) => {
          const isCartDrawerToggle = event.target.matches(selectors$Q.cartDrawerToggle);
          const isCartDrawerChild = document.querySelector(selectors$Q.cartDrawer).contains(event.target);
          const isPopupQuickView = event.target.closest(selectors$Q.popupQuickView);

          if (!isCartDrawerToggle && !isCartDrawerChild && !isPopupQuickView) {
            this.closeCartDrawer();
          }
        };

        // Bind cart drawer toggle buttons click event
        this.cartToggleButtons.forEach((button) => {
          button.addEventListener('click', this.cartDrawerToggleClickEvent);
        });

        // Close drawers on click outside
        //   Replaced 'click' with 'mousedown' as a quick and simple fix to the dragging issue on the upsell slider
        //   which was causing the cart-drawer to close when we start dragging the slider and finish our drag outside the cart-drawer
        //   which was triggering the 'click' event
        document.addEventListener('mousedown', this.cartDrawerCloseEvent);
      }

      /**
       * Toggle classes on different containers and messages
       *
       * @return  {Void}
       */

      toggleClassesOnContainers() {
        const that = this;

        if (this.isCartPage) {
          this.buttonHolder.classList.toggle(classes$I.hidden, !that.hasItemsInCart());
        } else {
          this.pairProductsHolder.classList.toggle(classes$I.hidden, !that.hasItemsInCart());
          this.cartForm.classList.toggle(classes$I.hidden, !that.hasItemsInCart());
          this.emptyMessageBottom.classList.toggle(classes$I.hidden, that.hasItemsInCart());
          this.cartNoteHolder.classList.toggle(classes$I.hidden, !that.hasItemsInCart());
        }
        this.emptyMessage.classList.toggle(classes$I.hidden, that.hasItemsInCart());
        this.itemsHolder.classList.toggle(classes$I.hidden, !that.hasItemsInCart());
        this.cartItemsQty.classList.toggle(classes$I.hidden, !that.hasItemsInCart());
      }

      /**
       * Build cart depends on results
       *
       * @param   {Object}  data
       *
       * @return  {Void}
       */

      build(data) {
        const cartItemsData = data.querySelector(selectors$Q.apiLineItems);
        const upsellItemsData = data.querySelector(selectors$Q.apiUpsellItems);
        const cartEmptyData = Boolean(cartItemsData === null && upsellItemsData === null);
        const priceData = data.querySelector(selectors$Q.apiCartPrice);
        const cartTotal = data.querySelector(selectors$Q.cartTotal);

        if (this.priceHolder && priceData) {
          this.priceHolder.innerHTML = priceData.innerHTML;
        }

        // Remove items animate class to reinit animations
        this.animateCartItems('out');

        if (cartEmptyData) {
          this.itemsHolder.innerHTML = '';

          if (this.pairProductsHolder) {
            this.pairProductsHolder.innerHTML = '';
          }
        } else {
          this.itemsHolder.innerHTML = cartItemsData.innerHTML;

          if (this.pairProductsHolder) {
            this.pairProductsHolder.innerHTML = upsellItemsData.innerHTML;
          }

          this.renderPairProducts();
        }

        this.newTotalItems = cartItemsData && cartItemsData.querySelectorAll(selectors$Q.item).length ? cartItemsData.querySelectorAll(selectors$Q.item).length : 0;
        this.subtotal = cartTotal && cartTotal.hasAttribute(attributes$A.cartTotal) ? parseInt(cartTotal.getAttribute(attributes$A.cartTotal)) : 0;
        this.cartCount = this.getCartItemCount();

        if (this.cartMessage.length > 0) {
          this.updateProgress();
        }

        this.cartToggleButtons.forEach((button) => {
          button.classList.remove(classes$I.cartItems);

          if (this.newTotalItems > 0) {
            button.classList.add(classes$I.cartItems);
          }
        });

        this.toggleErrorMessage();
        this.updateItemsQuantity(this.cartCount);

        // Update cart total price
        this.cartTotalPrice.innerHTML = this.subtotal === 0 ? window.theme.strings.free : themeCurrency.formatMoney(this.subtotal, theme.moneyWithCurrencyFormat);

        if (this.totalItems !== this.newTotalItems) {
          this.totalItems = this.newTotalItems;

          this.toggleClassesOnContainers();
        }

        // Add class "is-updated" line items holder to reduce cart items animation delay via CSS variables
        if (this.isCartDrawerOpen || this.isCartPage) {
          this.itemsHolder.classList.add(classes$I.updated);
        }

        this.cartEvents();
        this.initCartUpdate();
        this.enableCartButtons();
        this.resetButtonClasses();
        this.removeLoadingClass();

        document.dispatchEvent(new CustomEvent('theme:cart:added', {bubbles: true}));

        if (this.cartDrawer) {
          this.openCartDrawer();

          // Reinit animations in Cart Drawer after Drawer transition ends
          const onCartDrawerTransitionEnd = (event) => {
            if (event.target !== this.cartDrawer) return;

            this.animateCartItems('in');

            this.cartDrawer.removeEventListener('transitionend', onCartDrawerTransitionEnd);
          };

          this.cartDrawer.addEventListener('transitionend', onCartDrawerTransitionEnd);
        }

        // Reinit animations in Cart
        requestAnimationFrame(() => this.animateCartItems('in'));
      }

      /**
       * Get cart item count
       *
       * @return  {Void}
       */

      getCartItemCount() {
        // Returning 0 and not the actual cart items count is done only for when "Cart type" settings are set to "Page"
        // The actual count is necessary only when we build and render the cart/cart-drawer after we get a response from the Cart API
        if (!this.cart) return 0;
        return Array.from(this.cart.querySelectorAll(selectors$Q.qtyInput)).reduce((total, quantityInput) => total + parseInt(quantityInput.value), 0);
      }

      /**
       * Check for items in the cart
       *
       * @return  {Void}
       */

      hasItemsInCart() {
        return this.totalItems > 0;
      }

      /**
       * Show/hide free shipping message
       *
       * @param   {Number}  total
       *
       * @return  {Void}
       */

      freeShippingMessageHandle(total) {
        if (this.cartMessage.length > 0) {
          document.querySelectorAll(selectors$Q.cartMessage).forEach((message) => {
            const hasFreeShipping = message.hasAttribute(attributes$A.cartMessageValue) && message.getAttribute(attributes$A.cartMessageValue) === 'true' && total !== 0;
            const cartMessageDefault = message.querySelector(selectors$Q.cartMessageDefault);

            message.classList.toggle(classes$I.success, total >= this.cartFreeLimitShipping && hasFreeShipping);
            message.classList.toggle(classes$I.isHidden, total === 0);
            if (cartMessageDefault) {
              cartMessageDefault.classList.toggle(classes$I.isHidden, total >= this.cartFreeLimitShipping);
            }
          });
        }
      }

      /**
       * Update progress when update cart
       *
       * @return  {Void}
       */

      updateProgress() {
        const newPercentValue = (this.subtotal / this.cartFreeLimitShipping) * 100;
        let leftToSpend = themeCurrency.formatMoney(this.cartFreeLimitShipping - this.subtotal, theme.moneyFormat);
        if (leftToSpend.endsWith('.00') || leftToSpend.endsWith(',00')) {
          leftToSpend = leftToSpend.slice(0, -3);
        }

        if (theme.settings.currency_code_enable) {
          leftToSpend += ` ${theme.current_iso_code}`;
        }

        if (this.cartMessage.length > 0) {
          document.querySelectorAll(selectors$Q.cartMessage).forEach((message) => {
            const cartMessageProgressItems = message.querySelectorAll(selectors$Q.cartProgress);
            const leftToSpendMessage = message.querySelector(selectors$Q.leftToSpend);

            if (leftToSpendMessage) {
              leftToSpendMessage.innerHTML = leftToSpend;
            }

            if (cartMessageProgressItems.length) {
              cartMessageProgressItems.forEach((cartMessageProgress, index) => {
                cartMessageProgress.classList.toggle(classes$I.isHidden, this.subtotal / this.cartFreeLimitShipping >= 1);
                cartMessageProgress.style.setProperty('--progress-width', `${newPercentValue}%`);
                if (index === 0) {
                  cartMessageProgress.setAttribute(attributes$A.value, newPercentValue);
                }
              });
            }

            this.freeShippingMessageHandle(this.subtotal);
          });
        }
      }

      /**
       * Render Upsell Products
       */
      renderPairProducts() {
        this.flktyUpsell = null;
        this.pairProductsHolder = document.querySelector(selectors$Q.pairProductsHolder);
        this.pairProducts = document.querySelector(selectors$Q.pairProducts);
        this.upsellHolders = document.querySelectorAll(selectors$Q.upsellHolder);

        if (this.pairProductsHolder === null || this.pairProductsHolder === undefined) {
          return;
        }

        // Upsell slider
        const that = this;
        if (this.upsellHolders.length > 1) {
          this.flktyUpsell = new Flickity(this.pairProducts, {
            wrapAround: true,
            pageDots: true,
            adaptiveHeight: true,
            prevNextButtons: false,
            on: {
              ready: function () {
                new QuickViewPopup(that.cart);
                this.reloadCells();
                requestAnimationFrame(() => this.resize());
              },
            },
          });

          return;
        }

        // Single upsell item
        new QuickViewPopup(this.cart);
      }

      updateItemsQuantity(itemsQty) {
        let oneItemText = theme.strings.cart_items_one;
        let manyItemsText = theme.strings.cart_items_many;
        oneItemText = oneItemText.split('}}')[1];
        manyItemsText = manyItemsText.split('}}')[1];

        if (this.cartItemsQty) {
          this.cartItemsQty.textContent = itemsQty === 1 ? `${itemsQty} ${oneItemText}` : `${itemsQty} ${manyItemsText}`;
        }
      }

      observeAdditionalCheckoutButtons() {
        // identify an element to observe
        const additionalCheckoutButtons = this.cart.querySelector(selectors$Q.additionalCheckoutButtons);
        if (additionalCheckoutButtons) {
          // create a new instance of `MutationObserver` named `observer`,
          // passing it a callback function
          const observer = new MutationObserver(() => {
            this.a11y.removeTrapFocus();
            this.a11y.trapFocus({
              container: this.cart,
            });
            observer.disconnect();
          });

          // call `observe()` on that MutationObserver instance,
          // passing it the element to observe, and the options object
          observer.observe(additionalCheckoutButtons, {subtree: true, childList: true});
        }
      }

      formSubmitHandler() {
        const termsAccepted = document.querySelector(selectors$Q.cartTermsCheckbox).checked;
        const termsError = document.querySelector(selectors$Q.termsErrorMessage);

        // Disable form submit if terms and conditions are not accepted
        if (!termsAccepted) {
          if (document.querySelector(selectors$Q.termsErrorMessage).length > 0) {
            return;
          }

          termsError.innerText = theme.strings.cart_acceptance_error;
          this.cartCheckoutButton.setAttribute(attributes$A.disabled, true);
          termsError.classList.add(classes$I.expanded);
        } else {
          termsError.classList.remove(classes$I.expanded);
          this.cartCheckoutButton.removeAttribute(attributes$A.disabled);
        }
      }

      resetButtonClasses() {
        const buttons = document.querySelectorAll(selectors$Q.buttonAddToCart);
        if (buttons) {
          buttons.forEach((button) => {
            if (button.classList.contains(classes$I.loading)) {
              button.classList.remove(classes$I.loading);
              button.classList.add(classes$I.success);

              setTimeout(() => {
                button.removeAttribute(attributes$A.disabled);
                button.classList.remove(classes$I.success);
              }, settings$4.timers.addProductTimeout);
            }
          });
        }
      }

      addLoadingClass() {
        if (this.cartDrawer) {
          this.cartDrawer.classList.add(classes$I.loading);
        } else if (this.itemsWrapper) {
          this.itemsWrapper.classList.add(classes$I.loading);
        }
      }

      removeLoadingClass() {
        if (this.cartDrawer) {
          this.cartDrawer.classList.remove(classes$I.loading);
        } else if (this.itemsWrapper) {
          this.itemsWrapper.classList.remove(classes$I.loading);
        }
      }

      scrollToCartTop() {
        if (this.cartDrawer) {
          this.cartDrawerBody.scrollTo({
            top: 0,
            left: 0,
            behavior: 'instant',
          });
          return;
        }

        window.scrollTo({
          top: this.outerSection?.offsetTop - this.headerInitialHeight - this.announcementBarHeight,
          left: 0,
          behavior: 'smooth',
        });
      }

      unload() {
        if (this.cartDrawerToggle) {
          this.cartDrawerToggle.removeEventListener('click', this.cartDrawerToggleClickEvent);
        }

        this.cartToggleButtons.forEach((button) => {
          button.removeEventListener('click', this.cartDrawerToggleClickEvent);
        });

        // Close drawers on click outside
        document.removeEventListener('mousedown', this.cartDrawerCloseEvent);

        if (this.collapsible !== null) {
          this.collapsible.onUnload();
        }
      }
    }

    const cartDrawer = {
      onLoad() {
        sections$A[this.id] = new CartDrawer();
      },
      onUnload() {
        if (typeof sections$A[this.id].unload === 'function') {
          sections$A[this.id].unload();
        }
      },
    };
    register('cart-template', cartDrawer);

    const selectors$P = {
      scrollToTop: '[data-scroll-top-button]',
    };
    const classes$H = {
      isVisible: 'is-visible',
    };

    // Scroll to top button
    const scrollTopButton = document.querySelector(selectors$P.scrollToTop);
    if (scrollTopButton) {
      scrollTopButton.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth',
        });
      });
      document.addEventListener(
        'scroll',
        throttle(() => {
          scrollTopButton.classList.toggle(classes$H.isVisible, window.pageYOffset > window.innerHeight);
        }, 150)
      );
    }

    const selectors$O = {
      details: 'details',
      popdownBody: '[data-popdown-body]',
      popdownClose: '[data-popdown-close]',
      popdownToggle: '[data-popdown-toggle]',
      searchFormInner: '[data-search-form-inner]',
      input: 'input:not([type="hidden"])',
      popularSearchesLink: '[data-popular-searches-link]',
      header: '[data-site-header]',
      nav: '[data-nav]',
      navItemsCompress: '[data-nav-items-compress]',
      navIcons: '[data-nav-icons]',
      mobileMenu: '[data-mobile-menu]',
      predictiveSearch: 'predictive-search',
      searchForm: 'search-form',
    };

    const attributes$z = {
      popdownInHeader: 'data-popdown-in-header',
      popdownInPage: 'data-popdown-in-page',
      searchPerformed: 'data-search-performed',
      ariaActivedescendant: 'aria-activedescendant',
      ariaExpanded: 'aria-expanded',
      open: 'open',
      role: 'role',
    };

    const classes$G = {
      searchOpened: 'search-opened',
      headerMenuOpened: 'site-header--menu-opened',
      headerCompress: 'site-header--compress',
      open: 'is-open',
    };

    class SearchPopdown extends HTMLElement {
      constructor() {
        super();
        this.isPopdownInHeader = this.hasAttribute(attributes$z.popdownInHeader);
        this.isPopdownInPage = this.hasAttribute(attributes$z.popdownInPage);
        this.popdownBody = this.querySelector(selectors$O.popdownBody);
        this.popdownClose = this.querySelector(selectors$O.popdownClose);
        this.searchFormInner = this.querySelector(selectors$O.searchFormInner);
        this.popularSearchesLink = this.querySelectorAll(selectors$O.popularSearchesLink);
        this.searchFormWrapper = this.querySelector(selectors$O.searchForm) ? this.querySelector(selectors$O.searchForm) : this.querySelector(selectors$O.predictiveSearch);
        this.predictiveSearch = this.searchFormWrapper.matches(selectors$O.predictiveSearch);
        this.header = document.querySelector(selectors$O.header);
        this.headerSection = this.header?.parentNode;
        this.nav = this.header?.querySelector(selectors$O.nav);
        this.mobileMenu = this.headerSection?.querySelector(selectors$O.mobileMenu);
        this.a11y = a11y;
        this.ensureClosingOnResizeEvent = () => this.ensureClosingOnResize();
        this.popdownTransitionCallbackEvent = (event) => this.popdownTransitionCallback(event);
        this.detailsToggleCallbackEvent = (event) => this.detailsToggleCallback(event);

        if (this.isPopdownInHeader) {
          this.details = this.querySelector(selectors$O.details);
          this.popdownToggle = this.querySelector(selectors$O.popdownToggle);
        }
      }

      connectedCallback() {
        if (this.isPopdownInHeader) {
          this.searchFormInner.addEventListener('transitionend', this.popdownTransitionCallbackEvent);
          this.details.addEventListener('keyup', (event) => event.code.toUpperCase() === 'ESCAPE' && this.close());
          this.details.addEventListener('toggle', this.detailsToggleCallbackEvent);
          this.popdownClose.addEventListener('click', (event) => this.close(event));
          this.popdownToggle.addEventListener('click', (event) => this.onPopdownToggleClick(event));
          this.popdownToggle.setAttribute(attributes$z.role, 'button');
        }

        if (this.isPopdownInPage) {
          this.popdownClose.addEventListener('click', () => this.triggerPopdownClose());
          this.searchFormWrapper.addEventListener('focusout', () => this.onFocusOut());
          this.searchFormWrapper.input?.addEventListener('click', (event) => this.triggerPopdownOpen(event));
        }

        this.popularSearchesLink.forEach((element) => {
          element.addEventListener('click', (event) => {
            event.preventDefault();
            const popularSearchText = event.target.textContent;

            this.searchFormWrapper.input.value = popularSearchText;
            this.searchFormWrapper.submit();
          });
        });
      }

      // Prevent the default details toggle and close manually the popdown
      onPopdownToggleClick(event) {
        const isChrome = navigator.userAgent.includes('Chrome');
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (isChrome && !isIOS) {
          event.target.closest(selectors$O.details).setAttribute(attributes$z.open, '');
        }
        if (event.target.closest(selectors$O.details).hasAttribute(attributes$z.open)) {
          event.preventDefault();
          this.close();
        }
      }

      // Use default details toggle to open the search popdown
      detailsToggleCallback(event) {
        if (event.target.hasAttribute(attributes$z.open)) {
          this.open();
        }
      }

      popdownTransitionCallback(event) {
        if (event.target !== this.searchFormInner) return;

        if (!this.details.classList.contains(classes$G.open)) {
          this.onClose();
        } else if (event.propertyName === 'transform') {
          // Wait for the 'transform' transition to complete in order to prevent jumping content issues because of the trapFocus
          this.a11y.trapFocus({
            container: this.searchFormInner,
          });
        }
      }

      onBodyClick(event) {
        const isTargetInPopdown = this.contains(event.target);
        const isHeaderMenuOpened = this.header?.classList.contains(classes$G.headerMenuOpened);

        if (isHeaderMenuOpened || isTargetInPopdown) return;
        if (!isTargetInPopdown) this.close();
      }

      onFocusOut() {
        if (!this.predictiveSearch) return;

        requestAnimationFrame(() => {
          if (!this.searchFormWrapper.contains(document.activeElement)) {
            this.searchFormWrapper.close();
          }
        });
      }

      triggerPopdownOpen(event) {
        let isTouch = matchMedia('(pointer:coarse)').matches;
        const viewportMobile = window.innerWidth < theme.sizes.small;
        const shouldOpenPopdownOnTouchDevice = isTouch || viewportMobile;

        if (viewportMobile && window.Shopify.designMode) {
          isTouch = true;
        }

        if (!this.nav || !this.mobileMenu) return;

        if (shouldOpenPopdownOnTouchDevice) {
          event.preventDefault();

          const isHeaderCompressed = this.header.classList.contains(classes$G.headerCompress);
          let popdownToggle = this.mobileMenu.querySelector(selectors$O.popdownToggle);

          if (!isTouch) {
            popdownToggle = isHeaderCompressed
              ? this.nav.querySelector(`${selectors$O.navItemsCompress} ${selectors$O.popdownToggle}`)
              : this.nav.querySelector(`${selectors$O.navIcons} ${selectors$O.popdownToggle}`);
          }

          setTimeout(() => {
            popdownToggle?.dispatchEvent(new Event('click', {bubbles: true}));
          }, 300);
        }
      }

      open() {
        this.onBodyClickEvent = (event) => this.onBodyClick(event);
        this.searchFormWrapper.input.setAttribute(attributes$z.ariaExpanded, true);

        document.body.classList.add(classes$G.searchOpened);
        document.body.addEventListener('click', this.onBodyClickEvent);
        document.addEventListener('theme:resize', this.ensureClosingOnResizeEvent);
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true}));

        // Safari opening transition fix
        requestAnimationFrame(() => {
          this.details.classList.add(classes$G.open);
        });
      }

      close(event) {
        // Do nothing if there are selected items and the target element is the close button
        const ariaActivedescendant = this.searchFormWrapper.input.getAttribute(attributes$z.ariaActivedescendant);
        if (event && event.target === this.popdownClose && ariaActivedescendant && ariaActivedescendant !== '') return;
        this.a11y.removeTrapFocus();
        this.details.classList.remove(classes$G.open);
        if (this.predictiveSearch) this.searchFormWrapper.close();
        this.searchFormWrapper.handleFocusableDescendants(true);
      }

      triggerPopdownClose() {
        if (this.predictiveSearch) this.searchFormWrapper.close();

        if (this.searchFormWrapper.popularSearches) {
          requestAnimationFrame(() => document.activeElement.blur());
        }
      }

      onClose() {
        this.details.removeAttribute(attributes$z.open);
        document.dispatchEvent(new CustomEvent('theme:search:close', {bubbles: true}));
        document.body.classList.remove(classes$G.searchOpened);
        document.body.removeEventListener('click', this.onBodyClickEvent);
        document.removeEventListener('theme:resize', this.ensureClosingOnResizeEvent);
        document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
      }

      ensureClosingOnResize() {
        // Due to having multiple <search-popdown> elements in `.mobile-menu`, `.nav--default` or `.menu__item--compress` parents,
        // the element can become hidden when the browser is resized
        // `transitionend` event is then not fired and the closing methods are not finished properly
        const isElementHiddenFromView = this.offsetParent === null;
        if (!isElementHiddenFromView) return;

        this.onClose();
      }
    }

    customElements.define('search-popdown', SearchPopdown);

    Shopify.Products = (function () {
      const config = {
        howManyToShow: 4,
        howManyToStoreInMemory: 10,
        wrapperId: 'recently-viewed-products',
        section: null,
        onComplete: null,
      };

      let productHandleQueue = [];
      let wrapper = null;
      let howManyToShowItems = null;

      const today = new Date();
      const expiresDate = new Date();
      const daysToExpire = 90;
      expiresDate.setTime(today.getTime() + 3600000 * 24 * daysToExpire);

      const cookie = {
        configuration: {
          expires: expiresDate.toGMTString(),
          path: '/',
          domain: window.location.hostname,
          sameSite: 'none',
          secure: true,
        },
        name: 'shopify_recently_viewed',
        write: function (recentlyViewed) {
          const recentlyViewedString = recentlyViewed.join(' ');
          document.cookie = `${this.name}=${recentlyViewedString}; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}; sameSite=${this.configuration.sameSite}; secure=${this.configuration.secure}`;
        },
        read: function () {
          let recentlyViewed = [];
          let cookieValue = null;

          if (document.cookie.indexOf('; ') !== -1 && document.cookie.split('; ').find((row) => row.startsWith(this.name))) {
            cookieValue = document.cookie
              .split('; ')
              .find((row) => row.startsWith(this.name))
              .split('=')[1];
          }

          if (cookieValue !== null) {
            recentlyViewed = cookieValue.split(' ');
          }

          return recentlyViewed;
        },
        destroy: function () {
          const cookieVal = null;
          document.cookie = `${this.name}=${cookieVal}; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}`;
        },
        remove: function (productHandle) {
          const recentlyViewed = this.read();
          const position = recentlyViewed.indexOf(productHandle);
          if (position !== -1) {
            recentlyViewed.splice(position, 1);
            this.write(recentlyViewed);
          }
        },
      };

      const finalize = (wrapper, section) => {
        showElement(wrapper, true);
        const cookieItemsLength = cookie.read().length;

        if (Shopify.recentlyViewed && howManyToShowItems && cookieItemsLength && cookieItemsLength < howManyToShowItems && wrapper.children.length) {
          let allClassesArr = [];
          let addClassesArr = [];
          let objCounter = 0;
          for (const property in Shopify.recentlyViewed) {
            objCounter += 1;
            const objString = Shopify.recentlyViewed[property];
            const objArr = objString.split(' ');
            const propertyIdx = parseInt(property.split('_')[1]);
            allClassesArr = [...allClassesArr, ...objArr];

            if (cookie.read().length === propertyIdx || (objCounter === Object.keys(Shopify.recentlyViewed).length && !addClassesArr.length)) {
              addClassesArr = [...addClassesArr, ...objArr];
            }
          }

          for (let i = 0; i < wrapper.children.length; i++) {
            const element = wrapper.children[i];
            if (allClassesArr.length) {
              element.classList.remove(...allClassesArr);
            }

            if (addClassesArr.length) {
              element.classList.add(...addClassesArr);
            }
          }
        }

        // If we have a callback.
        if (config.onComplete) {
          try {
            config.onComplete(wrapper, section);
          } catch (error) {
            console.log(error);
          }
        }
      };

      const moveAlong = (shown, productHandleQueue, wrapper, section) => {
        if (productHandleQueue.length && shown < config.howManyToShow) {
          fetch(`${window.theme.routes.root}products/${productHandleQueue[0]}?section_id=api-product-grid-item`)
            .then((response) => response.text())
            .then((product) => {
              const aosDelay = shown * 150;
              const aosAnchor = wrapper.id ? `#${wrapper.id}` : '';
              const fresh = document.createElement('div');
              let productReplaced = product;

              // Unpublished products that are draft or archived can still be displayed in Theme editor
              // Preventing them from showing cleans all JS errors that are present because of the missing products and JSON data
              if (productReplaced.includes('data-unpublished')) {
                cookie.remove(productHandleQueue[0]);
                productHandleQueue.shift();
                moveAlong(shown, productHandleQueue, wrapper, section);
                return;
              }

              productReplaced = productReplaced.includes('||itemAosDelay||') ? productReplaced.replaceAll('||itemAosDelay||', aosDelay) : productReplaced;
              productReplaced = productReplaced.includes('||itemAosAnchor||') ? productReplaced.replaceAll('||itemAosAnchor||', aosAnchor) : productReplaced;
              fresh.innerHTML = productReplaced;

              wrapper.innerHTML += fresh.querySelector('[data-api-content]').innerHTML;

              productHandleQueue.shift();
              shown++;
              moveAlong(shown, productHandleQueue, wrapper, section);
            })
            .catch(() => {
              cookie.remove(productHandleQueue[0]);
              productHandleQueue.shift();
              moveAlong(shown, productHandleQueue, wrapper, section);
            });
        } else {
          finalize(wrapper, section);
        }
      };

      return {
        showRecentlyViewed: function (params) {
          const paramsNew = params || {};
          const shown = 0;

          // Update defaults.
          Object.assign(config, paramsNew);

          // Read cookie.
          productHandleQueue = cookie.read();

          // Element where to insert.
          wrapper = document.querySelector(`#${config.wrapperId}`);

          // How many products to show.
          howManyToShowItems = config.howManyToShow;
          config.howManyToShow = Math.min(productHandleQueue.length, config.howManyToShow);

          // If we have any to show.
          if (config.howManyToShow && wrapper) {
            // Getting each product with an Ajax call and rendering it on the page.
            moveAlong(shown, productHandleQueue, wrapper, config.section);
          }
        },

        getConfig: function () {
          return config;
        },

        clearList: function () {
          cookie.destroy();
        },

        recordRecentlyViewed: function (params) {
          const paramsNew = params || {};

          // Update defaults.
          Object.assign(config, paramsNew);

          // Read cookie.
          let recentlyViewed = cookie.read();

          // If we are on a product page.
          if (window.location.pathname.indexOf('/products/') !== -1) {
            // What is the product handle on this page.
            let productHandle = decodeURIComponent(window.location.pathname)
              .match(
                /\/products\/([a-z0-9\-]|[\u3000-\u303F]|[\u3040-\u309F]|[\u30A0-\u30FF]|[\uFF00-\uFFEF]|[\u4E00-\u9FAF]|[\u2605-\u2606]|[\u2190-\u2195]|[\u203B]|[\w\u0430-\u044f]|[\u0400-\u04FF]|[\u0900-\u097F]|[\u0590-\u05FF\u200f\u200e]|[\u0621-\u064A\u0660-\u0669 ])+/
              )[0]
              .split('/products/')[1];

            if (config.handle) {
              productHandle = config.handle;
            }

            // In what position is that product in memory.
            const position = recentlyViewed.indexOf(productHandle);

            // If not in memory.
            if (position === -1) {
              // Add product at the start of the list.
              recentlyViewed.unshift(productHandle);
              // Only keep what we need.
              recentlyViewed = recentlyViewed.splice(0, config.howManyToStoreInMemory);
            } else {
              // Remove the product and place it at start of list.
              recentlyViewed.splice(position, 1);
              recentlyViewed.unshift(productHandle);
            }

            // Update cookie.
            cookie.write(recentlyViewed);
          }
        },

        hasProducts: cookie.read().length > 0,
      };
    })();

    const selectors$N = {
      actions: '[data-actions]',
      button: '[data-button]',
      content: '[data-content]',
      collapsibleContainer: '[data-collapsible-container]',
    };

    const attributes$y = {
      height: 'data-height',
      ariaExpanded: 'aria-expanded',
    };

    const classes$F = {
      open: 'is-open',
      enabled: 'is-enabled',
    };

    class ToggleEllipsis extends HTMLElement {
      constructor() {
        super();

        this.initialHeight = this.getAttribute(attributes$y.height);
        this.content = this.querySelector(selectors$N.content);
        this.actions = this.querySelector(selectors$N.actions);
        this.button = this.querySelector(selectors$N.button);
        this.toggle = this.toggle.bind(this);
        this.toggleActions = this.toggleActions.bind(this);
      }

      connectedCallback() {
        this.button.addEventListener('click', this.toggle);

        if (this.content.offsetHeight < this.initialHeight) {
          this.setHeight(this.content.offsetHeight);
        } else {
          this.setHeight(this.initialHeight);
        }

        this.toggleActions();

        document.addEventListener('theme:resize', this.toggleActionsEvent.bind(this));
      }

      toggle() {
        const isExpanded = !this.classList.contains(classes$F.open);
        const expandedHeight = this.content.offsetHeight + this.actions.offsetHeight * 2;

        this.setHeight(isExpanded ? expandedHeight : this.initialHeight);
        this.classList.toggle(classes$F.open, isExpanded);

        this.updateTabIndex();

        this.dispatchEvent(
          new CustomEvent('theme:ellipsis:toggle', {
            bubbles: true,
            detail: {
              isExpanded,
              dropdownHeight: expandedHeight,
            },
          })
        );
      }

      disconnectedCallback() {
        document.removeEventListener('theme:resize', this.toggleActions);
      }

      setHeight(contentHeight) {
        this.style.setProperty('--height', `${contentHeight}px`);
      }

      toggleActions() {
        this.classList.toggle(classes$F.enabled, this.content.offsetHeight + this.actions.offsetHeight > this.initialHeight);
        this.updateTabIndex();
      }

      toggleActionsEvent() {
        const isCollapsibleExpanded = this.closest(selectors$N.collapsibleContainer).getAttribute(attributes$y.ariaExpanded) === 'true';

        if (isCollapsibleExpanded) {
          this.toggleActions();
        }
      }

      updateTabIndex() {
        const links = this.content.querySelectorAll('a');
        const toggleActionsHeight = this.actions.offsetHeight;

        if (this.observer) {
          this.observer.disconnect();
        }

        this.observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.setAttribute('tabindex', '0');
              } else {
                entry.target.setAttribute('tabindex', '-1');
              }
            });
          },
          {
            root: this,
            threshold: 1,
            rootMargin: `0px 0px -${toggleActionsHeight}px 0px`, // Exclude height of the read more/less button as it's not part of the content
          }
        );

        links.forEach((link) => {
          this.observer.observe(link);
        });
      }
    }

    if (!customElements.get('toggle-ellipsis')) {
      customElements.define('toggle-ellipsis', ToggleEllipsis);
    }

    const selectors$M = {
      form: 'form',
      selectorWrapper: '[data-selector-wrapper]',
      popoutList: '[data-popout-list]',
      popoutToggle: '[data-popout-toggle]',
      popoutInput: '[data-popout-input]',
      popoutOptions: '[data-popout-option]',
      popoutText: '[data-popout-text]',
      ariaCurrent: '[aria-current]',
      productGridImage: '[data-product-image]',
      productGrid: '[data-product-grid-item]',
      quickViewItem: '[data-quick-view-item]',
      quickViewFooter: '[data-quick-view-foot]',
      cartItem: '[data-cart-item]',
      popoutQuantity: '[data-quantity-field]',
      cartDrawer: '[data-cart-drawer]',
      cartDrawerMessage: '[data-cart-message]',
      cartDrawerErrors: '[data-cart-errors]',
      cartDrawerBody: '[data-cart-drawer-body]',
      cartDrawerItems: '[data-items-holder]',
    };

    const classes$E = {
      selectorOpen: 'selector-wrapper--open',
      popoutListTop: 'select-popout__list--top',
      listVisible: 'select-popout__list--visible',
      active: 'is-active',
      currentSuffix: '--current',
      visible: 'is-visible',
      cartItemOpen: 'cart__item--open',
    };

    const attributes$x = {
      ariaCurrent: 'aria-current',
      ariaExpanded: 'aria-expanded',
      dataValue: 'data-value',
      popoutPrevent: 'data-popout-prevent',
      popoutQuantity: 'data-quantity-field',
      quickViewInner: 'data-quick-view-inner',
      quickViewFocus: 'data-quick-view-focus',
      popoutInitialized: 'data-popout-initialized',
      quantityHolder: 'data-quantity-holder',
    };

    if (!customElements.get('popout-select')) {
      customElements.define(
        'popout-select',
        class Popout extends HTMLElement {
          constructor() {
            super();
          }

          connectedCallback() {
            this.popout = this;
            this.selectorWrapper = this.popout.closest(selectors$M.selectorWrapper);
            this.popoutList = this.popout.querySelector(selectors$M.popoutList);
            this.popoutToggle = this.popout.querySelector(selectors$M.popoutToggle);
            this.popoutText = this.popout.querySelector(selectors$M.popoutText);
            this.popoutInput = this.popout.querySelector(selectors$M.popoutInput);
            this.popoutOptions = this.popout.querySelectorAll(selectors$M.popoutOptions);
            this.popoutPrevent = this.popout.getAttribute(attributes$x.popoutPrevent) === 'true';
            this.cartItem = this.popoutList.closest(selectors$M.cartItem);
            this.popupToggleFocusoutEvent = (evt) => this.popupToggleFocusout(evt);
            this.popupListFocusoutEvent = (evt) => this.popupListFocusout(evt);
            this.popupToggleClickEvent = (evt) => this.popupToggleClick(evt);
            this.popoutKeyupEvent = (evt) => this.popoutKeyup(evt);
            this.popupOptionsClickEvent = (evt) => this.popupOptionsClick(evt);
            this._connectOptionsDispatchEvent = (evt) => this._connectOptionsDispatch(evt);
            this.bodyClick = this.bodyClick.bind(this);
            this.popoutTop = false;

            this._connectOptions();
            this._connectToggle();
            this._onFocusOut();
            this.popupListSetDimensions();
          }

          popupToggleClick(evt) {
            const ariaExpanded = evt.currentTarget.getAttribute(attributes$x.ariaExpanded) === 'true';

            if (this.popoutList.closest(selectors$M.productGrid)) {
              const productGridItemImage = this.popoutList.closest(selectors$M.productGrid).querySelector(selectors$M.productGridImage);

              if (productGridItemImage) {
                productGridItemImage.classList.toggle(classes$E.visible, !ariaExpanded);
              }
            }

            if (this.cartItem) {
              this.cartItem.classList.toggle(classes$E.cartItemOpen);
            }

            evt.currentTarget.setAttribute(attributes$x.ariaExpanded, !ariaExpanded);
            this.popoutList.classList.toggle(classes$E.listVisible);
            this.toggleListPosition();
            this.popupListSetDimensions();
          }

          popupToggleFocusout(evt) {
            const ariaExpanded = this.popoutToggle.getAttribute(attributes$x.ariaExpanded) === 'true';

            if (!evt.relatedTarget) {
              return;
            }

            const popoutLostFocus = this.popout.contains(evt.relatedTarget);
            const popoutFromQuickView = evt.relatedTarget.hasAttribute(attributes$x.quickViewInner) || evt.relatedTarget.hasAttribute(attributes$x.quickViewFocus);

            if (!popoutLostFocus && !popoutFromQuickView && ariaExpanded) {
              this._hideList();
            }
          }

          popupListFocusout(evt) {
            const childInFocus = evt.currentTarget.contains(evt.relatedTarget);
            const isVisible = this.popoutList.classList.contains(classes$E.listVisible);

            if (isVisible && !childInFocus) {
              this._hideList();
            }
          }

          calc(get = 'shouldBeOnTop') {
            const {headerHeight, stickyHeaderHeight, announcementBarHeight} = readHeights();
            const quickViewItem = this.popout.closest(selectors$M.quickViewItem);
            const cartDrawer = this.popout.closest(selectors$M.cartDrawer);
            let popoutTop = Math.floor(this.popout.getBoundingClientRect().top);

            // Header and Announcement bar adjustments
            let headerH = headerHeight || 0;
            let announcementBarH = 0;
            if (announcementBarHeight !== 0 && window.scrollY < announcementBarHeight) announcementBarH = announcementBarHeight;
            if (window.scrollY > announcementBarH + headerHeight) headerH = stickyHeaderHeight;

            // Available height and initial adjustments
            let availableHeight = window.innerHeight;
            let adjustments = headerH + announcementBarH;

            // Quick view drawer calculations adjustments
            if (quickViewItem) {
              const quickViewFooter = quickViewItem.querySelector(selectors$M.quickViewFooter);
              const quickViewFooterH = quickViewFooter?.offsetHeight || 0;
              const quickViewOffsetTop = Math.floor(quickViewItem.getBoundingClientRect().top);
              popoutTop -= quickViewOffsetTop;
              availableHeight -= quickViewFooterH;
              adjustments = quickViewOffsetTop;

              if (isMobile()) {
                availableHeight = quickViewItem.offsetHeight - quickViewFooterH;
              }
            }

            if (cartDrawer) {
              const cartDrawerMessage = cartDrawer.querySelector(selectors$M.cartDrawerMessage);
              const cartDrawerErrors = cartDrawer.querySelector(selectors$M.cartDrawerErrors);
              const cartDrawerBody = cartDrawer.querySelector(selectors$M.cartDrawerBody);
              const cartDrawerItems = cartDrawer.querySelector(selectors$M.cartDrawerItems);
              const cartDrawerMessageH = cartDrawerMessage?.offsetHeight || 0;
              const cartDrawerErrorsH = cartDrawerErrors?.offsetHeight || 0;
              const cartDrawerBodyH = cartDrawerBody?.scrollHeight || 0;
              const cartDrawerItemsOffsetTop = Math.floor(cartDrawerItems?.getBoundingClientRect().top);
              popoutTop -= cartDrawerItemsOffsetTop;
              availableHeight = cartDrawerBodyH - cartDrawerMessageH - cartDrawerErrorsH;
              adjustments = 0;
            }

            // Available height total
            let availableHeightTotal = availableHeight - adjustments;
            if (quickViewItem && isMobile()) {
              availableHeightTotal = availableHeight;
            }

            // Getters:
            // 'shouldBeOnTop': check whether the space above the select toggle is more than what's below it
            if (get === 'shouldBeOnTop') {
              return availableHeightTotal / 2 < popoutTop;
            }

            // 'availableHeightAbove': calculate the available space above the select toggle
            if (get === 'availableHeightAbove') {
              const buttonOffsetTop = Math.floor(this.popoutToggle.getBoundingClientRect().top - 1);
              adjustments += 10; // (2 * 5px) to make up for the offset above the select toggle and below the top part of the available space
              return `${parseInt(buttonOffsetTop - adjustments)}px`;
            }

            // 'availableHeightBelow': calculate the available space below the select toggle
            if (get === 'availableHeightBelow') {
              const listOffsetTop = Math.floor(this.popoutList.getBoundingClientRect().top - 1);
              adjustments = 10; // (2 * 5px) to make up for the offset above the options list and below the bottom part of the available space
              return `${parseInt(availableHeight - listOffsetTop - adjustments)}px`;
            }
          }

          toggleListPosition() {
            const ariaExpanded = this.popoutToggle.getAttribute(attributes$x.ariaExpanded) === 'true';

            const removeTopClass = () => {
              this.selectorWrapper?.classList.remove(classes$E.selectorOpen);
              this.popoutList.classList.remove(classes$E.popoutListTop);
              this.popoutTop = false;
              this.popoutList.removeEventListener('transitionend', removeTopClass);
            };

            if (ariaExpanded) {
              this.selectorWrapper?.classList.add(classes$E.selectorOpen);
              if (this.calc('shouldBeOnTop')) {
                this.popoutList.classList.add(classes$E.popoutListTop);
                this.popoutTop = true;
              }
            } else {
              this.popoutList.addEventListener('transitionend', removeTopClass);
            }
          }

          popupListSetDimensions() {
            this.popoutList.style.setProperty('--max-height', '100vh');

            requestAnimationFrame(() => {
              if (this.popoutTop) {
                this.popoutList.style.setProperty('--max-height', this.calc('availableHeightAbove'));
              } else {
                this.popoutList.style.setProperty('--max-height', this.calc('availableHeightBelow'));
              }
            });
          }

          popupOptionsClick(evt) {
            const link = evt.target.closest(selectors$M.popoutOptions);
            if (link.attributes.href.value === '#') {
              evt.preventDefault();

              let attrValue = '';

              if (evt.currentTarget.getAttribute(attributes$x.dataValue)) {
                attrValue = evt.currentTarget.getAttribute(attributes$x.dataValue);
              }

              if (!this.popoutInput && this.popout.nextSibling.hasAttribute(attributes$x.quantityHolder)) {
                this.popoutInput = this.popout.nextSibling.querySelector(selectors$M.popoutQuantity);
              }

              this.popoutInput.value = attrValue;

              if (this.popoutPrevent) {
                this.popoutInput.dispatchEvent(new Event('change'));

                if (this.cartItem) {
                  this.popoutInput.dispatchEvent(new Event('input'));
                }

                // Switch from a "1..10" quantity dropdown to an input with "+/-" buttons
                this.switchQuantityInputBehavior(evt.detail.preventTrigger);

                const currentElement = this.popoutList.querySelector(`[class*="${classes$E.currentSuffix}"]`);
                let targetClass = classes$E.currentSuffix;

                if (currentElement && currentElement.classList.length) {
                  for (const currentElementClass of currentElement.classList) {
                    if (currentElementClass.includes(classes$E.currentSuffix)) {
                      targetClass = currentElementClass;
                      break;
                    }
                  }
                }

                const listTargetElement = this.popoutList.querySelector(`.${targetClass}`);

                if (listTargetElement) {
                  listTargetElement.classList.remove(`${targetClass}`);
                  evt.currentTarget.parentElement.classList.add(`${targetClass}`);
                }

                const targetAttribute = this.popoutList.querySelector(selectors$M.ariaCurrent);

                if (targetAttribute) {
                  targetAttribute.removeAttribute(attributes$x.ariaCurrent);
                  evt.currentTarget.setAttribute(attributes$x.ariaCurrent, 'true');
                }

                if (attrValue !== '') {
                  this.popoutText.textContent = attrValue;
                }

                this.popupToggleFocusout(evt);
                this.popupListFocusout(evt);
              } else {
                this._submitForm(attrValue);
              }
            }
          }

          switchQuantityInputBehavior(prevent = true) {
            if (prevent || !this.popoutInput.hasAttribute(attributes$x.popoutQuantity)) return;

            const targetElement = this.popoutList.querySelector(`[${attributes$x.dataValue}="${this.popoutInput.value}"]`);
            if (!targetElement) return;
            if (targetElement.parentElement.nextSibling) return;

            this.popout.classList.add(classes$E.active);
            this.selectorWrapper?.classList.remove(classes$E.selectorOpen);
          }

          popoutKeyup(event) {
            if (event.code !== theme.keyboardKeys.ESCAPE) {
              return;
            }
            this._hideList();
            this.popoutToggle.focus();
          }

          bodyClick(event) {
            const isOption = this.popout.contains(event.target);
            const isVisible = this.popoutList.classList.contains(classes$E.listVisible);

            if (isVisible && !isOption) {
              this._hideList();
            }
          }

          _connectToggle() {
            this.popout.setAttribute(attributes$x.popoutInitialized, '');
            this.popoutToggle.addEventListener('click', this.popupToggleClickEvent);
          }

          _connectOptions() {
            if (this.popoutOptions.length) {
              this.popoutOptions.forEach((element) => {
                element.addEventListener('theme:popout:click', this.popupOptionsClickEvent);
                element.addEventListener('click', this._connectOptionsDispatchEvent);
              });
            }
          }

          _connectOptionsDispatch(evt) {
            const event = new CustomEvent('theme:popout:click', {
              cancelable: true,
              bubbles: true,
              detail: {
                preventTrigger: false,
              },
            });

            if (!evt.target.dispatchEvent(event)) {
              evt.preventDefault();
            }
          }

          _onFocusOut() {
            this.popoutToggle.addEventListener('focusout', this.popupToggleFocusoutEvent);
            this.popoutList.addEventListener('focusout', this.popupListFocusoutEvent);
            this.popout.addEventListener('keyup', this.popoutKeyupEvent);

            document.body.addEventListener('click', this.bodyClick);
          }

          _submitForm() {
            const form = this.popout.closest(selectors$M.form);
            if (form) {
              form.submit();
            }
          }

          _hideList() {
            this.popoutList.classList.remove(classes$E.listVisible);
            this.popoutToggle.setAttribute(attributes$x.ariaExpanded, false);
            this.toggleListPosition();

            if (this.cartItem) {
              this.cartItem.classList.remove(classes$E.cartItemOpen);
            }
          }

          disconnectedCallback() {
            if (this.popoutOptions.length) {
              this.popoutOptions.forEach((element) => {
                element.removeEventListener('theme:popout:click', this.popupOptionsClickEvent);
                element.removeEventListener('click', this._connectOptionsDispatchEvent);
              });
            }

            this.popoutToggle.removeEventListener('click', this.popupToggleClickEvent);
            this.popoutToggle.removeEventListener('focusout', this.popupToggleFocusoutEvent);
            this.popoutList.removeEventListener('focusout', this.popupListFocusoutEvent);
            this.popout.removeEventListener('keyup', this.popoutKeyupEvent);
            document.body.removeEventListener('click', this.bodyClick);
          }
        }
      );
    }

    const selectors$L = {
      quantityHolder: '[data-quantity-holder]',
      quantityField: '[data-quantity-field]',
      quantityButton: '[data-quantity-button]',
      quantityMinusButton: '[data-quantity-minus]',
      quantityPlusButton: '[data-quantity-plus]',
      cartItem: '[data-cart-item]',
    };

    const classes$D = {
      quantityReadOnly: 'read-only',
      isDisabled: 'is-disabled',
    };

    if (!customElements.get('quantity-counter')) {
      customElements.define(
        'quantity-counter',
        class QuantityCounter extends HTMLElement {
          constructor() {
            super();
          }

          connectedCallback() {
            // DOM Elements
            this.quantity = this;
            this.cartItem = this.quantity.closest(selectors$L.cartItem);

            if (!this.quantity) {
              return;
            }

            this.field = this.quantity.querySelector(selectors$L.quantityField);
            this.buttons = this.quantity.querySelectorAll(selectors$L.quantityButton);
            this.increaseButton = this.quantity.querySelector(selectors$L.quantityPlusButton);

            // Set value or classes
            this.quantityValue = Number(this.field.value || 0);
            this.cartItemID = this.field.getAttribute('data-id');
            this.maxValue = Number(this.field.getAttribute('max')) > 0 ? Number(this.field.getAttribute('max')) : null;
            this.minValue = Number(this.field.getAttribute('min')) > 0 ? Number(this.field.getAttribute('min')) : 0;
            this.disableIncrease = this.disableIncrease.bind(this);

            // Flags
            this.emptyField = false;

            // Methods
            this.updateQuantity = this.updateQuantity.bind(this);
            this.decrease = this.decrease.bind(this);
            this.increase = this.increase.bind(this);

            this.disableIncrease();

            // Events
            if (!this.quantity.classList.contains(classes$D.quantityReadOnly)) {
              this.changeValueOnClick();
              this.changeValueOnInput();
            }
          }

          /**
           * Change field value when click on quantity buttons
           *
           * @return  {Void}
           */

          changeValueOnClick() {
            this.buttons.forEach((element) => {
              element.addEventListener('click', (event) => {
                event.preventDefault();

                this.quantityValue = Number(this.field.value || 0);

                const clickedElement = event.target;
                const isDescrease = clickedElement.matches(selectors$L.quantityMinusButton) || clickedElement.closest(selectors$L.quantityMinusButton);
                const isIncrease = clickedElement.matches(selectors$L.quantityPlusButton) || clickedElement.closest(selectors$L.quantityPlusButton);

                if (isDescrease) {
                  this.decrease();
                }

                if (isIncrease) {
                  this.increase();
                }

                this.updateQuantity();
              });
            });
          }

          /**
           * Change field value when input new value in a field
           *
           * @return  {Void}
           */

          changeValueOnInput() {
            this.field.addEventListener('input', () => {
              this.quantityValue = this.field.value;
              this.updateQuantity();
            });
          }

          /**
           * Update field value
           *
           * @return  {Void}
           */

          updateQuantity() {
            if (this.maxValue < this.quantityValue && this.maxValue !== null) {
              this.quantityValue = this.maxValue;
            }

            if (this.minValue > this.quantityValue) {
              this.quantityValue = this.minValue;
            }

            this.field.value = this.quantityValue;

            this.disableIncrease();

            if (this.cartItem) {
              document.dispatchEvent(new CustomEvent('theme:cart:update'));
              this.updateCart();
            } else {
              this.triggerInputChange();
            }
          }

          /**
           * Decrease value
           *
           * @return  {Void}
           */

          decrease() {
            if (this.quantityValue > this.minValue) {
              this.quantityValue--;

              return;
            }

            this.quantityValue = 0;
          }

          /**
           * Increase value
           *
           * @return  {Void}
           */

          increase() {
            this.quantityValue++;
          }

          /**
           * Disable increase
           *
           * @return  {[type]}  [return description]
           */

          disableIncrease() {
            this.increaseButton.classList.toggle(classes$D.isDisabled, this.quantityValue >= this.maxValue && this.maxValue !== null);
          }

          updateCart() {
            if (this.quantityValue === '') return;

            const event = new CustomEvent('theme:cart:update', {
              bubbles: true,
              detail: {
                id: this.cartItemID,
                quantity: this.quantityValue,
              },
            });

            if (this.cartItem) {
              this.cartItem.dispatchEvent(event);
            }
          }

          triggerInputChange() {
            this.field.dispatchEvent(new Event('change'));
          }
        }
      );
    }

    theme.ProductModel = (function () {
      let modelJsonSections = {};
      let models = {};
      let xrButtons = {};

      const selectors = {
        productMediaWrapper: '[data-product-single-media-wrapper]',
        mediaGroup: '[data-product-single-media-group]',
        productXr: '[data-shopify-xr]',
        mediaId: 'data-media-id',
        model3d: 'data-shopify-model3d-id',
        modelViewer: 'model-viewer',
        modelJson: '#ModelJson-',
        deferredMedia: '[data-deferred-media]',
        deferredMediaButton: '[data-deferred-media-button]',
      };
      const classes = {
        isLoading: 'is-loading',
        mediaHidden: 'media--hidden',
      };

      function init(mediaContainer, sectionId) {
        modelJsonSections[sectionId] = {
          loaded: false,
        };

        const deferredMediaButton = mediaContainer.querySelector(selectors.deferredMediaButton);

        if (deferredMediaButton) {
          deferredMediaButton.addEventListener('click', loadContent.bind(this, mediaContainer, sectionId));
        }
      }

      function loadContent(mediaContainer, sectionId) {
        if (mediaContainer.querySelector(selectors.deferredMedia).getAttribute('loaded')) {
          return;
        }

        mediaContainer.classList.add(classes.isLoading);
        const content = document.createElement('div');
        content.appendChild(mediaContainer.querySelector('template').content.firstElementChild.cloneNode(true));
        const modelViewerElement = content.querySelector('model-viewer');
        const deferredMedia = mediaContainer.querySelector(selectors.deferredMedia);
        deferredMedia.appendChild(modelViewerElement);
        deferredMedia.setAttribute('loaded', true);
        const mediaId = mediaContainer.dataset.mediaId;
        const modelId = modelViewerElement.dataset.modelId;
        const xrButton = mediaContainer.closest(selectors.mediaGroup).parentElement.querySelector(selectors.productXr);
        xrButtons[sectionId] = {
          element: xrButton,
          defaultId: modelId,
        };

        models[mediaId] = {
          modelId: modelId,
          mediaId: mediaId,
          sectionId: sectionId,
          container: mediaContainer,
          element: modelViewerElement,
        };

        if (!window.ShopifyXR) {
          window.Shopify.loadFeatures([
            {
              name: 'shopify-xr',
              version: '1.0',
              onLoad: setupShopifyXr,
            },
            {
              name: 'model-viewer-ui',
              version: '1.0',
              onLoad: setupModelViewerUi,
            },
          ]);
        } else {
          setupModelViewerUi();
        }
      }

      function setupShopifyXr(errors) {
        if (errors) {
          console.warn(errors);
          return;
        }
        if (!window.ShopifyXR) {
          document.addEventListener('shopify_xr_initialized', function () {
            setupShopifyXr();
          });
          return;
        }

        for (const sectionId in modelJsonSections) {
          if (modelJsonSections.hasOwnProperty(sectionId)) {
            const modelSection = modelJsonSections[sectionId];

            if (modelSection.loaded) {
              continue;
            }

            const modelJson = document.querySelector(`${selectors.modelJson}${sectionId}`);

            if (modelJson) {
              window.ShopifyXR.addModels(JSON.parse(modelJson.innerHTML));
              modelSection.loaded = true;
            }
          }
        }

        window.ShopifyXR.setupXRElements();
      }

      function setupModelViewerUi(errors) {
        if (errors) {
          console.warn(errors);
          return;
        }

        for (const key in models) {
          if (models.hasOwnProperty(key)) {
            const model = models[key];
            if (!model.modelViewerUi) {
              model.modelViewerUi = new Shopify.ModelViewerUI(model.element);
              setupModelViewerListeners(model);
            }
          }
        }
      }

      function setupModelViewerListeners(model) {
        const xrButton = xrButtons[model.sectionId];
        model.container.addEventListener('theme:media:visible', function () {
          xrButton.element.setAttribute(selectors.model3d, model.modelId);

          if (window.theme.touch) {
            return;
          }

          model.modelViewerUi.play();
          model.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
        });

        model.container.addEventListener('theme:media:hidden', function () {
          model.modelViewerUi.pause();
        });

        model.container.addEventListener('xrLaunch', function () {
          model.modelViewerUi.pause();
        });

        model.element.addEventListener('load', () => {
          xrButton.element.setAttribute(selectors.model3d, model.modelId);
          model.container.classList.remove(classes.isLoading);
          model.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
        });

        model.element.addEventListener('shopify_model_viewer_ui_toggle_play', function () {
          pauseOtherMedia(model.mediaId);
          setTimeout(() => {
            // Timeout to trigger play event after pause events
            model.container.dispatchEvent(new CustomEvent('theme:media:play'), {bubbles: true});
          }, 50);
        });
        model.element.addEventListener('shopify_model_viewer_ui_toggle_pause', function () {
          model.container.dispatchEvent(new CustomEvent('theme:media:pause'), {bubbles: true});
        });

        pauseOtherMedia(model.mediaId);
      }

      function pauseOtherMedia(mediaId) {
        const currentMedia = `[${selectors.mediaId}="${mediaId}"]`;
        const otherMedia = document.querySelectorAll(`${selectors.productMediaWrapper}:not(${currentMedia})`);

        if (otherMedia.length) {
          otherMedia.forEach((media) => {
            media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
            media.classList.add(classes.mediaHidden);
          });
        }
      }

      function removeSectionModels(sectionId) {
        for (const key in models) {
          if (models.hasOwnProperty(key)) {
            const model = models[key];
            if (model.sectionId === sectionId) {
              delete models[key];
            }
          }
        }
        delete modelJsonSections[sectionId];
        delete theme.mediaInstances[sectionId];
      }

      return {
        init: init,
        loadContent: loadContent,
        removeSectionModels: removeSectionModels,
      };
    })();

    register('collection-template', filters);

    const selectors$K = {
      templateAddresses: '.template-customers-addresses',
      accountForm: '[data-form]',
      addressNewForm: '[data-form-new]',
      btnNew: '[data-button-new]',
      btnEdit: '[data-button-edit]',
      btnDelete: '[data-button-delete]',
      btnCancel: '[data-button-cancel]',
      editAddress: 'data-form-edit',
      addressCountryNew: 'AddressCountryNew',
      addressProvinceNew: 'AddressProvinceNew',
      addressProvinceContainerNew: 'AddressProvinceContainerNew',
      addressCountryOption: '[data-country-option]',
      addressCountry: 'AddressCountry',
      addressProvince: 'AddressProvince',
      addressProvinceContainer: 'AddressProvinceContainer',
      requiredInputs: 'input[type="text"]:not(.optional)',
    };

    const attributes$w = {
      dataFormId: 'data-form-id',
    };

    const classes$C = {
      hidden: 'is-hidden',
      validation: 'validation--showup',
    };

    class Addresses {
      constructor(section) {
        this.section = section;
        this.addressNewForm = this.section.querySelector(selectors$K.addressNewForm);
        this.accountForms = this.section.querySelectorAll(selectors$K.accountForm);

        this.init();
        this.validate();
      }

      init() {
        if (this.addressNewForm) {
          const section = this.section;
          const newAddressForm = this.addressNewForm;
          this.customerAddresses();

          const newButtons = section.querySelectorAll(selectors$K.btnNew);
          if (newButtons.length) {
            newButtons.forEach((button) => {
              button.addEventListener('click', function (e) {
                e.preventDefault();
                button.classList.add(classes$C.hidden);
                newAddressForm.classList.remove(classes$C.hidden);
              });
            });
          }

          const editButtons = section.querySelectorAll(selectors$K.btnEdit);
          if (editButtons.length) {
            editButtons.forEach((button) => {
              button.addEventListener('click', function (e) {
                e.preventDefault();
                const formId = this.getAttribute(attributes$w.dataFormId);
                section.querySelector(`[${selectors$K.editAddress}="${formId}"]`).classList.toggle(classes$C.hidden);
              });
            });
          }

          const deleteButtons = section.querySelectorAll(selectors$K.btnDelete);
          if (deleteButtons.length) {
            deleteButtons.forEach((button) => {
              button.addEventListener('click', function (e) {
                e.preventDefault();
                const formId = this.getAttribute(attributes$w.dataFormId);
                if (confirm(theme.strings.delete_confirm)) {
                  Shopify.postLink('/account/addresses/' + formId, {parameters: {_method: 'delete'}});
                }
              });
            });
          }

          const cancelButtons = section.querySelectorAll(selectors$K.btnCancel);
          if (cancelButtons.length) {
            cancelButtons.forEach((button) => {
              button.addEventListener('click', function (e) {
                e.preventDefault();
                this.closest(selectors$K.accountForm).classList.add(classes$C.hidden);
                document.querySelector(selectors$K.btnNew).classList.remove(classes$C.hidden);
              });
            });
          }
        }
      }

      customerAddresses() {
        // Initialize observers on address selectors, defined in shopify_common.js
        if (Shopify.CountryProvinceSelector) {
          new Shopify.CountryProvinceSelector(selectors$K.addressCountryNew, selectors$K.addressProvinceNew, {
            hideElement: selectors$K.addressProvinceContainerNew,
          });
        }

        // Initialize each edit form's country/province selector
        const countryOptions = this.section.querySelectorAll(selectors$K.addressCountryOption);
        countryOptions.forEach((element) => {
          const formId = element.getAttribute(attributes$w.dataFormId);
          const countrySelector = `${selectors$K.addressCountry}_${formId}`;
          const provinceSelector = `${selectors$K.addressProvince}_${formId}`;
          const containerSelector = `${selectors$K.addressProvinceContainer}_${formId}`;

          new Shopify.CountryProvinceSelector(countrySelector, provinceSelector, {
            hideElement: containerSelector,
          });
        });
      }

      validate() {
        this.accountForms.forEach((accountForm) => {
          const form = accountForm.querySelector('form');
          const inputs = form.querySelectorAll(selectors$K.requiredInputs);

          form.addEventListener('submit', (event) => {
            let isEmpty = false;

            // Display notification if input is empty
            inputs.forEach((input) => {
              if (!input.value) {
                input.nextElementSibling.classList.add(classes$C.validation);
                isEmpty = true;
              } else {
                input.nextElementSibling.classList.remove(classes$C.validation);
              }
            });

            if (isEmpty) {
              event.preventDefault();
            }
          });
        });
      }
    }

    const template = document.querySelector(selectors$K.templateAddresses);
    if (template) {
      new Addresses(template);
    }

    const selectors$J = {
      form: '[data-account-form]',
      showReset: '[data-show-reset]',
      hideReset: '[data-hide-reset]',
      recover: '[data-recover-password]',
      login: '[data-login-form]',
      recoverSuccess: '[data-recover-success]',
      recoverSuccessText: '[data-recover-success-text]',
      recoverHash: '#recover',
    };

    const classes$B = {
      hidden: 'is-hidden',
    };

    class Login {
      constructor(form) {
        this.form = form;
        this.showButton = form.querySelector(selectors$J.showReset);
        this.hideButton = form.querySelector(selectors$J.hideReset);
        this.recover = form.querySelector(selectors$J.recover);
        this.login = form.querySelector(selectors$J.login);
        this.success = form.querySelector(selectors$J.recoverSuccess);
        this.successText = form.querySelector(selectors$J.recoverSuccessText);
        this.init();
      }

      init() {
        if (window.location.hash == selectors$J.recoverHash) {
          this.showRecoverPasswordForm();
        } else {
          this.hideRecoverPasswordForm();
        }

        if (this.success) {
          this.successText.classList.remove(classes$B.hidden);
        }

        this.showButton.addEventListener(
          'click',
          (e) => {
            e.preventDefault();
            this.showRecoverPasswordForm();
          },
          false
        );
        this.hideButton.addEventListener(
          'click',
          (e) => {
            e.preventDefault();
            this.hideRecoverPasswordForm();
          },
          false
        );
      }

      showRecoverPasswordForm() {
        this.recover.classList.remove(classes$B.hidden);
        this.login.classList.add(classes$B.hidden);
        window.location.hash = selectors$J.recoverHash;
        return false;
      }

      hideRecoverPasswordForm() {
        this.login.classList.remove(classes$B.hidden);
        this.recover.classList.add(classes$B.hidden);
        window.location.hash = '';
        return false;
      }
    }

    const loginForm = document.querySelector(selectors$J.form);
    if (loginForm) {
      new Login(loginForm);
    }

    register('search-template', [filters, tabs]);

    const selectors$I = {
      frame: '[data-ticker-frame]',
      scale: '[data-ticker-scale]',
      text: '[data-ticker-text]',
      clone: 'data-clone',
    };

    const attributes$v = {
      speed: 'data-marquee-speed',
    };

    const classes$A = {
      animationClass: 'ticker--animated',
      unloadedClass: 'ticker--unloaded',
      comparitorClass: 'ticker__comparitor',
    };

    const settings$3 = {
      moveTime: 1.63, // 100px going to move for 1.63s
      space: 100, // 100px
    };

    class Ticker {
      constructor(el, stopClone = false) {
        this.frame = el;
        this.stopClone = stopClone;
        this.scale = this.frame.querySelector(selectors$I.scale);
        this.text = this.frame.querySelector(selectors$I.text);

        this.comparitor = this.text.cloneNode(true);
        this.comparitor.classList.add(classes$A.comparitorClass);
        this.frame.appendChild(this.comparitor);
        this.scale.classList.remove(classes$A.unloadedClass);
        this.resizeEvent = debounce(() => this.checkWidth(), 100);
        this.listen();
      }

      listen() {
        document.addEventListener('theme:resize:width', this.resizeEvent);
        this.checkWidth();
      }

      checkWidth() {
        const padding = window.getComputedStyle(this.frame).paddingLeft.replace('px', '') * 2;

        if (this.frame.clientWidth - padding < this.comparitor.clientWidth || this.stopClone) {
          if (this.scale.childElementCount === 1) {
            this.text.classList.add(classes$A.animationClass);
            this.clone = this.text.cloneNode(true);
            this.clone.setAttribute(selectors$I.clone, '');
            this.scale.appendChild(this.clone);

            if (this.stopClone) {
              for (let index = 0; index < 10; index++) {
                const cloneSecond = this.text.cloneNode(true);
                cloneSecond.setAttribute(selectors$I.clone, '');
                this.scale.appendChild(cloneSecond);
              }
            }

            let frameSpeed = this.frame.getAttribute(attributes$v.speed);
            if (frameSpeed === null) {
              frameSpeed = 100;
            }
            const speed = settings$3.moveTime * (100 / parseInt(frameSpeed, 10));
            const animationTimeFrame = (this.text.clientWidth / settings$3.space) * speed;

            this.scale.style.setProperty('--animation-time', `${animationTimeFrame}s`);
          }
        } else {
          this.text.classList.add(classes$A.animationClass);
          let clone = this.scale.querySelector(`[${selectors$I.clone}]`);
          if (clone) {
            this.scale.removeChild(clone);
          }
          this.text.classList.remove(classes$A.animationClass);
        }
      }

      unload() {
        document.removeEventListener('theme:resize:width', this.resizeEvent);
      }
    }

    const selectors$H = {
      parallaxElement: '[data-parallax]',
      shopifySection: '.shopify-section',
      main: '[data-main]',
    };

    const classes$z = {
      isDisabled: 'is-disabled',
      mainContent: 'main-content',
      shopifySection: 'shopify-section',
      sectionFooterVisible: 'section-footer--visible',
      cardScrollingHidden: 'card-scrolling-hidden',
      stickyTopZero: 'sticky-top-zero',
    };

    const attributes$u = {
      parallaxAnimation: 'data-parallax',
      parallaxIntensity: 'data-parallax-intensity',
      parallaxStatic: 'data-parallax-static',
      singleElement: 'data-parallax-single',
      disableOnMobile: 'data-parallax-disable-on-mobile',
      parallaxRounded: 'data-parallax-rounded-corners',
      parallaxRoundedLarge: 'data-parallax-rounded-corners-large',
    };

    const sections$z = {};

    class ParallaxElement {
      constructor(el) {
        this.container = el;
        this.percentage = 0;
        this.percentageFull = 0;
        this.animation = this.container.getAttribute(attributes$u.parallaxAnimation);
        this.animations = this.animation.split(',');
        this.disableOnMobile = this.container.hasAttribute(attributes$u.disableOnMobile);
        this.viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        this.containerHeight = this.container.offsetHeight;
        this.main = document.querySelector(selectors$H.main);
        this.firstSection = this.main.children[0];
        this.orientation = getScreenOrientation();
        this.scrollEvent = () => this.updateParallax();
        this.resizeEvent = () => this.updateHeight();
        this.refreshEvent = () => this.refresh();

        this.assignFooterArguments();
        this.assignCardScrollingArguments();

        requestAnimationFrame(() => this.init());
      }

      /**
       * Declare the variables necessary only for the 'footer' parallax animation
       */
      assignFooterArguments() {
        if (!this.animations.includes('footer')) return;

        this.shopifySection = this.container.closest(selectors$H.shopifySection);

        // Add offset for rounded corners sections
        this.footerPrevSectionOffset = 0;
        if (this.container.hasAttribute(attributes$u.parallaxRounded)) {
          this.footerPrevSectionOffset = 8; // --radius-large value
          if (this.container.hasAttribute(attributes$u.parallaxRoundedLarge)) {
            this.footerPrevSectionOffset = 34; // --radius-large value
          }
        }

        // Get previous section
        this.prevSection = this.container.parentNode.previousElementSibling;
        if (this.prevSection && !this.prevSection.classList.contains(classes$z.shopifySection) && !this.prevSection.classList.contains(classes$z.mainContent)) {
          // if previous section is not a shopify section/main so it should be the main container
          this.prevSection = this.main;
        }

        requestAnimationFrame(() => {
          this.containerHeight = this.container.offsetHeight;
          this.footerOffset = 0.15 * this.containerHeight;
          this.cachedPosition = this.footerOffset;
          this.cachedPercentage = 0;
        });
      }

      /**
       * Declare the variables necessary only for the 'card-scrolling' parallax animation
       */
      assignCardScrollingArguments() {
        if (!this.animations.includes('card-scrolling')) return;

        let {stickyHeaderHeight} = readHeights();
        this.headerHeight = stickyHeaderHeight || 0;
        this.shopifySection = this.container.closest(selectors$H.shopifySection);
        this.nextSection = this.shopifySection.nextElementSibling;
        this.cardScrollingStickyTop = this.headerHeight || 0;
        this.cardScrollingMarginTop = this.nextSection ? parseInt(window.getComputedStyle(this.nextSection).getPropertyValue('margin-top')) : 0;
        this.after = false;

        this.prevSection = this.shopifySection.previousElementSibling;
        if (this.prevSection) {
          const firstSectionId = this.firstSection.id;
          const matchesFirstSection = this.prevSection.matches(`#${firstSectionId}`);
          const prevSectionHeight = this.prevSection.offsetHeight;
          this.shopifySection.classList.toggle(classes$z.stickyTopZero, matchesFirstSection && prevSectionHeight <= this.headerHeight * 2);
        }

        this.opacityValue = (delta) => {
          if (!delta) return 0;
          // Section is fully visible with its overlay at zero opacity
          if (Boolean(delta <= 0)) return 0;
          // Fade-away effect is in transition
          if (Boolean(delta > 0 && delta <= 100)) return Number(delta / 100).toFixed(4);
          // Section is out of sight with the overlay at full opacity
          if (Boolean(delta > 100)) return 1;
        };
      }

      init() {
        this.updateParallax();
        document.addEventListener('theme:scroll', this.scrollEvent);
        document.addEventListener('theme:resize', this.resizeEvent);
        document.addEventListener('theme:parallax:refresh', this.refreshEvent);
      }

      updateParallax() {
        if (this.container.classList.contains(classes$z.isDisabled)) return;
        if (this.disableOnMobile && isMobile()) return;

        this.scrollTop = Math.round(window.scrollY);
        this.scrollBottom = this.scrollTop + this.viewportHeight;
        this.elementOffsetTopPoint = Math.round(this.container.getBoundingClientRect().top + this.scrollTop);

        // Refresh containers' arguments and heights while scrolling to avoid sections 'reorder/unload/load' issues in the Theme editor
        if (window.Shopify.designMode) {
          this.assignCardScrollingArguments();
          this.containerHeight = this.container.offsetHeight;
        }

        this.elementOffsetBottomPoint = this.elementOffsetTopPoint + this.containerHeight;
        this.isBottomOfElementPassed = this.elementOffsetBottomPoint < this.scrollTop;
        this.isTopOfElementReached = this.elementOffsetTopPoint < this.scrollBottom;
        this.isInView = this.isTopOfElementReached && !this.isBottomOfElementPassed;

        this.adjustCalculations();
        this.toggleVisibility();

        if (this.isInView) {
          this.scrollProgress = this.scrollBottom - this.elementOffsetTopPoint;
          this.percentage = ((this.scrollProgress - this.containerHeight / 2) * 100) / this.viewportHeight; // -50% to 50% percent progress of the section
          this.percentageFull = Number(this.scrollProgress / this.containerHeight).toFixed(2); // 0.00 to 1.00 - percent progress of the section

          // 0% to 100% percent progress of the section when visible in the viewport
          this.percentageVisible = Number((this.scrollProgress * 100) / (this.viewportHeight + this.containerHeight)).toFixed(2);

          if (this.animations.includes('circle')) {
            this.animateCircleText();
          }
          if (this.animations.includes('horizontal') || this.animations.includes('vertical') || this.animations.includes('diagonal')) {
            this.animateOverlappingImages();
          }
          if (this.animations.includes('offset-ltr') || this.animations.includes('offset-rtl')) {
            this.offsetX();
          }
          if (this.animations.includes('card-scrolling')) {
            this.cardScrollingEffect();
          }
          if (this.animations.includes('zoom-on-scroll')) {
            this.zoomInOut();
          }
          if (this.animations.includes('footer')) {
            this.animateFooter();
          }
        }
      }

      /**
       * Adjust the calculations done on scroll for specific cases
       */
      adjustCalculations() {
        if (this.animations.includes('card-scrolling')) {
          this.currentSectionTop = this.shopifySection.getBoundingClientRect().top;

          if (this.nextSection) {
            this.nextSectionTop = this.nextSection.getBoundingClientRect().top;
            // Including the negative section offset, coming from its `margin-top` property, provides a smoother ending of the fade-away effect
            this.offsetTop = this.nextSectionTop - this.containerHeight - this.cardScrollingMarginTop;
          } else {
            this.nextSectionTop = this.currentSectionTop + this.containerHeight;
            this.offsetTop = this.currentSectionTop;
          }

          this.distance = Math.floor(this.currentSectionTop - this.headerHeight);

          // Hide the section after the point at which the next overlapping section meets with the top of the viewport, or better yet if the section has already surpassed the sticky one
          this.after = Boolean(Math.round(this.nextSectionTop - this.headerHeight - this.cardScrollingMarginTop + this.viewportHeight * 0.1) < 0);
          this.isInView = this.isTopOfElementReached && !this.after;
        }

        if (this.animations.includes('footer')) {
          this.elementOffsetTopPoint = Math.round(this.prevSection?.getBoundingClientRect().bottom - this.footerPrevSectionOffset + this.scrollTop);
          this.elementOffsetBottomPoint = this.elementOffsetTopPoint + this.containerHeight;
          this.isBottomOfElementPassed = this.elementOffsetBottomPoint < this.scrollTop;
          this.isTopOfElementReached = this.elementOffsetTopPoint < this.scrollBottom;
          this.isInView = this.isTopOfElementReached && !this.isBottomOfElementPassed;
          this.isApproaching = Math.round(this.elementOffsetTopPoint - this.viewportHeight / 2) < this.scrollBottom;
        }
      }

      /**
       * Toggle section visibility due to see-through issues on Chrome and Safari when the section contains `position: sticky;` CSS props
       *  - hide the 'card-scrolling' section as soon as it's out of sight when the section after it has completely passed on top of it
       *  - show the 'footer' section only if it's fully visible, or if one is approaching it while scrolling down the page
       */
      toggleVisibility() {
        if (this.animations.includes('card-scrolling')) {
          this.shopifySection.classList.toggle(classes$z.cardScrollingHidden, this.after);
        }

        if (this.animations.includes('footer')) {
          if (Boolean(this.isApproaching || this.isInView)) {
            this.shopifySection.classList.add(classes$z.sectionFooterVisible);
          } else {
            this.shopifySection.classList.remove(classes$z.sectionFooterVisible);
          }
        }
      }

      /**
       * Fade away animation for a card scrolling effect, used in the "Slideshow" and "Banner image" sections
       *  - start at the point at which the section top meets with the top of the screen
       *  - end as soon as the next section has completely passed on top of the sticky one
       *  - set a CSS property used as the value of the card scrolling overlay opacity
       */
      cardScrollingEffect() {
        // Set the CSS property that handles overlay opacity
        const delta = (this.offsetTop / this.containerHeight) * -100;
        this.container.style.setProperty('--card-scrolling-overlay', this.opacityValue(delta));
      }

      /**
       * Zoom animation on scroll, used in the "Slideshow", "Banner image" and "Countdown" sections
       */
      zoomInOut() {
        // Intensity value is best set between 0 and 1. Bigger value will make the zoom more aggressive.
        // Setting intensity at `0.2` will result in the image reaching up to `1.2` for its highest scale value, i.e. "transform: scale(1.2);"
        const intensity = 0.2;

        // Adjustments for cases when 'card-scrolling' and 'zoom-on-scroll' parallax animations are enabled for the container simultaneously
        if (this.animations.includes('card-scrolling') && this.nextSection) {
          const cumulativeTop = this.nextSectionTop - this.headerHeight - this.cardScrollingMarginTop - this.containerHeight;
          const elementOffsetTopPoint = Math.round(cumulativeTop + this.scrollTop);
          const scrollProgress = this.scrollBottom - elementOffsetTopPoint;
          this.percentageVisible = Number((scrollProgress * 100) / (this.viewportHeight + this.containerHeight + this.cardScrollingMarginTop)).toFixed(2);
        }

        const delta = (intensity * this.percentageVisible) / 100;
        let scale = Number(1 + delta).toFixed(4);
        scale = scale > 1 ? scale : 1; // Prevent image scale down under 100%
        this.container.style.setProperty('--scale', scale);
      }

      /**
       * Offset the container to the left or right on scroll, used in the "Announcement bar" and "Marquee" sections
       */
      offsetX() {
        const isStatic = this.container.hasAttribute(attributes$u.parallaxStatic);
        const intensity = this.container.getAttribute(attributes$u.parallaxIntensity) || 100;
        // Adjustment is necessary for `Ticker` instances with cloned elements
        let adjustment = this.animations.includes('offset-ltr') ? intensity : 0;
        if (isStatic) adjustment = intensity / 2;
        const direction = this.animations.includes('offset-ltr') ? 1 : -1;
        // Examples:
        // `intensity` of 100 and 'ltr' animation results in `offset` values from -100 to 0
        // `intensity` of 100 and 'rtl' animation results in `offset` values from 0 to 100
        // `intensity` of 50 and 'ltr' animation results in `offset` values from -50 to 0
        // `intensity` of 50 and 'rtl' animation results in `offset` values from 0 to 50
        const offset = (intensity * this.percentageVisible) / 100 - adjustment;
        const offsetX = Number(offset * direction).toFixed(2);

        this.container.style.setProperty('--offsetX', `${offsetX}%`);
      }

      /**
       * Update containers' heights and re-set values necessary for all calculations on scroll
       */
      updateHeight() {
        if (this.animations.includes('card-scrolling')) {
          let {stickyHeaderHeight} = readHeights();
          this.headerHeight = stickyHeaderHeight || 0;
          this.cardScrollingStickyTop = this.headerHeight || 0;
          this.cardScrollingMarginTop = this.nextSection ? parseInt(window.getComputedStyle(this.nextSection).getPropertyValue('margin-top')) : 0;
          this.containerHeight = this.container.offsetHeight;

          this.prevSection = this.shopifySection.previousElementSibling;
          if (this.prevSection) {
            const firstSectionId = this.firstSection.id;
            const matchesFirstSection = this.prevSection.matches(`#${firstSectionId}`);
            const prevSectionHeight = this.prevSection.offsetHeight;
            this.shopifySection.classList.toggle(classes$z.stickyTopZero, matchesFirstSection && prevSectionHeight <= this.headerHeight * 2);
          }
        }

        const isDesktop = matchMedia('(min-width: 1024px)').matches;

        if (this.orientation !== getScreenOrientation() || isDesktop) {
          this.viewportHeight = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
          this.containerHeight = this.container.offsetHeight;
          this.orientation = getScreenOrientation();
        }
      }

      /**
       * "Products list" section's circle text "Rotate on scroll" animation
       */
      animateCircleText() {
        const rotateDegree = 70;
        const angle = ((rotateDegree * this.percentage) / 100) * -1; // The -1 negates the value to have it rotate counterclockwise
        const adjustRotateDegree = rotateDegree / 2; // We use this to keep the image upright when scrolling and it gets to the middle of the page

        if (this.percentage > 0) {
          this.container.style.setProperty(`--rotate`, `${adjustRotateDegree + angle}deg`);
        }
      }

      /**
       * "Overlapping images" section's parallax animations
       */
      animateOverlappingImages() {
        const intensity = this.container.getAttribute(attributes$u.parallaxIntensity);
        const offsetRange = 0.25 * intensity;
        const offsetRangeHalf = offsetRange / 2;
        const singleElement = this.container.hasAttribute(attributes$u.singleElement);
        const offset = (offsetRange * this.percentage) / 100;

        let offsetXPrimary = 0;
        let offsetYPrimary = 0;
        let offsetXSecondary = 0;
        let offsetYSecondary = 0;

        if (this.animations.includes('horizontal') || this.animations.includes('diagonal')) {
          offsetXPrimary = -1 * offsetRangeHalf + offset;
          offsetXSecondary = offsetRangeHalf - offset;
        }

        if (this.animations.includes('vertical') || this.animations.includes('diagonal')) {
          offsetYPrimary = offsetRangeHalf - offset;
          offsetYSecondary = -1 * offsetRangeHalf + offset;
        }

        this.container.style.setProperty('--transformX-primary', `${offsetXPrimary}%`);
        this.container.style.setProperty('--transformY-primary', `${offsetYPrimary}%`);

        if (!singleElement) {
          this.container.style.setProperty('--transformX-secondary', `${offsetXSecondary}%`);
          this.container.style.setProperty('--transformY-secondary', `${offsetYSecondary}%`);
        }
      }

      /**
       * "Footer" and "Footer minimal" sections parallax animations
       */
      animateFooter() {
        const offsetMove = this.footerOffset * this.percentageFull;
        const percentageOfFullOffset = Number((offsetMove / this.footerOffset) * 100).toFixed(2);
        const currentTransform = new WebKitCSSMatrix(window.getComputedStyle(this.container).transform);
        const currentOffset = Number(currentTransform.m42).toFixed(2);
        let newOffset = Number(this.footerOffset - offsetMove).toFixed(2);
        if (this.percentageFull >= 1) {
          newOffset = 0;
        }

        if (currentOffset !== newOffset && this.cachedPercentage !== percentageOfFullOffset) {
          this.container.style.setProperty('--transformY', `${newOffset}`);
          this.cachedPercentage = percentageOfFullOffset;
          this.cachedPosition = newOffset;
        }
      }

      /**
       * Event callback for Theme Editor `shopify:section:unload` event
       */
      unload() {
        document.removeEventListener('theme:scroll', this.scrollEvent);
        document.removeEventListener('theme:resize', this.resizeEvent);
        document.removeEventListener('theme:parallax:refresh', this.refreshEvent);
      }

      /**
       * Refresh arguments and scroll positions
       */
      refresh() {
        this.assignFooterArguments();
        this.assignCardScrollingArguments();
        this.updateParallax();
      }
    }

    const parallaxSection = {
      onLoad() {
        sections$z[this.id] = [];
        const elements = this.container.querySelectorAll(selectors$H.parallaxElement);
        elements.forEach((element) => {
          sections$z[this.id].push(new ParallaxElement(element));
        });
      },
      onUnload() {
        sections$z[this.id].forEach((element) => {
          if (typeof element.unload === 'function') {
            element.unload();
          }
        });
      },
    };

    const selectors$G = {
      announcement: '[data-announcement]',
      announcementSlide: '[data-announcement-slide]',
      frame: '[data-ticker-frame]',
      slide: '[data-slide]',
      slider: '[data-slider]',
      static: '[data-static]',
      tickerScale: '[data-ticker-scale]',
      tickerText: '[data-ticker-text]',
      parallax: '[data-parallax]',
      textHighlight: 'text-highlight',
    };

    const attributes$t = {
      slide: 'data-slide',
      speed: 'data-slider-speed',
      arrows: 'data-slider-arrows',
      stop: 'data-stop',
      style: 'style',
      targetReferrer: 'data-target-referrer',
      clipPath: 'clip-path',
    };

    const classes$y = {
      desktop: 'desktop',
      mobile: 'mobile',
      tickerAnimated: 'ticker--animated',
      isDisabled: 'is-disabled',
    };

    const tags = {
      clipPath: 'clipPath',
    };

    const sections$y = {};

    class AnnouncementBar {
      constructor(container) {
        this.barHolder = container;
        this.locationPath = location.href;
        this.slides = this.barHolder.querySelectorAll(selectors$G.slide);
        this.slider = this.barHolder.querySelector(selectors$G.slider);
        this.static = this.barHolder.querySelector(selectors$G.static);
        this.parallax = this.barHolder.querySelector(selectors$G.parallax);
        this.tickers = [];
        this.flkty = null;

        this.init();
      }

      init() {
        this.removeAnnouncement();

        if (this.slider) {
          this.initSlider();
          document.addEventListener('theme:resize:width', this.initSlider.bind(this));
        }

        if (this.static) {
          this.initTickers();
          this.tickerAnimationPause();
        }

        if (!this.slider && !this.static) {
          this.initTickers(true);
          this.tickerAnimationPause();
        }

        this.updateSVGClipPathIDs();
      }

      /**
       * Delete announcement which has a target referrer attribute and it is not contained in page URL
       */
      removeAnnouncement() {
        for (let i = 0; i < this.slides.length; i++) {
          const element = this.slides[i];

          if (!element.hasAttribute(attributes$t.targetReferrer)) {
            continue;
          }

          if (this.locationPath.indexOf(element.getAttribute(attributes$t.targetReferrer)) === -1 && !window.Shopify.designMode) {
            element.parentNode.removeChild(element);
          }
        }
      }

      // This is used to hide the section based on the target device (e.g., if all slides are for mobile, hide the section on desktop).
      checkSlidesClasses(slides, barHolder) {
        if (slides.length !== 0) {
          const slidesMobile = barHolder.querySelectorAll(`${selectors$G.slide}.${classes$y.mobile}`);
          const slidesDesktop = barHolder.querySelectorAll(`${selectors$G.slide}.${classes$y.desktop}`);

          if (slides.length === slidesMobile.length) {
            barHolder.parentNode.classList.add(classes$y.mobile);
          } else if (slides.length === slidesDesktop.length) {
            barHolder.parentNode.classList.add(classes$y.desktop);
          }
        }
      }

      /**
       * Init slider
       */
      initSlider() {
        const slides = this.slider.querySelectorAll(selectors$G.slide);
        const sliderArrows = this.slider.hasAttribute(attributes$t.arrows);

        this.checkSlidesClasses(slides, this.barHolder);

        if (slides) {
          let slideSelector = `${selectors$G.slide}`;

          if (window.innerWidth < theme.sizes.small) {
            slideSelector = `${selectors$G.slide}:not(.${classes$y.desktop})`;
          } else {
            slideSelector = `${selectors$G.slide}:not(.${classes$y.mobile})`;
          }

          if (this.flkty != null) {
            this.flkty.destroy();
          }

          this.flkty = new Flickity(this.slider, {
            cellSelector: slideSelector,
            pageDots: false,
            prevNextButtons: sliderArrows,
            wrapAround: true,
            autoPlay: parseInt(this.slider.getAttribute(attributes$t.speed), 10),
            on: {
              ready: () => {
                setTimeout(() => {
                  this.slider.dispatchEvent(
                    new CustomEvent('slider-is-loaded', {
                      bubbles: true,
                      detail: {
                        slider: this,
                      },
                    })
                  );
                }, 10);
              },
              change: (index) => {
                this.flkty.cells.forEach((slide, i) => {
                  slide.element.querySelectorAll(selectors$G.textHighlight).forEach((highlight) => {
                    highlight.setTriggerAttribute(Boolean(i === index));
                  });
                });
              },
            },
          });
          this.flkty.reposition();
        }

        this.slider.addEventListener('slider-is-loaded', () => {
          this.initTickers();
          this.updateSVGClipPathIDs();
        });
      }

      /**
       * Init tickers in sliders
       */
      initTickers(stopClone = false) {
        const frames = this.barHolder.querySelectorAll(selectors$G.frame);

        frames.forEach((element) => {
          const ticker = new Ticker(element, stopClone);
          this.tickers.push(ticker);

          const slides = element.querySelectorAll(selectors$G.slide);
          this.checkSlidesClasses(slides, this.barHolder);
        });
      }

      toggleTicker(e, isStopped) {
        const tickerScale = e.target.closest(selectors$G.tickerScale);
        const element = document.querySelector(`[${attributes$t.slide}="${e.detail.blockId}"]`);

        if (isStopped && element) {
          tickerScale.setAttribute(attributes$t.stop, '');
          tickerScale.querySelectorAll(selectors$G.tickerText).forEach((textHolder) => {
            textHolder.classList.remove(classes$y.tickerAnimated);
            textHolder.style.transform = `translate3d(${-(element.offsetLeft - parseInt(getComputedStyle(element).marginLeft, 10))}px, 0, 0)`;
          });
        }

        if (!isStopped && element) {
          tickerScale.querySelectorAll(selectors$G.tickerText).forEach((textHolder) => {
            textHolder.classList.add(classes$y.tickerAnimated);
            textHolder.removeAttribute(attributes$t.style);
          });
          tickerScale.removeAttribute(attributes$t.stop);

          if (this.static) {
            document.dispatchEvent(new CustomEvent('theme:resize:width', {bubbles: true}));
          }
        }
      }

      tickerAnimationPause() {
        let hoverTimer = 0;
        let isHovered = false;
        const tickerContainer = this.barHolder.querySelector(selectors$G.announcementSlide);

        tickerContainer.addEventListener('mouseenter', () => {
          isHovered = true;

          hoverTimer = setTimeout(() => {
            if (isHovered) {
              tickerContainer.querySelectorAll(selectors$G.tickerText).forEach((element) => {
                element.style.animationPlayState = 'paused';
              });
            }

            clearTimeout(hoverTimer);
          }, 500);
        });

        tickerContainer.addEventListener('mouseleave', () => {
          isHovered = false;

          tickerContainer.querySelectorAll(selectors$G.tickerText).forEach((element) => {
            element.style.animationPlayState = 'running';
          });
        });
      }

      updateSVGClipPathIDs() {
        this.barHolder.querySelectorAll(selectors$G.slide).forEach((svg, index) => {
          const clipPath = svg.querySelector(tags.clipPath);

          if (clipPath) {
            const newclipPathId = `${clipPath.id}_${index}`;

            // Update the clipPath ID
            clipPath.id = newclipPathId;

            // Update the 'clip-path' URL reference in the <g> tag
            const gTag = svg.querySelector(`g[${attributes$t.clipPath}]`);
            if (gTag) {
              gTag.setAttribute(attributes$t.clipPath, `url(#${newclipPathId})`);
            }
          }
        });
      }

      onBlockSelect(evt) {
        const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));

        if (this.slider && this.flkty !== null) {
          this.flkty.select(index);
          this.flkty.pausePlayer();
        }

        if (!this.slider) {
          this.toggleTicker(evt, true);
        }

        if (this.parallax) {
          this.parallax.style.setProperty('--offsetX', '0%');
          this.parallax.classList.add(classes$y.isDisabled);
        }
      }

      onBlockDeselect(evt) {
        if (this.slider && this.flkty !== null) {
          this.flkty.unpausePlayer();
        }

        if (!this.slider) {
          this.toggleTicker(evt, false);
        }

        if (this.parallax) {
          this.parallax.classList.remove(classes$y.isDisabled);
          document.dispatchEvent(new CustomEvent('theme:scroll'));
        }
      }

      onUnload() {
        document.removeEventListener('theme:resize:width', this.initSlider.bind(this));

        if (this.tickers.length > 0) {
          this.tickers.forEach((ticker) => {
            ticker.unload();
          });
        }
      }
    }

    const announcement = {
      onLoad() {
        sections$y[this.id] = [];
        const element = this.container.querySelector(selectors$G.announcement);
        if (element) {
          sections$y[this.id].push(new AnnouncementBar(element));
        }
      },
      onBlockSelect(e) {
        if (sections$y[this.id].length) {
          sections$y[this.id].forEach((el) => {
            if (typeof el.onBlockSelect === 'function') {
              el.onBlockSelect(e);
            }
          });
        }
      },
      onBlockDeselect(e) {
        if (sections$y[this.id].length) {
          sections$y[this.id].forEach((el) => {
            if (typeof el.onBlockSelect === 'function') {
              el.onBlockDeselect(e);
            }
          });
        }
      },
      onUnload() {
        sections$y[this.id].forEach((el) => {
          if (typeof el.onUnload === 'function') {
            el.onUnload();
          }
        });
      },
    };

    register('announcement-bar', announcement);
    register('marquee', [announcement, parallaxSection]);

    const selectors$F = {
      disclosureWrappper: '[data-hover-disclosure]',
      header: '[data-site-header]',
      link: '[data-top-link]',
      headerBackground: '[data-header-background]',
      navItem: '[data-nav-item]',
    };

    const classes$x = {
      isVisible: 'is-visible',
      grandparent: 'grandparent',
      headerMenuOpened: 'site-header--menu-opened',
      hasScrolled: 'has-scrolled',
      headerHovered: 'site-header--hovered',
      headerCompress: 'site-header--compress',
      searchOpened: 'search-opened',
      megamenuOpened: 'megamenu-opened',
    };

    const attributes$s = {
      disclosureToggle: 'data-hover-disclosure-toggle',
      ariaHasPopup: 'aria-haspopup',
      ariaExpanded: 'aria-expanded',
      ariaControls: 'aria-controls',
    };

    let sections$x = {};

    class HoverDisclosure {
      constructor(el) {
        this.disclosure = el;
        this.body = document.body;
        this.header = el.closest(selectors$F.header);
        this.key = this.disclosure.id;
        this.trigger = document.querySelector(`[${attributes$s.disclosureToggle}='${this.key}']`);
        this.link = this.trigger.querySelector(selectors$F.link);
        this.grandparent = this.trigger.classList.contains(classes$x.grandparent);
        this.background = document.querySelector(selectors$F.headerBackground);
        this.trigger.setAttribute(attributes$s.ariaHasPopup, true);
        this.trigger.setAttribute(attributes$s.ariaExpanded, false);
        this.trigger.setAttribute(attributes$s.ariaControls, this.key);
        this.dropdown = this.trigger.querySelector(selectors$F.disclosureWrappper);
        this.setBackgroundHeightEvent = () => this.setBackgroundHeight();

        this.connectHoverToggle();
        this.handleTablets();
      }

      setBackgroundHeight() {
        this.hasScrolled = this.body.classList.contains(classes$x.hasScrolled);
        this.headerHeight = this.hasScrolled ? window.stickyHeaderHeight : this.header.offsetHeight;

        if (this.grandparent) {
          this.dropdown.style.height = 'auto';
          this.dropdownHeight = this.dropdown.offsetHeight + this.headerHeight;
        } else {
          this.dropdownHeight = this.headerHeight;
        }

        this.background.style.setProperty('--header-background-height', `${this.dropdownHeight}px`);

        // Hide header dropdowns on mobile
        if (window.innerWidth < theme.sizes.small) {
          this.hideDisclosure();
        }
      }

      showDisclosure() {
        this.setBackgroundHeight();
        document.addEventListener('theme:resize', this.setBackgroundHeightEvent);

        // Set accessibility and classes
        this.trigger.setAttribute(attributes$s.ariaExpanded, true);
        this.trigger.classList.add(classes$x.isVisible);
        this.header.classList.add(classes$x.headerMenuOpened);
        if (this.trigger.classList.contains(classes$x.grandparent)) {
          this.body.classList.add(classes$x.megamenuOpened);
        }
        this.updateHeaderHover();
      }

      hideDisclosure() {
        this.background.style.removeProperty('--header-background-height');
        document.removeEventListener('theme:resize', this.setBackgroundHeightEvent);

        this.trigger.classList.remove(classes$x.isVisible);
        this.trigger.setAttribute(attributes$s.ariaExpanded, false);
        this.header.classList.remove(classes$x.headerMenuOpened);
        this.body.classList.remove(classes$x.megamenuOpened);
      }

      updateHeaderHover() {
        requestAnimationFrame(() => {
          const isHovered = this.header.matches(':hover');
          const hasHoveredClass = this.header.classList.contains(classes$x.headerHovered);

          if (isHovered && !hasHoveredClass) this.header.classList.add(classes$x.headerHovered);
        });
      }

      handleTablets() {
        // first click opens the popup, second click opens the link
        this.trigger.addEventListener('touchstart', (e) => {
          const isOpen = this.trigger.classList.contains(classes$x.isVisible);
          if (!isOpen) {
            e.preventDefault();

            // Hide the rest of the active nav items
            const activeNavItems = this.header.querySelectorAll(`.${classes$x.isVisible}${selectors$F.navItem}`);

            if (activeNavItems.length > 0) {
              activeNavItems.forEach((item) => {
                if (item !== this.trigger) {
                  item.dispatchEvent(new Event('mouseleave', {bubbles: true}));

                  const onTransitionEnd = () => {
                    requestAnimationFrame(() => {
                      this.showDisclosure();
                    });

                    item.removeEventListener('transitionend', onTransitionEnd);
                  };

                  item.addEventListener('transitionend', onTransitionEnd);
                }
              });

              return;
            }

            this.showDisclosure();
          }
        });
      }

      connectHoverToggle() {
        this.trigger.addEventListener('mouseenter', () => this.showDisclosure());
        this.link.addEventListener('focus', () => this.showDisclosure());

        this.trigger.addEventListener('mouseleave', () => this.hideDisclosure());
        this.trigger.addEventListener('focusout', (event) => {
          const inMenu = this.trigger.contains(event.relatedTarget);

          if (!inMenu) {
            this.hideDisclosure();
          }
        });
        this.disclosure.addEventListener('keyup', (event) => {
          if (event.code !== theme.keyboardKeys.ESCAPE) {
            return;
          }
          this.hideDisclosure();
        });
      }

      onBlockSelect(event) {
        if (this.disclosure.contains(event.target)) {
          const isTouch = matchMedia('(pointer:coarse)').matches;
          const viewportMobile = window.innerWidth < theme.sizes.small;
          let mobileNavEnabled = false;

          if ((viewportMobile && window.Shopify.designMode) || this.header.classList.contains(classes$x.headerCompress)) {
            // if theme editor in mobile mode or nav compressed is visible
            mobileNavEnabled = true;
          }

          if (!isTouch && !mobileNavEnabled) this.showDisclosure(event); // showDisclosure only for desktop
        }
      }

      onBlockDeselect(event) {
        if (this.disclosure.contains(event.target)) {
          this.hideDisclosure();
        }
      }
    }

    const hoverDisclosure = {
      onLoad() {
        sections$x[this.id] = [];
        const disclosures = this.container.querySelectorAll(selectors$F.disclosureWrappper);

        disclosures.forEach((el) => {
          sections$x[this.id].push(new HoverDisclosure(el));
        });
      },
      onBlockSelect(evt) {
        sections$x[this.id].forEach((el) => {
          if (typeof el.onBlockSelect === 'function') {
            el.onBlockSelect(evt);
          }
        });
      },
      onBlockDeselect(evt) {
        sections$x[this.id].forEach((el) => {
          if (typeof el.onBlockDeselect === 'function') {
            el.onBlockDeselect(evt);
          }
        });
      },
    };

    const selectors$E = {
      header: '[data-site-header]',
      announcementBar: '[data-announcement-wrapper]',
      collectionFilters: '[data-collection-filters]',
      logoTextLink: '[data-logo-text-link]',
      mobileMenuTrigger: '[data-mobile-menu-trigger]',
      nav: '[data-nav]',
      navItem: '[data-nav-item]',
      wrapper: '[data-wrapper]',
      headerBackground: '[data-header-background]',
      cartPage: '[data-cart-page]',
      widthContent: '[data-takes-space]',
    };

    const classes$w = {
      jsDrawerOpenAll: ['js-drawer-open', 'js-drawer-open-cart', 'js-quick-view-visible', 'js-quick-view-from-cart'],
      headerTransparent: 'site-header--transparent',
      headerHovered: 'site-header--hovered',
      headerMenuOpened: 'site-header--menu-opened',
      hasScrolled: 'has-scrolled',
      hideHeader: 'hide-header',
      headerCompress: 'site-header--compress',
      isVisible: 'is-visible',
      isOpen: 'is-open',
      searchOpened: 'search-opened',
      noOutline: 'no-outline',
      cloneClass: 'js__header__clone',
      drawerOpen: 'js-drawer-open',
    };

    const attributes$r = {
      navAlignment: 'data-nav-alignment',
      headerSticky: 'data-header-sticky',
    };

    const sections$w = {};

    class Header {
      constructor(container) {
        this.container = container;
        this.background = document.querySelector(selectors$E.headerBackground);
        this.header = container;
        this.headerWrapper = container.querySelector(selectors$E.wrapper);
        this.logoTextLink = container.querySelector(selectors$E.logoTextLink);
        this.nav = container.querySelector(selectors$E.nav);
        this.mobileMenuTrigger = container.querySelector(selectors$E.mobileMenuTrigger);
        this.headerStateEvent = (event) => this.headerState(event);
        this.handleTouchstartEvent = (event) => this.handleTouchstart(event);
        this.updateBackgroundHeightEvent = (event) => this.updateBackgroundHeight(event);
        this.triggerDrawerOpeningEvent = () => this.triggerDrawerOpening(this.mobileMenuTrigger);

        initTransparentHeader();

        this.minWidth = this.getMinWidth();
        this.checkWidthEvent = () => this.checkWidth();
        this.listenWidth();
        this.initMobileNavToggle();
        this.handleTextLinkLogos();
        this.initStickyHeader();
        this.handleBackgroundEvents();

        if (!document.querySelector(selectors$E.cartPage)) {
          window.cart = new CartDrawer();
        }

        document.body.addEventListener('touchstart', this.handleTouchstartEvent, {passive: true});
        this.updateHeaderHover();
      }

      updateHeaderHover() {
        requestAnimationFrame(() => {
          const isHovered = this.header.matches(':hover');
          const hasHoveredClass = this.header.classList.contains(classes$w.headerHovered);

          if (isHovered && !hasHoveredClass) this.header.classList.add(classes$w.headerHovered);
        });
      }

      handleTouchstart(event) {
        const isInHeader = this.header.contains(event.target);
        const activeNavItem = this.header.querySelector(`.${classes$w.isVisible}${selectors$E.navItem}`);

        if (!isInHeader && activeNavItem) {
          activeNavItem.dispatchEvent(new Event('mouseleave', {bubbles: true}));
        }
      }

      handleTextLinkLogos() {
        if (this.logoTextLink === null) return;

        const headerHeight = this.header.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
        document.documentElement.style.setProperty('--header-sticky-height', `${headerHeight}px`);
      }

      initStickyHeader() {
        this.headerSticky = this.header.hasAttribute(attributes$r.headerSticky);
        this.hasScrolled = false;
        this.hasCollectionFilters = document.querySelector(selectors$E.collectionFilters);
        this.position = this.header.dataset.position;

        const shouldShowCompactHeader = this.position === 'fixed' && !this.hasCollectionFilters;
        if (shouldShowCompactHeader) {
          this.headerState();
          document.addEventListener('theme:scroll', this.headerStateEvent);
          return;
        }

        document.body.classList.remove(classes$w.hasScrolled);
        if (window.isHeaderTransparent) {
          this.header.classList.add(classes$w.headerTransparent);
        }
      }

      // Switch to "compact" header on scroll
      headerState(event) {
        const headerHeight = parseInt(this.header.dataset.height || this.header.offsetHeight);
        const announcementBar = document.querySelector(selectors$E.announcementBar);
        const announcementHeight = announcementBar ? announcementBar.offsetHeight : 0;
        const pageOffset = headerHeight + announcementHeight;
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollUp = event && event.detail && event.detail.up;

        // Show compact header when scroll down
        this.hasScrolled = currentScrollTop > pageOffset;
        document.body.classList.toggle(classes$w.hasScrolled, this.hasScrolled);

        // Hide compact header when scroll back to top
        const hideHeaderThreshold = pageOffset + window.stickyHeaderHeight;
        const bellowThreshold = currentScrollTop < hideHeaderThreshold;
        const shouldHideHeader = bellowThreshold && scrollUp;
        document.body.classList.toggle(classes$w.hideHeader, shouldHideHeader);

        if (window.isHeaderTransparent) {
          const shouldShowTransparentHeader = !this.hasScrolled || shouldHideHeader;
          this.header.classList.toggle(classes$w.headerTransparent, shouldShowTransparentHeader);
        }

        // Update header background height if users scroll the page with their mouse over the header or over an opened nav menu
        if (this.header.classList.contains(classes$w.headerHovered)) {
          const currentHeight = this.hasScrolled ? window.stickyHeaderHeight : headerHeight;
          this.background.style.setProperty('--header-background-height', `${currentHeight}px`);

          const activeNavItem = this.header.querySelector(`.${classes$w.isVisible}${selectors$E.navItem}`);
          if (activeNavItem) {
            activeNavItem.dispatchEvent(new Event('mouseenter', {bubbles: true}));
          }
        }
      }

      handleBackgroundEvents() {
        this.headerWrapper.addEventListener('mouseenter', this.updateBackgroundHeightEvent);

        this.headerWrapper.addEventListener('mouseleave', this.updateBackgroundHeightEvent);

        this.header.addEventListener('focusout', this.updateBackgroundHeightEvent);

        document.addEventListener('theme:cart:close', this.updateBackgroundHeightEvent);

        // Helps fixing Safari issues with background not being updated on search close and mouse over the header
        document.addEventListener('theme:search:close', this.updateBackgroundHeightEvent);
      }

      updateBackgroundHeight(event) {
        const isDesktop = matchMedia('(pointer:fine)').matches;
        const isFocusEnabled = !document.body.classList.contains(classes$w.noOutline);
        const isNotTabbingOnDesktop = isDesktop && !isFocusEnabled;

        if (!event) return;

        let drawersVisible = classes$w.jsDrawerOpenAll.some((popupClass) => document.body.classList.contains(popupClass));

        // Update header background height on:
        // 'mouseenter' event
        // opened Cart drawer/Quick View/Menu drawers
        if (event.type === 'mouseenter' || drawersVisible) {
          this.headerHeight = this.hasScrolled ? window.stickyHeaderHeight : this.header.offsetHeight;

          this.header.classList.add(classes$w.headerHovered);

          if (!this.header.classList.contains(classes$w.headerMenuOpened)) {
            this.background.style.setProperty('--header-background-height', `${this.headerHeight}px`);
          }
        }

        if (event.type === 'mouseenter') return;

        requestAnimationFrame(() => {
          drawersVisible = classes$w.jsDrawerOpenAll.some((popupClass) => document.body.classList.contains(popupClass));

          if (drawersVisible) return;

          // Remove header background and handle focus on:
          // 'mouseleave' event
          // 'theme:cart:close' event
          // 'theme:search:close' event
          // 'focusout' event
          // closed Cart drawer/Quick View/Menu drawers

          if (event.type === 'focusout' && !isDesktop) return;
          if (event.type === 'theme:search:close' && !isNotTabbingOnDesktop) return;
          if (this.hasScrolled) return;

          const focusOutOfHeader = document.activeElement.closest(selectors$E.header) === null;
          const isSearchOpened = document.body.classList.contains(classes$w.searchOpened);
          const headerMenuOpened = this.header.classList.contains(classes$w.headerMenuOpened);

          if (isSearchOpened || headerMenuOpened) return;

          if (event.type === 'focusout') {
            if (!focusOutOfHeader) return;
          }

          this.header.classList.remove(classes$w.headerHovered);
          this.background.style.setProperty('--header-background-height', '0px');

          if (!isFocusEnabled) {
            document.activeElement.blur();
          }
        });
      }

      listenWidth() {
        document.addEventListener('theme:resize', this.checkWidthEvent);
        this.checkWidth();
      }

      checkWidth() {
        if (window.innerWidth < this.minWidth) {
          this.header.classList.add(classes$w.headerCompress);
        } else {
          this.header.classList.remove(classes$w.headerCompress);
        }
      }

      getMinWidth() {
        const headerWrapperStyles = this.headerWrapper.currentStyle || window.getComputedStyle(this.headerWrapper);
        const headerPaddings = parseInt(headerWrapperStyles.paddingLeft) * 2;
        const comparitor = this.header.cloneNode(true);
        comparitor.classList.add(classes$w.cloneClass);
        document.body.appendChild(comparitor);
        const wideElements = comparitor.querySelectorAll(selectors$E.widthContent);
        const navAlignment = this.header.getAttribute(attributes$r.navAlignment);
        const minWidth = _sumSplitWidths(wideElements, navAlignment);

        document.body.removeChild(comparitor);

        return minWidth + wideElements.length * 20 + headerPaddings;
      }

      initMobileNavToggle() {
        this.mobileMenuTrigger?.addEventListener('click', () => {
          if (!document.body.classList.contains(classes$w.drawerOpen)) {
            if (document.body.classList.contains(classes$w.searchOpened)) {
              document.addEventListener('theme:search:close', this.triggerDrawerOpeningEvent);
              return;
            }
            this.triggerDrawerOpening(this.mobileMenuTrigger);
          }
        });
      }

      triggerDrawerOpening(mobileMenuTrigger) {
        document.dispatchEvent(new CustomEvent('theme:drawer:opening', {bubbles: true, detail: {element: mobileMenuTrigger}}));
        document.removeEventListener('theme:search:close', this.triggerDrawerOpeningEvent);
      }

      onUnload() {
        // Reset variables so that the proper ones are applied before saving in the Theme editor
        // Necessary only when they were previously updated in `handleTextLinkLogos()` function
        document.documentElement.style.removeProperty('--header-height');
        document.documentElement.style.removeProperty('--header-sticky-height');

        this.initStickyHeader();
        document.body.classList.remove(...classes$w.jsDrawerOpenAll);
        document.removeEventListener('theme:scroll', this.headerStateEvent);
        document.removeEventListener('theme:resize', this.checkWidthEvent);
        document.removeEventListener('theme:cart:close', this.updateBackgroundHeightEvent);
        document.removeEventListener('theme:search:close', this.updateBackgroundHeightEvent);
        document.body.removeEventListener('touchstart', this.handleTouchstartEvent);
        document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));

        if (typeof window.cart.unload === 'function') {
          window.cart.unload();
        }
      }
    }

    function _sumSplitWidths(nodes, alignment) {
      let arr = [];
      nodes.forEach((el) => {
        arr.push(el.clientWidth);
      });
      let [logoWidth, navWidth, iconsWidth] = arr;

      // Check if nav is left and set correct width
      if (alignment === 'left') {
        const tempWidth = logoWidth;
        logoWidth = navWidth;
        navWidth = tempWidth;
      }

      if (alignment !== 'right') {
        if (logoWidth > iconsWidth) {
          iconsWidth = logoWidth;
        } else {
          logoWidth = iconsWidth;
        }
      }

      return logoWidth + navWidth + iconsWidth;
    }

    const headerSection = {
      onLoad() {
        sections$w[this.id] = new Header(this.container);
      },
      onUnload() {
        sections$w[this.id].onUnload();
      },
    };

    register('header', [headerSection, hoverDisclosure]);

    const selectors$D = {
      trigger: '[data-collapsible-trigger]',
    };

    const classes$v = {
      isExpanded: 'is-expanded',
    };

    const accordionSection = {
      onBlockSelect(e) {
        const trigger = e.target.querySelector(selectors$D.trigger);
        requestAnimationFrame(() => {
          if (!trigger.classList.contains(classes$v.isExpanded)) {
            trigger.dispatchEvent(new Event('click'));
          }
        });
      },
    };

    register('accordions', [accordionSection, collapsible]);

    const selectors$C = {
      button: '[data-share-button]',
      tooltip: '[data-share-button-tooltip]',
    };

    const classes$u = {
      visible: 'is-visible',
      hiding: 'is-hiding',
    };

    const sections$v = {};

    class ShareButton {
      constructor(container) {
        this.container = container;
        this.button = this.container.querySelector(selectors$C.button);
        this.tooltip = this.container.querySelector(selectors$C.tooltip);
        this.transitionSpeed = 200;
        this.hideTransitionTimeout = 0;
        this.init();
      }

      init() {
        if (this.button) {
          this.button.addEventListener('click', () => {
            let targetUrl = window.location.href;
            if (this.button.dataset.shareLink) {
              targetUrl = this.button.dataset.shareLink;
            }

            if (!this.tooltip.classList.contains(classes$u.visible)) {
              navigator.clipboard.writeText(targetUrl).then(() => {
                this.tooltip.classList.add(classes$u.visible);
                setTimeout(() => {
                  this.tooltip.classList.add(classes$u.hiding);
                  this.tooltip.classList.remove(classes$u.visible);

                  if (this.hideTransitionTimeout) {
                    clearTimeout(this.hideTransitionTimeout);
                  }

                  this.hideTransitionTimeout = setTimeout(() => {
                    this.tooltip.classList.remove(classes$u.hiding);
                  }, this.transitionSpeed);
                }, 1500);
              });
            }
          });
        }
      }
    }

    const shareButton = {
      onLoad() {
        sections$v[this.id] = new ShareButton(this.container);
      },
    };

    register('article', [shareButton]);

    const selectors$B = {
      videoPlay: '[data-video-play]',
    };

    const attributes$q = {
      videoPlayValue: 'data-video-play',
    };

    class VideoPlay {
      constructor(container) {
        this.container = container;
        this.videoPlay = this.container.querySelectorAll(selectors$B.videoPlay);
        this.a11y = a11y;

        this.init();
      }

      init() {
        if (this.videoPlay.length) {
          this.videoPlay.forEach((element) => {
            element.addEventListener('click', (e) => {
              if (element.hasAttribute(attributes$q.videoPlayValue) && element.getAttribute(attributes$q.videoPlayValue).trim() !== '') {
                e.preventDefault();

                const items = [
                  {
                    html: element.getAttribute(attributes$q.videoPlayValue),
                  },
                ];
                const options = {
                  mainClass: 'pswp--video',
                };

                this.a11y.state.trigger = element;
                new LoadPhotoswipe(items, options);
              }
            });
          });
        }
      }
    }

    const videoPlay = {
      onLoad() {
        new VideoPlay(this.container);
      },
    };

    const selectors$A = {
      imageWrapper: '[data-banner-image]',
      titleWrapper: '[data-banner-title]',
      lazyImage: '.lazy-image',
      parallax: '[data-parallax="zoom-on-scroll"],[data-parallax="card-scrolling"],[data-parallax="zoom-on-scroll,card-scrolling"]',
      textRevealCropper: '.text-reveal__cropper',
      aos: '[data-aos]',
    };

    const classes$t = {
      bannerNoCachedImages: 'banner--no-cached-images',
      bannerImgLoaded: 'banner--img-loaded',
      imgIn: 'img-in',
      overflowHidden: 'overflow-hidden',
      textHighlightWrapper: 'text-highlight-wrapper',
    };

    const sections$u = {};

    class BannerImage {
      constructor(section) {
        this.container = section.container;
        this.title = this.container.querySelector(selectors$A.titleWrapper);
        this.parallax = null;

        this.init();
      }

      init() {
        this.handleImageAnimation(true);

        if (this.container.matches(selectors$A.parallax)) {
          this.parallax = new ParallaxElement(this.container);
        }

        if (this.title && !this.title.classList.contains(classes$t.textHighlightWrapper)) {
          const animatedTitle = this.title.querySelector(selectors$A.aos);

          if (!animatedTitle) return;

          const textRevealCropper = animatedTitle.closest(selectors$A.textRevealCropper);
          textRevealCropper?.classList.add(classes$t.overflowHidden);
          waitForAnimationEnd(animatedTitle).then(() => {
            textRevealCropper?.classList.remove(classes$t.overflowHidden);
          });
        }
      }

      /**
       * Handles image animation that would be triggered on page load
       *  - uses a fallback class modifier for Banner image section with no cached hero images
       *  - that class resets the default banner CSS animation so it won't be executed when `.img-in` class is added when `img.complete` is detected
       *  - gets the `.lazy-image` container and listens for `transitionend` event of its `<img>` child element
       *  - adds a class modifier after `<img>` transition has completed, when shimmer effect has been removed, that should trigger the hero image animation
       *  - removes classes on Theme Editor `shopify:section:unload` and `shopify:section:reorder` events
       */
      handleImageAnimation(onLoad = false) {
        if (!onLoad) {
          this.container.classList.remove(classes$t.bannerNoCachedImages);
          this.container.classList.remove(classes$t.bannerImgLoaded);
          return;
        }

        const imageWrapper = this.container.querySelector(selectors$A.imageWrapper);
        const img = imageWrapper.querySelectorAll(selectors$A.lazyImage);
        const imgComplete = this.container.classList.contains(classes$t.imgIn);

        if (img.length && !imgComplete) {
          this.container.classList.add(classes$t.bannerNoCachedImages);

          const onImageTransitionEnd = (event) => {
            requestAnimationFrame(() => this.container.classList.add(classes$t.bannerImgLoaded));
            img[0].removeEventListener('transitionend', onImageTransitionEnd);
          };

          img[0].addEventListener('transitionend', onImageTransitionEnd);
        }
      }

      onReorder() {
        this.handleImageAnimation(false);
      }

      onUnload() {
        this.handleImageAnimation(false);

        if (this.parallax) {
          this.parallax.unload();
          this.parallax = null;
        }
      }
    }

    const bannerImage = {
      onLoad() {
        sections$u[this.id] = new BannerImage(this);
      },
      onReorder(e) {
        sections$u[this.id].onReorder(e);
      },
      onUnload(e) {
        sections$u[this.id].onUnload(e);
      },
    };

    register('banner-image', [bannerImage, videoPlay]);

    const selectors$z = {
      scrollSpy: '[data-scroll-spy]',
    };

    const classes$s = {
      selected: 'is-selected',
      isFullHeight: 'is-full-height',
    };

    const attributes$p = {
      scrollSpy: 'data-scroll-spy',
      scrollSpyPrevent: 'data-scroll-spy-prevent',
      mobile: 'data-scroll-spy-mobile',
      desktop: 'data-scroll-spy-desktop',
    };

    const sections$t = {};

    class ScrollSpy {
      constructor(section, element) {
        this.container = section;
        this.element = element;

        if (!this.element) return;

        this.anchorSelector = `[${attributes$p.scrollSpy}="#${this.element.id}"]`;
        this.anchor = this.container.querySelector(this.anchorSelector);
        this.anchors = this.container.querySelectorAll(`[${attributes$p.scrollSpy}]`);

        if (!this.anchor) return;

        this.scrollCallback = () => this.onScroll();
        this.init();
      }

      init() {
        this.onScroll();
        document.addEventListener('theme:scroll', this.scrollCallback);
        document.addEventListener('theme:resize:width', this.scrollCallback);
      }

      isEligible() {
        if (this.container.hasAttribute(attributes$p.scrollSpyPrevent)) return false;

        return (
          (isMobile() && this.anchor.hasAttribute(attributes$p.mobile)) ||
          (isDesktop() && this.anchor.hasAttribute(attributes$p.desktop)) ||
          (!this.anchor.hasAttribute(attributes$p.desktop) && !this.anchor.hasAttribute(attributes$p.mobile))
        );
      }

      onScroll() {
        // Check eligibility of whether to run `onScroll()` handler
        if (!this.isEligible()) return;

        // Check element's visibility in the viewport
        this.top = this.element.getBoundingClientRect().top;
        this.bottom = this.element.getBoundingClientRect().bottom;
        const windowHeight = Math.round(window.innerHeight);
        const scrollTop = Math.round(window.scrollY);
        const scrollBottom = scrollTop + windowHeight;
        const elementOffsetTopPoint = Math.round(this.top + scrollTop);
        const elementHeight = this.element.offsetHeight;
        const elementOffsetBottomPoint = elementOffsetTopPoint + elementHeight;
        const isBottomOfElementPassed = elementOffsetBottomPoint < scrollTop;
        const isTopOfElementReached = elementOffsetTopPoint < scrollBottom;
        const isInView = isTopOfElementReached && !isBottomOfElementPassed;

        if (!isInView) return;

        // Set container classes or inline styles to help with proper sticky positon of the anchor elements parent container
        if (this.anchor.parentNode.offsetHeight <= elementHeight) {
          this.container.style.setProperty('--sticky-position', `${window.innerHeight / 2 - elementHeight / 2}px`);
        } else {
          this.container.classList.add(classes$s.isFullHeight);
        }

        // Check anchor's intersection within the element
        this.anchorTop = this.anchor.getBoundingClientRect().top;
        this.anchorBottom = this.anchor.getBoundingClientRect().bottom;
        const anchorTopPassedElementTop = this.top < this.anchorTop;
        const anchorBottomPassedElementBottom = this.bottom < this.anchorBottom;
        const shouldBeActive = anchorTopPassedElementTop && !anchorBottomPassedElementBottom;

        if (!shouldBeActive) return;

        // Update active classes
        this.anchors.forEach((anchor) => {
          if (!anchor.matches(this.anchorSelector)) {
            anchor.classList.remove(classes$s.selected);
          }
        });

        this.anchor.classList.add(classes$s.selected);
      }

      onUnload() {
        document.removeEventListener('theme:scroll', this.scrollCallback);
        document.removeEventListener('theme:resize:width', this.scrollCallback);
      }
    }

    const scrollSpy = {
      onLoad() {
        sections$t[this.id] = [];
        const elements = this.container.querySelectorAll(selectors$z.scrollSpy);

        elements.forEach((element) => {
          const scrollSpy = this.container.querySelector(element.getAttribute(attributes$p.scrollSpy));
          sections$t[this.id].push(new ScrollSpy(this.container, scrollSpy));
        });
      },
      onUnload() {
        sections$t[this.id].forEach((element) => {
          if (typeof element.onUnload === 'function') {
            element.onUnload();
          }
        });
      },
    };

    const selectors$y = {
      banner: '[data-banner]',
      sliderContent: '[data-slider-content]',
      sliderMedia: '[data-slider-media]',
      links: 'a, button',
    };

    const attributes$o = {
      index: 'data-index',
      tabIndex: 'tabindex',
      singleImage: 'data-slider-single-image',
      scrollSpyPrevent: 'data-scroll-spy-prevent',
    };

    const classes$r = {
      isSelected: 'is-selected',
    };

    const settings$2 = {
      row: 'row',
      columns: 'columns',
    };

    let sections$s = {};

    class BannerWithTextColumns {
      constructor(section) {
        this.container = section.container;
        this.sliderContent = this.container.querySelector(selectors$y.sliderContent);
        this.singleImageEnabled = this.sliderContent?.hasAttribute(attributes$o.singleImage);
        this.banners = this.container.querySelectorAll(selectors$y.banner);
        this.links = this.container.querySelectorAll('a');
        this.sliderMedia = this.container.querySelector(selectors$y.sliderMedia);
        this.flktyContent = null;
        this.flktyMedia = null;
        this.onResizeCallback = () => this.handleSlidersOnResize();

        // Initialise functionality based on the "Appearance > Row/Columns" section settings
        this.appearance = this.container.dataset.appearance;

        if (this.appearance === settings$2.columns) {
          this.handleColumnsLayout();
        } else {
          this.handleRowLayout();
        }
      }

      /**
       * Event listeners on hover, touch or keyboard tabbing, that sync the Content and Media items states
       */
      listen() {
        document.addEventListener('theme:resize:width', this.onResizeCallback);

        // A11y focusables event listener
        this.links.forEach((link) => {
          link.addEventListener('focus', () => {
            const selectedIndex = Number(link.closest(selectors$y.banner).getAttribute(attributes$o.index));

            if (window.innerWidth >= theme.sizes.small) {
              this.sync(selectedIndex);
            }
          });
        });

        this.banners.forEach((slide) => {
          // Listener for screens with mouse cursors
          slide.addEventListener('mouseenter', () => {
            const selectedIndex = Number(slide.getAttribute(attributes$o.index));

            if (window.innerWidth >= theme.sizes.small && !window.theme.touch) {
              this.sync(selectedIndex);
            }
          });

          // Listener specifically for touch devices
          slide.addEventListener('pointerup', () => {
            const selectedIndex = Number(slide.getAttribute(attributes$o.index));

            if (window.innerWidth >= theme.sizes.small && window.theme.touch) {
              this.sync(selectedIndex);
            }
          });
        });
      }

      /**
       * Functionality for "Appearance -> Columns"
       *  - grid with columns count based on section blocks count
       *  - init two sliders, one for Content, another for Media items
       *  - have a distinct flickity slider on mobile
       *  - sync sliders with fade-in/scale animations
       */
      handleColumnsLayout() {
        if (this.sliderContent.children.length <= 1) return;

        let isDraggable = window.innerWidth < window.theme.sizes.small;

        if (this.sliderMedia.children.length > 1) {
          this.flktyMedia = new Flickity(this.sliderMedia, {
            draggable: false,
            wrapAround: false,
            fade: true,
            prevNextButtons: false,
            adaptiveHeight: false,
            pageDots: false,
            setGallerySize: false,
            on: {
              change: (index) => {
                this.handleGroupItemsNavigation(index, this.flktyContent);
              },
            },
          });

          flickitySmoothScrolling(this.sliderMedia);
        }

        this.flktyContent = new Flickity(this.sliderContent, {
          draggable: isDraggable,
          prevNextButtons: false,
          pageDots: true,
          cellAlign: 'left',
          adaptiveHeight: false,
          imagesLoaded: true,
          on: {
            ready: () => {
              this.listen();
              this.slidesTabIndex();
            },
            change: (index) => {
              if (window.innerWidth < theme.sizes.small && !this.singleImageEnabled) {
                this.flktyMedia.select(index);
              }

              this.slidesTabIndex();
              this.handleGroupItemsNavigation(index, this.flktyMedia);
            },
          },
        });

        flickitySmoothScrolling(this.sliderContent);
      }

      /**
       * Functionality for "Appearance -> Row"
       *  - a row of items, spaced as much as their content allows
       *  - init a Media slider and sync Content items with it
       *  - listen for mouseover/touch events to update active states when "Show single image" settings are enabled
       *  - use fade-in and scale animations on states change
       *  - Media slider draggable events are used to change the active states on tablet
       *  - Content items active state is automatically updated based on scroll position and visibility in the viewport
       */
      handleRowLayout() {
        const isSingleMedia = this.sliderMedia.children.length <= 1;

        if (isSingleMedia || isMobile()) {
          this.updateState(0);
          this.listen();

          return;
        }

        this.initMediaSlider();
      }

      /**
       * Initialise media slider with Flickity
       */
      initMediaSlider() {
        this.flktyMedia = new Flickity(this.sliderMedia, {
          draggable: true,
          wrapAround: false,
          fade: true,
          prevNextButtons: false,
          adaptiveHeight: false,
          pageDots: false,
          setGallerySize: false,
          on: {
            ready: () => {
              this.updateState(0);
              this.listen();
            },
            change: (index) => {
              this.updateState(index);
            },
          },
        });

        flickitySmoothScrolling(this.sliderMedia);
      }

      /**
       * Handle slider sync on navigating with tabbing or using arrow keys through flickity's items group
       */
      handleGroupItemsNavigation(index, sliderToSync = null) {
        if (sliderToSync === null) return;

        requestAnimationFrame(() => {
          if (index !== sliderToSync.selectedIndex) {
            sliderToSync.select(index);
          }
        });
      }

      /**
       * Update focusables tab index on slide change
       */
      slidesTabIndex() {
        if (!this.sliderContent) return;

        const slider = Flickity.data(this.sliderContent);
        slider.cells.forEach((slide) => {
          let tabIndex = '-1';
          if (slide.element.classList.contains(classes$r.isSelected)) {
            tabIndex = '0';
          }
          slide.element.querySelectorAll(selectors$y.links).forEach((link) => {
            link.setAttribute(attributes$o.tabIndex, tabIndex);
          });
        });
      }

      /**
       * Synchronise the Content and Media items states
       */
      sync(index = 0) {
        if (this.appearance === settings$2.columns) {
          this.flktyContent.selectCell(index);
        } else {
          this.updateState(index);
        }

        if (this.flktyMedia) {
          this.flktyMedia.selectCell(index);
        }
      }

      /**
       * Update the active state, based on a selected item's index
       */
      updateState(index = 0) {
        this.banners.forEach((element) => {
          const elementIndex = Number(element.getAttribute(attributes$o.index));
          element.classList.toggle(classes$r.isSelected, elementIndex === index);
        });
      }

      /**
       * Resize or destroy sliders
       */
      handleSlidersOnResize() {
        const isLayoutRow = this.appearance === settings$2.row;

        if (isLayoutRow) {
          if (isMobile() && this.flktyMedia) {
            this.flktyMedia.destroy();
            this.flktyMedia = null;
            return;
          }

          if (isDesktop() && !this.flktyMedia) {
            this.initMediaSlider();
            return;
          }
        }

        if (this.flktyContent) {
          this.flktyContent.resize();
          this.toggleDraggable();
        }

        if (this.flktyMedia) {
          this.flktyMedia.resize();
        }
      }

      /**
       * Enable or disable dragging and flicking on initialised Flickity instances, depending on screen size
       */
      toggleDraggable() {
        this.flktyContent.options.draggable = window.innerWidth < window.theme.sizes.small;
        this.flktyContent.updateDraggable();
      }

      /**
       * Event callback for Theme Editor `shopify:block:select` event
       */
      onBlockSelect(event) {
        const selectedIndex = parseInt([...event.target.parentNode.children].indexOf(event.target));
        this.sync(selectedIndex);

        if (this.appearance === settings$2.row) {
          const target = this.sliderMedia.children[selectedIndex];
          const targetOffsetTop = Math.round(target.getBoundingClientRect().top);

          this.container.setAttribute(attributes$o.scrollSpyPrevent, '');

          setTimeout(() => scrollTo(targetOffsetTop), 400);
          setTimeout(() => this.container.removeAttribute(attributes$o.scrollSpyPrevent), 1000);
        }
      }

      /**
       * Event callback for Theme Editor `shopify:section:unload` event
       */
      onUnload() {
        document.removeEventListener('theme:resize:width', this.onResizeCallback);
      }
    }

    const BannerWithTextColumnsSection = {
      onLoad() {
        sections$s[this.id] = new BannerWithTextColumns(this);
      },
      onBlockSelect(event) {
        sections$s[this.id].onBlockSelect(event);
      },
    };

    register('banner-with-text-columns', [BannerWithTextColumnsSection, scrollSpy]);

    register('blog-posts', ajaxify);

    const selectors$x = {
      slider: '[data-slider]',
      sliderItem: '[data-slider-item]',
      sliderItemImage: '[data-media-container]',
      links: 'a, button',
      flickityButton: '.flickity-button',
    };

    const classes$q = {
      carouselInactive: 'carousel--inactive',
      carouselResize: 'carousel--resize',
    };

    const attributes$n = {
      tabIndex: 'tabindex',
    };

    const sections$r = {};

    class ColumnsWithImage {
      constructor(section) {
        this.container = section.container;
        this.slider = this.container.querySelector(selectors$x.slider);
        this.flkty = null;
        this.gutter = 0;
        this.checkSlidesSizeOnResize = () => this.checkSlidesSize();
        this.listen();
      }

      initSlider() {
        this.slider.classList.remove(classes$q.carouselInactive);

        this.flkty = new Flickity(this.slider, {
          pageDots: false,
          cellAlign: 'left',
          groupCells: true,
          contain: true,
          on: {
            ready: () => {
              this.setSliderArrowsPosition(this.slider);
              setTimeout(() => {
                this.changeTabIndex();
                this.flkty.resize();
              }, 0);
            },
            change: () => {
              this.changeTabIndex();
            },
          },
        });

        Flickity.prototype._createResizeClass = function () {
          this.element.classList.add(classes$q.carouselResize);
        };

        Flickity.createMethods.push('_createResizeClass');

        const resize = Flickity.prototype.resize;
        Flickity.prototype.resize = function () {
          this.element.classList.remove(classes$q.carouselResize);
          resize.call(this);
          this.element.classList.add(classes$q.carouselResize);
        };
      }

      destroySlider() {
        this.slider.classList.add(classes$q.carouselInactive);

        if (this.flkty !== null) {
          this.flkty.destroy();
          this.flkty = null;
        }
      }

      checkSlidesSize() {
        const sliderItemStyle = this.container.querySelector(selectors$x.sliderItem).currentStyle || window.getComputedStyle(this.container.querySelector(selectors$x.sliderItem));
        this.gutter = parseInt(sliderItemStyle.marginRight);
        const containerWidth = this.slider.offsetWidth;
        const itemsWidth = this.getItemsWidth();
        const itemsOverflowViewport = containerWidth < itemsWidth;

        if (window.innerWidth >= theme.sizes.small && itemsOverflowViewport) {
          this.initSlider();
        } else {
          this.destroySlider();
        }
      }

      changeTabIndex() {
        const selectedElementsIndex = this.flkty.selectedIndex;

        this.flkty.slides.forEach((slide, index) => {
          slide.cells.forEach((cell) => {
            cell.element.querySelectorAll(selectors$x.links).forEach((link) => {
              link.setAttribute(attributes$n.tabIndex, selectedElementsIndex === index ? '0' : '-1');
            });
          });
        });
      }

      getItemsWidth() {
        let itemsWidth = 0;
        const slides = this.slider.querySelectorAll(selectors$x.sliderItem);
        if (slides.length) {
          slides.forEach((item) => {
            itemsWidth += item.offsetWidth + this.gutter;
          });
        }

        return itemsWidth;
      }

      listen() {
        if (this.slider) {
          this.checkSlidesSize();
          document.addEventListener('theme:resize:width', this.checkSlidesSizeOnResize);
        }
      }

      setSliderArrowsPosition(slider) {
        const arrows = slider.querySelectorAll(selectors$x.flickityButton);
        const image = slider.querySelector(selectors$x.sliderItemImage);

        if (arrows.length && image) {
          arrows.forEach((arrow) => {
            arrow.style.top = `${image.offsetHeight / 2}px`;
          });
        }
      }

      onBlockSelect(evt) {
        if (this.flkty !== null) {
          const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));
          const slidesPerPage = parseInt(this.flkty.slides[0].cells.length);
          const groupIndex = Math.floor(index / slidesPerPage);
          const slider = evt.target.closest(selectors$x.slider);

          const onTransitionEnd = () => {
            requestAnimationFrame(() => {

              this.flkty.select(groupIndex);
              this.setSliderArrowsPosition(slider);
            });

            this.flkty.element.removeEventListener('transitionend', onTransitionEnd);
          };

          this.flkty.element.addEventListener('transitionend', onTransitionEnd);
        } else {
          const sliderStyle = this.slider.currentStyle || window.getComputedStyle(this.slider);
          const sliderPadding = parseInt(sliderStyle.paddingLeft);
          const blockPositionLeft = evt.target.offsetLeft - sliderPadding;

          // Native scroll to item
          this.slider.scrollTo({
            top: 0,
            left: blockPositionLeft,
            behavior: 'smooth',
          });
        }
      }

      onUnload() {
        document.removeEventListener('theme:resize:width', this.checkSlidesSizeOnResize);
      }
    }

    const ColumnsWithImageSection = {
      onLoad() {
        sections$r[this.id] = new ColumnsWithImage(this);
      },
      onUnload(e) {
        sections$r[this.id].onUnload(e);
      },
      onBlockSelect(e) {
        sections$r[this.id].onBlockSelect(e);
      },
    };

    register('columns-with-image', [ColumnsWithImageSection, videoPlay]);

    const selectors$w = {
      formMessageClose: '[data-form-message-close]',
      formMessageWrapper: '[data-form-message]',
    };

    const classes$p = {
      hideDown: 'hide-down',
      notificationVisible: 'notification-visible',
    };

    let sections$q = {};

    class ContactForm {
      constructor(section) {
        this.container = section.container;
        this.closeButton = this.container.querySelector(selectors$w.formMessageClose);
        this.messageWrapper = this.container.querySelector(selectors$w.formMessageWrapper);

        if (this.messageWrapper) {
          this.hidePopups();
          this.closeFormMessage();
          this.autoHideMessage();
        }
      }

      hidePopups() {
        document.body.classList.add(classes$p.notificationVisible);
      }

      showPopups() {
        document.body.classList.remove(classes$p.notificationVisible);
      }

      closeFormMessage() {
        this.closeButton.addEventListener('click', this.closeMessage.bind(this));
      }

      closeMessage(e) {
        e.preventDefault();
        this.messageWrapper.classList.add(classes$p.hideDown);
        this.showPopups();
      }

      autoHideMessage() {
        setTimeout(() => {
          this.messageWrapper.classList.add(classes$p.hideDown);
          this.showPopups();
        }, 10000);
      }
    }

    const contactFormSection = {
      onLoad() {
        sections$q[this.id] = new ContactForm(this);
      },
    };

    register('contact-form', contactFormSection);

    const selectors$v = {
      time: 'time',
      days: '[data-days]',
      hours: '[data-hours]',
      minutes: '[data-minutes]',
      seconds: '[data-seconds]',
      sectionType: '[data-section-type]',
      shopifySection: '.shopify-section',
      productTimer: '[data-product-timer]',
      aosItem: '[data-aos]',
    };

    const classes$o = {
      countdownTimerShowMessage: 'countdown-timer--show-message',
      aosAnimate: 'aos-animate',
      aosLoading: 'aos-loading',
      countdown: 'countdown',
    };

    const attributes$m = {
      expirationBehavior: 'data-expiration-behavior',
      leadingZero: 'data-leading-zero',
    };

    const settings$1 = {
      hide: 'hide',
      showMessage: 'show-message',
    };

    class CountdownTimer extends HTMLElement {
      constructor() {
        super();

        this.section = this.closest(selectors$v.sectionType);
        this.shopifySection = this.closest(selectors$v.shopifySection);
        this.productTimer = this.closest(selectors$v.productTimer);
        this.expirationBehavior = this.getAttribute(attributes$m.expirationBehavior);
        this.leadingZero = this.hasAttribute(attributes$m.leadingZero);

        this.time = this.querySelector(selectors$v.time);
        // The string we're passing should be ISO 8601 compliant
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date#date_time_string_format
        this.endDate = Date.parse(this.time.dateTime);

        this.days = this.querySelector(selectors$v.days);
        this.hours = this.querySelector(selectors$v.hours);
        this.minutes = this.querySelector(selectors$v.minutes);
        this.seconds = this.querySelector(selectors$v.seconds);

        this.daysInMs = 1000 * 60 * 60 * 24;
        this.hoursInMs = this.daysInMs / 24;
        this.minutesInMs = this.hoursInMs / 60;
        this.secondsInMs = this.minutesInMs / 60;

        this.isLoading = true;
        this.shouldHideOnComplete = this.expirationBehavior === settings$1.hide;
        this.shouldShowMessage = this.expirationBehavior === settings$1.showMessage;
        this.isAnimated = false;

        this.update = this.update.bind(this);
      }

      connectedCallback() {
        this.init();
      }

      disconnectedCallback() {
        this.stopTimer();
      }

      init() {
        if (isNaN(this.endDate)) {
          this.onComplete();
          return;
        }

        if (this.endDate <= Date.now()) {
          this.onComplete();
          return;
        }

        if (this.section.classList.contains(classes$o.countdown)) {
          this.onLoad(true);
        }

        // Update the countdown every second
        this.interval = setInterval(this.update, 1000);
      }

      stopTimer() {
        clearInterval(this.interval);
      }

      convertTime(timeInMs) {
        const days = this.formatDigits(parseInt(timeInMs / this.daysInMs, 10));
        timeInMs -= days * this.daysInMs;
        const hours = this.formatDigits(parseInt(timeInMs / this.hoursInMs, 10));
        timeInMs -= hours * this.hoursInMs;
        const minutes = this.formatDigits(parseInt(timeInMs / this.minutesInMs, 10));
        timeInMs -= minutes * this.minutesInMs;
        const seconds = this.formatDigits(parseInt(timeInMs / this.secondsInMs, 10));

        return {
          days: days,
          hours: hours,
          minutes: minutes,
          seconds: seconds,
        };
      }

      // Make numbers less than 10 to appear with a leading zero like 01, 02, 03
      formatDigits(number) {
        if (number < 10 && this.leadingZero) number = '0' + number;
        return number;
      }

      render(timer) {
        // `textContent` is used instead of `innerText` or `innerHTML` because it doesn't trigger computationally expensive reflows.
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent#differences_from_innertext
        this.days.textContent = timer.days;
        this.hours.textContent = timer.hours;
        this.minutes.textContent = timer.minutes;
        this.seconds.textContent = timer.seconds;
      }

      onComplete() {
        this.render({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });

        if (this.shouldHideOnComplete && !window.Shopify.designMode) {
          if (this.productTimer) {
            this.productTimer.remove();
          } else {
            this.shopifySection.remove();
          }
          document.dispatchEvent(new CustomEvent('theme:parallax:refresh')); // Refresh all scrollable-parallax elements arguments and scroll positions
        }

        if (this.shouldShowMessage) {
          this.classList.add(classes$o.countdownTimerShowMessage);
        }
      }

      /**
       * Refresh animated elements when timer loads
       */
      triggerAnimations() {
        if (theme.settings.animations == 'false') return;

        this.section.querySelectorAll(selectors$v.aosItem).forEach((element) => {
          if (this.isAnimated) element.classList.add(classes$o.aosAnimate);
        });
      }

      /**
       * Remove all animated classes to reload them after the countdown loads
       */
      removeAnimations() {
        this.section.querySelectorAll(selectors$v.aosItem).forEach((element) => {
          requestAnimationFrame(() => {
            if (element.classList.contains(classes$o.aosAnimate)) {
              element.classList.remove(classes$o.aosAnimate);
              this.isAnimated = true;
            }
          });
        });
      }

      onLoad(init) {
        if (init) {
          // Loading state
          this.removeAnimations();
          return;
        }

        this.isLoading = false;
        this.triggerAnimations();
      }

      update() {
        const currentDate = Date.now();
        const timeDiff = this.endDate - currentDate;

        if (timeDiff <= 0) {
          this.stopTimer();
          this.onComplete();
          return;
        }

        const remainingTime = this.convertTime(timeDiff);

        this.render(remainingTime);

        if (this.isLoading) this.onLoad(false);
      }
    }

    register('countdown', [videoPlay, parallaxSection]);

    if (!customElements.get('countdown-timer')) {
      customElements.define('countdown-timer', CountdownTimer);
    }

    const selectors$u = {
      videoId: '[data-video-id]',
      videoPlayer: '[data-video-player]',
      videoTemplate: '[data-video-template]',
      videoAutoplay: '[data-video-autoplay]',
      videoWrapper: '[data-video-wrapper]',
      videoPlayButton: '[data-video-bg-play]',
    };

    const classes$n = {
      loading: 'is-loading',
      paused: 'is-paused',
    };

    const sections$p = {};

    class VideoBackground {
      constructor(container) {
        this.container = container;
        this.videoId = this.container.querySelector(selectors$u.videoId);
        this.videoPlayer = this.container.querySelector(selectors$u.videoPlayer);
        this.videoTemplate = this.container.querySelector(selectors$u.videoTemplate);
        this.videoPlayButton = this.container.querySelector(selectors$u.videoPlayButton);
        this.init();
      }

      init() {
        if (!this.videoId) return;

        /*
          Observe video element and pull it out from its template tag
        */
        const videoObserver = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const videoMarkup = this.videoTemplate.innerHTML;
                this.videoPlayer.innerHTML = videoMarkup;
                this.video = this.container.querySelector(selectors$u.videoAutoplay);
                this.videoPlayer.classList.remove(classes$n.loading);
                this.container.classList.add(classes$n.paused);

                this.listen();

                // Stop observing element after it was animated
                observer.unobserve(entry.target);
              }
            });
          },
          {
            root: null,
            rootMargin: '300px',
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
          }
        );

        videoObserver.observe(this.videoPlayer);

        // Force video autoplay button
        this.videoPlayButton.addEventListener('click', (event) => {
          event.preventDefault();
          this.video?.play();
        });
      }

      listen() {
        this.video.addEventListener('play', () => {
          this.container.classList.remove(classes$n.paused);
        });

        // Force video autoplay on iOS when Low Power Mode is On
        this.container.addEventListener(
          'touchstart',
          () => {
            this.video.play();
          },
          {passive: true}
        );
      }
    }

    const videoBackground = {
      onLoad() {
        sections$p[this.id] = [];
        const videoWrappers = this.container.querySelectorAll(selectors$u.videoWrapper);
        videoWrappers.forEach((videoWrapper) => {
          sections$p[this.id].push(new VideoBackground(videoWrapper));
        });
      },
    };

    class PopupCookie {
      constructor(name, value) {
        this.configuration = {
          expires: null, // session cookie
          path: '/',
          domain: window.location.hostname,
          sameSite: 'none',
          secure: true,
        };
        this.name = name;
        this.value = value;
      }

      write() {
        const hasCookie = document.cookie.indexOf('; ') !== -1 && !document.cookie.split('; ').find((row) => row.startsWith(this.name));
        if (hasCookie || document.cookie.indexOf('; ') === -1) {
          document.cookie = `${this.name}=${this.value}; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}; sameSite=${this.configuration.sameSite}; secure=${this.configuration.secure}`;
        }
      }

      read() {
        if (document.cookie.indexOf('; ') !== -1 && document.cookie.split('; ').find((row) => row.startsWith(this.name))) {
          const returnCookie = document.cookie
            .split('; ')
            .find((row) => row.startsWith(this.name))
            .split('=')[1];

          return returnCookie;
        } else {
          return false;
        }
      }

      destroy() {
        if (document.cookie.split('; ').find((row) => row.startsWith(this.name))) {
          document.cookie = `${this.name}=null; expires=${this.configuration.expires}; path=${this.configuration.path}; domain=${this.configuration.domain}; sameSite=${this.configuration.sameSite}; secure=${this.configuration.secure}`;
        }
      }
    }

    const selectors$t = {
      newsletterForm: '[data-newsletter-form]',
      popup: '[data-popup]',
      section: 'section',
      footer: 'footer',
      shopifySection: '.shopify-section',
      header: '[data-site-header]',
    };

    const classes$m = {
      success: 'has-success',
      error: 'has-error',
      parallaxFooter: 'section-footer--parallax',
    };

    const attributes$l = {
      storageNewsletterFormId: 'newsletter_form_id',
    };

    const sections$o = {};

    class Newsletter {
      constructor(newsletter) {
        this.newsletter = newsletter;
        this.sessionStorage = window.sessionStorage;
        this.popup = this.newsletter.closest(selectors$t.popup);
        this.stopSubmit = true;
        this.isChallengePage = false;
        this.formID = null;
        this.formIdSuccess = null;

        this.checkForChallengePage();

        this.newsletterSubmit = (e) => this.newsletterSubmitEvent(e);

        if (!this.isChallengePage) {
          this.init();
        }
      }

      init() {
        this.newsletter.addEventListener('submit', this.newsletterSubmit);

        this.showMessage();
      }

      newsletterSubmitEvent(e) {
        if (this.stopSubmit) {
          e.preventDefault();

          this.removeStorage();
          this.writeStorage();
          this.stopSubmit = false;
          this.newsletter.submit();
        }
      }

      checkForChallengePage() {
        this.isChallengePage = window.location.pathname === theme.routes.root + 'challenge';
      }

      writeStorage() {
        if (this.sessionStorage !== undefined) {
          this.sessionStorage.setItem(attributes$l.storageNewsletterFormId, this.newsletter.id);
        }
      }

      readStorage() {
        this.formID = this.sessionStorage.getItem(attributes$l.storageNewsletterFormId);
      }

      removeStorage() {
        this.sessionStorage.removeItem(attributes$l.storageNewsletterFormId);
      }

      showMessage() {
        this.readStorage();

        if (this.newsletter.id === this.formID) {
          const newsletter = document.getElementById(this.formID);
          const submissionSuccess = window.location.search.indexOf('?customer_posted=true') !== -1;
          const submissionFailure = window.location.search.indexOf('accepts_marketing') !== -1;

          if (submissionSuccess) {
            newsletter.classList.remove(classes$m.error);
            newsletter.classList.add(classes$m.success);

            if (this.popup) {
              this.cookie = new PopupCookie(this.popup.dataset.cookieName, 'user_has_closed');
              this.cookie.write();
            }
          } else if (submissionFailure) {
            newsletter.classList.remove(classes$m.success);
            newsletter.classList.add(classes$m.error);
          }

          if (submissionSuccess || submissionFailure) {
            this.scrollToForm(newsletter);
          }
        }
      }

      /**
       * Scroll to the last submitted newsletter form
       */
      scrollToForm(newsletter) {
        let {stickyHeaderHeight} = readHeights();
        const headerHeight = stickyHeaderHeight || 0;
        const newsletterSection = newsletter.closest(selectors$t.section);
        const newsletterFooter = newsletter.closest(selectors$t.footer);
        const isVisible = visibilityHelper.isElementPartiallyVisible(newsletter) || visibilityHelper.isElementTotallyVisible(newsletter);

        if (!isVisible) {
          setTimeout(() => {
            let windowScroll = window.scrollY;
            let newsletterTop = newsletter.getBoundingClientRect().top;
            if (newsletterSection) {
              newsletterTop = newsletterSection.getBoundingClientRect().top;
            } else if (newsletterFooter) {
              if (newsletterFooter.closest(selectors$t.shopifySection).classList.contains(classes$m.parallaxFooter)) {
                newsletterTop = document.body.scrollHeight;
                windowScroll = 0;
              }
            }

            const scrollTo = newsletterTop - headerHeight + windowScroll;
            window.scrollTo({
              top: scrollTo,
              left: 0,
              behavior: 'smooth',
            });
          }, 400);
        }
      }

      /**
       * Event callback for Theme Editor `shopify:section:unload` event
       */
      onUnload() {
        this.newsletter.removeEventListener('submit', this.newsletterSubmit);
      }
    }

    const newsletterSection = {
      onLoad() {
        sections$o[this.id] = [];
        const newsletters = this.container.querySelectorAll(selectors$t.newsletterForm);
        newsletters.forEach((form) => {
          sections$o[this.id].push(new Newsletter(form));
        });
      },
      onUnload() {
        sections$o[this.id].forEach((form) => {
          if (typeof form.onUnload === 'function') {
            form.onUnload();
          }
        });
      },
    };

    const selectors$s = {
      product: '[data-product]',
      productSlider: '[data-slider]',
      productSlide: '[data-slide]',
      productGridItemImage: '[data-product-media-container]',
      flickityButton: '.flickity-button',
      item: '[data-slide]',
      links: 'a, button',
    };

    const attributes$k = {
      tabIndex: 'tabindex',
    };

    const sections$n = {};

    class CustomContent {
      constructor(container) {
        this.container = container;
        this.product = this.container.querySelectorAll(selectors$s.product);
        this.productSlider = this.container.querySelectorAll(selectors$s.productSlider);
        this.checkSliderOnResize = () => this.checkSlider();
        this.resizeSliderEvent = (event) => this.resizeSlider(event);
        this.flkty = [];
        this.videoObj = [];
        this.quickViewObj = [];

        this.listen();
      }

      checkSlider() {
        if (window.innerWidth >= theme.sizes.small) {
          this.productSlider.forEach((slider) => {
            this.initProductSlider(slider);
          });
        } else {
          this.productSlider.forEach((slider) => {
            this.destroyProductSlider(slider);
          });
        }
      }

      initProductSlider(slider) {
        const slidesCount = slider.querySelectorAll(selectors$s.productSlide).length;
        const sliderId = slider.dataset.slider;

        if (slidesCount > 1) {
          if (this.flkty[sliderId] === undefined || !this.flkty[sliderId].isActive) {
            this.flkty[sliderId] = new Flickity(slider, {
              prevNextButtons: true,
              adaptiveHeight: true,
              pageDots: true,
              wrapAround: true,
              on: {
                ready: () => {
                  this.setSliderArrowsPosition(slider);
                },
                change: (index) => {
                  this.flkty[sliderId].cells.forEach((slide, i) => {
                    slide.element.querySelectorAll(selectors$s.links).forEach((link) => {
                      link.setAttribute(attributes$k.tabIndex, i === index ? '0' : '-1');
                    });
                  });
                },
              },
            });
          } else {
            this.setSliderArrowsPosition(slider);
          }
        }
      }

      destroyProductSlider(slider) {
        const sliderId = slider.dataset.slider;

        if (typeof this.flkty[sliderId] === 'object') {
          this.flkty[sliderId].destroy();
        }
      }

      setSliderArrowsPosition(slider) {
        const arrows = slider.querySelectorAll(selectors$s.flickityButton);
        const image = slider.querySelector(selectors$s.productGridItemImage);

        if (arrows.length && image) {
          arrows.forEach((arrow) => {
            arrow.style.top = `${image.offsetHeight / 2}px`;
          });
        }
      }

      resizeSlider(event) {
        const slider = event.target;
        const flkty = Flickity.data(slider) || null;

        if (!flkty) return;
        flkty.resize();
      }

      listen() {
        this.checkSlider();
        document.addEventListener('theme:resize:width', this.checkSliderOnResize);

        this.productSlider.forEach((slider) => {
          slider.addEventListener('theme:slider:resize', this.resizeSliderEvent);
        });
      }

      onUnload() {
        if (this.flkty) {
          for (const key in this.flkty) {
            if (this.flkty.hasOwnProperty(key)) {
              this.flkty[key].destroy();
            }
          }
        }

        document.removeEventListener('theme:resize:width', this.checkSliderOnResize);

        this.productSlider.forEach((slider) => {
          slider.removeEventListener('theme:slider:resize', this.resizeSliderEvent);
        });
      }
    }

    const CustomContentSection = {
      onLoad() {
        sections$n[this.id] = new CustomContent(this.container);
      },
      onUnload(e) {
        sections$n[this.id].onUnload(e);
      },
    };

    register('custom-content', [CustomContentSection, newsletterSection, videoPlay, tooltip, videoBackground, productGrid]);

    const selectors$r = {
      slider: '[data-slider]',
      sliderItem: '[data-slide]',
      productGridItemImage: '[data-product-media-container]',
      links: 'a, button',
      flickityButton: '.flickity-button',
      promo: '[data-promo]',
      productGridItems: '[data-product-block]',
    };

    const classes$l = {
      carousel: 'carousel',
      carouselInactive: 'carousel--inactive',
      isLastSlideVisible: 'is-last-slide-visible',
      featuredCollection: 'featured-collection',
      promoFullWidth: 'collection-promo--full',
      promoTwoItemsWidth: 'collection-promo--two-columns',
    };

    const attributes$j = {
      sliderId: 'data-slider-id',
      showImage: 'data-slider-show-image',
      tabIndex: 'tabindex',
    };

    const sections$m = {};

    class GridSlider {
      constructor(container) {
        this.container = container;
        this.columns = parseInt(this.container.dataset.columns);
        this.sliders = this.container.querySelectorAll(selectors$r.slider);
        this.checkSlidesSizeOnResize = () => this.checkSlidesSize();
        this.resetSliderEvent = (e) => this.resetSlider(e);
        this.resizeSliderEvent = (event) => this.resizeSlider(event);
        this.flkty = [];
        this.listen();

        this.handleLastSlideOverlayOnMobile();
      }

      initSlider(slider) {
        const sliderId = slider.getAttribute(attributes$j.sliderId);
        slider.classList.remove(classes$l.carouselInactive);

        if (this.flkty[sliderId] === undefined || !this.flkty[sliderId].isActive) {
          this.flkty[sliderId] = new Flickity(slider, {
            pageDots: false,
            cellSelector: selectors$r.sliderItem,
            cellAlign: 'left',
            groupCells: true,
            contain: true,
            wrapAround: false,
            adaptiveHeight: false,
            on: {
              ready: () => {
                this.setSliderArrowsPosition(slider);
                setTimeout(() => {
                  this.changeTabIndex(slider);
                }, 0);
              },
              change: () => {
                this.changeTabIndex(slider);
              },
            },
          });

          this.handleLastSlideOverlayOnTablet(slider);
        } else {
          this.setSliderArrowsPosition(slider);
        }
      }

      destroySlider(slider) {
        const sliderId = slider.getAttribute(attributes$j.sliderId);

        if (slider.classList.contains(classes$l.carousel)) {
          slider.classList.add(classes$l.carouselInactive);
        }

        if (typeof this.flkty[sliderId] === 'object') {
          this.flkty[sliderId].destroy();
        }
      }

      // Move slides to their initial position
      resetSlider(e) {
        const slider = e.target;
        const sliderId = slider.getAttribute(attributes$j.sliderId);

        if (typeof this.flkty[sliderId] === 'object') {
          this.flkty[sliderId].select(0, false, true);
        } else {
          slider.scrollTo({
            left: 0,
            behavior: 'instant',
          });
        }
      }

      resizeSlider(event) {
        const slider = event.target;
        const flkty = Flickity.data(slider) || null;

        if (!flkty) return;
        flkty.resize();
      }

      checkSlidesSize() {
        if (this.sliders.length) {
          this.sliders.forEach((slider) => {
            const columns = this.columns;
            const isDesktop = window.innerWidth >= theme.sizes.large;
            const isLaptop = window.innerWidth >= theme.sizes.large && window.innerWidth < theme.sizes.widescreen;
            const isTablet = window.innerWidth >= theme.sizes.small && window.innerWidth < theme.sizes.large;
            const slides = slider.querySelectorAll(selectors$r.sliderItem);
            let itemsCount = slides.length;
            const promos = slider.querySelectorAll(selectors$r.promo);

            // If there are promos in the grid with different width
            if (promos.length && isDesktop) {
              promos.forEach((promo) => {
                if (promo.classList.contains(classes$l.promoFullWidth)) {
                  itemsCount += columns - 1;
                } else if (promo.classList.contains(classes$l.promoTwoItemsWidth)) {
                  itemsCount += 1;
                }
              });
            }

            // If tab collection has show image enabled
            if (slider.hasAttribute(attributes$j.showImage)) {
              itemsCount += 1;
            }

            if ((isDesktop && itemsCount > columns) || (isLaptop && itemsCount > 3) || (isTablet && itemsCount > 2)) {
              this.initSlider(slider);
              this.getTallestProductGridItem(slider);
            } else {
              this.destroySlider(slider);
            }
          });
        }
      }

      changeTabIndex(slider) {
        const sliderId = slider.getAttribute(attributes$j.sliderId);
        const selectedElementsIndex = this.flkty[sliderId].selectedIndex;

        this.flkty[sliderId].slides.forEach((slide, index) => {
          slide.cells.forEach((cell) => {
            cell.element.querySelectorAll(selectors$r.links).forEach((link) => {
              link.setAttribute(attributes$j.tabIndex, selectedElementsIndex === index ? '0' : '-1');
            });
          });
        });
      }

      setSliderArrowsPosition(slider) {
        const arrows = slider.querySelectorAll(selectors$r.flickityButton);
        const image = slider.querySelector(selectors$r.productGridItemImage);

        if (arrows.length && image) {
          arrows.forEach((arrow) => {
            arrow.style.top = `${image.offsetHeight / 2}px`;
          });
        }
      }

      handleLastSlideOverlayOnTablet(slider) {
        const sliderId = slider.getAttribute(attributes$j.sliderId);

        this.flkty[sliderId].on('select', () => {
          const isTablet = window.innerWidth >= theme.sizes.small && window.innerWidth < theme.sizes.large;

          if (!isTablet) return;

          const selectedIndex = this.flkty[sliderId].selectedIndex;
          const sliderGroups = this.flkty[sliderId].slides.length - 1;
          const isLastSliderGroup = sliderGroups === selectedIndex;

          slider.parentNode.classList.toggle(classes$l.isLastSlideVisible, isLastSliderGroup);
        });
      }

      getTallestProductGridItem(slider) {
        const promos = slider.querySelectorAll(selectors$r.promo);

        if (promos.length) {
          const productGridItems = slider.querySelectorAll(selectors$r.productGridItems);
          const tallestGridItemHeight = Math.max(...Array.from(productGridItems).map((productGridItem) => productGridItem.offsetHeight));

          slider.style.setProperty('--carousel-promo-height', `${tallestGridItemHeight}px`);
        }
      }

      handleLastSlideOverlayOnMobile() {
        this.sliders.forEach((slider) => {
          slider.addEventListener('scroll', (event) => {
            const isMobile = window.innerWidth < theme.sizes.small;

            if (!isMobile) return;

            const offsetWidth = event.target.offsetWidth;
            const lastSlide = Array.from(slider.children).pop();
            const rect = lastSlide.getBoundingClientRect();
            const isLastSlideVisible = rect.left + 80 < offsetWidth; // 80px is enough to negate the small visible part of the slide on the right

            slider.parentNode.classList.toggle(classes$l.isLastSlideVisible, isLastSlideVisible);
          });
        });
      }

      listen() {
        if (this.sliders.length) {
          this.checkSlidesSize();
          document.addEventListener('theme:resize:width', this.checkSlidesSizeOnResize);

          this.sliders.forEach((slider) => {
            slider.addEventListener('theme:tab:change', this.resetSliderEvent);
            slider.addEventListener('theme:slider:resize', this.resizeSliderEvent);
          });
        }
      }

      /**
       * Event callback for Theme Editor `shopify:block:select` event
       */
      onBlockSelect(evt) {
        const slider = evt.target.closest(selectors$r.slider);
        const flkty = Flickity.data(slider) || null;

        if (!slider) {
          return;
        }

        let parent = evt.target.parentNode;
        let target = evt.target;

        if (this.container.classList.contains(classes$l.featuredCollection)) {
          // In Featured collection section the shopify block attributes are on inner element
          parent = parent.parentNode;
          target = target.parentNode;
        }

        if (flkty !== null && flkty.isActive) {
          const index = parseInt([...parent.children].indexOf(target));
          const slidesPerPage = parseInt(flkty.slides[0].cells.length);
          const groupIndex = Math.floor(index / slidesPerPage);

          const onTransitionEnd = () => {
            requestAnimationFrame(() => {

              flkty.select(groupIndex);
              this.setSliderArrowsPosition(slider);
            });

            flkty.element.removeEventListener('transitionend', onTransitionEnd);
          };

          flkty.element.addEventListener('transitionend', onTransitionEnd);
        } else {
          const sliderStyle = slider.currentStyle || window.getComputedStyle(slider);
          const sliderPadding = parseInt(sliderStyle.paddingLeft);
          const blockPositionLeft = target.offsetLeft - sliderPadding;

          // Native scroll to item
          slider.scrollTo({
            top: 0,
            left: blockPositionLeft,
            behavior: 'smooth',
          });
        }
      }

      /**
       * Event callback for Theme Editor `shopify:section:unload` event
       */
      onUnload() {
        if (this.flkty) {
          for (const key in this.flkty) {
            if (this.flkty.hasOwnProperty(key)) {
              this.flkty[key].destroy();
            }
          }
        }

        document.removeEventListener('theme:resize:width', this.checkSlidesSizeOnResize);

        if (this.sliders.length) {
          this.sliders.forEach((slider) => {
            slider.removeEventListener('theme:tab:change', this.resetSliderEvent);
            slider.removeEventListener('theme:slider:resize', this.resizeSliderEvent);
          });
        }
      }
    }

    const gridSlider = {
      onLoad() {
        sections$m[this.id] = [];
        const els = this.container.querySelectorAll(selectors$r.slider);
        els.forEach((el) => {
          sections$m[this.id].push(new GridSlider(this.container));
        });
      },
      onUnload() {
        sections$m[this.id].forEach((el) => {
          if (typeof el.onUnload === 'function') {
            el.onUnload();
          }
        });
      },
      onBlockSelect(e) {
        sections$m[this.id].forEach((el) => {
          if (typeof el.onBlockSelect === 'function') {
            el.onBlockSelect(e);
          }
        });
      },
    };

    register('featured-collection', [productGrid, tooltip, gridSlider]);

    register('featured-video', [videoPlay, videoBackground]);

    const selectors$q = {
      shopPayWrapper: '[data-shop-pay-wrapper]',
      shopLoginButton: 'shop-login-button',
      shopFollowButton: 'shop-follow-button',
      followOnShopButton: 'follow-on-shop-button',
      heartIcon: 'heart-icon',
      shopLogo: 'shop-logo',
    };

    const sections$l = {};

    class ShopPayLink {
      constructor(container) {
        this.container = container;
        this.shopPayWrapper = document.querySelector(selectors$q.shopPayWrapper);
        this.shopLoginButton = document.querySelector(selectors$q.shopLoginButton);

        this.init();
      }

      init() {
        if (!this.shopLoginButton || !this.shopPayWrapper) return;

        const bgColor = this.shopPayWrapper.dataset.bg || 'transparent';
        const textColor = this.shopPayWrapper.dataset.text || '#fff';
        const hoverColor = this.shopPayWrapper.dataset.hover || '#fff';

        this.mainButtonStyles = `
      :host {
        --bg-color: ${bgColor};
        --text-color: ${textColor};
        --hover-color: ${hoverColor};
      }

      .follow-icon-wrapper:before {
        background: var(--bg-color);
        border-color: var(--text-color);
        transition: border 0.3s ease;
      }

      .button:not(.button--following):focus-visible .follow-icon-wrapper:before,
      .button:not(.button--following):hover .follow-icon-wrapper:before {
        background: var(--bg-color);
        border-color: var(--hover-color);
      }

      .button {
        background: transparent;
        color: var(--text-color);
      }

      .following-text {
        color: var(--text-color);
      }

      .button--following:focus-visible,
      .button--following:hover {
        background: var(--bg-color);
      }

      .button:not(.button--following):focus-visible .follow-icon-wrapper:before,
      .button:not(.button--following):hover .follow-icon-wrapper:before {
        background: var(--bg-color);
        border-color: var(--hover-color);
      }
    `;

        this.svgIconsStyles = `
      :host {
        color: ${textColor};
      }
    `;

        customElements.whenDefined(selectors$q.shopLoginButton).then((res) => {
          requestAnimationFrame(() => {
            const shadowRoot1 = this.shopLoginButton.shadowRoot;
            const shopFollowButton = shadowRoot1?.querySelector(selectors$q.shopFollowButton);
            const shadowRoot2 = shopFollowButton?.shadowRoot;
            const followOnShopButton = shadowRoot2?.querySelector(selectors$q.followOnShopButton);
            const shadowRoot3 = followOnShopButton?.shadowRoot;

            if (shadowRoot3) this.overwriteStyles(shadowRoot3.host.shadowRoot, this.mainButtonStyles);

            const heartIcon = shadowRoot3.querySelector(selectors$q.heartIcon);
            const shadowRoot4 = heartIcon?.shadowRoot;
            const shopLogo = shadowRoot3.querySelector(selectors$q.shopLogo);
            const shadowRoot5 = shopLogo?.shadowRoot;

            if (shadowRoot4) this.overwriteStyles(shadowRoot4.host.shadowRoot, this.svgIconsStyles);
            if (shadowRoot5) this.overwriteStyles(shadowRoot5.host.shadowRoot, this.svgIconsStyles);
          });
        });
      }

      overwriteStyles(element, styles) {
        let style = document.createElement('style');
        style.innerHTML = styles;
        element.appendChild(style);
      }
    }

    const shopPayLink = {
      onLoad() {
        sections$l[this.id] = new ShopPayLink(this.container);
      },
    };

    const selectors$p = {
      wave: ':scope > [data-wave]',
      main: '[data-main]',
      trigger: '[data-collapsible-trigger-mobile]',
      footerParallax: '[data-parallax="footer"]',
    };

    const classes$k = {
      isExpanded: 'is-expanded',
      wavy: 'wavy',
      shadow: 'parallax-shadow',
      rounded: 'parallax-rounded-corners',
      mainParallax: 'main-content--parallax',
      footerParallax: 'section-footer--parallax',
      sectionFooterVisible: 'section-footer--visible',
      mainContent: 'main-content',
      shopifySection: 'shopify-section',
      bodyRoundedCornersLarge: 'body--rounded-corners-large',
    };

    const attributes$i = {
      bg: '--bg',
      footerBg: '--footer-bg',
      parallax: 'data-parallax',
      parallaxWavy: 'data-parallax-wavy',
      parallaxRounded: 'data-parallax-rounded-corners',
      parallaxRoundedLarge: 'data-parallax-rounded-corners-large',
      parallaxSafari: 'data-parallax-disable-on-safari',
    };

    const sections$k = {};

    class Footer {
      constructor(section) {
        this.container = section.container;
        this.main = document.querySelector(selectors$p.main);
        this.footerParallax = null;
        this.wavyEnabled = this.container.hasAttribute(attributes$i.parallaxWavy);

        this.parentContainer = this.container.parentNode;
        this.resizeEvent = () => this.resize();
        this.unloadEvent = () => this.onUnload();

        requestIdleCallback(() => {
          if (this.container.hasAttribute(attributes$i.parallax) && !this.main.classList.contains(classes$k.mainParallax)) {
            this.init();
            document.addEventListener('theme:resize', this.resizeEvent);
            document.addEventListener('theme:footer:unload', this.unloadEvent);
          }
        });
      }

      init() {
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && this.container.hasAttribute(attributes$i.parallaxSafari);
        const stopParallax = this.isViewportSmaller() || window.innerWidth < theme.sizes.small || isSafari;
        const body = document.body;
        body.classList.remove(classes$k.bodyRoundedCornersLarge);

        const bgColor = getComputedStyle(this.container).getPropertyValue(attributes$i.bg); // get background color of footer section
        this.parentContainer.style.setProperty('--footer-parallax-height', `auto`); // reset parallax footer height

        let prevSection = this.parentContainer.previousElementSibling;

        if (prevSection) {
          if (!prevSection.classList.contains(classes$k.shopifySection) && !prevSection.classList.contains(classes$k.mainContent)) {
            // if previous section is not a shopify section/main so it should be the main container
            prevSection = this.main;
          }

          if (this.wavyEnabled && !stopParallax) {
            // Add wavy classes if stopParallax is false
            const oldWaves = prevSection.querySelectorAll(selectors$p.wave);
            [...oldWaves].map((wave) => wave.remove()); // remove old waves

            const wave = this.container.querySelector(selectors$p.wave); // wave element in footer section
            prevSection.append(wave.cloneNode(true)); // append wave element in previous section
            prevSection.classList.add(classes$k.wavy); // add wavy class to previous section

            this.container.classList.remove(classes$k.wavy); // remove footer wavy class
          } else {
            if (this.container.hasAttribute(attributes$i.parallaxRounded) && !this.wavyEnabled) {
              // Toggle "parallax-rounded-corners" and "parallax-shadow" classes if the footer wave is disabled or the parallax effect should be removed due to `stopParallax" conditions
              prevSection.classList.toggle(classes$k.rounded, !stopParallax);
              prevSection.classList.toggle(classes$k.shadow, !stopParallax);

              if (this.container.hasAttribute(attributes$i.parallaxRoundedLarge)) {
                // Increase rounded corners
                body.classList.toggle(classes$k.bodyRoundedCornersLarge, !stopParallax);
              }
            } else if (!stopParallax) {
              // Add box-shadow if stopParallax is false
              prevSection.classList.add(classes$k.shadow);
            }
          }

          prevSection.style.setProperty(attributes$i.footerBg, bgColor); // add footer bg color
        }

        if (stopParallax) return;

        this.main.classList.add(classes$k.mainParallax);
        this.parentContainer.classList.add(classes$k.footerParallax); // this will add sticky styles only to section with enabled parallax
        this.parentContainer.style.setProperty('--footer-parallax-height', `${this.container.clientHeight}px`);
        this.footerParallax = new ParallaxElement(this.container);
      }

      resize() {
        this.parentContainer.style.setProperty('--footer-parallax-height', `auto`); // reset parallax footer height

        // Reset footer functionality on resize:
        // - when viewport is smaller - this will disable the parallax
        // - when the window width is smaller than 768px - this will disable the parallax
        // - when footer parallax is disabled - this will enable the parallax
        if (this.isViewportSmaller() || window.innerWidth < theme.sizes.small || !this.footerParallax) {
          this.onUnload(true);
        }

        this.parentContainer.style.setProperty('--footer-parallax-height', `${this.container.clientHeight}px`);
      }

      isViewportSmaller() {
        const viewportHeight = Math.round(Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
        const footerHeight = this.container.clientHeight;
        let waveHeight = 0;
        if (this.wavyEnabled) {
          waveHeight = 50; // half of the wave height
        }

        return viewportHeight < footerHeight + waveHeight;
      }

      onBlockSelect(e) {
        const trigger = e.target.querySelector(selectors$p.trigger);
        requestAnimationFrame(() => {
          if (trigger && !trigger.classList.contains(classes$k.isExpanded)) {
            trigger.dispatchEvent(new Event('click'));
          }
        });
      }

      onBlockDeselect(e) {
        const trigger = e.target.querySelector(selectors$p.trigger);
        requestAnimationFrame(() => {
          if (trigger && trigger.classList.contains(classes$k.isExpanded)) {
            trigger.dispatchEvent(new Event('click'));
          }
        });
      }

      onUnload(reset = false) {
        document.removeEventListener('theme:resize', this.resizeEvent);
        document.removeEventListener('theme:footer:unload', this.unloadEvent);

        if (this.footerParallax) {
          this.footerParallax.unload();

          if (reset) {
            removeFooterWave(this.parentContainer);
          }
        }

        if (this.footerParallax || reset) {
          setTimeout(() => {
            const shopifyInstances = Shopify.theme.sections.instances;
            const parallaxFooters = document.querySelectorAll(selectors$p.footerParallax);
            const footerInstance = shopifyInstances.filter((instance) => instance.container === parallaxFooters[0]);
            this.main.classList.remove(classes$k.mainParallax); // remove main-content--parallax class to trigger section functions
            this.parentContainer.classList.remove(classes$k.footerParallax);
            this.parentContainer.classList.remove(classes$k.sectionFooterVisible);

            if (footerInstance[0]) {
              // Load first parallax footer
              footerInstance[0].onLoad();
            }
          });
        }
      }
    }

    const footerSection = {
      onLoad() {
        sections$k[this.id] = new Footer(this);
      },
      onBlockSelect(e) {
        sections$k[this.id].onBlockSelect(e);
      },
      onBlockDeselect(e) {
        sections$k[this.id].onBlockDeselect(e);
      },
      onReorder() {
        sections$k[this.id].onUnload();
      },
      onUnload() {
        sections$k[this.id].onUnload();
      },
    };

    register('footer', [newsletterSection, collapsible, footerSection, shopPayLink]);

    const selectors$o = {
      slider: '[data-slider]',
    };

    let sections$j = {};

    class IconsRow {
      constructor(section) {
        this.container = section.container;
        this.slider = this.container.querySelector(selectors$o.slider);
      }

      onBlockSelect(evt) {
        const sliderStyle = this.slider.currentStyle || window.getComputedStyle(this.slider);
        const sliderPadding = parseInt(sliderStyle.paddingLeft);
        const blockPositionLeft = evt.target.offsetLeft - sliderPadding;

        this.slider.scrollTo({
          top: 0,
          left: blockPositionLeft,
          behavior: 'smooth',
        });
      }
    }

    const iconsRowSection = {
      onLoad() {
        sections$j[this.id] = new IconsRow(this);
      },
      onBlockSelect(e) {
        sections$j[this.id].onBlockSelect(e);
      },
    };

    register('icons-row', iconsRowSection);

    const selectors$n = {
      item: '[data-accordion-item]',
      button: '[data-accordion-button]',
    };

    const classes$j = {
      isActive: 'is-active',
      toAnimate: 'to-animate',
      isAnimating: 'is-animating',
    };

    const sections$i = {};

    class ImageAccordions {
      constructor(section) {
        this.container = section.container;
        this.controller = new AbortController();
        this.imageAccordionsItems = this.container.querySelectorAll(selectors$n.item);
        this.buttons = this.container.querySelectorAll(selectors$n.button);
        this.accordionExpandEvent = (item) => this.accordionExpand(item);
        this.accordionFocusEvent = (item) => this.accordionFocus(item);

        this.init();
      }

      init() {
        this.triggerLoadingAnimation();

        this.imageAccordionsItems.forEach((item) => {
          item.addEventListener('mouseenter', this.accordionExpandEvent.bind(this, item));
        });

        this.buttons.forEach((button) => {
          button.addEventListener('focusin', this.accordionFocusEvent.bind(this, button));
        });
      }

      triggerLoadingAnimation() {
        if (theme.settings.animationsEnabled == 'false' || isMobile()) return;

        // Apply a `.to-animate` class beforehand, to prepare only the styles necessary for animating but which should not affect normal section behaviour

        const onAnimationEnd = (event) => {
          if (event.animationName === 'expandAccordion') {
            // Set `.is-active` class to the first item, since the default active item is the last one
            this.accordionExpand(this.imageAccordionsItems[0]);

            // Remove loading animation classes and event listeners
            this.container.classList.remove(classes$j.toAnimate);
            this.container.classList.remove(classes$j.isAnimating);
            this.container.removeEventListener('animationend', onAnimationEnd);
          }
        };

        // Transitionend event should fire whenever IntersectionObserver from `animations.js` module detects that current section is already visible in the viewport
        const onTransitionEnd = (event) => {
          requestAnimationFrame(() => {
            if (event.target === this.container) {
              // Class which triggers the container loading animations
              this.container.classList.add(classes$j.isAnimating);
              this.container.removeEventListener('transitionend', onTransitionEnd);
            }
          });
        };

        // Listen for `transitionend` event to trigger container loading animation
        this.container.addEventListener('transitionend', onTransitionEnd, {signal: this.controller.signal});
        // Listen for `animationend` event to set up the same "initial section load state" when loading animation has ended
        this.container.addEventListener('animationend', onAnimationEnd, {signal: this.controller.signal});
      }

      accordionExpand(item) {
        if (!item.classList.contains(classes$j.isActive)) {
          this.imageAccordionsItems.forEach((item) => {
            item.classList.remove(classes$j.isActive);
          });
          item.classList.add(classes$j.isActive);
        }
      }

      accordionFocus(button) {
        button.closest(selectors$n.item).dispatchEvent(new Event('mouseenter'));
      }

      onBlockSelect(event) {
        const element = event.target;
        if (!element) return;

        this.controller.abort();
        this.container.classList.remove(classes$j.toAnimate, classes$j.isAnimating);
        this.accordionExpand(element);

        if (!isMobile()) return;
        element.parentNode.scrollTo({
          top: 0,
          left: element.offsetLeft,
          behavior: 'smooth',
        });
      }
    }

    const imageAccordionsSection = {
      onLoad() {
        sections$i[this.id] = new ImageAccordions(this);
      },
      onBlockSelect(event) {
        sections$i[this.id].onBlockSelect(event);
      },
    };

    register('image-accordions', imageAccordionsSection);

    const selectors$m = {
      trigger: '[data-collapsible-trigger]',
    };

    const classes$i = {
      isExpanded: 'is-expanded',
    };

    const sections$h = {};

    class imageWithText {
      constructor(section) {
        this.container = section.container;
      }

      onBlockSelect(e) {
        const trigger = e.target.querySelector(selectors$m.trigger);
        requestAnimationFrame(() => {
          if (trigger && !trigger.classList.contains(classes$i.isExpanded)) {
            trigger.dispatchEvent(new Event('click'));
          }
        });
      }
    }

    const imageWithTextSection = {
      onLoad() {
        sections$h[this.id] = new imageWithText(this);
      },
      onBlockSelect(e) {
        sections$h[this.id].onBlockSelect(e);
      },
    };

    register('image-with-text', [videoPlay, imageWithTextSection, collapsible]);

    register('list-collections', gridSlider);

    const sections$g = {};

    const selectors$l = {
      slider: '[data-slider-gallery]',
      sliderNav: '[data-slider-info]',
      item: '[data-slide-item]',
    };

    class Locations {
      constructor(section) {
        this.container = section.container;
        this.slider = this.container.querySelector(selectors$l.slider);
        this.sliderNav = this.container.querySelector(selectors$l.sliderNav);
        this.flkty = null;
        this.flktyNav = null;
        this.resizeEvent = () => this.enableAdaptiveHeight();

        this.initSlider();
      }

      initSlider() {
        const slidesCount = this.container.querySelectorAll(selectors$l.item).length;
        this.flkty = Flickity.data(this.slider);
        this.flktyNav = Flickity.data(this.sliderNav);

        if (slidesCount <= 1) {
          return;
        }

        this.flkty = new Flickity(this.slider, {
          fade: true,
          wrapAround: true,
          adaptiveHeight: true,
          prevNextButtons: false,
          pageDots: false,
        });

        // iOS smooth scrolling fix
        flickitySmoothScrolling(this.slider);

        this.flktyNav = new Flickity(this.sliderNav, {
          fade: true,
          wrapAround: true,
          imagesLoaded: true,
          asNavFor: this.slider,
          prevNextButtons: true,
          pageDots: false,
        });

        // Update adaptiveHeight
        this.enableAdaptiveHeight();
        document.addEventListener('theme:resize', this.resizeEvent);

        // Trigger text change on image move/drag
        this.flktyNav.on('change', () => {
          this.flkty.selectCell(this.flktyNav.selectedIndex);

          if (isMobile()) {
            let {stickyHeaderHeight} = readHeights();
            const headerHeight = stickyHeaderHeight || 0;
            const scrollTop = Math.round(window.scrollY);
            const containerOffsetTopPoint = Math.round(this.container.getBoundingClientRect().top + scrollTop - headerHeight);

            window.scrollTo({
              top: containerOffsetTopPoint,
              left: 0,
              behavior: 'smooth',
            });
          }
        });

        // Trigger text change on image move/drag
        this.flkty.on('change', () => {
          this.flktyNav.selectCell(this.flkty.selectedIndex);
        });
      }

      enableAdaptiveHeight() {
        this.flktyNav.options.adaptiveHeight = false;

        if (isMobile()) {
          this.flktyNav.options.adaptiveHeight = true;
        }

        this.flktyNav.resize();
      }

      onBlockSelect(evt) {
        const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));

        if (this.flkty !== null) {
          this.flkty.select(index);
        }
        if (this.flktyNav !== null) {
          this.flktyNav.select(index);
        }
      }

      onUnload() {
        document.removeEventListener('theme:resize', this.resizeEvent);
      }
    }

    const LocationsSection = {
      onLoad() {
        sections$g[this.id] = new Locations(this);
      },
      onBlockSelect(e) {
        sections$g[this.id].onBlockSelect(e);
      },
      onUnload() {
        sections$g[this.id].onUnload();
      },
    };

    register('locations', LocationsSection);

    const sections$f = {};

    const selectors$k = {
      slider: '[data-slider]',
      sliderItem: '[data-slide-item]',
      sTLHotspotsItem: '[data-stl-hotspots-item]',
      pointer: '[data-pointer]',
      pointerBubble: '[data-pointer-bubble]',
      productGridItemImage: '[data-product-media-container]',
      quickViewItemHolder: '[data-quick-view-item-holder]',
      flickityButton: '.flickity-button',
      links: 'a, button',
      tooltip: '[data-tooltip]',
    };

    const attributes$h = {
      products: 'data-products',
      pointer: 'data-pointer',
      hotspot: 'data-hotspot',
      tabIndex: 'tabindex',
    };

    const classes$h = {
      productGridItemImageHover: 'product-grid-item__image--hovered',
      isSelected: 'is-selected',
      isActive: 'is-active',
      onHover: 'on-hover',
      popupOpen: 'pswp--open',
    };

    class Look {
      constructor(container) {
        this.container = container;
        this.slider = this.container.querySelector(selectors$k.slider);
        this.productOnRow = Number(this.slider?.getAttribute(attributes$h.products)) || 3;
        this.slides = this.container.querySelectorAll(selectors$k.sliderItem);
        this.sTLHotspotsItems = this.container.querySelectorAll(selectors$k.sTLHotspotsItem);
        this.pointers = this.container.querySelectorAll(selectors$k.pointer);
        this.pointerBubbles = this.container.querySelectorAll(selectors$k.pointerBubble);
        this.flkty = null;
        this.observer = null;

        this.checkSlidesSizeOnResize = () => this.checkSlidesSize();
        this.resizeSliderEvent = (event) => this.resizeSlider(event);
        this.pointersInit = (event) => this.dotPointers(event);
        this.pointersOver = (event) => this.dotPointerIn(event);
        this.pointersOut = (event) => this.dotPointerOut(event);

        this.debouncedBlockSelectCallback = debounce((event) => this.debouncedBlockSelect(event), 500);

        this.quickViewPopup = new QuickViewPopup(this.container);
        this.listen();
      }

      listen() {
        if (this.slider) {
          this.checkSlidesSize();
          document.addEventListener('theme:resize:width', this.checkSlidesSizeOnResize);
          this.slider.addEventListener('theme:slider:resize', this.resizeSliderEvent);
        }

        this.pointers.forEach((pointer) => {
          pointer.addEventListener('click', this.pointersInit);
          pointer.addEventListener('mouseover', this.pointersOver);
          pointer.addEventListener('mouseleave', this.pointersOut);
        });

        this.pointerBubbles.forEach((pointerBubble, index) => {
          pointerBubble.addEventListener('click', (event) => [...this.pointers][index].dispatchEvent(new Event(event.type)));
          pointerBubble.addEventListener('mouseover', (event) => [...this.pointers][index].dispatchEvent(new Event(event.type)));
          pointerBubble.addEventListener('mouseleave', (event) => [...this.pointers][index].dispatchEvent(new Event(event.type)));
        });
      }

      checkSlidesSize() {
        const isMobile = window.innerWidth < theme.sizes.small;
        const isDesktop = window.innerWidth >= theme.sizes.large;
        const isTablet = window.innerWidth >= theme.sizes.small && window.innerWidth < theme.sizes.large;
        const shouldInitOnDesktop = Boolean(isDesktop && this.slides.length > this.productOnRow);
        const shouldInitOnTablet = Boolean(isTablet && this.slides.length > 2);

        this.initTooltips();

        if (!isMobile) {
          if (shouldInitOnDesktop || shouldInitOnTablet) {
            this.initSlider();
          } else {
            this.destroySlider();
            this.slidesTabIndex();
          }

          return;
        }

        this.destroySlider();
      }

      initTooltips() {
        this.tooltips = this.container.querySelectorAll(selectors$k.tooltip);
        this.tooltips.forEach((tooltip) => {
          new Tooltip(tooltip);
        });
      }

      initSlider() {
        if (this.flkty === null) {
          this.flkty = new Flickity(this.slider, {
            prevNextButtons: true,
            wrapAround: true,
            adaptiveHeight: false,
            cellAlign: 'left',
            groupCells: false,
            contain: true,
            on: {
              ready: () => {
                this.slidesTabIndex();
                this.setSliderArrowsPosition();
                this.dotPointers();
              },
              change: () => {
                this.slidesTabIndex();
                this.dotPointers();
              },
            },
          });

          return;
        }

        this.setSliderArrowsPosition();
      }

      setSliderArrowsPosition() {
        const isDesktop = window.innerWidth >= theme.sizes.small;

        if (!isDesktop) return;

        const arrows = this.slider.querySelectorAll(selectors$k.flickityButton);
        const image = this.slider.querySelector(selectors$k.productGridItemImage);

        if (arrows.length && image) {
          arrows.forEach((arrow) => {
            arrow.style.top = `${image.offsetHeight / 2}px`;
          });
        }
      }

      slidesTabIndex() {
        if (this.slides.length < this.productOnRow + 1) {
          this.slider.querySelectorAll(selectors$k.links).forEach((link) => {
            link.setAttribute(attributes$h.tabIndex, '0');
          });

          return;
        }

        const slider = Flickity.data(this.slider);

        slider.cells.forEach((slide) => {
          let tabIndex = '-1';
          if (slide.element.classList.contains(classes$h.isSelected)) {
            tabIndex = '0';
          }

          slide.element.querySelectorAll(selectors$k.links).forEach((link) => {
            link.setAttribute(attributes$h.tabIndex, tabIndex);
          });
        });
      }

      destroySlider() {
        if (typeof this.flkty === 'object' && this.flkty !== null) {
          this.flkty.destroy();
          this.flkty = null;
        }
      }

      resizeSlider(event) {
        const slider = event.target;
        const flkty = Flickity.data(slider) || null;

        if (!flkty) return;
        flkty.resize();
      }

      dotPointers(event) {
        if (this.pointers.length === 0) return;

        this.sTLHotspotsItems.forEach((element) => element.classList.remove(classes$h.onHover));

        if (event) {
          const dotIndex = event.target.getAttribute(attributes$h.pointer);

          this.flkty?.select(dotIndex);

          return;
        }

        const slideIndex = this.flkty == null ? 0 : this.flkty.selectedIndex;

        if (slideIndex >= 0) {
          this.sTLHotspotsItems[slideIndex].classList.add(classes$h.onHover);
        }
      }

      dotPointerIn(event) {
        const dotIndex = event.target.getAttribute(attributes$h.pointer);
        const image = this.slides[dotIndex].querySelector(selectors$k.productGridItemImage);
        const isTouch = matchMedia('(pointer:coarse)').matches;
        const isMobile = window.innerWidth < theme.sizes.small;
        if (!isMobile && !isTouch) {
          this.observeImage(image);
        }

        this.pointers[dotIndex].style.setProperty('--target-animation', 'none');
      }

      dotPointerOut(event) {
        const dotIndex = event.target.getAttribute(attributes$h.pointer);
        const image = this.slides[dotIndex].querySelector(selectors$k.productGridItemImage);
        image.classList.remove(classes$h.productGridItemImageHover);
        image.dispatchEvent(new Event('mouseleave'));
        if (this.observer) {
          this.observer.disconnect();
        }

        this.pointers.forEach((pointer) => {
          pointer.style.removeProperty('--target-animation');
        });
      }

      observeImage(image) {
        this.observer = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              const target = entry.target;
              const outsideWrapper = entry.intersectionRatio == 0;

              if (!outsideWrapper) {
                target.dispatchEvent(new Event('mouseenter'));
                target.classList.add(classes$h.productGridItemImageHover);
              }
            });
          },
          {
            root: this.slider,
            threshold: [0.95, 1],
          }
        );
        this.observer.observe(image);
      }

      triggerClick(target) {
        requestAnimationFrame(() => target.dispatchEvent(new Event('click')));
      }

      destroyQuickViewPopup() {
        const pswpElement = this.quickViewPopup?.loadPhotoswipe?.pswpElement;
        if (!pswpElement) return;
        if (pswpElement.classList.contains(classes$h.popupOpen)) {
          this.quickViewPopup.loadPhotoswipe.popup.close();
        }
      }

      /**
       * Event callback for Theme Editor `shopify:block:select` event
       * The timeouts here are necessary for issues with selecting blocks from one `Shop the look` section to another
       */
      onBlockSelect(event) {
        this.debouncedBlockSelectCallback(event);
      }

      debouncedBlockSelect(event) {
        const pswpElement = this.quickViewPopup?.loadPhotoswipe?.pswpElement;

        // No popup element
        if (!pswpElement) {
          setTimeout(() => this.triggerClick(event.target), 400);
          return;
        }

        setTimeout(() => {
          // Popup initialized
          if (pswpElement.classList.contains(classes$h.popupOpen)) {
            // Popup opened
            const holder = this.quickViewPopup.loadPhotoswipe.pswpElement.querySelector(`[${attributes$h.hotspot}="${event.target.getAttribute(attributes$h.hotspot)}"]`);
            const quickViewItemHolders = this.quickViewPopup.loadPhotoswipe.pswpElement.querySelectorAll(selectors$k.quickViewItemHolder);

            holder.classList.add(classes$h.isActive);

            quickViewItemHolders.forEach((element) => {
              if (element !== holder) {
                element.classList.remove(classes$h.isActive);
              }
            });
          } else {
            // Popup closed
            this.triggerClick(event.target);
          }
        });
      }

      /**
       * Event callback for Theme Editor `shopify:section:unload` event
       */
      onUnload() {
        this.destroyQuickViewPopup();
        document.removeEventListener('theme:resize:width', this.checkSlidesSizeOnResize);

        if (this.slider) {
          this.slider.removeEventListener('theme:slider:resize', this.resizeSliderEvent);
        }
      }

      /**
       * Event callback for Theme Editor `shopify:section:deselect` event
       */
      onDeselect() {
        this.destroyQuickViewPopup();
      }
    }

    const lookSection = {
      onLoad() {
        sections$f[this.id] = new Look(this.container);
      },
      onUnload() {
        sections$f[this.id].onUnload();
      },
      onBlockSelect(event) {
        sections$f[this.id].onBlockSelect(event);
      },
      onDeselect() {
        sections$f[this.id].onDeselect();
      },
    };

    register('look', [lookSection]);

    const selectors$j = {
      grid: '[data-grid]',
      item: '[data-item]',
      itemContentInner: '[data-item-content-inner]',
      carouselMobile: '.carousel--mobile',
      aosTrigger: 'data-aos-trigger',
      animatable: '[data-aos], [data-aos-anchor]',
    };

    const attributes$g = {
      aosAnchor: 'data-aos-anchor',
      aosTrigger: 'data-aos-trigger',
      sliderMobile: 'data-slider-mobile',
    };

    const classes$g = {
      aosAnimate: 'aos-animate',
    };

    let sections$e = {};

    class Mosaic {
      constructor(section) {
        this.container = section.container;
        this.hasSliderMobile = this.container.hasAttribute(attributes$g.sliderMobile);
        this.carouselMobile = this.container.querySelector(selectors$j.carouselMobile);
        this.items = this.container.querySelectorAll(selectors$j.item);
        this.onResizeCallback = () => this.onResize();

        this.updateAOSAnchors();
        document.addEventListener('theme:resize:width', this.onResizeCallback);
      }

      onResize() {
        this.updateAOSAnchors();
      }

      updateAOSAnchors() {
        if (theme.settings.animationsEnabled == 'false') return;

        // Animate all anchors at once when there is a carousel with native scrolling on mobile
        if (isMobile() && this.hasSliderMobile && this.carouselMobile && this.items.length > 1) {
          const firstItem = this.items[0];
          const firstContentInner = firstItem.querySelector(selectors$j.itemContentInner);
          const blockId = firstItem.id;
          const contentInnerId = firstContentInner ? firstContentInner.id : blockId;

          firstItem.setAttribute(attributes$g.aosTrigger, `#${blockId}`);
          firstContentInner?.setAttribute(attributes$g.aosTrigger, `#${contentInnerId}`);

          this.items.forEach((item) => {
            const animatable = item.querySelectorAll(selectors$j.animatable);
            const itemContentInner = item.querySelector(selectors$j.itemContentInner);

            item.setAttribute(attributes$g.aosAnchor, `#${blockId}`);
            itemContentInner?.setAttribute(attributes$g.aosAnchor, `#${contentInnerId}`);
            animatable.forEach((element) => element.setAttribute(attributes$g.aosAnchor, `#${contentInnerId}`));
          });
        }
      }

      triggerAOS(target) {
        if (theme.settings.animationsEnabled == 'false') return;
        if (!target) return;

        const animatable = target.querySelectorAll(selectors$j.animatable);
        const isAnimated = [...animatable].some((element) => element.classList.contains(classes$g.aosAnimate));

        if (isAnimated) return;

        this.items.forEach((item) => {
          const animatable = item.querySelectorAll(selectors$j.animatable);
          item.classList.add(classes$g.aosAnimate);
          animatable.forEach((element) => element.classList.add(classes$g.aosAnimate));
        });
      }

      /**
       * Event callback for Theme Editor `shopify:block:select` event
       */
      onBlockSelect(e) {
        const target = e.target;
        const grid = target.closest(selectors$j.grid);
        const wrapperStyle = grid.currentStyle || window.getComputedStyle(grid);
        const wrapperPadding = parseInt(wrapperStyle.paddingLeft);
        const blockPositionLeft = target.offsetLeft - wrapperPadding;
        const firstItem = this.items[0];
        const isFirstItem = target.matches(`#${firstItem.id}`);

        // Execute the AOS animations if the selected block contains animatable elements that are not triggered
        if (!isFirstItem) this.triggerAOS(target);

        // Native scroll to item
        setTimeout(() => {
          grid.scrollTo({
            top: 0,
            left: blockPositionLeft,
            behavior: 'smooth',
          });
        }, 500);
      }

      /**
       * Event callback for Theme Editor `shopify:section:unload` event
       */
      onUnload() {
        document.removeEventListener('theme:resize:width', this.onResizeCallback);
      }
    }

    const mosaicSection = {
      onLoad() {
        sections$e[this.id] = new Mosaic(this);
      },
      onUnload() {
        sections$e[this.id].onUnload();
      },
      onBlockSelect(e) {
        sections$e[this.id].onBlockSelect(e);
      },
    };

    register('mosaic', mosaicSection);

    const selectors$i = {
      slider: '[data-slider]',
      slide: '[data-slide]',
      links: 'a, button',
    };

    const classes$f = {
      flickityEnabled: 'flickity-enabled',
      carousel: 'carousel',
      carouselResize: 'carousel--resize',
      carouselInactive: 'carousel--inactive',
      isSelected: 'is-selected',
      textCenter: 'text-center',
    };

    const attributes$f = {
      sectionId: 'data-section-id',
      tabIndex: 'tabindex',
      slide: 'data-slide',
    };

    const sections$d = {};

    class SocialGallery {
      constructor(section) {
        this.container = section.container;
        this.sectionId = this.container.getAttribute(attributes$f.sectionId);
        this.slider = this.container.querySelector(selectors$i.slider);

        if (!this.slider) return;

        this.slides = this.slider.querySelectorAll(selectors$i.slide);
        this.flkty = null;
        this.onResizeCallback = () => this.onResize();

        this.init();
      }

      init() {
        this.handleSliderState();
        this.listen();
      }

      onResize() {
        this.handleSliderState();

        if (this.flkty !== null) {
          this.flkty.resize();

          if (this.flkty.size.width >= this.flkty.slideableWidth) this.destroySlider();
        }
      }

      handleSliderState() {
        const isInactive = this.slider.classList.contains(classes$f.carouselInactive);

        if (isInactive && !isMobile()) {
          this.destroySlider();
          return;
        }

        if (this.slides.length === 1 && isMobile()) {
          this.destroySlider();
          return;
        }

        if (!this.flkty) {
          this.initSlider();
        }

        if (this.flkty.slideableWidth < this.flkty.size.width) this.destroySlider();
      }

      initSlider() {
        const hasTextCenter = this.slider.classList.contains(classes$f.textCenter);

        this.slider.classList.remove(classes$f.carouselInactive);

        this.flkty = new Flickity(this.slider, {
          cellSelector: selectors$i.slide,
          prevNextButtons: true,
          pageDots: true,
          groupCells: true,
          cellAlign: hasTextCenter ? 'center' : 'left',
          contain: true,
          adaptiveHeight: false,
          draggable: true,
          on: {
            ready: () => {
              this.slidesTabIndex();
            },
            change: () => {
              this.slidesTabIndex();
            },
          },
        });

        this.createResizeClass();
      }

      createResizeClass() {
        if (typeof Flickity.prototype._createResizeClass === 'function') return;

        Flickity.prototype._createResizeClass = function () {
          this.element.classList.add(classes$f.carouselResize);
        };

        Flickity.createMethods.push('_createResizeClass');

        const resize = Flickity.prototype.resize;
        Flickity.prototype.resize = function () {
          this.element.classList.remove(classes$f.carouselResize);
          resize.call(this);
          this.element.classList.add(classes$f.carouselResize);
        };
      }

      slidesTabIndex() {
        const slider = Flickity.data(this.slider);

        slider.cells.forEach((slide) => {
          let tabIndex = '-1';
          if (slide.element.classList.contains(classes$f.isSelected)) {
            tabIndex = '0';
          }

          slide.element.querySelectorAll(selectors$i.links).forEach((link) => {
            link.setAttribute(attributes$f.tabIndex, tabIndex);
          });
        });
      }

      destroySlider() {
        if (!this.slider.classList.contains(classes$f.flickityEnabled)) return;

        if (this.slider.classList.contains(classes$f.carousel)) {
          this.slider.classList.add(classes$f.carouselInactive);
        }

        if (this.flkty !== null) {
          this.flkty.destroy();
          this.flkty = null;
        }
      }

      listen() {
        document.addEventListener('theme:resize:width', this.onResizeCallback);
      }

      onBlockSelect(evt) {
        if (this.flkty && this.flkty.isActive) {
          const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));
          const slidesPerPage = parseInt(this.flkty.slides[0].cells.length);
          const groupIndex = Math.floor(index / slidesPerPage);

          const onTransitionEnd = () => {
            requestAnimationFrame(() => {

              this.flkty.select(groupIndex);
            });

            this.flkty.element.removeEventListener('transitionend', onTransitionEnd);
          };

          this.flkty.element.addEventListener('transitionend', onTransitionEnd);
        }
      }

      onUnload() {
        document.removeEventListener('theme:resize:width', this.onResizeCallback);
      }
    }

    const SocialGallerySection = {
      onLoad() {
        sections$d[this.id] = new SocialGallery(this);
      },
      onUnload(e) {
        sections$d[this.id].onUnload(e);
      },
      onBlockSelect(e) {
        sections$d[this.id].onBlockSelect(e);
      },
    };

    register('multicolumns', SocialGallerySection);

    register('newsletter', newsletterSection);

    register('overlapping-images', [videoPlay, parallaxSection]);

    const selectors$h = {
      toggleAdmin: '[data-toggle-admin]',
      toggleNewsletter: '[data-toggle-newsletter]',
      adminForm: '[data-form-admin]',
      newsletterForm: '[data-form-newsletter]',
    };

    let sections$c = {};

    class Password {
      constructor(section) {
        this.container = section.container;
        this.toggleAdmin = this.container.querySelector(selectors$h.toggleAdmin);
        this.toggleNewsletter = this.container.querySelector(selectors$h.toggleNewsletter);
        this.adminForm = this.container.querySelector(selectors$h.adminForm);
        this.newsletterForm = this.container.querySelector(selectors$h.newsletterForm);
        this.adminErrors = this.adminForm.querySelector('.errors');
        this.newsletterErrors = this.newsletterForm.querySelector('.errors');

        this.init();
      }

      init() {
        this.toggleAdmin.addEventListener('click', (e) => {
          e.preventDefault();
          this.showPasswordForm();
        });

        this.toggleNewsletter.addEventListener('click', (e) => {
          e.preventDefault();
          this.hidePasswordForm();
        });

        if (window.location.hash == '#login' || this.adminErrors) {
          this.showPasswordForm();
        } else {
          this.hidePasswordForm();
        }
      }

      showPasswordForm() {
        showElement(this.adminForm);
        hideElement(this.newsletterForm);
        window.location.hash = '#login';
      }

      hidePasswordForm() {
        showElement(this.newsletterForm);
        hideElement(this.adminForm);
        window.location.hash = '';
      }
    }

    const passwordSection = {
      onLoad() {
        sections$c[this.id] = new Password(this);
      },
    };

    register('password-template', passwordSection);

    const selectors$g = {
      largePromo: '[data-large-promo]',
      largePromoInner: '[data-large-promo-inner]',
      tracking: '[data-tracking-consent]',
      trackingInner: '[data-tracking-consent-inner]',
      trackingAccept: '[data-confirm-cookies]',
      popupBar: '[data-popup-bar]',
      popupBarHolder: '[data-popup-bar-holder]',
      popupBarToggle: '[data-popup-bar-toggle]',
      popupBody: '[data-popup-body]',
      popupClose: '[data-popup-close]',
      popupUnderlay: '[data-popup-underlay]',
      newsletterForm: '[data-newsletter-form]',
    };

    const attributes$e = {
      cookieName: 'data-cookie-name',
      targetReferrer: 'data-target-referrer',
      preventScrollLock: 'data-prevent-scroll-lock',
    };

    const classes$e = {
      success: 'has-success',
      error: 'has-error',
      selected: 'selected',
      hasBlockSelected: 'has-block-selected',
      expanded: 'popup--expanded',
      visible: 'popup--visible',
      mobile: 'mobile',
      desktop: 'desktop',
      popupBar: 'popup--bar',
      barIsVisible: 'popup-bar-is-visible',
    };

    let sections$b = {};
    let scrollLockTimer = 0;
    let activePopups = 0;
    let popups = [];

    class DelayShow {
      constructor(popupContainer, popup) {
        this.popupContainer = popupContainer;
        this.popup = popup;
        this.popupBody = popup.querySelector(selectors$g.popupBody);
        this.delay = popupContainer.dataset.popupDelay;
        this.isSubmitted = window.location.href.indexOf('accepts_marketing') !== -1 || window.location.href.indexOf('customer_posted=true') !== -1;
        this.a11y = a11y;
        this.showPopupOnScrollEvent = () => this.showPopupOnScroll();

        if (this.delay === 'always' || this.isSubmitted) {
          this.always();
        }

        if (this.delay && this.delay.includes('delayed') && !this.isSubmitted) {
          const seconds = this.delay.includes('_') ? parseInt(this.delay.split('_')[1]) : 10;
          this.delayed(seconds);
        }

        if (this.delay === 'bottom' && !this.isSubmitted) {
          this.bottom();
        }

        if (this.delay === 'idle' && !this.isSubmitted) {
          this.idle();
        }
      }

      always() {
        this.showPopup();
      }

      delayed(seconds = 10) {
        setTimeout(() => {
          // Show popup after specific seconds
          this.showPopup();
        }, seconds * 1000);
      }

      // Scroll to the bottom of the page
      bottom() {
        document.addEventListener('theme:scroll', this.showPopupOnScrollEvent);
      }

      // Idle for 1 min
      idle() {
        const isTargetValid = this.checkPopupTarget() === true;
        if (!isTargetValid) {
          return;
        }

        let timer = 0;
        let idleTime = 60000;
        const documentEvents = ['mousemove', 'mousedown', 'click', 'touchmove', 'touchstart', 'touchend', 'keydown', 'keypress'];
        const windowEvents = ['load', 'resize', 'scroll'];

        const startTimer = () => {
          timer = setTimeout(() => {
            timer = 0;
            this.showPopup();
          }, idleTime);

          documentEvents.forEach((eventType) => {
            document.addEventListener(eventType, resetTimer);
          });

          windowEvents.forEach((eventType) => {
            window.addEventListener(eventType, resetTimer);
          });
        };

        const resetTimer = () => {
          if (timer) {
            clearTimeout(timer);
          }

          documentEvents.forEach((eventType) => {
            document.removeEventListener(eventType, resetTimer);
          });

          windowEvents.forEach((eventType) => {
            window.removeEventListener(eventType, resetTimer);
          });

          startTimer();
        };

        startTimer();
      }

      showPopup() {
        // Push every popup in array, so we can focus the next one, after closing each
        const popupElement = {id: this.popup.id, body: this.popupBody};
        popups.push(popupElement);

        const isTargetValid = this.checkPopupTarget() === true;

        if (isTargetValid) {
          activePopups += 1;
          this.popup.classList.add(classes$e.visible);
          if (this.popup.classList.contains(classes$e.popupBar)) {
            document.body.classList.add(classes$e.barIsVisible);
          }

          this.a11y.trapFocus({
            container: this.popupBody,
          });

          // The scroll is not locking if data-prevent-scroll-lock is added to the Popup container
          if (this.popup.hasAttribute(attributes$e.preventScrollLock)) {
            return false;
          }

          this.scrollLock();
        }
      }

      checkPopupTarget() {
        const targetMobile = this.popup.parentNode.classList.contains(classes$e.mobile);
        const targetDesktop = this.popup.parentNode.classList.contains(classes$e.desktop);

        if ((targetMobile && window.innerWidth >= theme.sizes.small) || (targetDesktop && window.innerWidth < theme.sizes.small)) {
          return false;
        } else {
          return true;
        }
      }

      scrollLock() {
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.popupBody}));
      }

      showPopupOnScroll() {
        if (window.scrollY + window.innerHeight >= document.body.clientHeight) {
          this.showPopup();
          document.removeEventListener('theme:scroll', this.showPopupOnScrollEvent);
        }
      }

      onUnload() {
        document.removeEventListener('theme:scroll', this.showPopupOnScrollEvent);
      }
    }

    class TargetReferrer {
      constructor(el) {
        this.popupContainer = el;
        this.locationPath = location.href;

        if (!this.popupContainer.hasAttribute(attributes$e.targetReferrer)) {
          return false;
        }

        if (this.locationPath.indexOf(this.popupContainer.getAttribute(attributes$e.targetReferrer)) === -1 && !window.Shopify.designMode) {
          this.popupContainer.parentNode.removeChild(this.popupContainer);
        }
      }
    }

    class LargePopup {
      constructor(el) {
        this.popupContainer = el;
        this.popup = this.popupContainer.querySelector(selectors$g.largePromoInner);
        this.popupBody = this.popup.querySelector(selectors$g.popupBody);
        this.popupId = this.popup.id;
        this.close = this.popup.querySelector(selectors$g.popupClose);
        this.underlay = this.popup.querySelector(selectors$g.popupUnderlay);
        this.form = this.popup.querySelector(selectors$g.newsletterForm);
        this.cookie = new PopupCookie(this.popupContainer.dataset.cookieName, 'user_has_closed');
        this.isTargeted = new TargetReferrer(this.popupContainer);
        this.a11y = a11y;

        this.init();
      }

      init() {
        const cookieExists = this.cookie.read() !== false;

        if (!cookieExists || window.Shopify.designMode) {
          if (!window.Shopify.designMode) {
            new DelayShow(this.popupContainer, this.popup);
          } else {
            this.showPopup();
          }

          if (this.form) {
            setTimeout(() => {
              if (this.form.classList.contains(classes$e.success)) {
                this.showPopupIfNoCookie();
                activePopups -= 1;
              }
            });
          }

          this.initClosers();
        }
      }

      checkPopupTarget() {
        const targetMobile = this.popup.parentNode.classList.contains(classes$e.mobile);
        const targetDesktop = this.popup.parentNode.classList.contains(classes$e.desktop);

        if ((targetMobile && window.innerWidth >= theme.sizes.small) || (targetDesktop && window.innerWidth < theme.sizes.small)) {
          return false;
        } else {
          return true;
        }
      }

      showPopupIfNoCookie() {
        this.showPopup();
      }

      initClosers() {
        this.close.addEventListener('click', this.closePopup.bind(this));
        this.underlay.addEventListener('click', this.closePopup.bind(this));
        this.popupContainer.addEventListener('keyup', (event) => {
          if (event.code === theme.keyboardKeys.ESCAPE) {
            this.closePopup(event);
          }
        });
      }

      closePopup(event) {
        event.preventDefault();
        this.hidePopup();
        this.cookie.write();
      }

      scrollLock() {
        this.resetScrollUnlock();
        this.a11y.trapFocus({
          container: this.popupBody,
        });
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.popupBody}));
      }

      scrollUnlock() {
        this.resetScrollUnlock();

        // Unlock scrollbar after popup animation completes
        scrollLockTimer = setTimeout(() => {
          document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
        }, 300);
      }

      resetScrollUnlock() {
        if (scrollLockTimer) {
          clearTimeout(scrollLockTimer);
        }
      }

      showPopup() {
        const isTargetValid = this.checkPopupTarget() === true;
        const popupElement = {id: this.popupId, body: this.popup};
        popups.push(popupElement);
        if (isTargetValid) {
          activePopups += 1;
          this.popup.classList.add(classes$e.visible);
          this.scrollLock();
        }
      }

      hidePopup() {
        this.popup.classList.remove(classes$e.visible);
        const popupIndex = popups.findIndex((x) => x.id === this.popupId);
        activePopups -= 1;
        popups.splice(popupIndex, 1);

        if (activePopups == 1 && document.body.classList.contains(classes$e.barIsVisible)) {
          this.scrollUnlock();
        } else if (activePopups < 1) {
          this.scrollUnlock();
          this.a11y.removeTrapFocus();
        } else if (popups.length > 0) {
          const nextPopup = popups[popups.length - 1].body;
          this.a11y.trapFocus({
            container: nextPopup,
          });
        }
      }

      onBlockSelect(evt) {
        if (this.popupContainer.contains(evt.target) && !this.popup.classList.contains(classes$e.visible)) {
          this.popup.classList.add(classes$e.selected);
          this.popupContainer.classList.add(classes$e.hasBlockSelected);
          this.showPopup();
        }
      }

      onBlockDeselect(evt) {
        if (this.popupContainer.contains(evt.target)) {
          this.popup.classList.remove(classes$e.selected);
          this.popupContainer.classList.remove(classes$e.hasBlockSelected);
          this.hidePopup();
        }
      }

      onUnload() {
        this.scrollUnlock();
      }

      onDeselect() {
        this.popup.classList.remove(classes$e.selected);
        this.popupContainer.classList.remove(classes$e.hasBlockSelected);
        this.hidePopup();
      }
    }

    class Tracking {
      constructor(el) {
        this.popupContainer = el;
        this.popup = this.popupContainer.querySelector(selectors$g.trackingInner);
        this.popupId = this.popup.id;
        this.close = this.popup.querySelector(selectors$g.popupClose);
        this.acceptButton = this.popup.querySelector(selectors$g.trackingAccept);
        this.enable = this.popupContainer.dataset.enable === 'true';
        this.a11y = a11y;

        window.Shopify.loadFeatures(
          [
            {
              name: 'consent-tracking-api',
              version: '0.1',
            },
          ],
          (error) => {
            if (error) {
              throw error;
            }

            const userCanBeTracked = window.Shopify.customerPrivacy.userCanBeTracked();
            const userTrackingConsent = window.Shopify.customerPrivacy.getTrackingConsent();

            this.enableTracking = !userCanBeTracked && userTrackingConsent === 'no_interaction' && this.enable;

            if (window.Shopify.designMode) {
              this.enableTracking = true;
            }

            this.init();
          }
        );
      }

      init() {
        if (this.enableTracking) {
          this.showPopup();
        }

        this.clickEvents();
      }

      clickEvents() {
        this.close.addEventListener('click', (event) => {
          event.preventDefault();

          window.Shopify.customerPrivacy.setTrackingConsent(false, () => this.hidePopup());
        });

        this.acceptButton.addEventListener('click', (event) => {
          event.preventDefault();

          window.Shopify.customerPrivacy.setTrackingConsent(true, () => this.hidePopup());
        });

        document.addEventListener('trackingConsentAccepted', () => {
          console.log('trackingConsentAccepted event fired');
        });
      }

      showPopup() {
        const popupElement = {id: this.popupId, body: this.popup};
        popups.push(popupElement);
        this.popup.classList.add(classes$e.visible);
        this.a11y.trapFocus({
          container: this.popup,
        });
      }

      hidePopup() {
        this.popup.classList.remove(classes$e.visible);
        const popupIndex = popups.findIndex((x) => x.id === this.popupId);
        popups.splice(popupIndex, 1);

        if (activePopups < 1) {
          this.a11y.removeTrapFocus();
        } else if (popups.length > 0) {
          const nextPopup = popups[popups.length - 1].body;
          this.a11y.trapFocus({
            container: nextPopup,
          });
        }
      }

      onBlockSelect(evt) {
        if (this.popupContainer.contains(evt.target) && this.enableTracking && !this.popup.classList.contains(classes$e.visible)) {
          this.showPopup();
          this.popup.classList.add(classes$e.selected);
          this.popup.parentNode.classList.add(classes$e.hasBlockSelected);
        }
      }

      onBlockDeselect(evt) {
        if (this.popupContainer.contains(evt.target)) {
          this.popup.classList.remove(classes$e.selected);
          this.popupContainer.classList.remove(classes$e.hasBlockSelected);
          this.hidePopup();
        }
      }

      onDeselect() {
        this.popup.classList.remove(classes$e.selected);
        this.popupContainer.classList.remove(classes$e.hasBlockSelected);
        this.hidePopup();
      }
    }

    class PopupBar {
      constructor(el) {
        this.popupContainer = el;
        this.popup = this.popupContainer.querySelector(selectors$g.popupBarHolder);
        this.popupBody = this.popup.querySelector(selectors$g.popupBody);
        this.popupId = this.popup.id;
        this.close = this.popup.querySelector(selectors$g.popupClose);
        this.underlay = this.popup.querySelector(selectors$g.popupUnderlay);
        this.toggle = this.popup.querySelector(selectors$g.popupBarToggle);
        this.cookie = new PopupCookie(this.popupContainer.dataset.cookieName, 'user_has_closed');
        this.form = this.popup.querySelector(selectors$g.newsletterForm);
        this.isTargeted = new TargetReferrer(this.popupContainer);
        this.a11y = a11y;

        this.init();
      }

      init() {
        const cookieExists = this.cookie.read() !== false;

        if (!cookieExists || window.Shopify.designMode) {
          if (!window.Shopify.designMode) {
            new DelayShow(this.popupContainer, this.popup);
          } else {
            this.showPopup();
          }

          this.initPopupToggleButton();
          this.initClosers();

          if (this.form) {
            setTimeout(() => {
              if (this.form.classList.contains(classes$e.success)) {
                this.showPopupIfNoCookie();
              }

              if (this.form.classList.contains(classes$e.error)) {
                // Expand popup if form has error
                this.toggle.dispatchEvent(new Event('click'));
              }
            });
          }
        }
      }

      checkPopupTarget() {
        const targetMobile = this.popup.parentNode.classList.contains(classes$e.mobile);
        const targetDesktop = this.popup.parentNode.classList.contains(classes$e.desktop);

        if ((targetMobile && window.innerWidth >= theme.sizes.small) || (targetDesktop && window.innerWidth < theme.sizes.small)) {
          return false;
        } else {
          return true;
        }
      }

      showPopupIfNoCookie() {
        this.showPopup();
        this.toggle.dispatchEvent(new Event('click'));
      }

      initPopupToggleButton() {
        this.toggle.addEventListener('click', (event) => {
          event.preventDefault();

          this.popup.classList.toggle(classes$e.expanded);

          if (this.popup.classList.contains(classes$e.expanded)) {
            this.scrollLock();
          } else {
            this.scrollUnlock();
          }
        });
      }

      showPopup() {
        const popupElement = {id: this.popupId, body: this.popup};
        popups.push(popupElement);
        this.a11y.trapFocus({
          container: this.popupBody,
        });
        const isTargetValid = this.checkPopupTarget() === true;
        if (isTargetValid) {
          activePopups += 1;
          document.body.classList.add(classes$e.barIsVisible);
          this.popup.classList.add(classes$e.visible);
        }
      }

      hidePopup() {
        this.popup.classList.remove(classes$e.visible);
        document.body.classList.remove(classes$e.barIsVisible);
        const popupIndex = popups.findIndex((x) => x.id === this.popupId);
        popups.splice(popupIndex, 1);

        if (activePopups >= 1) {
          activePopups -= 1;
        }

        if (activePopups < 1) {
          this.scrollUnlock();
          this.a11y.removeTrapFocus();
        } else if (popups.length > 0) {
          const nextPopup = popups[popups.length - 1].body;
          this.a11y.trapFocus({
            container: nextPopup,
          });
        }
      }

      initClosers() {
        this.close.addEventListener('click', this.closePopup.bind(this));
        this.underlay.addEventListener('click', () => this.toggle.dispatchEvent(new Event('click')));
        this.popupContainer.addEventListener('keyup', (event) => {
          if (event.code === theme.keyboardKeys.ESCAPE) {
            this.popup.classList.remove(classes$e.expanded);
            this.scrollUnlock();
          }
        });
      }

      closePopup(event) {
        event.preventDefault();

        this.cookie.write();
        this.hidePopup();
      }

      scrollLock() {
        document.dispatchEvent(new CustomEvent('theme:scroll:lock', {bubbles: true, detail: this.popupBody}));
      }

      scrollUnlock() {
        this.resetScrollUnlock();

        // Unlock scrollbar after popup animation completes
        scrollLockTimer = setTimeout(() => {
          document.dispatchEvent(new CustomEvent('theme:scroll:unlock', {bubbles: true}));
        }, 300);
      }

      resetScrollUnlock() {
        if (scrollLockTimer) {
          clearTimeout(scrollLockTimer);
        }
      }

      onBlockSelect(evt) {
        if (this.popupContainer.contains(evt.target) && !this.popup.classList.contains(classes$e.visible)) {
          this.showPopup();
          this.popup.classList.add(classes$e.expanded);
          this.popup.classList.add(classes$e.selected);
          this.popup.parentNode.classList.add(classes$e.hasBlockSelected);
          this.resetScrollUnlock();
          this.scrollLock();
        }
      }

      onBlockDeselect(evt) {
        if (this.popupContainer.contains(evt.target)) {
          this.popup.classList.remove(classes$e.expanded);
          this.popup.classList.remove(classes$e.selected);
          this.popup.parentNode.classList.remove(classes$e.hasBlockSelected);
          this.hidePopup();
        }
      }

      onUnload() {
        this.scrollUnlock();
      }

      onDeselect() {
        this.popup.classList.remove(classes$e.expanded);
        this.popup.classList.remove(classes$e.selected);
        this.popup.parentNode.classList.remove(classes$e.hasBlockSelected);
        this.hidePopup();
      }
    }

    const popupSection = {
      onLoad() {
        sections$b[this.id] = [];

        if (window.Shopify.designMode) {
          activePopups = 0;
        }

        const popupsLarge = this.container.querySelectorAll(selectors$g.largePromo);
        if (popupsLarge.length) {
          popupsLarge.forEach((el) => {
            sections$b[this.id].push(new LargePopup(el));
          });
        }

        const popupBars = this.container.querySelectorAll(selectors$g.popupBar);
        if (popupBars.length) {
          popupBars.forEach((el) => {
            sections$b[this.id].push(new PopupBar(el));
          });
        }

        const cookiesPopups = this.container.querySelectorAll(selectors$g.tracking);
        if (cookiesPopups.length) {
          cookiesPopups.forEach((el) => {
            sections$b[this.id].push(new Tracking(el));
          });
        }
      },
      onDeselect() {
        sections$b[this.id].forEach((el) => {
          if (typeof el.onDeselect === 'function') {
            el.onDeselect();
          }
        });
      },
      onBlockSelect(evt) {
        sections$b[this.id].forEach((el) => {
          if (typeof el.onBlockSelect === 'function') {
            el.onBlockSelect(evt);
          }
        });
      },
      onBlockDeselect(evt) {
        sections$b[this.id].forEach((el) => {
          if (typeof el.onBlockDeselect === 'function') {
            el.onBlockDeselect(evt);
          }
        });
      },
      onUnload(evt) {
        sections$b[this.id].forEach((el) => {
          if (typeof el.onUnload === 'function') {
            el.onUnload(evt);
          }
        });
      },
    };

    register('popups', [popupSection, newsletterSection]);

    const selectors$f = {
      pressItems: '[data-press-items]',
      logoSlider: '[data-logo-slider]',
      logoSlide: '[data-logo-slide]',
      links: 'a, button',
    };

    const attributes$d = {
      logoSlide: 'data-logo-index',
      tabIndex: 'tabindex',
    };

    let sections$a = {};

    class Press {
      constructor(section) {
        this.container = section.container;
        this.slider = this.container.querySelector(selectors$f.pressItems);
        this.sliderNav = this.container.querySelector(selectors$f.logoSlider);
        this.sliderResizeEvent = () => this.checkSlides();

        this.initSlider();
        this.checkSlides();

        window.addEventListener('load', this.resizeSlider.bind(this));
        document.addEventListener('theme:resize:width', this.sliderResizeEvent);
      }

      checkSlides() {
        const containerWidth = this.container.offsetWidth;
        const slides = this.container.querySelectorAll(selectors$f.logoSlide);
        const sliderNav = Flickity.data(this.sliderNav) || null;

        if (sliderNav !== null) {
          sliderNav.options.draggable = false;
          sliderNav.options.wrapAround = false;
          sliderNav.options.contain = true;

          if (this.getSlidesWidth() > containerWidth && slides.length > 2) {
            sliderNav.options.draggable = true;
            sliderNav.options.wrapAround = true;
            sliderNav.options.contain = false;
          }
          sliderNav.resize();
          sliderNav.updateDraggable();
        }
      }

      getSlidesWidth() {
        const slides = this.container.querySelectorAll(selectors$f.logoSlide);
        let slidesTotalWidth = 0;

        if (slides.length) {
          slides.forEach((slide) => {
            slidesTotalWidth += slide.offsetWidth;
          });
        }
        return slidesTotalWidth;
      }

      /* Init slider */
      initSlider() {
        let flkty = Flickity.data(this.slider) || null;
        let flktyNav = Flickity.data(this.sliderNav) || null;
        const duration = parseInt(this.container.dataset.duration);
        const autoplay = this.container.dataset.autoplay === 'true' ? duration : false;

        flkty = new Flickity(this.slider, {
          fade: true,
          wrapAround: true,
          adaptiveHeight: false,
          prevNextButtons: false,
          pageDots: false,
          autoPlay: autoplay,
        });

        flktyNav = new Flickity(this.sliderNav, {
          draggable: false,
          wrapAround: false,
          contain: true,
          imagesLoaded: true,
          asNavFor: this.slider,
          prevNextButtons: false,
          adaptiveHeight: false,
          pageDots: false,
          on: {
            ready: () => {
              const slides = this.container.querySelectorAll(selectors$f.logoSlide);
              slides.forEach((slide) => {
                // Change slide text on logo change for a11y reasons
                slide.addEventListener('keyup', (event) => {
                  if (event.code === theme.keyboardKeys.ENTER || event.code === theme.keyboardKeys.NUMPADENTER || event.code === theme.keyboardKeys.SPACE) {
                    const selectedIndex = Number(slide.getAttribute(attributes$d.logoSlide));
                    flkty.selectCell(selectedIndex);
                  }
                });
              });
            },
          },
        });

        // iOS smooth scrolling fix
        flickitySmoothScrolling(this.slider);
        flickitySmoothScrolling(this.sliderNav);

        // Trigger text change on image move/drag
        flktyNav.on('change', (index) => {
          flkty.selectCell(index);
        });

        // Trigger text change on image move/drag
        flkty.on('change', (index) => {
          flktyNav.selectCell(index);

          flkty.cells.forEach((slide, i) => {
            slide.element.querySelectorAll(selectors$f.links).forEach((link) => {
              link.setAttribute(attributes$d.tabIndex, i === index ? '0' : '-1');
            });
          });
        });
      }

      // slider height fix on window load
      resizeSlider() {
        const hasSlider = Flickity.data(this.slider);

        if (hasSlider) {
          hasSlider.resize();
        }
      }

      onBlockSelect(event) {
        const slider = Flickity.data(this.slider) || null;
        const sliderNav = Flickity.data(this.sliderNav) || null;
        const index = parseInt([...event.target.parentNode.children].indexOf(event.target));

        if (slider !== null) {
          slider.select(index);
          slider.pausePlayer();
        }

        if (sliderNav !== null) {
          sliderNav.select(index);
        }
      }

      onBlockDeselect() {
        const slider = Flickity.data(this.slider) || null;
        const autoplay = this.container.dataset.autoplay === 'true';

        if (autoplay && slider !== null) {
          slider.playPlayer();
        }
      }

      onUnload() {
        document.removeEventListener('theme:resize:width', this.sliderResizeEvent);
      }
    }

    const pressSection = {
      onLoad() {
        sections$a[this.id] = new Press(this);
      },
      onUnload(e) {
        sections$a[this.id].onUnload(e);
      },
      onBlockSelect(e) {
        sections$a[this.id].onBlockSelect(e);
      },
      onBlockDeselect() {
        sections$a[this.id].onBlockDeselect();
      },
    };

    register('press', pressSection);

    const selectors$e = {
      slideshow: '[data-product-single-media-slider]',
      productInfo: '[data-product-info]',
      headerSticky: '[data-header-sticky]',
      headerHeight: '[data-header-height]',
    };

    const classes$d = {
      sticky: 'is-sticky',
    };

    const attributes$c = {
      stickyEnabled: 'data-sticky-enabled',
    };

    window.theme.variables = {
      productPageSticky: false,
    };

    const sections$9 = {};

    class ProductSticky {
      constructor(section) {
        this.container = section.container;
        this.stickyEnabled = this.container.getAttribute(attributes$c.stickyEnabled) === 'true';
        this.productInfo = this.container.querySelector(selectors$e.productInfo);
        this.stickyScrollTop = 0;
        this.scrollLastPosition = 0;
        this.stickyDefaultTop = 0;
        this.currentPoint = 0;
        this.defaultTopBottomSpacings = 30;
        this.scrollTop = window.scrollY;
        this.scrollDirectionDown = true;
        this.requestAnimationSticky = null;
        this.stickyFormLoad = true;
        this.stickyFormLastHeight = null;
        this.onChangeCounter = 0;
        this.scrollEvent = (e) => this.scrollEvents(e);
        this.resizeEvent = (e) => this.resizeEvents(e);

        this.init();
      }

      init() {
        if (this.stickyEnabled) {
          this.stickyScrollCheck();

          document.addEventListener('theme:resize', this.resizeEvent);
        }

        this.initSticky();
      }

      initSticky() {
        if (theme.variables.productPageSticky) {
          this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition());

          this.productInfo.addEventListener('theme:form:sticky', (e) => {
            this.removeAnimationFrame();

            this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition(e));
          });

          document.addEventListener('theme:scroll', this.scrollEvent);
        }
      }

      scrollEvents(e) {
        if (e.detail !== null) {
          this.scrollTop = e.detail.position;
          this.scrollDirectionDown = e.detail.down;
        }

        if (!this.requestAnimationSticky) {
          this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition());
        }
      }

      resizeEvents() {
        this.stickyScrollCheck();

        document.removeEventListener('theme:scroll', this.scrollEvent);

        this.initSticky();
      }

      stickyScrollCheck() {
        const windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        const isDesktop = windowWidth >= window.theme.sizes.large;
        const targetProductInfo = this.container.querySelector(selectors$e.productInfo);

        if (!targetProductInfo) return;

        if (isDesktop) {
          const productInfo = this.container.querySelector(selectors$e.productInfo);
          const slideshow = this.container.querySelector(selectors$e.slideshow);

          if (!productInfo || !slideshow) return;
          const productCopyHeight = productInfo.offsetHeight;
          const productImagesHeight = slideshow.offsetHeight;

          // Is the product form and description taller than window space
          // Is also shorter than the window and images
          if (productCopyHeight < productImagesHeight) {
            theme.variables.productPageSticky = true;
            targetProductInfo.classList.add(classes$d.sticky);
          } else {
            theme.variables.productPageSticky = false;
            targetProductInfo.classList.remove(classes$d.sticky);
          }
        } else {
          theme.variables.productPageSticky = false;
          targetProductInfo.classList.remove(classes$d.sticky);
        }
      }

      calculateStickyPosition(e = null) {
        const eventExist = Boolean(e && e.detail);
        const isAccordion = Boolean(eventExist && e.detail.element && e.detail.element === 'accordion');
        const productInfoHeight = this.productInfo.offsetHeight;
        const heightDifference = window.innerHeight - productInfoHeight - this.defaultTopBottomSpacings;
        const scrollDifference = Math.abs(this.scrollTop - this.scrollLastPosition);

        if (this.scrollDirectionDown) {
          this.stickyScrollTop -= scrollDifference;
        } else {
          this.stickyScrollTop += scrollDifference;
        }

        if (this.stickyFormLoad) {
          if (document.querySelector(selectors$e.headerSticky) && document.querySelector(selectors$e.headerHeight)) {
            this.stickyDefaultTop = parseInt(document.querySelector(selectors$e.headerHeight).getBoundingClientRect().height);
          } else {
            this.stickyDefaultTop = this.defaultTopBottomSpacings;
          }

          this.stickyScrollTop = this.stickyDefaultTop;
        }

        this.stickyScrollTop = Math.min(Math.max(this.stickyScrollTop, heightDifference), this.stickyDefaultTop);

        const differencePoint = this.stickyScrollTop - this.currentPoint;
        this.currentPoint = this.stickyFormLoad ? this.stickyScrollTop : this.currentPoint + differencePoint * 0.5;

        this.productInfo.style.setProperty('--sticky-top', `${this.currentPoint}px`);

        this.scrollLastPosition = this.scrollTop;
        this.stickyFormLoad = false;

        if (
          (isAccordion && this.onChangeCounter <= 10) ||
          (isAccordion && this.stickyFormLastHeight !== productInfoHeight) ||
          (this.stickyScrollTop !== this.currentPoint && this.requestAnimationSticky)
        ) {
          if (isAccordion) {
            this.onChangeCounter += 1;
          }

          if (isAccordion && this.stickyFormLastHeight !== productInfoHeight) {
            this.onChangeCounter = 11;
          }

          this.requestAnimationSticky = requestAnimationFrame(() => this.calculateStickyPosition(e));
        } else if (this.requestAnimationSticky) {
          this.removeAnimationFrame();
        }

        this.stickyFormLastHeight = productInfoHeight;
      }

      removeAnimationFrame() {
        if (this.requestAnimationSticky) {
          cancelAnimationFrame(this.requestAnimationSticky);
          this.requestAnimationSticky = null;
          this.onChangeCounter = 0;
        }
      }

      onUnload() {
        if (this.stickyEnabled) {
          document.removeEventListener('theme:resize', this.resizeEvent);
        }

        if (theme.variables.productPageSticky) {
          document.removeEventListener('theme:scroll', this.scrollEvent);
        }
      }
    }

    const productStickySection = {
      onLoad() {
        sections$9[this.id] = new ProductSticky(this);
      },
      onUnload() {
        sections$9[this.id].onUnload();
      },
    };

    const selectors$d = {
      mediaContainer: '[data-product-single-media-group]',
      productMediaSlider: '[data-product-single-media-slider]',
      zoomWrapper: '[data-zoom-wrapper]',
    };

    const classes$c = {
      popupClass: 'pswp-zoom-gallery',
      popupClassNoThumbs: 'pswp-zoom-gallery--single',
      isMoving: 'is-moving',
    };

    const attributes$b = {
      dataImageWidth: 'data-image-width',
      dataImageHeight: 'data-image-height',
    };

    class Zoom {
      constructor(container) {
        this.container = container;
        this.mediaContainer = this.container.querySelector(selectors$d.mediaContainer);
        this.slider = this.container.querySelector(selectors$d.productMediaSlider);
        this.zoomWrappers = this.container.querySelectorAll(selectors$d.zoomWrapper);
        this.zoomEnable = this.mediaContainer.dataset.gallery === 'true';
        this.a11y = a11y;

        if (this.zoomEnable) {
          this.init();
        }
      }

      init() {
        if (this.zoomWrappers.length) {
          this.zoomWrappers.forEach((element, i) => {
            element.addEventListener('click', (e) => {
              e.preventDefault();

              const isMoving = this.slider && this.slider.classList.contains(classes$c.isMoving);

              if (!isMoving) {
                this.a11y.state.trigger = element;
                this.createZoom(i);
              }
            });
          });
        }
      }

      createZoom(indexImage) {
        const instance = this;
        let items = [];
        let counter = 0;

        this.zoomWrappers.forEach((elementImage) => {
          const imgSrc = elementImage.getAttribute('href');
          const imgWidth = parseInt(elementImage.getAttribute(attributes$b.dataImageWidth));
          const imgHeight = parseInt(elementImage.getAttribute(attributes$b.dataImageHeight));

          items.push({
            src: imgSrc,
            w: imgWidth,
            h: imgHeight,
            msrc: imgSrc,
          });

          counter += 1;
          if (instance.zoomWrappers.length === counter) {
            let popupClass = `${classes$c.popupClass}`;

            if (counter === 1) {
              popupClass = `${classes$c.popupClass} ${classes$c.popupClassNoThumbs}`;
            }
            const options = {
              barsSize: {top: 60, bottom: 60},
              history: false,
              focus: false,
              index: indexImage,
              mainClass: popupClass,
              showHideOpacity: true,
              showAnimationDuration: 250,
              hideAnimationDuration: 250,
              closeOnScroll: false,
              closeOnVerticalDrag: false,
              captionEl: false,
              closeEl: true,
              closeElClasses: ['caption-close'],
              tapToClose: false,
              clickToCloseNonZoomable: false,
              maxSpreadZoom: 2,
              loop: true,
              spacing: 0,
              allowPanToNext: true,
              pinchToClose: false,
            };

            new LoadPhotoswipe(items, options);
          }
        });
      }
    }

    const selectors$c = {
      complementaryProducts: '[data-complementary-products]',
      buttonQuickView: '[data-button-quick-view]',
    };

    const attributes$a = {
      url: 'data-url',
    };

    class ComplementaryProducts extends HTMLElement {
      constructor() {
        super();
      }

      connectedCallback() {
        const handleIntersection = (entries, observer) => {
          if (!entries[0].isIntersecting) return;
          observer.unobserve(this);

          if (this.hasAttribute(attributes$a.url) && this.getAttribute(attributes$a.url) !== '') {
            fetch(this.getAttribute(attributes$a.url))
              .then((response) => response.text())
              .then((text) => {
                const html = document.createElement('div');
                html.innerHTML = text;
                const recommendations = html.querySelector(selectors$c.complementaryProducts);

                if (recommendations && recommendations.innerHTML.trim().length) {
                  this.innerHTML = recommendations.innerHTML;
                }

                if (html.querySelector(selectors$c.buttonQuickView)) {
                  new QuickViewPopup(this);
                }
              })
              .catch((e) => {
                console.error(e);
              });
          }
        };

        new IntersectionObserver(handleIntersection.bind(this), {rootMargin: '0px 0px 400px 0px'}).observe(this);
      }
    }

    const selectors$b = {
      recipientCheckbox: '[data-recipient-checkbox]',
      recipientEmail: '[data-recipient-email]',
      recipientName: '[data-recipient-name]',
      recipientMessage: '[data-recipient-message]',
      recipientSendOn: '[data-recipient-send-on]',
      recipientControl: '[data-recipient-control]',
      recipientOffset: '[data-recipient-offset]',
      productForm: '[data-product-form]',
      cartDrawer: '[data-cart-drawer]',
    };

    const classes$b = {
      quickViewVisible: 'js-quick-view-visible',
    };

    class RecipientForm extends HTMLElement {
      constructor() {
        super();
        this.recipientCheckbox = this.querySelector(selectors$b.recipientCheckbox);
        this.recipientControl = this.querySelector(selectors$b.recipientControl);
        this.recipientControl.disabled = true;
        this.recipientEmail = this.querySelector(selectors$b.recipientEmail);
        this.recipientName = this.querySelector(selectors$b.recipientName);
        this.recipientMessage = this.querySelector(selectors$b.recipientMessage);
        this.recipientSendOn = this.querySelector(selectors$b.recipientSendOn);
        this.recipientOffset = this.querySelector(selectors$b.recipientOffset);
        if (this.recipientOffset) this.recipientOffset.value = new Date().getTimezoneOffset();
        this.cartDrawer = document.querySelector(selectors$b.cartDrawer);

        this.onChangeEvent = (event) => this.onChange(event);
        this.onCartAddedEvent = () => this.onCartAdded();
      }

      connectedCallback() {
        if (!this.recipientCheckbox) return;

        this.disableInputFields();

        this.recipientCheckbox.addEventListener('change', this.onChangeEvent);
        document.addEventListener('theme:cart:added', this.onCartAddedEvent);
      }

      onChange(event) {
        if (!event.target.checked) {
          this.clearInputFields();
          this.disableInputFields();
          return;
        }

        this.enableInputFields();
      }

      onCartAdded() {
        const scrollToPosition = this.closest(selectors$b.productForm).offsetTop;
        const isQuickBuyForm = document.body.classList.contains(classes$b.quickViewVisible);
        const isRecipientFormActive = this.recipientCheckbox.checked === true;

        if (!isRecipientFormActive) return;

        if (!isQuickBuyForm) {
          // Scroll to the top position of the Product form to prevent layout shift when Recipient form fields are hidden
          window.scrollTo({
            top: scrollToPosition,
            left: 0,
            behavior: 'smooth',
          });
        }

        // Hide Recipient form fields when Cart Drawer's opening animation is completed
        const onCartDrawerTransitionEnd = (event) => {
          if (event.target !== this.cartDrawer) return;

          requestAnimationFrame(() => {
            this.recipientCheckbox.checked = false;
            this.recipientCheckbox.dispatchEvent(new Event('change'));
          });

          this.cartDrawer.removeEventListener('transitionend', onCartDrawerTransitionEnd);
        };

        this.cartDrawer.addEventListener('transitionend', onCartDrawerTransitionEnd);
      }

      inputFields() {
        return [this.recipientEmail, this.recipientName, this.recipientMessage, this.recipientSendOn];
      }

      disableableFields() {
        return [...this.inputFields(), this.recipientOffset];
      }

      clearInputFields() {
        this.inputFields().forEach((field) => (field.value = ''));
      }

      enableInputFields() {
        this.disableableFields().forEach((field) => (field.disabled = false));
      }

      disableInputFields() {
        this.disableableFields().forEach((field) => (field.disabled = true));
      }

      disconnectedCallback() {
        this.recipientCheckbox.removeEventListener('change', this.onChangeEvent);
        document.removeEventListener('theme:cart:added', this.onCartAddedEvent);
      }
    }

    const selectors$a = {
      productMediaSlider: '[data-product-single-media-slider]',
      productMediaThumb: '[data-thumbnail-id]',
      productMediaThumbs: '[data-product-single-media-thumbs]',
      productMediaWrapper: '[data-product-single-media-wrapper]',
      productModel: '[data-model]',
      productSingleThumbnailLink: '.product-single__thumbnail-link',
      deferredMedia: '[data-deferred-media]',
      deferredMediaButton: '[data-deferred-media-button]',
      modalScrollContainer: '[data-tabs-holder]',
      tooltip: '[data-tooltip]',
      links: 'a, button',
      upsellProduct: '[data-upsell-holder]',
      upsellProductSlider: '[data-upsell-slider]',
      featureSlider: '[data-slider]',
      productJson: '[data-product-json]',
    };

    const classes$a = {
      featuredProduct: 'featured-product',
      featuredProductOnboarding: 'featured-product--onboarding',
      hasMediaActive: 'has-media-active',
      isSelected: 'is-selected',
      mediaHidden: 'media--hidden',
      noOutline: 'no-outline',
      hasPopup: 'has-popup',
      isMoving: 'is-moving',
    };

    const attributes$9 = {
      mediaId: 'data-media-id',
      sectionId: 'data-section-id',
      thumbId: 'data-thumbnail-id',
      dataTallLayout: 'data-tall-layout',
      loaded: 'loaded',
      tabIndex: 'tabindex',
      ariaHidden: 'aria-hidden',
    };

    const sections$8 = {};

    class Product {
      constructor(section) {
        this.container = section.container;
        this.sectionId = this.container.getAttribute(attributes$9.sectionId);
        this.tallLayout = this.container.getAttribute(attributes$9.dataTallLayout) === 'true';
        this.featureSliders = this.container.querySelectorAll(selectors$a.featureSlider);
        this.flkty = null;
        this.flktyNav = null;
        this.isFlickityDragging = false;
        this.enableHistoryState = !this.container.classList.contains(classes$a.featuredProduct);
        this.checkSliderOnResize = () => this.checkSlider();
        this.flktyNavOnResize = () => this.resizeFlickityNav();

        this.initUpsellSlider();
        this.initFeatureSlider();

        new QuickViewPopup(this.container);

        // Skip initialization of product form, slider and media functions if section has onboarding content only
        if (this.container.classList.contains(classes$a.featuredProductOnboarding)) {
          return;
        }

        // Record recently viewed products when the product page is loading
        const productJson = this.container.querySelector(selectors$a.productJson);
        if (productJson && productJson.innerHTML) {
          const productJsonHandle = JSON.parse(productJson.innerHTML).handle;
          let recentObj = {};
          if (productJsonHandle) {
            recentObj = {
              handle: productJsonHandle,
            };
          }
          Shopify.Products.recordRecentlyViewed(recentObj);
        } else {
          Shopify.Products.recordRecentlyViewed();
        }

        new Zoom(this.container);

        this.productSlider();
        this.initMediaSwitch();
        this.initProductVideo();
        this.initProductModel();
        this.initShopifyXrLaunch();
      }

      productSlider() {
        this.checkSlider();
        document.addEventListener('theme:resize:width', this.checkSliderOnResize);
      }

      checkSlider() {
        if (!this.tallLayout || window.innerWidth < theme.sizes.large) {
          this.initProductSlider();
          return;
        }

        this.destroyProductSlider();
      }

      resizeFlickityNav() {
        if (this.flktyNav !== null) {
          this.flktyNav.resize();
        }
      }

      /* Product Slider */
      initProductSlider() {
        const slider = this.container.querySelector(selectors$a.productMediaSlider);
        const thumbs = this.container.querySelector(selectors$a.productMediaThumbs);
        const media = this.container.querySelectorAll(selectors$a.productMediaWrapper);

        if (media.length > 1) {
          this.flkty = new Flickity(slider, {
            wrapAround: true,
            pageDots: false,
            adaptiveHeight: true,
            on: {
              ready: () => {
                slider.setAttribute(attributes$9.tabIndex, '-1');
                this.slidesAriaHidden(slider);

                media.forEach((item) => {
                  if (!item.classList.contains(classes$a.isSelected)) {
                    const links = item.querySelectorAll(selectors$a.links);
                    if (links.length) {
                      links.forEach((link) => {
                        link.setAttribute(attributes$9.tabIndex, '-1');
                      });
                    }
                  }
                });
              },
              dragStart: () => {
                slider.classList.add(classes$a.isMoving);
              },
              dragMove: () => {
                // Prevent lightbox trigger on dragMove
                this.isFlickityDragging = true;
              },
              staticClick: () => {
                this.isFlickityDragging = false;
              },
              change: () => {
                // Fix aria-hidden error
                this.slidesAriaHidden(slider);
              },
              settle: (index) => {
                const currentSlide = this.flkty.selectedElement;
                const mediaId = currentSlide.getAttribute(attributes$9.mediaId);

                this.flkty.cells.forEach((slide, i) => {
                  const links = slide.element.querySelectorAll(selectors$a.links);
                  if (links.length) {
                    links.forEach((link) => {
                      link.setAttribute(attributes$9.tabIndex, i === index ? '0' : '-1');
                    });
                  }
                });
                this.switchMedia(mediaId);
                slider.classList.remove(classes$a.isMoving);
              },
            },
          });

          // Toggle flickity draggable functionality based on media play/pause state
          if (media.length) {
            media.forEach((el) => {
              el.addEventListener('theme:media:play', () => {
                this.flkty.options.draggable = false;
                this.flkty.updateDraggable();
                el.closest(selectors$a.productMediaSlider).classList.add(classes$a.hasMediaActive);
              });

              el.addEventListener('theme:media:pause', () => {
                this.flkty.options.draggable = true;
                this.flkty.updateDraggable();
                el.closest(selectors$a.productMediaSlider).classList.remove(classes$a.hasMediaActive);
              });
            });
          }

          // iOS smooth scrolling fix
          flickitySmoothScrolling(slider);

          if (thumbs !== null) {
            this.flktyNav = new Flickity(thumbs, {
              asNavFor: slider,
              contain: true,
              pageDots: false,
              prevNextButtons: false,
              resize: true,
              on: {
                ready: () => {
                  thumbs.setAttribute(attributes$9.tabIndex, '-1');
                  this.slidesAriaHidden(thumbs);
                  requestAnimationFrame(this.flktyNavOnResize);
                },
                change: () => {
                  this.slidesAriaHidden(thumbs);
                },
              },
            });

            const onTransitionEnd = () => {
              requestAnimationFrame(this.flktyNavOnResize);
              this.flktyNav.viewport.removeEventListener('transitionend', onTransitionEnd);
            };

            if (this.flktyNav !== null) {
              document.addEventListener('theme:resize:width', this.flktyNavOnResize);
              this.flktyNav.viewport.addEventListener('transitionend', onTransitionEnd);
            }

            // iOS smooth scrolling fix
            flickitySmoothScrolling(thumbs);

            // Disable link click
            const thumbLinks = this.container.querySelectorAll(selectors$a.productSingleThumbnailLink);
            if (thumbLinks.length) {
              thumbLinks.forEach((el) => {
                el.addEventListener('click', (e) => {
                  e.preventDefault();
                });
              });
            }
          }
        }
      }

      slidesAriaHidden(slider) {
        const sliderNav = Flickity.data(slider);

        sliderNav.cells.forEach((slide) => slide.element.setAttribute(attributes$9.ariaHidden, 'false'));
      }

      destroyProductSlider() {
        if (this.flkty !== null) {
          this.flkty.destroy();
          this.flktyNav.destroy();

          this.flkty = null;
          this.flktyNav = null;
        }
      }

      /* Upsell Products Slider */
      initUpsellSlider() {
        const slider = this.container.querySelector(selectors$a.upsellProductSlider);
        const items = this.container.querySelectorAll(selectors$a.upsellProduct);

        if (items.length > 1) {
          const flktyUpsell = new Flickity(slider, {
            wrapAround: true,
            pageDots: true,
            adaptiveHeight: true,
            prevNextButtons: false,
          });

          flktyUpsell.on('change', (index) => {
            flktyUpsell.cells.forEach((slide, i) => {
              const links = slide.element.querySelectorAll(selectors$a.links);
              if (links.length) {
                links.forEach((link) => {
                  link.setAttribute(attributes$9.tabIndex, i === index ? '0' : '-1');
                });
              }
            });
          });
        }
      }

      /* Feature Block Slider */
      initFeatureSlider() {
        this.featureSliders.forEach((featureSliders) => {
          const featureSlideIndex = Array.from(featureSliders.children);

          if (featureSlideIndex.length > 1) {
            this.flktyFeature = new Flickity(featureSliders, {
              wrapAround: true,
              pageDots: true,
              adaptiveHeight: true,
              prevNextButtons: false,
            });
          }
        });
      }

      handleMediaFocus(event) {
        // Do nothing unless ENTER or TAB key are pressed
        if (event.code !== theme.keyboardKeys.ENTER && event.code !== theme.keyboardKeys.TAB) {
          return;
        }

        const mediaId = event.currentTarget.getAttribute(attributes$9.thumbId);
        const activeSlide = this.container.querySelector(`[${attributes$9.mediaId}="${mediaId}"]`);
        const slideIndex = parseInt([...activeSlide.parentNode.children].indexOf(activeSlide));
        const slider = this.container.querySelector(selectors$a.productMediaSlider);
        const sliderNav = this.container.querySelector(selectors$a.productMediaThumbs);
        const flkty = Flickity.data(slider) || null;
        const flktyNav = Flickity.data(sliderNav) || null;

        // Go to the related slide media
        if (flkty && flkty.isActive && slideIndex > -1 && (event.code === theme.keyboardKeys.ENTER || event.code === theme.keyboardKeys.NUMPADENTER)) {
          flkty.select(slideIndex);
        }

        // Move thumbs to the selected one
        if (flktyNav && flktyNav.isActive && slideIndex > -1) {
          flktyNav.select(slideIndex);
        }
      }

      switchMedia(mediaId) {
        const mediaItems = document.querySelectorAll(`${selectors$a.productMediaWrapper}`);
        const selectedMedia = this.container.querySelector(`${selectors$a.productMediaWrapper}[${attributes$9.mediaId}="${mediaId}"]`);
        const isFocusEnabled = !document.body.classList.contains(classes$a.noOutline);

        // Pause other media
        if (mediaItems.length) {
          mediaItems.forEach((media) => {
            media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
            media.classList.add(classes$a.mediaHidden);
          });
        }

        if (isFocusEnabled) {
          selectedMedia.focus();
        }

        selectedMedia.closest(selectors$a.productMediaSlider).classList.remove(classes$a.hasMediaActive);
        selectedMedia.classList.remove(classes$a.mediaHidden);
        selectedMedia.dispatchEvent(new CustomEvent('theme:media:visible'), {bubbles: true});

        // If media is not loaded, trigger poster button click to load it
        const deferredMedia = selectedMedia.querySelector(selectors$a.deferredMedia);
        if (deferredMedia && deferredMedia.getAttribute(attributes$9.loaded) !== 'true') {
          selectedMedia.querySelector(selectors$a.deferredMediaButton).dispatchEvent(new Event('click'));
        }
      }

      initMediaSwitch() {
        const productThumbImages = this.container.querySelectorAll(selectors$a.productMediaThumb);
        if (productThumbImages.length) {
          productThumbImages.forEach((el) => {
            el.addEventListener('keyup', this.handleMediaFocus.bind(this));
            el.addEventListener('click', (e) => {
              e.preventDefault();
            });
          });
        }
      }

      initProductVideo() {
        this.videos = new ProductVideo(this.container);
      }

      initProductModel() {
        const modelItems = this.container.querySelectorAll(selectors$a.productModel);
        if (modelItems.length) {
          modelItems.forEach((element) => {
            theme.ProductModel.init(element, this.sectionId);
          });
        }
      }

      initShopifyXrLaunch() {
        document.addEventListener('shopify_xr_launch', () => {
          const currentMedia = this.container.querySelector(`${selectors$a.productModel}:not(.${classes$a.mediaHidden})`);
          currentMedia.dispatchEvent(new CustomEvent('xrLaunch'));
        });
      }

      onUnload() {
        if (this.flktyNav !== null) {
          document.removeEventListener('theme:resize:width', this.flktyNavOnResize);
        }

        document.removeEventListener('theme:resize:width', this.checkSliderOnResize);
      }

      onBlockSelect(event) {
        const flkty = Flickity.data(event.target.closest(selectors$a.featureSlider));
        const index = parseInt([...event.target.parentNode.children].indexOf(event.target));

        if (flkty) {
          flkty.select(index);
        }
      }
    }

    const productSection = {
      onLoad() {
        sections$8[this.id] = new Product(this);
      },
      onUnload: function () {
        sections$8[this.id].onUnload();
      },
      onBlockSelect(event) {
        sections$8[this.id].onBlockSelect(event);
      },
    };

    register('product-template', [productFormSection, productSection, swatchSection, swatchesContainer, shareButton, collapsible, tooltip, drawer, productStickySection]);
    register('featured-product', [productFormSection, productSection, swatchSection, swatchesContainer, shareButton, collapsible, tooltip, drawer, productStickySection]);

    if (!customElements.get('complementary-products')) {
      customElements.define('complementary-products', ComplementaryProducts);
    }

    if (!customElements.get('recipient-form')) {
      customElements.define('recipient-form', RecipientForm);
    }

    const attributes$8 = {
      href: 'href',
      mediaId: 'data-media-id',
      deferredMediaLoaded: 'data-deferred-media-loaded',
    };

    const selectors$9 = {
      deferredMedia: '[data-deferred-media]',
      deferredMediaButton: '[data-deferred-media-button]',
      productContentWrapper: '[data-product-content-wrapper]',
      productMediaWrapper: '[data-product-single-media-wrapper]',
      productModel: '[data-model]',
      productLink: '[data-product-link]',
      productSingleMediaImage: '[data-product-single-media-image]',
      sliderContents: '[data-slider-contents]',
      sliderImages: '[data-slider-images]',
      tabButton: '[data-tab-button]',
      tabItem: '[data-tab-item]',
      circleText: '[data-circle-text]',
    };

    const classes$9 = {
      aosAnimate: 'aos-animate',
      tabButtonActive: 'products-list__nav__button--active',
      tabItemActive: 'products-list__item--active',
      mediaHidden: 'media--hidden',
      isDisabled: 'is-disabled',
    };

    const sections$7 = {};

    class ProductsList {
      constructor(section) {
        this.container = section.container;
        this.sectionId = this.container.dataset.sectionId;
        this.tabButtons = this.container.querySelectorAll(selectors$9.tabButton);
        this.tabItems = this.container.querySelectorAll(selectors$9.tabItem);
        this.slidersImages = this.container.querySelectorAll(selectors$9.sliderImages);
        this.slidersContents = this.container.querySelectorAll(selectors$9.sliderContents);
        this.videos = [];
        this.flktyImages = [];
        this.flktyContent = [];
        this.sliderResizeEvent = () => this.resizeSlider();

        this.initButtons();
        this.initSliders();
        this.initProductVideos();
        this.initProductModel();
        this.initShopifyXrLaunch();
        this.listen();
      }

      listen() {
        if (this.slidersImages.length > 0 || this.slidersContents.length > 0) {
          document.addEventListener('theme:resize', this.sliderResizeEvent);
        }
      }

      resizeSlider() {
        if (this.flktyImages.length > 0) {
          requestAnimationFrame(() => {
            this.flktyImages.forEach((flktyImages) => flktyImages.resize());
          });
        }

        if (this.flktyContent.length > 0) {
          requestAnimationFrame(() => {
            this.flktyContent.forEach((flktyContent) => flktyContent.resize());
          });
        }
      }

      initButtons() {
        if (this.tabButtons.length) {
          this.tabButtons.forEach((tabButton) => {
            tabButton.addEventListener('click', (e) => {
              if (tabButton.classList.contains(classes$9.tabButtonActive)) {
                return;
              }

              const currentTabAnchor = tabButton.getAttribute(attributes$8.href);
              const currentTab = this.container.querySelector(currentTabAnchor);
              const currentMedia = currentTab.querySelector(selectors$9.productMediaWrapper);
              const mediaId = currentMedia ? currentMedia.dataset.mediaId : null;
              const currentCircleText = currentTab.querySelector(selectors$9.circleText);

              this.tabButtons.forEach((button) => {
                button.classList.remove(classes$9.tabButtonActive);
              });
              this.tabItems.forEach((item) => {
                const circleText = item.querySelector(selectors$9.circleText);
                item.classList.remove(classes$9.tabItemActive);
                circleText?.classList.add(classes$9.isDisabled);

                if (theme.settings.animationsEnabled) {
                  item.querySelectorAll(`.${classes$9.aosAnimate}`).forEach((element) => {
                    element.classList.remove(classes$9.aosAnimate);
                    setTimeout(() => {
                      element.classList.add(classes$9.aosAnimate);
                    });
                  });
                }
              });

              tabButton.classList.add(classes$9.tabButtonActive);
              currentTab.classList.add(classes$9.tabItemActive);

              document.dispatchEvent(new CustomEvent('theme:resize')); // Trigger theme:resize event to refresh the slider height

              if (currentCircleText) {
                currentCircleText.classList.remove(classes$9.isDisabled);
                document.dispatchEvent(new CustomEvent('theme:scroll')); // Trigger theme:scroll event to refresh the circle-text values
              }

              this.handleProductVideos(currentTab, mediaId);

              e.preventDefault();
            });
          });
        }
      }

      initSliders() {
        this.slidersImages.forEach((sliderImages, idx) => {
          const contentsElement = sliderImages.closest(selectors$9.tabItem).querySelector(selectors$9.sliderContents);

          const flktyImages = new Flickity(sliderImages, {
            fade: true,
            pageDots: false,
            prevNextButtons: true,
            wrapAround: true,
            adaptiveHeight: true,
            asNavFor: contentsElement,
            on: {
              change: (index) => {
                if (this.flktyContent.length > 0) {
                  this.flktyContent[idx].select(index);
                }
              },
            },
          });

          flktyImages.on('settle', (index) => {
            const elements = sliderImages.querySelectorAll(selectors$9.productMediaWrapper);

            for (let i = 0; i < elements.length; i++) {
              if (i === index) {
                elements[i].querySelector(selectors$9.productSingleMediaImage).removeAttribute('tabindex');
              } else {
                elements[i].querySelector(selectors$9.productSingleMediaImage).setAttribute('tabindex', '-1');
              }
            }
          });

          this.flktyImages.push(flktyImages);
        });

        this.slidersContents.forEach((sliderContent) => {
          const flktyContent = new Flickity(sliderContent, {
            fade: true,
            pageDots: false,
            prevNextButtons: false,
            wrapAround: true,
            adaptiveHeight: true,
          });

          flktyContent.on('settle', (index) => {
            const elements = sliderContent.querySelectorAll(selectors$9.productContentWrapper);

            for (let i = 0; i < elements.length; i++) {
              if (i === index) {
                elements[i].querySelectorAll(selectors$9.productLink).forEach((element) => {
                  element.removeAttribute('tabindex');
                });
              } else {
                elements[i].querySelectorAll(selectors$9.productLink).forEach((element) => {
                  element.setAttribute('tabindex', '-1');
                });
              }
            }
          });

          this.flktyContent.push(flktyContent);
        });
      }

      initProductVideos() {
        this.tabItems.forEach((item) => {
          if (item.classList.contains(classes$9.tabItemActive)) {
            this.handleProductVideos(item);
          }
        });
      }

      loadVideos(container, mediaId = null) {
        const videoObserver = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const productVideo = new ProductVideo(container);

                this.videos.push(productVideo);
                container.setAttribute(attributes$8.deferredMediaLoaded, '');
                this.playToggle(mediaId);

                observer.unobserve(entry.target);
              }
            });
          },
          {
            root: null,
            rootMargin: '300px',
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
          }
        );

        videoObserver.observe(container);
      }

      handleProductVideos(container, mediaId = null) {
        if (!container.hasAttribute(attributes$8.deferredMediaLoaded)) {
          this.loadVideos(container, mediaId);
          return;
        }

        this.playToggle(mediaId);
      }

      playToggle(mediaId) {
        this.videos.forEach((element) => {
          if (typeof element.pauseContainerMedia === 'function' && mediaId) {
            element.pauseContainerMedia(mediaId, this.container);
            this.switchMedia(mediaId);
          }

          if (!mediaId && Object.keys(element.players).length === 0) {
            this.pauseContainerMedia(this.container);
          }
        });
      }

      switchMedia(mediaId) {
        const selectedMedia = this.container.querySelector(`${selectors$9.productMediaWrapper}[${attributes$8.mediaId}="${mediaId}"]`);
        const isFocusEnabled = !document.body.classList.contains(classes$9.noOutline);

        if (isFocusEnabled) {
          selectedMedia.focus();
        }

        selectedMedia.classList.remove(classes$9.mediaHidden);
        selectedMedia.dispatchEvent(new CustomEvent('theme:media:visible'), {bubbles: true});
      }

      pauseContainerMedia(container) {
        const mediaItems = container.querySelectorAll(selectors$9.productMediaWrapper);

        if (mediaItems.length === 0) return;

        mediaItems.forEach((media) => {
          media.dispatchEvent(new CustomEvent('theme:media:hidden'), {bubbles: true});
          media.classList.add(classes$9.mediaHidden);
        });
      }

      initProductModel() {
        const modelItems = this.container.querySelectorAll(selectors$9.productModel);
        if (modelItems.length) {
          modelItems.forEach((element) => {
            theme.ProductModel.init(element, this.sectionId);
          });
        }
      }

      initShopifyXrLaunch() {
        document.addEventListener('shopify_xr_launch', () => {
          const currentMedia = this.container.querySelector(`${selectors$9.productModel}:not(.${classes$9.mediaHidden})`);
          currentMedia.dispatchEvent(new CustomEvent('xrLaunch'));
        });
      }

      onBlockSelect(evt) {
        // Show selected tab
        evt.target.dispatchEvent(new Event('click'));
      }

      onUnload() {
        if (this.slidersImages.length > 0 || this.slidersContents.length > 0) {
          document.removeEventListener('theme:resize', this.sliderResizeEvent);
        }
      }
    }

    const productsListSection = {
      onLoad() {
        sections$7[this.id] = new ProductsList(this);
      },
      onUnload() {
        sections$7[this.id].onUnload();
      },
      onBlockSelect(e) {
        sections$7[this.id].onBlockSelect(e);
      },
    };

    register('products-list', [productsListSection, parallaxSection]);

    const selectors$8 = {
      product: '[data-product-block]',
      relatedProducts: '[data-related-products]',
      recentlyViewed: '[data-recent-wrapper]',
      recentlyViewedWrapper: '[data-recently-viewed-wrapper]',
      slider: '[data-slider]',
      slide: '[data-slide]',
      aos: '[data-aos]',
      tabsHolder: '[data-tabs-holder]',
      tabsLink: '[data-tabs-link]',
      tab: '[data-tab]',
      tooltip: '[data-tooltip]',
    };

    const attributes$7 = {
      sectionId: 'data-section-id',
      productId: 'data-product-id',
      limit: 'data-limit',
      minimum: 'data-minimum',
      tabsLink: 'data-tabs-link',
      columnsMobile: 'data-column-mobile',
    };

    const classes$8 = {
      hidden: 'hidden',
      aosAnimate: 'aos-animate',
      oneWhole: 'mobile--one-whole',
      oneHalf: 'mobile--one-half',
    };

    const sections$6 = {};

    class RelatedProducts {
      constructor(section) {
        this.section = section;
        this.sectionId = section.id;
        this.container = section.container;

        this.related();
        this.recent();

        this.tabs = new Tabs(this.container);
      }

      related() {
        this.relatedProducts = this.container.querySelector(selectors$8.relatedProducts);

        if (!this.relatedProducts) {
          return;
        }

        const sectionId = this.container.getAttribute(attributes$7.sectionId);
        const productId = this.container.getAttribute(attributes$7.productId);
        const limit = this.container.getAttribute(attributes$7.limit);
        const requestUrl = `${theme.routes.product_recommendations_url}?section_id=${sectionId}&limit=${limit}&product_id=${productId}`;

        fetch(requestUrl)
          .then((response) => {
            if (!response.ok) {
              const error = new Error(response.status);
              this.hideRelated();
              throw error;
            }
            return response.text();
          })
          .then((data) => {
            const createdElement = document.createElement('div');
            createdElement.innerHTML = data;
            const inner = createdElement.querySelector(selectors$8.relatedProducts);

            if (!inner) return;

            if (inner.querySelectorAll(selectors$8.product).length) {
              this.relatedProducts.innerHTML = inner.innerHTML;

              this.relatedProductGrid = new ProductGrid(this.relatedProducts);
              this.relatedGridSlider = new GridSlider(this.container);
              this.initTooltips(this.relatedProducts);
            }
          });
      }

      recent() {
        const recentlyViewed = this.container.querySelector(selectors$8.recentlyViewed);
        const howManyToshow = recentlyViewed ? parseInt(recentlyViewed.getAttribute(attributes$7.limit)) : 4;

        Shopify.Products.showRecentlyViewed({
          howManyToShow: howManyToshow,
          wrapperId: `recently-viewed-products-${this.sectionId}`,
          section: this.section,
          onComplete: (wrapper, section) => {
            const container = section.container;
            const recentlyViewedHolder = container.querySelector(selectors$8.recentlyViewed);
            const recentlyViewedWrapper = container.querySelector(selectors$8.recentlyViewedWrapper);
            const recentProducts = wrapper.querySelectorAll(selectors$8.product);
            const aosItem = recentlyViewedHolder.querySelectorAll(selectors$8.aos);
            const slider = recentlyViewedHolder.querySelector(selectors$8.slider);
            const minimumNumberProducts = recentlyViewedHolder.hasAttribute(attributes$7.minimum) ? parseInt(recentlyViewedHolder.getAttribute(attributes$7.minimum)) : 1;
            const checkRecentInRelated = !recentlyViewedWrapper && recentProducts.length > 0;
            const checkRecentOutsideRelated = recentlyViewedWrapper && recentProducts.length >= minimumNumberProducts;
            const columnsMobile = slider.getAttribute(attributes$7.columnsMobile);

            if (checkRecentInRelated || checkRecentOutsideRelated) {
              this.recentProductGrid = new ProductGrid(recentlyViewedHolder);
              this.initTooltips(recentlyViewedHolder);

              if (checkRecentOutsideRelated) {
                container.classList.remove(classes$8.hidden);
              }

              if (slider) {
                this.recentGridSlider = new GridSlider(container);

                requestAnimationFrame(() => {
                  this.recentGridSlider.sliders.forEach((slider) => {
                    slider.dispatchEvent(new CustomEvent('theme:slider:resize', {bubbles: true}));
                    this.recentGridSlider.setSliderArrowsPosition(slider);
                  });
                });

                slider.querySelectorAll(selectors$8.slide).forEach(slides => {
                  if (columnsMobile == 2) {
                    slides.classList.add(classes$8.oneHalf);
                    slides.classList.remove(classes$8.oneWhole);
                  } else {
                    slides.classList.add(classes$8.oneWhole);
                    slides.classList.remove(classes$8.oneHalf);
                  }
                });
              }

              let itemsSet = [];
              recentlyViewedHolder.addEventListener('theme:target:animate', (event) => {
                itemsSet.push(event.detail);
                if (itemsSet.length === aosItem.length) {
                  requestAnimationFrame(() => aosItem.forEach((item) => item.classList.add(classes$8.aosAnimate)));
                }
              });
            }
          },
        });
      }

      hideRelated() {
        const tab = this.relatedProducts.closest(selectors$8.tab);
        const tabsHolder = this.relatedProducts.closest(selectors$8.tabsHolder);
        const tabsLink = tabsHolder.querySelector(`[${attributes$7.tabsLink}="${tab.dataset.tab}"]`);

        tab.remove();

        if (!tabsLink) return;
        tabsLink.remove();
        tabsHolder.querySelector(selectors$8.tabsLink).dispatchEvent(new Event('click'));
        this.tabs.customScrollbar.unload();
        requestAnimationFrame(() => {
          this.tabs.customScrollbar = new CustomScrollbar(this.tabs.container);
        });
      }

      /**
       * Init tooltips for swatches
       */
      initTooltips(container) {
        this.tooltips = container.querySelectorAll(selectors$8.tooltip);
        this.tooltips.forEach((tooltip) => {
          new Tooltip(tooltip);
        });
      }

      /**
       * Event callback for Theme Editor `shopify:section:deselect` event
       */
      onDeselect() {
        if (this.relatedProductGrid) this.relatedProductGrid.onDeselect();
        if (this.recentProductGrid) this.recentProductGrid.onDeselect();
      }

      /**
       * Event callback for Theme Editor `shopify:block:select` event
       */
      onBlockSelect(event) {
        const element = event.target;
        const tab = this.container.querySelectorAll(selectors$8.tab);

        if (!element || tab.length < 2) return;

        element.dispatchEvent(new Event('click'));

        element.parentNode.scrollTo({
          top: 0,
          left: element.offsetLeft - element.clientWidth,
          behavior: 'smooth',
        });
      }

      /**
       * Event callback for Theme Editor `shopify:section:unload` event
       */
      onUnload() {
        if (this.relatedProductGrid) this.relatedProductGrid.onUnload();
        if (this.relatedGridSlider) this.relatedGridSlider.onUnload();
        if (this.recentProductGrid) this.recentProductGrid.onUnload();
        if (this.recentGridSlider) this.recentGridSlider.onUnload();
      }
    }

    const relatedProductsSection = {
      onLoad() {
        sections$6[this.id] = new RelatedProducts(this);
      },
      onDeselect() {
        sections$6[this.id].onDeselect();
      },
      onBlockSelect(event) {
        sections$6[this.id].onBlockSelect(event);
      },
      onUnload() {
        sections$6[this.id].onUnload();
      },
    };

    register('related-products', relatedProductsSection);
    register('recent-products', relatedProductsSection);

    const selectors$7 = {
      sTLHotspotsItem: '[data-stl-hotspots-item]',
      sTLHotspotsTarget: '[data-stl-hotspots-target]',
      sTLHotspotsTrigger: '[data-stl-hotspots-trigger]',
      shopifySection: '.shopify-section',
      quickViewItemHolder: '[data-quick-view-item-holder]',
      links: '[data-product-block] a, [data-product-block] button',
    };

    const attributes$6 = {
      hotspot: 'data-hotspot',
      initialOpen: 'data-stl-initial-open',
      tabIndex: 'tabindex',
      ariaExpanded: 'aria-expanded',
    };

    const classes$7 = {
      aosAnimate: 'aos-animate',
      isActive: 'is-active',
      isLoading: 'is-loading',
      popupOpen: 'pswp--open',
      blockSelected: 'block-selected',
    };

    /**
     * Shop The Look Hotspots custom element
     * @example
     *  <stl-hotspots>
     *    <div data-stl-hotspots-item>
     *      <button type="button" data-stl-hotspots-target {{ block.shopify_attributes }}></button>
     *      <div data-stl-hotspots-trigger></div>
     *    </div>
     *  </stl-hotspots>
     */
    class STLHotspots extends HTMLElement {
      static observedAttributes = ['class'];

      constructor() {
        super();
        this.initialOpen = this.hasAttribute(attributes$6.initialOpen);
      }

      get items() {
        return [...this.querySelectorAll(selectors$7.sTLHotspotsItem)];
      }

      get targets() {
        return [...this.querySelectorAll(selectors$7.sTLHotspotsTarget)];
      }

      get triggers() {
        return [...this.querySelectorAll(selectors$7.sTLHotspotsTrigger)];
      }

      attributeChangedCallback(name, oldValue, newValue) {
        const isClassChange = name === 'class';
        const inView = newValue.includes(classes$7.aosAnimate);
        let justIn = true;
        if (oldValue) {
          if (oldValue.includes(classes$7.aosAnimate)) justIn = false;
        }

        if (isClassChange && inView && justIn) {
          this.animate();
        }
      }

      connectedCallback() {
        this.animationsTimeout = null;
        this.resetAnimations = false;
        this.init();
        this.listen();
      }

      init() {
        if (!theme.settings.animationsEnabled) {
          this.animate();
        }

        if (!this.initialOpen) {
          this.focusables();
        }
      }

      listen() {
        if (Shopify.designMode) {
          const section = this.closest(selectors$7.shopifySection);
          section.addEventListener('shopify:section:select', () => this.restoreAnimations());
          section.addEventListener('shopify:section:deselect', (event) => this.deselectAll(event));
          section.addEventListener('shopify:block:deselect', () => this.restoreAnimations());

          this.addEventListener('shopify:block:select', (event) => {
            if (this.animationsTimeout) {
              clearTimeout(this.animationsTimeout);
              this.animationsTimeout = null;
            }
            this.removeAnimations();
            this.deselectAll(event);
            this.select(this.targets.indexOf(event.target));
          });
        }

        this.targets.forEach((target) => {
          target.addEventListener('click', (event) => {
            this.select(this.targets.indexOf(event.target));
            this.restoreAnimations();
          });
        });

        this.triggers.forEach((target) => {
          target.addEventListener('click', (event) => {
            const selectedIndex = this.triggers.indexOf(event.target);
            this.select(selectedIndex);

            this.restoreAnimations();

            // Open a quick view drawer when clicking on each trigger, mobile only
            if (isMobile()) {
              this.dispatchEvent(
                new CustomEvent('stl:open-quick-view', {
                  bubbles: true,
                  detail: {index: selectedIndex},
                })
              );
            }
          });
        });

        this.addEventListener('keyup', (event) => this.onKeyup(event));
      }

      animate() {
        if (!this.initialOpen) return;
        let delay = 600;
        if (Shopify.designMode) delay = 300;
        if (this.resetAnimations) return;
        setTimeout(() => this.select(0), delay);
      }

      removeAnimations() {
        this.items.forEach((item) => {
          item.style.setProperty('--duration', '0s');
          item.classList.add(classes$7.blockSelected);
        });
        this.resetAnimations = true;
      }

      restoreAnimations() {
        if (!Shopify.designMode) return;

        this.items.forEach((item) => item.classList.remove(classes$7.blockSelected));

        this.animationsTimeout = setTimeout(() => {
          this.items.forEach((item) => {
            item.style.removeProperty('--duration');
          });
          this.resetAnimations = false;
        }, 1e3);
      }

      deselectAll(event = false) {
        this.items.forEach((item, index) => {
          item.classList.remove(classes$7.isActive);

          if (index === 0 && this.initialOpen && event && !this.resetAnimations) {
            item.classList.add(classes$7.isActive);
          }
        });

        setTimeout(() => this.focusables());
      }

      select(selectedIndex) {
        this.items.forEach((item, index) => {
          item.setAttribute('aria-current', selectedIndex === index ? 'true' : 'false');
          item.classList.toggle(classes$7.isActive, selectedIndex === index);
        });

        this.focusables();
      }

      focusables() {
        this.items.forEach((element, index) => {
          const isActive = element.classList.contains(classes$7.isActive);
          const tabIndex = isActive ? '0' : '-1';
          const expanded = isActive ? true : false;
          element.querySelectorAll(selectors$7.links).forEach((link) => link.setAttribute(attributes$6.tabIndex, tabIndex));
          this.targets[index].setAttribute(attributes$6.ariaExpanded, expanded);
        });
      }

      onKeyup(event) {
        if (event.code === theme.keyboardKeys.ESCAPE) {
          this.deselectAll();
          event.target.closest(selectors$7.sTLHotspotsItem).querySelector(selectors$7.sTLHotspotsTarget).focus();
        }
      }
    }

    if (!customElements.get('stl-hotspots')) {
      customElements.define('stl-hotspots', STLHotspots);
    }

    /**
     * Shop The Look custom element
     * @example
     *  <shop-the-look>
     *    <stl-hotspots></stl-hotspots>
     *  </shop-the-look>
     */
    class ShopTheLook extends HTMLElement {
      constructor() {
        super();
      }

      get hotspots() {
        return this.querySelector('stl-hotspots');
      }

      get hotspotsTargets() {
        return [...this.querySelectorAll(selectors$7.sTLHotspotsTarget)];
      }

      get hotspotsTriggers() {
        return [...this.querySelectorAll(selectors$7.sTLHotspotsTrigger)];
      }

      connectedCallback() {
        this.init();
        this.listen();
      }

      disconnectedCallback() {}

      init() {
        // Quick view popup init and callbacks for the Theme editor
        this.quickViewPopup = new QuickViewPopup(this);
        this.openQuickViewPopupCallback = debounce((target) => this.openQuickViewPopup(target), 500);
      }

      listen() {
        if (Shopify.designMode) {
          const section = this.closest(selectors$7.shopifySection);
          section.addEventListener('shopify:section:unload', this.destroyQuickViewPopup.bind(this));
          section.addEventListener('shopify:section:deselect', this.destroyQuickViewPopup.bind(this));

          this.addEventListener('shopify:block:select', (event) => this.openQuickViewPopupCallback(event.target));
        }

        if (this.hotspots) {
          // Close all hotspot items when clicking outside them
          this.addEventListener('click', (event) => {
            const isHotspotsItem = Boolean(event.target.closest(selectors$7.sTLHotspotsItem) !== null);
            if (!isHotspotsItem) {
              this.hotspots.deselectAll();
              this.hotspots.restoreAnimations();
            }
          });

          // Open the quick view drawer when a `CustomEvent` is dispatched
          this.hotspots.addEventListener('stl:open-quick-view', (event) => {
            if (!isMobile()) return;

            const target = this.hotspotsTargets[event.detail.index];
            this.openQuickViewPopup(target);

            const onPopupInit = () => {
              this.hotspotsTriggers.forEach((button) => button.classList.add(classes$7.isLoading));

              this.quickViewPopup.loadPhotoswipe?.popup?.listen('destroy', () => {
                this.hotspotsTriggers.forEach((button) => button.classList.remove(classes$7.isLoading));
                target.removeEventListener('theme:popup:init', onPopupInit);
              });
            };
            target.addEventListener('theme:popup:init', onPopupInit);
          });
        }
      }

      openQuickViewPopup(target) {
        if (!isMobile()) return;

        const pswpElement = this.quickViewPopup?.loadPhotoswipe?.pswpElement;

        // No popup element
        if (!pswpElement) {
          setTimeout(() => this.triggerClick(target), 400);
          return;
        }

        setTimeout(() => {
          // Popup initialized
          if (pswpElement.classList.contains(classes$7.popupOpen)) {
            // Popup opened
            const holder = this.quickViewPopup.loadPhotoswipe.pswpElement.querySelector(`[${attributes$6.hotspot}="${target.getAttribute(attributes$6.hotspot)}"]`);
            const quickViewItemHolders = this.quickViewPopup.loadPhotoswipe.pswpElement.querySelectorAll(selectors$7.quickViewItemHolder);

            holder.classList.add(classes$7.isActive);

            quickViewItemHolders.forEach((element) => {
              if (element !== holder) {
                element.classList.remove(classes$7.isActive);
              }
            });
          } else {
            // Popup closed
            this.triggerClick(target);
          }
        });
      }

      triggerClick(target) {
        requestAnimationFrame(() => target.dispatchEvent(new Event('click')));
      }

      destroyQuickViewPopup() {
        const pswpElement = this.quickViewPopup?.loadPhotoswipe?.pswpElement;
        if (!pswpElement) return;
        if (pswpElement.classList.contains(classes$7.popupOpen)) {
          this.quickViewPopup.loadPhotoswipe.popup.close();
        }
      }
    }

    if (!customElements.get('shop-the-look')) {
      customElements.define('shop-the-look', ShopTheLook);
    }

    const sections$5 = {};

    const selectors$6 = {
      slider: '[data-slider]',
      sliderItem: '[data-item]',
      buttonProductsShow: '[data-button-show]',
      buttonProductsHide: '[data-button-hide]',
      itemProducts: '[data-item-products]',
      itemProductSlider: '[data-item-products-slider]',
      itemProduct: '[data-item-product]',
      links: 'a, button',
    };

    const classes$6 = {
      itemActive: 'blog-item--active',
      itemProductsVisible: 'blog-item__products--visible',
      featuredBlogSlider: 'shoppable-blog__slider',
      flickityEnabled: 'flickity-enabled',
      isSelected: 'is-selected',
    };

    const attributes$5 = {
      slider: 'data-slider',
      slidePosition: 'data-slide-position',
      sectionId: 'data-section-id',
      tabIndex: 'tabindex',
      ariaHidden: 'aria-hidden',
    };

    class ShoppableBlog {
      constructor(section) {
        this.container = section.container;
        this.flkty = null;
        this.slider = this.container.querySelector(selectors$6.slider);
        this.checkSlidesSizeOnResize = () => this.checkSlidesSize();
        this.isFullWidth = this.container.hasAttribute(attributes$5.fullWidth);
        this.gutter = 0;
        this.a11y = a11y;
        this.clickOutsideItemEvent = (e) => {
          const clickOutsideSliderItem = !(e.target.matches(selectors$6.sliderItem) || e.target.closest(selectors$6.sliderItem));

          if (clickOutsideSliderItem) {
            const sliderItem = this.container.querySelectorAll(selectors$6.sliderItem);
            if (sliderItem.length) {
              sliderItem.forEach((item) => {
                const itemProducts = item.querySelector(selectors$6.itemProducts);
                if (itemProducts) {
                  itemProducts.classList.remove(classes$6.itemProductsVisible);

                  this.changeTabIndex(itemProducts);
                  this.changeAriaHidden(itemProducts, true);
                }
                item.classList.remove(classes$6.itemActive);
              });
            }
          }
        };

        this.bindButtons();
        this.listen();
      }

      initSlider() {
        this.flkty = new Flickity(this.slider, {
          prevNextButtons: true,
          pageDots: false,
          cellAlign: 'left',
          wrapAround: false,
          groupCells: true,
          contain: true,
          on: {
            ready: () => {
              this.handleFocus();
            },
          },
        });

        this.flkty.on('change', () => {
          const slides = this.container.querySelectorAll(selectors$6.sliderItem);

          this.handleFocus();

          if (slides.length) {
            slides.forEach((el) => {
              const itemProducts = el.querySelector(selectors$6.itemProducts);

              el.classList.remove(classes$6.itemActive);

              if (itemProducts) {
                el.querySelector(selectors$6.itemProducts).classList.remove(classes$6.itemProductsVisible);
              }
            });
          }

          if (this.flkty && !this.flkty.options.draggable) {
            this.flkty.options.draggable = true;
            this.flkty.updateDraggable();
          }
        });
      }

      destroySlider() {
        if (this.flkty !== null) {
          this.flkty.destroy();
          this.flkty = null;
        }
      }

      checkSlidesSize() {
        const sliderItemStyle = this.container.querySelector(selectors$6.sliderItem).currentStyle || window.getComputedStyle(this.container.querySelector(selectors$6.sliderItem));
        this.gutter = parseInt(sliderItemStyle.marginRight);
        const containerWidth = this.slider.offsetWidth + this.gutter;
        const itemsWidth = this.getItemsWidth();
        const itemsOverflowViewport = containerWidth < itemsWidth;

        if (window.innerWidth >= theme.sizes.small && itemsOverflowViewport) {
          this.initSlider();
        } else {
          this.destroySlider();
        }
      }

      getItemsWidth() {
        let itemsWidth = 0;
        const slides = this.slider.querySelectorAll(selectors$6.sliderItem);
        if (slides.length) {
          slides.forEach((item) => {
            itemsWidth += item.offsetWidth + this.gutter;
          });
        }

        return itemsWidth;
      }

      bindButtons() {
        const itemProductSlider = this.container.querySelectorAll(selectors$6.itemProductSlider);
        const buttonProductsShow = this.container.querySelectorAll(selectors$6.buttonProductsShow);
        const buttonProductsHide = this.container.querySelectorAll(selectors$6.buttonProductsHide);

        if (buttonProductsShow.length) {
          buttonProductsShow.forEach((button) => {
            button.addEventListener('click', (e) => {
              e.preventDefault();

              this.container.querySelectorAll(selectors$6.sliderItem).forEach((item) => {
                const itemProducts = item.querySelector(selectors$6.itemProducts);
                item.classList.remove(classes$6.itemActive);

                if (itemProducts) {
                  itemProducts.classList.remove(classes$6.itemProductsVisible);

                  this.changeTabIndex(itemProducts);
                  this.changeAriaHidden(itemProducts, true);
                }
              });

              const item = button.closest(selectors$6.sliderItem);
              const itemProducts = item.querySelector(selectors$6.itemProducts);
              item.classList.add(classes$6.itemActive);

              if (itemProducts) {
                itemProducts.classList.add(classes$6.itemProductsVisible);

                this.changeTabIndex(itemProducts, 'enable');
                this.changeAriaHidden(itemProducts, false);

                const itemProductsSlider = itemProducts.querySelector(selectors$6.itemProductSlider);
                const allSlides = itemProductsSlider.querySelectorAll(selectors$6.itemProduct);
                const sliderActive = itemProductsSlider.classList.contains(classes$6.flickityEnabled);

                if (sliderActive) {
                  allSlides.forEach((slide) => {
                    const isSelected = slide.classList.contains(classes$6.isSelected);

                    slide.setAttribute(attributes$5.tabIndex, isSelected ? '0' : '-1');

                    this.changeAriaHidden(slide, !isSelected);
                  });
                }
              }

              if (this.flkty !== null) {
                this.flkty.options.draggable = false;
                this.flkty.updateDraggable();
              }

              this.a11y.state.trigger = button;
            });
          });
        }

        if (buttonProductsHide.length) {
          buttonProductsHide.forEach((button) => {
            button.addEventListener('click', (e) => {
              e.preventDefault();
              const item = button.closest(selectors$6.sliderItem);
              const itemProducts = item.querySelector(selectors$6.itemProducts);
              item.classList.remove(classes$6.itemActive);

              if (itemProducts) {
                itemProducts.classList.remove(classes$6.itemProductsVisible);

                this.changeTabIndex(itemProducts);
                this.changeAriaHidden(itemProducts, true);
              }

              if (this.flkty !== null) {
                this.flkty.options.draggable = true;
                this.flkty.updateDraggable();
              }

              this.a11y.state.trigger.focus();
            });
          });
        }

        if (itemProductSlider.length) {
          itemProductSlider.forEach((slider) => {
            const countSlides = slider.querySelectorAll(selectors$6.itemProduct).length;

            if (countSlides > 1) {
              new Flickity(slider, {
                prevNextButtons: true,
                contain: true,
                pageDots: false,
                wrapAround: true,
                on: {
                  change: (index) => {
                    const allSlides = slider.querySelectorAll(selectors$6.itemProduct);

                    allSlides.forEach((slide, i) => {
                      const isSelected = i === index;

                      slide.setAttribute(attributes$5.tabIndex, isSelected ? '0' : '-1');

                      this.changeAriaHidden(slide, !isSelected);
                    });
                  },
                },
              });
            }
          });
        }

        this.slider.addEventListener('keyup', (event) => {
          if (event.code === theme.keyboardKeys.ESCAPE) {
            const sliderItem = event.target.hasAttribute(attributes$5.slider)
              ? event.target.querySelectorAll(selectors$6.sliderItem)
              : event.target.closest(selectors$6.slider).querySelectorAll(selectors$6.sliderItem);

            if (sliderItem.length) {
              sliderItem.forEach((item) => {
                const itemProducts = item.querySelector(selectors$6.itemProducts);
                item.classList.remove(classes$6.itemActive);
                if (itemProducts) {
                  itemProducts.classList.remove(classes$6.itemProductsVisible);

                  this.changeTabIndex(itemProducts);
                  this.changeAriaHidden(itemProducts, true);
                }
              });

              if (this.flkty) {
                this.flkty.options.draggable = true;
                this.flkty.updateDraggable();
              }
            }

            this.a11y.state.trigger.focus();
          }
        });
      }

      handleFocus() {
        const sliderItems = this.container.querySelectorAll(selectors$6.sliderItem);

        if (sliderItems.length) {
          sliderItems.forEach((item) => {
            const selected = item.classList.contains(classes$6.isSelected);
            const itemProducts = item.querySelector(selectors$6.itemProducts);

            if (!selected) {
              this.changeTabIndex(item);

              if (itemProducts) {
                itemProducts.classList.remove(classes$6.itemProductsVisible);
              }
            } else {
              this.changeTabIndex(item, 'enable');

              if (itemProducts) {
                this.changeTabIndex(itemProducts);
              }
            }
          });
        }
      }

      listen() {
        if (this.slider) {
          this.checkSlidesSize();
          document.addEventListener('theme:resize:width', this.checkSlidesSizeOnResize);
        }

        document.addEventListener('mousedown', this.clickOutsideItemEvent);
      }

      changeAriaHidden(element, isHidden) {
        element.setAttribute(attributes$5.ariaHidden, isHidden ? true : false);
      }

      changeTabIndex(items, state = '') {
        const tabIndex = state === 'enable' ? '0' : '-1';
        items.querySelectorAll(selectors$6.links).forEach((link) => {
          link.setAttribute(attributes$5.tabIndex, tabIndex);
        });

        const itemProductSliders = items.querySelectorAll(selectors$6.itemProductSlider);
        const itemProducts = items.querySelector(selectors$6.itemProducts);
        const isVisible = items.classList.contains(classes$6.itemProductsVisible);

        itemProductSliders.forEach((itemProductSlider) => {
          itemProductSlider.setAttribute(attributes$5.tabIndex, isVisible ? '0' : '-1');

          itemProductSlider.querySelectorAll(selectors$6.itemProduct).forEach((itemProduct) => {
            this.changeAriaHidden(itemProduct, !isVisible);
          });
        });

        if (itemProducts) {
          this.changeAriaHidden(itemProducts, !isVisible);
        }
      }

      onBlockSelect(evt) {
        if (this.flkty !== null) {
          const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));
          const slidesPerPage = parseInt(this.flkty.slides[0].cells.length);
          const groupIndex = Math.floor(index / slidesPerPage);

          const onTransitionEnd = () => {
            requestAnimationFrame(() => {

              this.flkty.select(groupIndex);
            });

            this.flkty.element.removeEventListener('transitionend', onTransitionEnd);
          };

          this.flkty.element.addEventListener('transitionend', onTransitionEnd);
        } else {
          const sliderStyle = this.slider.currentStyle || window.getComputedStyle(this.slider);
          const sliderPadding = parseInt(sliderStyle.paddingLeft);
          const blockPositionLeft = evt.target.offsetLeft - sliderPadding;

          // Native scroll to item
          this.slider.scrollTo({
            top: 0,
            left: blockPositionLeft,
            behavior: 'smooth',
          });
        }
      }

      onUnload() {
        document.removeEventListener('theme:resize:width', this.checkSlidesSizeOnResize);
        document.removeEventListener('mousedown', this.clickOutsideItemEvent);
      }
    }

    const shoppableBlogSection = {
      onLoad() {
        sections$5[this.id] = new ShoppableBlog(this);
      },
      onUnload(e) {
        sections$5[this.id].onUnload(e);
      },
      onBlockSelect(e) {
        sections$5[this.id].onBlockSelect(e);
      },
    };

    register('shoppable-blog', shoppableBlogSection);

    const selectors$5 = {
      arrowScrollDown: '[data-scroll-down]',
      header: '[data-site-header]',
      item: '[data-slide]',
      links: 'a, button',
      slider: '[data-slider]',
      lazyImage: '.lazy-image',
      textHighlight: 'text-highlight',
      parallax: '[data-parallax="zoom-on-scroll"],[data-parallax="card-scrolling"],[data-parallax="zoom-on-scroll,card-scrolling"]',
    };

    const attributes$4 = {
      style: 'data-style',
      currentStyle: 'data-current-style',
      tabIndex: 'tabindex',
    };

    const classes$5 = {
      headerFixed: 'site-header--fixed',
      sliderNoCachedImages: 'slider--no-cached-images',
      sliderImgLoaded: 'slider--img-loaded',
      imgIn: 'img-in',
      originalHeight: 'original-height',
      originalHeightMobile: 'original-height-mobile',
      hasMobileHeight: 'has-mobile-height',
    };

    const sections$4 = {};

    class Slider {
      constructor(section) {
        this.container = section.container;
        this.header = document.querySelector(selectors$5.header);
        this.items = this.container.querySelectorAll(selectors$5.item);
        this.flkty = null;
        this.parallax = null;
        this.resizeEvent = () => {
          this.flkty.resize();
        };

        this.getTallestSlideItem();
        this.initSlider();
        this.bindScrollButton();

        this.getTallestSlideItemOnResize = () => this.getTallestSlideItem();

        document.addEventListener('theme:resize:width', this.getTallestSlideItemOnResize);

        if (this.container.matches(selectors$5.parallax)) {
          this.parallax = new ParallaxElement(this.container);
        }
      }

      initSlider() {
        const slidesCount = this.items.length;
        const duration = parseInt(this.container.dataset.duration);
        const pageDots = this.container.dataset.pageDots === 'true' && slidesCount > 1;
        const prevNextButtons = this.container.dataset.navArrows === 'true' && slidesCount > 1;
        let autoplay = this.container.dataset.autoplay === 'true';

        if (autoplay) {
          autoplay = duration;
        }

        if (slidesCount > 1) {
          this.flkty = new Flickity(this.container, {
            fade: true,
            cellSelector: selectors$5.item,
            autoPlay: autoplay,
            wrapAround: true,
            adaptiveHeight: true,
            setGallerySize: true,
            imagesLoaded: true,
            pageDots: pageDots,
            prevNextButtons: prevNextButtons,
            dragThreshold: 25,
            on: {
              ready: () => {
                const currentStyle = this.items[0].getAttribute(attributes$4.style);
                this.container.setAttribute(attributes$4.currentStyle, currentStyle);
                requestAnimationFrame(this.resizeEvent);
                document.addEventListener('theme:vars', this.resizeEvent); // Update slideshow height after height vars init

                this.handleFirstSlideAnimation(true);
              },
              change: (index) => {
                const currentSlide = this.flkty.selectedElement;
                const currentStyle = currentSlide.getAttribute(attributes$4.style);

                this.container.setAttribute(attributes$4.currentStyle, currentStyle);
                this.handleFirstSlideAnimation(false);

                this.flkty.cells.forEach((slide, i) => {
                  slide.element.querySelectorAll(selectors$5.links).forEach((link) => {
                    link.setAttribute(attributes$4.tabIndex, i === index ? '0' : '-1');
                  });

                  slide.element.querySelectorAll(selectors$5.textHighlight).forEach((highlight) => {
                    highlight.setTriggerAttribute(Boolean(i === index));
                  });
                });
              },
            },
          });

          // iOS smooth scrolling fix
          flickitySmoothScrolling(this.container);
        } else if (slidesCount === 1) {
          const currentStyle = this.items[0].getAttribute(attributes$4.style);
          this.container.setAttribute(attributes$4.currentStyle, currentStyle);
        }
      }

      getTallestSlideItem() {
        if (this.items.length <= 1) return;

        // Remove the container's custom property to let each slide item use the `var(--min-h)` fallback value for their `min-height`
        this.container.style.removeProperty('--item-min-h');

        const heights = [...this.items].map((item) => Math.floor(item.offsetHeight));
        const tallestSlideItemHeight = Math.max(...heights);
        const isOriginalHeight = [...this.items].some((item) => item.classList.contains(classes$5.originalHeight));
        const isOriginalHeightMobile = [...this.items].some((item) => item.classList.contains(classes$5.originalHeightMobile));
        const hasMobileHeight = this.container.classList.contains(classes$5.hasMobileHeight);

        if ((isDesktop() && !isOriginalHeight) || (isMobile() && !isOriginalHeightMobile && hasMobileHeight) || (isMobile() && !isOriginalHeight && !hasMobileHeight)) {
          const heightDiffs = [...this.items].some((item) => Math.floor(item.offsetHeight) !== tallestSlideItemHeight);

          if (heightDiffs) {
            this.container.style.setProperty('--item-min-h', `${tallestSlideItemHeight}px`);
          }
        }
      }

      /**
       * Handles image animation in first slide that would be triggered on page load
       *  - uses a fallback class modifier for sliders that contain a first slide with no cached hero images
       *  - that class resets the default slider CSS animation so it won't be executed when `.img-in` class is added when `img.complete` is detected
       *  - gets the first slide's `.lazy-image` container and listens for `transitionend` event of its `<img>` child element
       *  - adds a class modifier after `<img>` transition has completed, when shimmer effect has been removed, that should trigger the hero image animation
       *  - removes classes on Theme Editor `shopify:section:unload` and `shopify:section:reorder` events
       */
      handleFirstSlideAnimation(onLoad = false) {
        if (!onLoad) {
          this.container.classList.remove(classes$5.sliderNoCachedImages);
          this.container.classList.remove(classes$5.sliderImgLoaded);
          return;
        }

        const firstSlide = this.items[0];
        const slideImage = firstSlide.querySelectorAll(selectors$5.lazyImage);
        const slideImgComplete = this.container.classList.contains(classes$5.imgIn);

        if (slideImage.length && !slideImgComplete) {
          this.container.classList.add(classes$5.sliderNoCachedImages);

          const onImageTransitionEnd = (event) => {
            requestAnimationFrame(() => this.container.classList.add(classes$5.sliderImgLoaded));
            slideImage[0].removeEventListener('transitionend', onImageTransitionEnd);
          };

          slideImage[0].addEventListener('transitionend', onImageTransitionEnd);
        }
      }

      // Scroll down function
      bindScrollButton() {
        const arrowDown = this.container.querySelector(selectors$5.arrowScrollDown);

        if (arrowDown) {
          arrowDown.addEventListener('click', (e) => {
            e.preventDefault();

            const headerHeight = this.header.classList.contains(classes$5.headerFixed) ? 60 : 0;
            const scrollToPosition = parseInt(Math.ceil(this.container.offsetTop + this.container.offsetHeight - headerHeight));

            window.scrollTo({
              top: scrollToPosition,
              left: 0,
              behavior: 'smooth',
            });
          });
        }
      }

      onBlockSelect(evt) {
        const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));

        if (this.flkty !== null) {
          this.flkty.select(index);
          this.flkty.pausePlayer();
        }
      }

      onBlockDeselect(evt) {
        const autoplay = evt.target.closest(selectors$5.slider).dataset.autoplay === 'true';
        if (autoplay && this.flkty !== null) {
          this.flkty.playPlayer();
        }
      }

      onReorder() {
        this.handleFirstSlideAnimation(false);

        if (this.flkty !== null) {
          this.flkty.resize();
        }
      }

      onUnload() {
        document.removeEventListener('theme:resize:width', this.getTallestSlideItemOnResize);

        this.handleFirstSlideAnimation(false);

        if (this.flkty !== null) {
          document.removeEventListener('theme:vars', this.resizeEvent);
          this.flkty.destroy();
          this.flkty = null;
        }

        if (this.parallax) {
          this.parallax.unload();
          this.parallax = null;
        }
      }
    }

    const slider = {
      onLoad() {
        sections$4[this.id] = new Slider(this);
      },
      onReorder(e) {
        sections$4[this.id].onReorder(e);
      },
      onUnload(e) {
        sections$4[this.id].onUnload(e);
      },
      onBlockSelect(e) {
        sections$4[this.id].onBlockSelect(e);
      },
      onBlockDeselect(e) {
        sections$4[this.id].onBlockDeselect(e);
      },
    };

    register('slider', [slider, videoPlay]);

    const selectors$4 = {
      body: '[data-sticky-card-body]',
      wrapper: '[data-sticky-card-wrapper]',
      content: '[data-sticky-card-content]',
      aside: '[data-sticky-card-aside]',
      text: '[data-sticky-card-text]',
      media: '[data-sticky-card-media]',
      vh: '[data-sticky-vh]',
    };

    const classes$4 = {
      isStuckUp: 'is-stuck-up',
      hasPassedSticky: 'has-passed-sticky',
      spillover: 'spillover',
    };

    const attributes$3 = {
      layoutMobile: 'data-sticky-card-layout-mobile',
    };

    const sections$3 = {};

    class StickyImageCards {
      constructor(section) {
        this.container = section.container;
        this.body = this.container.querySelector(selectors$4.body);
        this.wrapper = this.container.querySelectorAll(selectors$4.wrapper);
        this.content = this.container.querySelector(selectors$4.content);
        this.aside = this.container.querySelector(selectors$4.aside);
        this.text = this.container.querySelectorAll(selectors$4.text);
        this.media = this.container.querySelectorAll(selectors$4.media);
        this.textInContent = this.content?.querySelectorAll(selectors$4.text);
        this.vh = this.container.querySelector(selectors$4.vh);
        this.layoutMobile = this.container.getAttribute(attributes$3.layoutMobile);
        this.isDesktop = Boolean(getWindowWidth() >= window.theme.sizes.large);
        this.isMobile = isMobile();
        this.orientation = getScreenOrientation();

        if (this.media.length === 0) return;

        this.onScrollCallback = () => this.onScroll();
        this.onResizeCallback = () => this.onResize();
        this.init();
      }

      init() {
        requestAnimationFrame(() => {
          this.calculateHeights();
          this.onScroll();
        });

        document.addEventListener('theme:scroll', this.onScrollCallback);
        document.addEventListener('theme:resize', this.onResizeCallback);
      }

      onScroll() {
        if (!this.isEligible()) return;

        this.detectStickyPositions();
      }

      isEligible() {
        const elementOffsetTopPoint = Math.round(this.container.getBoundingClientRect().top + window.scrollY);
        const elementOffsetBottomPoint = elementOffsetTopPoint + this.container.offsetHeight;
        const isBottomOfElementPassed = elementOffsetBottomPoint < Math.round(window.scrollY);
        const isTopOfElementReached = elementOffsetTopPoint < Math.round(window.scrollY + window.innerHeight);
        const isInView = isTopOfElementReached && !isBottomOfElementPassed;

        return isInView;
      }

      detectStickyPositions() {
        const parentOffset = Math.round(this.body.getBoundingClientRect().top - this.headerHeight - this.wrapperTop);

        [...this.wrapper].forEach((item, i) => {
          const distance = Math.floor(item.getBoundingClientRect().top - this.headerHeight);

          if (this.isMobile) {
            if (i !== this.lastIndex) {
              const nextOneDistance = Math.floor(this.wrapper[i + 1].getBoundingClientRect().top - this.headerHeight);
              item.classList.toggle(classes$4.hasPassedSticky, nextOneDistance <= this.stickyTop);
            }

            this.container.classList.toggle(`checkpoint-${i + 1}`, parentOffset <= this.cumulativeHeights[i] * -1);
          }

          item.classList.toggle(classes$4.isStuckUp, distance <= this.stickyTop);
        });
      }

      calculateHeights() {
        let {stickyHeaderHeight} = readHeights();
        this.headerHeight = stickyHeaderHeight || 0;
        this.spacingTop = parseInt(window.getComputedStyle(this.container).getPropertyValue('--padding')) || 20;
        this.wrapperTop = parseInt(window.getComputedStyle(this.wrapper[0]).getPropertyValue('top')) || 0;
        this.stickyTop = Math.floor(this.wrapperTop - this.headerHeight);
        this.gap = parseInt(window.getComputedStyle(this.aside).getPropertyValue('gap')) || 0;
        this.viewportHeight = this.vh.offsetHeight;
        this.lastIndex = [...this.wrapper].length - 1;
        this.cumulativeHeights = [];

        if (this.isMobile) {
          this.wrapperTop = this.spacingTop;
          this.stickyTop = this.spacingTop;
        }

        if (!this.textInContent) return;

        // Minimum height variables
        if (this.isDesktop && this.textInContent.length > 0) {
          this.textInContent.forEach((element, i) => {
            element.style.setProperty('--row-height', 'auto');
            this.wrapper[i].style.setProperty('--row-height', 'auto');

            const elementHeight = element.offsetHeight;
            const mediaHeight = this.media[i].offsetHeight;
            const maxHeight = Math.max(elementHeight, mediaHeight);

            element.style.setProperty('--row-height', `${maxHeight}px`);
            this.wrapper[i].style.setProperty('--row-height', `${maxHeight}px`);
          });
        }

        // Handle excessive content heights
        [...this.wrapper].forEach((item, i) => {
          item.style.setProperty('--item-height', 'auto');
          item.style.setProperty('--item-double-height', 'auto');

          requestAnimationFrame(() => {
            const itemHeight = item.offsetHeight;
            const isExceeding = itemHeight + this.wrapperTop + this.headerHeight > this.viewportHeight;

            const heights = [...this.wrapper].map((element) => (Number(element.dataset.index) >= i ? 0 : element.offsetHeight));
            this.cumulativeHeights.push(heights.reduce((a, b) => a + b, 0));

            item.classList.toggle(classes$4.spillover, isExceeding);

            if (isExceeding && this.isMobile) {
              item.style.setProperty('--item-height', `${itemHeight}px`);
              item.style.setProperty('--item-double-height', `${itemHeight * 2}px`);
            }
          });
        });
      }

      onResize() {
        requestAnimationFrame(() => {
          this.isDesktop = Boolean(getWindowWidth() >= window.theme.sizes.large);
          this.isMobile = isMobile();
          const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
          let isEligible = this.isDesktop || (!isIOS && this.isMobile);

          // Prevent updating of heights and props on iOS devices, where the `resize` event is triggered every time one is scrolling up and down the page
          if (this.orientation !== getScreenOrientation() && isIOS) {
            isEligible = true;
            this.orientation = getScreenOrientation();
          }

          if (!isEligible) return;
          this.calculateHeights();
        });
      }

      /**
       * Event callback for Theme Editor `shopify:section:unload` event
       */
      onUnload() {
        document.removeEventListener('theme:scroll', this.onScrollCallback);
        document.removeEventListener('theme:resize', this.onResizeCallback);
      }

      /**
       * Event callback for Theme Editor `shopify:block:select` event
       */
      onBlockSelect(event) {
        requestAnimationFrame(() => {
          const index = Number(event.target.dataset.index);
          const parentOffset = Math.round(this.body.getBoundingClientRect().top + window.scrollY);

          // Sum the heights of each previous sibling container
          const heights = [...this.wrapper].map((element) => (Number(element.dataset.index) >= index ? 0 : element.offsetHeight));
          const cumulativeHeight = heights.reduce((a, b) => a + b, 0);

          // Adjust the scroll top position depending on different mobile layouts
          const adjustTop = () => {
            // "Stacked" mobile layout
            if (this.isMobile && this.layoutMobile === 'stacked') {
              const gapAdjustment = this.gap * index * -1;
              const breathingSpace = this.gap / 2;
              return gapAdjustment + breathingSpace;
            }

            // "Sticky" mobile layout and all desktop layouts
            return this.stickyTop;
          };

          const distance = parentOffset + cumulativeHeight - adjustTop() - this.headerHeight;

          setTimeout(() => {
            window.scrollTo({
              top: distance,
              left: 0,
              behavior: 'smooth',
            });
          }, 400);
        });
      }
    }

    const stickyImageCards = {
      onLoad() {
        sections$3[this.id] = new StickyImageCards(this);
      },
      onUnload() {
        sections$3[this.id].onUnload();
      },
      onBlockSelect(event) {
        sections$3[this.id].onBlockSelect(event);
      },
    };

    register('sticky-image-cards', stickyImageCards);

    const selectors$3 = {
      wrapper: '[data-sticky-wrapper]',
      aside: '[data-sticky-aside]',
      inner: '[data-sticky-inner]',
      content: '[data-sticky-content]',
      text: '.js-only [data-sticky-text]',
      textInner: '.js-only [data-sticky-text-inner]',
      image: '.js-only [data-sticky-image]',
      images: '[data-sticky-images]',
      imageWrapper: '.image-wrapper',
      videoWrapper: '.sticky-images-and-text__video-wrapper',
      dot: '[data-sticky-dot]',
      textHighlight: 'text-highlight',
    };

    const attributes$2 = {
      withGaps: 'data-sticky-with-gaps',
      singleText: 'data-sticky-single-text',
      index: 'data-index',
    };

    const settings = {
      intersectionRatio: 0.5,
      scrollDirection: {
        horizontal: 'horizontal',
        horizontalReversed: 'horizontal-reversed',
        vertical: 'vertical',
        verticalReversed: 'vertical-reversed',
      },
      typeOfIntersecting: {
        maxVisibility: 'maximum-visibility-of-each-image-in-viewport',
        middleOfViewport: 'image-in-the-middle-of-viewport',
      },
    };

    const classes$3 = {
      isActive: 'is-active',
    };

    const sections$2 = {};

    class StickyImagesAndText {
      constructor(section) {
        this.container = section.container;
        this.scrollDirection = this.container.dataset.scrollDirection;
        this.horizontalScroll = this.scrollDirection === settings.scrollDirection.horizontal || this.scrollDirection === settings.scrollDirection.horizontalReversed;
        this.verticalScroll = this.scrollDirection === settings.scrollDirection.vertical || this.scrollDirection === settings.scrollDirection.verticalReversed;
        this.reverseDirection = this.scrollDirection === settings.scrollDirection.horizontalReversed || this.scrollDirection === settings.scrollDirection.verticalReversed;
        this.direction = this.reverseDirection ? 1 : -1;
        this.withGaps = this.container.hasAttribute(attributes$2.withGaps);
        this.singleText = this.container.hasAttribute(attributes$2.singleText);
        this.image = this.container.querySelectorAll(selectors$3.image);
        this.text = this.container.querySelectorAll(selectors$3.text);
        this.textInner = this.container.querySelectorAll(selectors$3.textInner);
        this.images = this.container.querySelector(selectors$3.images);
        this.dot = this.container.querySelectorAll(selectors$3.dot);
        this.aside = this.container.querySelector(selectors$3.aside);
        this.inner = this.container.querySelector(selectors$3.inner);
        this.content = this.container.querySelector(selectors$3.content);
        this.wrapper = this.container.querySelector(selectors$3.wrapper);
        this.textHighlight = this.container.querySelectorAll(selectors$3.textHighlight);
        this.performAnimation = null;
        this.lastOffset = 0;
        this.activeIndex = 0;
        this.lastActiveIndex = this.activeIndex;

        if (!this.wrapper) return;

        this.onScrollCallback = () => this.onScroll();
        this.onResizeCallback = () => this.onResize();
        this.calculateImagesOffsetCallback = () => this.calculateImagesOffset();

        this.init();
      }

      init() {
        this.getTypeOfIntersecting();
        this.observeImagesIntersecting();

        this.calculateHeights();
        this.performAnimation = requestAnimationFrame(this.calculateImagesOffsetCallback);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => this.calculateHeights());
        });

        document.addEventListener('theme:scroll', this.onScrollCallback);
        document.addEventListener('theme:resize:width', this.onResizeCallback);

        this.syncDots();
      }

      getTypeOfIntersecting() {
        // Detect the maximum visibility of each image when intersecting with the viewport
        this.typeOfIntersecting = settings.typeOfIntersecting.maxVisibility;
        this.fractionOfViewport = this.image[0].offsetHeight / window.innerHeight;

        if (!this.verticalScroll || isMobile()) return;

        if (this.fractionOfViewport < 0.6) {
          // Detect when each image is in the middle of viewport
          this.typeOfIntersecting = settings.typeOfIntersecting.middleOfViewport;
        }
      }

      observeImagesIntersecting() {
        this.observersCollection = new Set();
        this.compareIntersectionRatio = [];
        this.maxVisibility = 0;

        this.observer = new IntersectionObserver(
          (entries, observer) => {
            entries.forEach((entry) => {
              const target = entry.target;
              const targetHeight = target.offsetHeight;
              const intersectionRatio = entry.intersectionRatio;
              const isIntersecting = entry.isIntersecting;
              const currentStats = {
                target: entry.target,
                intersectionRatio: entry.intersectionRatio,
              };
              const checkMaxVisibility = this.typeOfIntersecting === settings.typeOfIntersecting.maxVisibility;

              let intersectAt = settings.intersectionRatio;
              if (this.windowHeight <= targetHeight) {
                intersectAt = 0;
              }

              if (checkMaxVisibility && isIntersecting) {
                this.observersCollection.forEach((item) => {
                  if (item.target === entry.target) {
                    this.observersCollection.delete(item);
                  }
                });
                this.observersCollection.add(currentStats);
                this.compareIntersectionRatio = [...this.observersCollection].map((item) => item.intersectionRatio);
                this.maxVisibility = Math.max(...this.compareIntersectionRatio);
              }

              if (isIntersecting && intersectionRatio > intersectAt) {
                if (checkMaxVisibility && this.maxVisibility === intersectionRatio) {
                  this.maxVisibilityItem = [...this.observersCollection].find((item) => item.intersectionRatio === this.maxVisibility);
                  this.activeIndex = Number(this.maxVisibilityItem.target.dataset.index);

                  if (this.lastActiveIndex !== this.activeIndex) {
                    this.sync();
                    this.lastActiveIndex = this.activeIndex;
                  }
                }
              }
            });
          },
          {
            root: null,
            rootMargin: '0px',
            threshold: [0, 0.15, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.85, 1],
          }
        );

        this.image.forEach((image) => this.observer.observe(image));
      }

      onScroll() {
        if (!this.performAnimation) {
          this.performAnimation = requestAnimationFrame(this.calculateImagesOffsetCallback);
        }

        if (this.typeOfIntersecting === settings.typeOfIntersecting.middleOfViewport) {
          this.image.forEach((image) => this.checkImagePositionInViewport(image));
        }
      }

      removeAnimationFrame() {
        if (this.performAnimation) {
          cancelAnimationFrame(this.performAnimation);
          this.performAnimation = null;
        }
      }

      checkImagePositionInViewport(element) {
        if (!element) return;

        const windowHeight = window.innerHeight;
        const scrollTop = window.scrollY;
        const scrollMiddle = scrollTop + windowHeight / 2;
        const scrollBottom = scrollTop + windowHeight;
        const elementOffsetTopPoint = Math.round(element.getBoundingClientRect().top + scrollTop);
        const elementHeight = element.offsetHeight;
        const elementOffsetBottomPoint = elementOffsetTopPoint + elementHeight;
        const isBottomOfElementPassed = elementOffsetBottomPoint < scrollTop;
        const isTopOfElementReached = elementOffsetTopPoint < scrollBottom;
        const isInView = isTopOfElementReached && !isBottomOfElementPassed;

        if (!isInView) return;

        if (scrollMiddle > elementOffsetTopPoint && elementOffsetBottomPoint > scrollMiddle) {
          this.activeIndex = Number(element.dataset.index);

          if (this.lastActiveIndex !== this.activeIndex) {
            this.sync();
            this.lastActiveIndex = this.activeIndex;
          }
        }
      }

      calculateImagesOffset() {
        const asideTop = this.aside.getBoundingClientRect().top - this.headerHeight;
        const stickyStartingPoint = asideTop - this.innerStickyTop;
        let percent = 0;
        let offset = 0;
        // Either offset images as soon as viewport top reaches the top point of the section,
        // or start the offset at the point where the inner container, that's holding all of the images, gets sticky
        const triggerPoint = !this.hasShortImages ? asideTop : stickyStartingPoint;

        if (triggerPoint < 0) {
          percent = (triggerPoint / this.bottomEndingPoint) * -1 * 100;
        } else if (triggerPoint >= 0) {
          percent = 0;
        } else {
          percent = 100;
        }

        offset = percent > 100 ? 100 : percent;
        offset *= this.image.length - 1;

        if (isMobile() || this.horizontalScroll) {
          this.aside.style.setProperty('--translateX', `${Number(offset * this.direction).toFixed(2)}%`);
        }

        if (this.lastOffset !== offset) {
          this.performAnimation = requestAnimationFrame(this.calculateImagesOffsetCallback);
        } else if (this.performAnimation) {
          this.removeAnimationFrame();
        }

        this.lastOffset = offset;
      }

      calculateHeights() {
        let {stickyHeaderHeight, windowHeight} = readHeights();
        this.headerHeight = stickyHeaderHeight || 0;
        this.windowHeight = windowHeight || window.innerHeight;

        // Content height variables
        if (this.text.length > 0) {
          const contentPaddingTop = this.content ? parseInt(window.getComputedStyle(this.content).getPropertyValue('padding-top')) : 0;
          const contentPaddingBottom = this.content ? parseInt(window.getComputedStyle(this.content).getPropertyValue('padding-bottom')) : 0;
          const textElementsHeights = [...this.text].map((element) => element.offsetHeight + contentPaddingTop + contentPaddingBottom);
          const textInnerElementsHeights = [...this.textInner].map((element) => element.offsetHeight);
          const maxTextHeight = Math.max(...textElementsHeights);
          const maxTextInnerHeight = Math.max(...textInnerElementsHeights);
          const highestText = isMobile() ? maxTextInnerHeight : maxTextHeight;
          const textElementsHeightsSum = textElementsHeights.reduce((a, b) => a + b, 0);
          const averageTextHeight = Math.floor(textElementsHeightsSum / textElementsHeights.length) || this.text[0].offsetHeight;

          this.container.style.removeProperty('--average-text-height');
          this.container.style.setProperty('--average-text-height', `${averageTextHeight}px`);
          this.container.style.removeProperty('--highest-text');
          this.container.style.setProperty('--highest-text', `${highestText}px`);
        }

        // Images height variables
        this.imagesHeight = this.images.offsetHeight;
        this.hasShortImages = false;

        if (this.image.length > 0) {
          const imageWrapperElement = this.image[0].querySelector(selectors$3.imageWrapper);
          const videoWrapperElement = this.image[0].querySelector(selectors$3.videoWrapper);
          const wrapperElement = imageWrapperElement || videoWrapperElement;

          this.imgHeight = wrapperElement ? wrapperElement.offsetHeight : 0;
          this.imgPadding = parseInt(window.getComputedStyle(this.image[0]).getPropertyValue('padding-top'));

          this.container.style.removeProperty('--images-height');
          this.container.style.setProperty('--images-height', `${this.imagesHeight}px`);
          this.container.style.removeProperty('--img-height');
          this.container.style.setProperty('--img-height', `${this.imgHeight + 2 * this.imgPadding}px`);
        }

        // Variables used in `calculateImagesOffset()` method
        this.asideHeight = this.aside.offsetHeight;
        this.asidePadding = parseInt(window.getComputedStyle(this.aside).getPropertyValue('padding-top'));
        this.breathingSpace = (this.windowHeight - this.imagesHeight) / 2 / 2;
        this.innerStickyTop = parseInt(window.getComputedStyle(this.inner).getPropertyValue('top')) - this.headerHeight - this.breathingSpace;
        this.gutters = this.withGaps ? 2 * this.asidePadding : 0;
        this.additionalSpace = isMobile() ? (this.withGaps ? this.asidePadding + 10 : 10) : this.gutters;
        this.minHeightForEndingPoing = this.imagesHeight + this.additionalSpace;
        if (!isMobile() && this.horizontalScroll) {
          this.minHeightForEndingPoing = this.windowHeight - this.headerHeight;

          // Update trigger point for images offset whenever each image height takes up less than 60% of the screen height
          this.hasShortImages = this.fractionOfViewport <= 0.6;
          if (this.hasShortImages) {
            this.minHeightForEndingPoing = this.imagesHeight - this.innerStickyTop + this.breathingSpace * 3;
          }
        }
        this.bottomEndingPoint = this.asideHeight - this.minHeightForEndingPoing;
      }

      refreshImagesOffsetValues() {
        // Double `requestAnimationFrame()` methods are used to make sure `calculateHeights()` gets executed first
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            document.dispatchEvent(new CustomEvent('theme:scroll'));
          });
        });
      }

      onResize() {
        this.calculateHeights();
        // Envoke `calculateHeights()` twice due to Theme editor issues
        requestAnimationFrame(() => this.calculateHeights());
        this.getTypeOfIntersecting();
        this.refreshImagesOffsetValues();
      }

      sync() {
        const textsToSync = !this.singleText ? this.text : [];

        [...this.image, ...textsToSync, ...this.dot].forEach((element) => {
          const elementIndex = Number(element.getAttribute(attributes$2.index));
          element.classList.toggle(classes$3.isActive, elementIndex === Number(this.activeIndex));
        });

        this.textHighlight.forEach((highlight) => highlight.shouldAnimate());
      }

      syncDots() {
        this.dot.forEach((element) => {
          element.addEventListener('click', (event) => {
            event.preventDefault();
            this.scrollTo(this.image[Number(event.target.dataset.index)]);
          });
        });
      }

      scrollTo(target, timeout = 0) {
        if (!target) return;

        const activeIndex = Number(target.dataset.index);
        const targetOffsetTop = Math.round(target.getBoundingClientRect().top + window.scrollY);
        const targetHeight = target.offsetHeight;
        const containerTop = Math.round(this.wrapper.getBoundingClientRect().top + window.scrollY);
        const asideTop = this.aside.getBoundingClientRect().top - this.headerHeight;
        const imagesHeight = this.images.offsetHeight;
        const scrollOffset = containerTop + imagesHeight * activeIndex;
        const imageFitsInVh = Boolean((this.image[0].offsetHeight + this.gutters) / (window.innerHeight - this.headerHeight) >= 1);

        // Horizontal layouts with images (+ top/bottom gaps) >= viewport height, Desktop
        let distance = scrollOffset - this.headerHeight;

        // Horizontal + Vertical layouts, Mobile
        if (isMobile()) {
          const triggerPoint = asideTop + window.scrollY;
          distance = triggerPoint + (this.bottomEndingPoint / (this.image.length - 1)) * activeIndex;
        }

        // Horizontal layouts with images (+ top/bottom gaps) < viewport height, Desktop
        if (this.horizontalScroll && isDesktop() && !imageFitsInVh) {
          const stickyStartingPoint = asideTop - this.innerStickyTop;
          const triggerPoint = !this.hasShortImages ? asideTop + window.scrollY : stickyStartingPoint + window.scrollY;

          distance = triggerPoint + (this.bottomEndingPoint / (this.image.length - 1)) * activeIndex;
        }

        // Vertical layouts, Desktop
        if (this.verticalScroll && isDesktop()) {
          // with images taking up more than 60% of the viewport height
          distance = targetOffsetTop - this.headerHeight;

          // with images taking up less than 60% of the viewport height
          if (this.typeOfIntersecting === settings.typeOfIntersecting.middleOfViewport) {
            distance = targetOffsetTop - window.innerHeight / 2 + targetHeight / 2 - this.headerHeight;
          }
        }

        const scrollOptions = {
          top: distance,
          left: 0,
          behavior: 'smooth',
        };

        timeout > 0 ? setTimeout(() => window.scrollTo(scrollOptions), timeout) : window.scrollTo(scrollOptions);
      }

      /**
       * Event callback for Theme Editor `shopify:section:unload` event
       */
      onUnload() {
        this.image.forEach((image) => this.observer.unobserve(image));

        document.removeEventListener('theme:scroll', this.onScrollCallback);
        document.removeEventListener('theme:resize:width', this.onResizeCallback);
      }

      /**
       * Event callback for Theme Editor `shopify:block:select` event
       */
      onBlockSelect(event) {
        this.scrollTo(event.target, 500);
      }
    }

    const stickyImagesAndText = {
      onLoad() {
        sections$2[this.id] = new StickyImagesAndText(this);
      },
      onUnload() {
        sections$2[this.id].onUnload();
      },
      onBlockSelect(event) {
        sections$2[this.id].onBlockSelect(event);
      },
    };

    register('sticky-images-and-text', [stickyImagesAndText, videoPlay]);

    register('subcollections', gridSlider);

    register('tab-collections', [productGrid, gridSlider, tabs]);

    const sections$1 = {};

    const selectors$2 = {
      slider: '[data-slider]',
      item: '[data-item]',
      links: 'a, button',
      button: '.flickity-button',
    };

    const classes$2 = {
      flickityEnabled: 'flickity-enabled',
      hasArrows: 'has-arrows',
      carouselResize: 'carousel--resize',
      buttonHolder: 'flickity-button-holder',
      isSelected: 'is-selected',
    };

    const attributes$1 = {
      sectionId: 'data-section-id',
      tabIndex: 'tabindex',
    };

    class Testimonials {
      constructor(section) {
        this.container = section.container;
        this.sectionId = this.container.getAttribute(attributes$1.sectionId);
        this.slider = this.container.querySelector(selectors$2.slider);
        this.alignment = this.slider.dataset.sliderAlignment;

        if (!this.slider) return;

        this.slides = this.slider.querySelectorAll(selectors$2.item);
        this.flkty = null;
        this.onResizeCallback = () => this.onResize();

        this.init();
      }

      init() {
        this.checkSlideCount();
        this.listen();
      }

      onResize() {
        this.checkSlideCount();
        if (this.flkty !== null) {
          this.flkty.resize();

          if (this.flkty.size.width >= this.flkty.slideableWidth) this.destroySlider();
        }
      }

      checkSlideCount() {
        // Destroy slider if there are 3 slides on desktop or 2 on tablet
        const slidesCount = this.slides.length;
        const twoSlidesOnTablet = Boolean(slidesCount == 2 && window.innerWidth >= theme.sizes.small);
        const singleSlide = Boolean(slidesCount == 1);

        if (twoSlidesOnTablet || singleSlide) {
          this.destroySlider();
          return;
        }

        if (!this.flkty) {
          this.initSlider();
          this.onResize();
          return;
        }

        if (this.flkty) {
          if (!this.flkty.isActive) this.initSlider();

          // Destroy slider if slidable container is smaller than the slider's container width
          this.flkty.slideableWidth > this.flkty.size.width ? this.initSlider() : this.destroySlider();
        }
      }

      initSlider() {
        this.flkty = new Flickity(this.slider, {
          cellSelector: selectors$2.item,
          prevNextButtons: true,
          pageDots: true,
          groupCells: true,
          cellAlign: this.alignment,
          contain: true,
          adaptiveHeight: false,
          on: {
            ready: () => {
              this.slidesTabIndex();
              requestAnimationFrame(() => {
                this.slider.querySelectorAll(selectors$2.button).forEach((button) => {
                  wrap(button, classes$2.buttonHolder);
                });
              });
            },
            change: () => {
              this.slidesTabIndex();
            },
          },
        });

        if (!isMobile()) {
          this.container.classList.add(classes$2.hasArrows);
        } else {
          this.container.classList.remove(classes$2.hasArrows);
        }
        this.createResizeClass();
      }

      createResizeClass() {
        if (typeof Flickity.prototype._createResizeClass === 'function') return;

        Flickity.prototype._createResizeClass = function () {
          this.element.classList.add(classes$2.carouselResize);
        };

        Flickity.createMethods.push('_createResizeClass');

        const resize = Flickity.prototype.resize;
        Flickity.prototype.resize = function () {
          this.element.classList.remove(classes$2.carouselResize);
          resize.call(this);
          this.element.classList.add(classes$2.carouselResize);
        };
      }

      slidesTabIndex() {
        const slider = Flickity.data(this.slider);

        slider.cells.forEach((slide) => {
          let tabIndex = '-1';
          if (slide.element.classList.contains(classes$2.isSelected)) {
            tabIndex = '0';
          }

          slide.element.querySelectorAll(selectors$2.links).forEach((link) => {
            link.setAttribute(attributes$1.tabIndex, tabIndex);
          });
        });
      }

      destroySlider() {
        if (!this.slider.classList.contains(classes$2.flickityEnabled)) return;

        if (this.flkty !== null) {
          // Revert 'flickity-button' elements to their original positions for proper slider destruction
          this.slider.querySelectorAll(selectors$2.button)?.forEach((button) => {
            const parent = button.parentNode;
            if (parent && parent.classList.contains(classes$2.buttonHolder)) {
              parent.parentNode.insertBefore(button, parent);
              parent.parentNode.removeChild(parent);
            }
          });

          this.flkty.destroy();
        }

        this.container.classList.remove(classes$2.hasArrows);
      }

      listen() {
        document.addEventListener('theme:resize:width', this.onResizeCallback);
      }

      onBlockSelect(evt) {
        if (this.flkty !== null && this.flkty.isActive) {
          const index = parseInt([...evt.target.parentNode.children].indexOf(evt.target));
          const slidesPerPage = parseInt(this.flkty.slides[0].cells.length);
          const groupIndex = Math.floor(index / slidesPerPage);

          const onTransitionEnd = () => {
            requestAnimationFrame(() => {

              this.flkty.select(groupIndex);
            });

            this.flkty.element.removeEventListener('transitionend', onTransitionEnd);
          };

          this.flkty.element.addEventListener('transitionend', onTransitionEnd);
        }
      }

      onUnload() {
        document.removeEventListener('theme:resize:width', this.onResizeCallback);
      }
    }

    const TestimonialsSection = {
      onLoad() {
        sections$1[this.id] = new Testimonials(this);
      },
      onUnload(e) {
        sections$1[this.id].onUnload(e);
      },
      onBlockSelect(e) {
        sections$1[this.id].onBlockSelect(e);
      },
    };

    register('testimonials', TestimonialsSection);

    const selectors$1 = {
      imageWrapper: '[data-hero-scrolling]',
      titleWrapper: '[data-banner-title]',
      lazyImage: '.lazy-image',
      parallax: '[data-parallax="zoom-on-scroll"],[data-parallax="card-scrolling"],[data-parallax="zoom-on-scroll,card-scrolling"]',
      textRevealCropper: '.text-reveal__cropper',
      aos: '[data-aos]',
      frame: '[data-ticker-frame]',
      slide: '[data-slide]',
      tickerScale: '[data-ticker-scale]',
      tickerText: '[data-ticker-text]',
      shopifyEditorBlock: 'data-shopify-editor-block',
    };

    const classes$1 = {
      bannerNoCachedImages: 'banner--no-cached-images',
      bannerImgLoaded: 'banner--img-loaded',
      imgIn: 'img-in',
      overflowHidden: 'overflow-hidden',
      textHighlightWrapper: 'text-highlight-wrapper',
      tickerAnimated: 'ticker--animated',
    };

    const attributes = {
      stop: 'data-stop',
      style: 'style',
    };

    const sections = {};

    class HeroScrolling {
      constructor(section) {
        this.container = section.container;
        this.title = this.container.querySelector(selectors$1.titleWrapper);
        this.parallax = null;
        this.tickers = [];

        this.init();
      }

      init() {
        this.handleImageAnimation(true);
        this.initTickers(true);
        this.tickerAnimationPause();

        if (this.container.matches(selectors$1.parallax)) {
          this.parallax = new ParallaxElement(this.container);
        }

        if (this.title && !this.title.classList.contains(classes$1.textHighlightWrapper)) {
          const animatedTitle = this.title.querySelector(selectors$1.aos);

          if (!animatedTitle) return;

          const textRevealCropper = animatedTitle.closest(selectors$1.textRevealCropper);
          textRevealCropper?.classList.add(classes$1.overflowHidden);
          waitForAnimationEnd(animatedTitle).then(() => {
            textRevealCropper?.classList.remove(classes$1.overflowHidden);
          });
        }
      }

      /**
       * Initializes ticker components within the hero banner
       *
       * This method finds all ticker frames in the container and creates a new Ticker instance for each one.
       * Each ticker is responsible for creating a continuous scrolling text effect.
       *
       * @param {boolean} stopClone - When true, prevents the ticker from cloning elements for infinite scrolling
       *                              and instead creates multiple clones for a static display
       */
      initTickers(stopClone = false) {
        const frames = this.container.querySelectorAll(selectors$1.frame);

        frames.forEach((element) => {
          const ticker = new Ticker(element, stopClone);
          this.tickers.push(ticker);
        });
      }

      /**
       * Toggles the ticker animation state in the Shopify editor
       *
       * This method handles the animation state of scrolling text blocks when they are
       * selected or deselected in the Shopify editor. It positions the text at the
       * appropriate offset when stopped and restores animation when resumed.
       *
       * @param {Event} e - The event object from the Shopify editor
       * @param {boolean} isStopped - Whether the ticker should be stopped (true) or resumed (false)
       */
      toggleTicker(e, isStopped) {
        const blockType = e.target.blockData.type;
        if (blockType !== 'scrolling_text') return;

        const tickerScale = e.target.closest(selectors$1.tickerScale);
        const element = tickerScale.querySelector(`[${selectors$1.shopifyEditorBlock}*="${e.target.blockData.id}"]`);

        if (isStopped && element) {
          tickerScale.setAttribute(attributes.stop, '');
          tickerScale.querySelectorAll(selectors$1.tickerText).forEach((textHolder) => {
            textHolder.classList.remove(classes$1.tickerAnimated);

            textHolder.style.transform = `translate3d(${-element.offsetLeft}px, 0, 0)`;
          });
        }

        if (!isStopped && element) {
          tickerScale.querySelectorAll(selectors$1.tickerText).forEach((textHolder) => {
            textHolder.classList.add(classes$1.tickerAnimated);
            textHolder.removeAttribute(attributes.style);
          });
          tickerScale.removeAttribute(attributes.stop);

          if (this.static) {
            document.dispatchEvent(new CustomEvent('theme:resize:width', {bubbles: true}));
          }
        }
      }

      onBlockSelect(evt) {
        this.toggleTicker(evt, true);
      }

      onBlockDeselect(evt) {
        this.toggleTicker(evt, false);
      }

      /**
       * Handles image animation that would be triggered on page load
       *
       * This method manages the animation sequence for hero images:
       * - Uses a fallback class modifier for Banner image section with no cached hero images
       * - Resets the default banner CSS animation so it won't be executed when `.img-in` class is added when `img.complete` is detected
       * - Gets the `.lazy-image` container and listens for `transitionend` event of its `<img>` child element
       * - Adds a class modifier after `<img>` transition has completed, when shimmer effect has been removed, that triggers the hero image animation
       * - Removes classes on Theme Editor `shopify:section:unload` and `shopify:section:reorder` events
       *
       * @param {boolean} onLoad - Whether this is being called during initial load (true) or cleanup (false)
       */
      handleImageAnimation(onLoad = false) {
        if (!onLoad) {
          this.container.classList.remove(classes$1.bannerNoCachedImages);
          this.container.classList.remove(classes$1.bannerImgLoaded);
          return;
        }

        const imageWrapper = this.container.querySelector(selectors$1.imageWrapper);
        const img = imageWrapper.querySelectorAll(selectors$1.lazyImage);
        const imgComplete = this.container.classList.contains(classes$1.imgIn);

        if (img.length && !imgComplete) {
          this.container.classList.add(classes$1.bannerNoCachedImages);

          const onImageTransitionEnd = (event) => {
            requestAnimationFrame(() => this.container.classList.add(classes$1.bannerImgLoaded));
            img[0].removeEventListener('transitionend', onImageTransitionEnd);
          };

          img[0].addEventListener('transitionend', onImageTransitionEnd);
        }
      }

      /**
       * Handles section reordering in the Shopify editor
       *
       * Resets image animation classes when the section is reordered.
       */
      onReorder() {
        this.handleImageAnimation(false);
      }

      /**
       * Cleans up resources when the section is unloaded
       *
       * Removes animation classes, unloads parallax effects if present,
       * and properly disposes of all ticker instances.
       */
      onUnload() {
        this.handleImageAnimation(false);

        if (this.parallax) {
          this.parallax.unload();
          this.parallax = null;
        }

        if (this.tickers.length > 0) {
          this.tickers.forEach((ticker) => {
            ticker.unload();
          });
        }
      }

      /**
       * Pauses ticker animation on hover after a short delay
       *
       * This method adds event listeners to pause the ticker animation when
       * the user hovers over it (after a 500ms delay) and resume animation
       * when the mouse leaves the ticker area.
       */
      tickerAnimationPause() {
        let hoverTimer = 0;
        let isHovered = false;
        const tickerContainer = this.container.querySelector(selectors$1.frame);

        if (!tickerContainer) return;

        tickerContainer.addEventListener('mouseenter', () => {
          isHovered = true;

          hoverTimer = setTimeout(() => {
            if (isHovered) {
              tickerContainer.querySelectorAll(selectors$1.tickerText).forEach((element) => {
                element.style.animationPlayState = 'paused';
              });
            }

            clearTimeout(hoverTimer);
          }, 500);
        });

        tickerContainer.addEventListener('mouseleave', () => {
          isHovered = false;

          tickerContainer.querySelectorAll(selectors$1.tickerText).forEach((element) => {
            element.style.animationPlayState = 'running';
          });
        });
      }
    }

    const heroScrolling = {
      onLoad() {
        sections[this.id] = new HeroScrolling(this);
      },
      onBlockSelect(e) {
        sections[this.id].onBlockSelect(e);
      },
      onBlockDeselect(e) {
        sections[this.id].onBlockDeselect(e);
      },
      onReorder(e) {
        sections[this.id].onReorder(e);
      },
      onUnload(e) {
        sections[this.id].onUnload(e);
      },
    };

    register('hero-scrolling', [heroScrolling, videoPlay]);

    const classes = {
      noOutline: 'no-outline',
    };

    const selectors = {
      inPageLink: '[data-skip-content]',
      linkesWithOnlyHash: 'a[href="#"]',
    };

    class Accessibility {
      constructor() {
        this.init();
      }

      init() {
        // this.a11y = a11y;

        // DOM Elements
        this.body = document.body;
        this.inPageLink = document.querySelector(selectors.inPageLink);
        this.linkesWithOnlyHash = document.querySelectorAll(selectors.linkesWithOnlyHash);

        // Flags
        this.isFocused = false;

        // A11Y init methods
        this.focusHash();
        this.bindInPageLinks();

        // Events
        this.clickEvents();
        this.focusEvents();
        this.focusEventsOff();
      }

      /**
       * Clicked events accessibility
       *
       * @return  {Void}
       */

      clickEvents() {
        if (this.inPageLink) {
          this.inPageLink.addEventListener('click', (event) => {
            event.preventDefault();
          });
        }

        if (this.linkesWithOnlyHash) {
          this.linkesWithOnlyHash.forEach((item) => {
            item.addEventListener('click', (event) => {
              event.preventDefault();
            });
          });
        }
      }

      /**
       * Focus events
       *
       * @return  {Void}
       */

      focusEvents() {
        document.addEventListener('keyup', (event) => {
          if (event.code !== theme.keyboardKeys.TAB) {
            return;
          }

          this.body.classList.remove(classes.noOutline);
          this.isFocused = true;
        });
      }

      /**
       * Focus events off
       *
       * @return  {Void}
       */

      focusEventsOff() {
        document.addEventListener('mousedown', () => {
          this.body.classList.add(classes.noOutline);
          this.isFocused = false;
        });
      }

      /**
       * Moves focus to an HTML element
       * eg for In-page links, after scroll, focus shifts to content area so that
       * next `tab` is where user expects. Used in bindInPageLinks()
       * eg move focus to a modal that is opened. Used in trapFocus()
       *
       * @param {Element} container - Container DOM element to trap focus inside of
       * @param {Object} options - Settings unique to your theme
       * @param {string} options.className - Class name to apply to element on focus.
       */

      forceFocus(element, options) {
        options = options || {};

        var savedTabIndex = element.tabIndex;

        element.tabIndex = -1;
        element.dataset.tabIndex = savedTabIndex;
        element.focus();
        if (typeof options.className !== 'undefined') {
          element.classList.add(options.className);
        }
        element.addEventListener('blur', callback);

        function callback(event) {
          event.target.removeEventListener(event.type, callback);

          element.tabIndex = savedTabIndex;
          delete element.dataset.tabIndex;
          if (typeof options.className !== 'undefined') {
            element.classList.remove(options.className);
          }
        }
      }

      /**
       * If there's a hash in the url, focus the appropriate element
       * This compensates for older browsers that do not move keyboard focus to anchor links.
       * Recommendation: To be called once the page in loaded.
       *
       * @param {Object} options - Settings unique to your theme
       * @param {string} options.className - Class name to apply to element on focus.
       * @param {string} options.ignore - Selector for elements to not include.
       */

      focusHash(options) {
        options = options || {};
        let hash = window.location.hash;

        if (typeof theme.settings.newHash !== 'undefined') {
          hash = theme.settings.newHash;
          window.location.hash = `#${hash}`;
        }
        const element = document.getElementById(hash.slice(1));

        // if we are to ignore this element, early return
        if (element && options.ignore && element.matches(options.ignore)) {
          return false;
        }

        if (hash && element) {
          this.forceFocus(element, options);
        }
      }

      /**
       * When an in-page (url w/hash) link is clicked, focus the appropriate element
       * This compensates for older browsers that do not move keyboard focus to anchor links.
       * Recommendation: To be called once the page in loaded.
       *
       * @param {Object} options - Settings unique to your theme
       * @param {string} options.className - Class name to apply to element on focus.
       * @param {string} options.ignore - CSS selector for elements to not include.
       */

      bindInPageLinks(options) {
        options = options || {};
        const links = Array.prototype.slice.call(document.querySelectorAll('a[href^="#"]'));

        function queryCheck(selector) {
          return document.getElementById(selector) !== null;
        }

        return links.filter((link) => {
          if (link.hash === '#' || link.hash === '') {
            return false;
          }

          if (options.ignore && link.matches(options.ignore)) {
            return false;
          }

          if (!queryCheck(link.hash.substr(1))) {
            return false;
          }

          var element = document.querySelector(link.hash);

          if (!element) {
            return false;
          }

          link.addEventListener('click', () => {
            this.forceFocus(element, options);
          });

          return true;
        });
      }
    }

    const getScrollbarWidth = () => {
      // Creating invisible container
      const outer = document.createElement('div');
      outer.style.visibility = 'hidden';
      outer.style.overflow = 'scroll'; // forcing scrollbar to appear
      outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps
      document.body.appendChild(outer);

      // Creating inner element and placing it in the container
      const inner = document.createElement('div');
      outer.appendChild(inner);

      // Calculating difference between container's full width and the child width
      const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

      // Removing temporary elements from the DOM
      outer.parentNode.removeChild(outer);

      return scrollbarWidth;
    };

    document.documentElement.style.setProperty('--scrollbar-width', `${getScrollbarWidth()}px`);

    document.addEventListener('DOMContentLoaded', function () {
      // Load all registered sections on the page.
      load('*');

      new Accessibility();

      if (!customElements.get('product-grid-item-swatch') && window.theme.settings.colorSwatchesType != 'disabled') {
        customElements.define('product-grid-item-swatch', GridSwatch);
      }

      // Safari smoothscroll polyfill
      const hasNativeSmoothScroll = 'scrollBehavior' in document.documentElement.style;

      if (!hasNativeSmoothScroll) {
        loadScript({url: theme.assets.smoothscroll});
      }
    });

})(themeVendor.ScrollLock, themeVendor.Flickity, themeVendor.themeCurrency, themeVendor.ajaxinate);
