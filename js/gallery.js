/**
 * Barbershop - Gallery Lightbox
 * Full-screen image gallery with keyboard navigation, swipe support, and category filtering
 */

(function() {
  'use strict';

  // ===== Gallery State =====
  const state = {
    items: [],
    filteredItems: [],
    currentIndex: 0,
    isOpen: false,
    touchStartX: 0,
    touchEndX: 0
  };

  // ===== DOM Elements =====
  const elements = {
    grid: null,
    items: [],
    filterBtns: [],
    lightbox: null,
    lightboxImage: null,
    lightboxClose: null,
    lightboxPrev: null,
    lightboxNext: null,
    lightboxCounter: null
  };

  // ===== Utility =====
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  const throttle = (fn, delay) => {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= delay) {
        last = now;
        fn(...args);
      }
    };
  };

  // ===== Initialize DOM References =====
  const cacheElements = () => {
    elements.grid = $('.gallery__grid');
    elements.items = $$('.gallery-item', elements.grid);
    elements.filterBtns = $$('.gallery__filter-btn');
    elements.lightbox = $('#lightbox');
    elements.lightboxImage = $('#lightboxImage');
    elements.lightboxClose = $('#lightboxClose');
    elements.lightboxPrev = $('#lightboxPrev');
    elements.lightboxNext = $('#lightboxNext');
    elements.lightboxCounter = $('#lightboxCounter');
  };

  // ===== Build Items Array =====
  const buildItemsArray = () => {
    state.items = elements.items.map((item, index) => ({
      element: item,
      image: item.querySelector('.gallery-item__image'),
      category: item.dataset.category,
      title: item.querySelector('.gallery-item__title')?.textContent || '',
      categoryLabel: item.querySelector('.gallery-item__category')?.textContent || '',
      index
    }));
    state.filteredItems = [...state.items];
  };

  // ===== Category Filtering =====
  const initFilter = () => {
    elements.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        // Update active button
        elements.filterBtns.forEach(b => {
          b.classList.toggle('gallery__filter-btn--active', b === btn);
          b.setAttribute('aria-selected', b === btn);
        });

        // Filter items with animation
        filterItems(filter);
      });
    });
  };

  const filterItems = (category) => {
    const items = elements.items;

    items.forEach((item, index) => {
      const itemCategory = item.dataset.category;
      const matches = category === 'all' || itemCategory === category;

      if (matches) {
        item.style.display = '';
        // Staggered entrance
        requestAnimationFrame(() => {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
          requestAnimationFrame(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          });
        });
        item.style.transitionDelay = `${index * 50}ms`;
      } else {
        item.style.opacity = '0';
        item.style.transform = 'scale(0.95)';
        setTimeout(() => {
          if (!matches) item.style.display = 'none';
        }, 300);
      }
    });

    // Update filtered items for lightbox
    state.filteredItems = state.items.filter(item =>
      category === 'all' || item.category === category
    );
  };

  // ===== Lightbox =====
  const openLightbox = (index) => {
    state.currentIndex = state.filteredItems.findIndex(item => item.index === index);
    if (state.currentIndex === -1) state.currentIndex = 0;

    state.isOpen = true;
    elements.lightbox.hidden = false;

    // Force reflow for animation
    requestAnimationFrame(() => {
      elements.lightbox.classList.add('lightbox--open');
    });

    updateLightboxImage();
    updateCounter();
    lockBodyScroll();
    trapFocus();
  };

  const closeLightbox = () => {
    state.isOpen = false;
    elements.lightbox.classList.remove('lightbox--open');

    setTimeout(() => {
      elements.lightbox.hidden = true;
      unlockBodyScroll();
    }, 300);
  };

  const updateLightboxImage = () => {
    const item = state.filteredItems[state.currentIndex];
    if (!item) return;

    elements.lightboxImage.src = item.image.src;
    elements.lightboxImage.alt = item.title;
  };

  const updateCounter = () => {
    if (elements.lightboxCounter) {
      elements.lightboxCounter.textContent = `${state.currentIndex + 1} / ${state.filteredItems.length}`;
    }
  };

  const navigateLightbox = (direction) => {
    if (!state.isOpen) return;

    state.currentIndex = (state.currentIndex + direction + state.filteredItems.length) % state.filteredItems.length;
    updateLightboxImage();
    updateCounter();
  };

  // ===== Keyboard Navigation =====
  const handleKeydown = (e) => {
    if (!state.isOpen) return;

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        navigateLightbox(-1);
        break;
      case 'ArrowRight':
        navigateLightbox(1);
        break;
      case 'Tab':
        trapFocus(e);
        break;
    }
  };

  // ===== Focus Trap =====
  let lastFocusedElement = null;

  const trapFocus = (e) => {
    const focusableElements = elements.lightbox.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  // ===== Touch/Swipe Support =====
  const handleTouchStart = (e) => {
    state.touchStartX = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e) => {
    state.touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const threshold = 50;
    const diff = state.touchStartX - state.touchEndX;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        navigateLightbox(1); // Swipe left = next
      } else {
        navigateLightbox(-1); // Swipe right = previous
      }
    }
  };

  // ===== Body Scroll Lock =====
  const lockBodyScroll = () => {
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.dataset.scrollY = scrollY;
  };

  const unlockBodyScroll = () => {
    const scrollY = parseInt(document.body.dataset.scrollY || '0', 10);
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);
    delete document.body.dataset.scrollY;
  };

  // ===== Event Listeners =====
  const bindEvents = () => {
    // Gallery item click
    elements.items.forEach((item, index) => {
      item.addEventListener('click', () => openLightbox(index));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(index);
        }
      });
    });

    // Lightbox controls
    elements.lightboxClose.addEventListener('click', closeLightbox);
    elements.lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    elements.lightboxNext.addEventListener('click', () => navigateLightbox(1));

    // Click outside image to close
    elements.lightbox.addEventListener('click', (e) => {
      if (e.target === elements.lightbox) {
        closeLightbox();
      }
    });

    // Keyboard
    document.addEventListener('keydown', handleKeydown);

    // Touch
    elements.lightbox.addEventListener('touchstart', handleTouchStart, { passive: true });
    elements.lightbox.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Filter
    initFilter();
  };

  // ===== Initialize =====
  const init = () => {
    cacheElements();

    if (!elements.grid || !elements.items.length) return;

    buildItemsArray();
    bindEvents();
  };

  // Run on DOM ready
  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();