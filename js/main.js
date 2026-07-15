/**
 * Barbershop - Main JavaScript
 * Core functionality: mobile nav, smooth scroll, scroll animations, header effects
 */

(function() {
  'use strict';

  // ===== DOM Ready =====
  const ready = (fn) => {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  };

  // ===== Utility Functions =====
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

  const debounce = (fn, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };

  // ===== Mobile Navigation =====
  const initMobileNav = () => {
    const navToggle = $('#navToggle');
    const nav = $('#nav');
    const navLinks = $$('.nav__link', nav);

    if (!navToggle || !nav) return;

    const closeNav = () => {
      nav.classList.remove('nav--open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    };

    const openNav = () => {
      nav.classList.add('nav--open');
      navToggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    };

    navToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = nav.classList.contains('nav--open');
      isOpen ? closeNav() : openNav();
    });

    // Close on link click
    navLinks.forEach(link => {
      link.addEventListener('click', closeNav);
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
        closeNav();
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (nav.classList.contains('nav--open') &&
          !nav.contains(e.target) &&
          !navToggle.contains(e.target)) {
        closeNav();
      }
    });
  };

  // ===== Header Scroll Effect =====
  const initHeaderScroll = () => {
    const header = $('#header');
    if (!header) return;

    const handleScroll = throttle(() => {
      if (window.scrollY > 50) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
  };

  // ===== Smooth Scroll =====
  const initSmoothScroll = () => {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const header = $('#header');
      const headerHeight = header ? header.offsetHeight : 0;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });

      // Update URL without scroll
      history.pushState(null, '', href);
    });
  };

  // ===== Scroll Reveal Animations =====
  const initScrollReveal = () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      $$('.reveal').forEach(el => el.classList.add('reveal--visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    $$('.reveal').forEach(el => observer.observe(el));
  };

  // ===== Active Nav Link on Scroll =====
  const initActiveNavLink = () => {
    const sections = $$('section[id]');
    const navLinks = $$('.nav__link');

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('nav__link--active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '-80px 0px -60% 0px'
    });

    sections.forEach(section => observer.observe(section));
  };

  // ===== Services Category Filter =====
  const initServicesFilter = () => {
    const categoryBtns = $$('.services__category-btn');
    const serviceCards = $$('.service-card');

    if (!categoryBtns.length || !serviceCards.length) return;

    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.category;

        // Update active button
        categoryBtns.forEach(b => {
          b.classList.toggle('services__category-btn--active', b === btn);
          b.setAttribute('aria-selected', b === btn);
        });

        // Filter cards with animation
        serviceCards.forEach((card, index) => {
          const matches = category === 'all' || card.dataset.category === category;

          if (matches) {
            card.style.display = '';
            // Stagger animation
            requestAnimationFrame(() => {
              card.style.opacity = '0';
              card.style.transform = 'translateY(20px)';
              card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
              requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
              });
            });
            // Stagger delay
            card.style.transitionDelay = `${index * 50}ms`;
          } else {
            card.style.opacity = '0';
            card.style.transform = 'translateY(-20px)';
            setTimeout(() => {
              if (!matches) card.style.display = 'none';
            }, 300);
          }
        });
      });
    });
  };

  // ===== Contact Form =====
  const initContactForm = () => {
    const form = $('.contact__form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = $('.contact__form-submit', form);
      const originalText = submitBtn.textContent;

      // Basic validation
      const requiredFields = $$('[required]', form);
      let isValid = true;

      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          field.style.borderColor = 'var(--error)';
          isValid = false;
        } else {
          field.style.borderColor = '';
        }
      });

      if (!isValid) return;

      // Simulate submission
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      setTimeout(() => {
        submitBtn.textContent = 'Request Sent!';
        submitBtn.classList.remove('btn--primary');
        submitBtn.classList.add('btn--gold');

        setTimeout(() => {
          form.reset();
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          submitBtn.classList.remove('btn--gold');
          submitBtn.classList.add('btn--primary');
        }, 3000);
      }, 1500);
    });

    // Clear error on input
    $$('.contact__form-input, .contact__form-select, .contact__form-textarea', form).forEach(field => {
      field.addEventListener('input', () => {
        field.style.borderColor = '';
      });
    });
  };

  // ===== Parallax Hero Background =====
  const initHeroParallax = () => {
    const heroBg = $('.hero__bg-image');
    if (!heroBg) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleScroll = throttle(() => {
      const scrolled = window.scrollY;
      const rate = scrolled * 0.3;
      heroBg.style.transform = `translateY(${rate}px)`;
    }, 50);

    window.addEventListener('scroll', handleScroll, { passive: true });
  };

  // ===== Set min date for contact form =====
  const initDateMin = () => {
    const dateInput = $('#date');
    if (dateInput) {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      dateInput.min = tomorrow.toISOString().split('T')[0];
    }
  };

  // ===== Initialize All =====
  const init = () => {
    initMobileNav();
    initHeaderScroll();
    initSmoothScroll();
    initScrollReveal();
    initActiveNavLink();
    initServicesFilter();
    initContactForm();
    initHeroParallax();
    initDateMin();

    // Trigger initial reveal check
    setTimeout(() => {
      window.dispatchEvent(new Event('scroll'));
    }, 100);
  };

  ready(init);
})();