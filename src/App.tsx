/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import pagesDataRaw from './data/pagesData.json';

interface PageEntry {
  title: string;
  styles: string[];
  bodyHtml: string;
}

const pagesData = pagesDataRaw as Record<string, PageEntry>;

declare global {
  interface Window {
    Swiper?: any;
    AOS?: any;
    lightGallery?: any;
    lgZoom?: any;
    FullCalendar?: any;
  }
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  const cleaned = pathname.replace(/\/+$/, '');
  if (pagesData[cleaned]) return cleaned;
  return '/';
}

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() =>
    normalizePath(window.location.pathname)
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const page = pagesData[currentRoute] || pagesData['/'];

  // Listen to browser back/forward navigation
  useEffect(() => {
    const onPopState = () => {
      setCurrentRoute(normalizePath(window.location.pathname));
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Re-initialize original GPLC page scripts, carousels, animations, calendar, and interactive controls
  useEffect(() => {
    document.title = page.title;

    const root = containerRef.current;
    if (!root) return;

    const cleanups: Array<() => void> = [];

    // 1. AOS Animations
    if (window.AOS) {
      window.AOS.init({
        once: true,
        duration: 680,
        offset: 60,
        easing: 'ease-out-cubic',
      });
      setTimeout(() => {
        window.AOS?.refresh();
      }, 100);
    }

    // 2. Hero MainSwiper
    if (window.Swiper && root.querySelector('.MainSwiper')) {
      const heroSwiper = new window.Swiper(root.querySelector('.MainSwiper'), {
        loop: true,
        effect: 'fade',
        speed: 900,
        autoplay: { delay: 5500, disableOnInteraction: false },
        pagination: {
          el: root.querySelector('.hero-pagination'),
          clickable: true,
        },
      });
      cleanups.push(() => heroSwiper?.destroy?.(true, true));
    }

    // 3. Testimonial Swiper
    if (window.Swiper && root.querySelector('.testiSwiper')) {
      const testiSwiper = new window.Swiper(root.querySelector('.testiSwiper'), {
        loop: true,
        spaceBetween: 24,
        breakpoints: {
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        },
        autoplay: { delay: 4500 },
        pagination: {
          el: root.querySelector('.testi-pag'),
          clickable: true,
        },
      });
      cleanups.push(() => testiSwiper?.destroy?.(true, true));
    }

    // 4. Event Swiper
    if (window.Swiper && root.querySelector('.EventSwiper')) {
      const eventSwiper = new window.Swiper(root.querySelector('.EventSwiper'), {
        loop: true,
        spaceBetween: 24,
        breakpoints: {
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        },
        autoplay: { delay: 4200 },
        pagination: {
          el: root.querySelector('.event-pag'),
          clickable: true,
        },
      });
      cleanups.push(() => eventSwiper?.destroy?.(true, true));
    }

    // 5. Counter Section Animation
    const counterSection = root.querySelector('.sectionWorkdata');
    if (counterSection) {
      const obs = new IntersectionObserver(
        (entries) => {
          if (!entries[0].isIntersecting) return;
          root.querySelectorAll<HTMLElement>('.counter-number').forEach((el) => {
            const target = parseInt(el.dataset.number || '0', 10) || 0;
            const duration = 1400;
            const start = performance.now();
            const animate = (now: number) => {
              const progress = Math.min((now - start) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              el.textContent = Math.round(target * eased).toLocaleString();
              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };
            requestAnimationFrame(animate);
          });
          obs.unobserve(counterSection);
        },
        { threshold: 0.3 }
      );
      obs.observe(counterSection);
      cleanups.push(() => obs.disconnect());
    }

    // 6. LightGallery
    const galleryEl = root.querySelector('#galleryRow') as HTMLElement | null;
    if (galleryEl && window.lightGallery) {
      try {
        const plugins = window.lgZoom ? [window.lgZoom] : [];
        const lgInstance = window.lightGallery(galleryEl, {
          speed: 500,
          plugins,
          download: false,
        });
        cleanups.push(() => lgInstance?.destroy?.());
      } catch {
        // Ignore re-init warning
      }
    }

    // 7. FullCalendar on /calendar page
    const calendarEl = root.querySelector('#campusCalendar') as HTMLElement | null;
    if (calendarEl && window.FullCalendar) {
      calendarEl.innerHTML = '';
      const calendar = new window.FullCalendar.Calendar(calendarEl, {
        initialView: window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth',
        height: 'auto',
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,listMonth',
        },
        events: [
          {
            title: 'ECA',
            start: '2026-04-17',
            end: undefined,
            color: '#0891b2',
          },
          {
            title: 'eca',
            start: '2026-08-21',
            end: '2026-08-22',
            color: '#2d6a4f',
          },
          {
            title: 'Exam',
            start: '2026-08-24',
            end: '2026-08-29',
            color: '#7c3aed',
          },
        ],
      });
      calendar.render();
      cleanups.push(() => calendar.destroy());
    }

    // 8. Sticky Header & Back-to-top
    const headerEl = root.querySelector('#gplcHeader');
    const backToTop = root.querySelector('#backToTop');
    const onScroll = () => {
      headerEl?.classList.toggle('scrolled', window.scrollY > 60);
      backToTop?.classList.toggle('is-visible', window.scrollY > 260);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', onScroll));

    const onBackToTopClick = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    backToTop?.addEventListener('click', onBackToTopClick);
    cleanups.push(() => backToTop?.removeEventListener('click', onBackToTopClick));

    // 9. Mobile Hamburger Menu
    const hamBtn = root.querySelector('#gplcHam');
    const navEl = root.querySelector('#gplcNav');
    const onHamClick = () => {
      hamBtn?.classList.toggle('open');
      navEl?.classList.toggle('open');
    };
    hamBtn?.addEventListener('click', onHamClick);
    cleanups.push(() => hamBtn?.removeEventListener('click', onHamClick));

    // 10. Sticky Notice Widget
    const stickyNoticeWidget = root.querySelector('#stickyNoticeWidget') as HTMLElement | null;
    const stickyNoticeToggle = root.querySelector('#stickyNoticeToggle') as HTMLElement | null;
    const applyStickyNoticeState = () => {
      if (!stickyNoticeWidget || !stickyNoticeToggle) return;
      const isMobile = window.innerWidth <= 768;
      const shouldCollapse = isMobile
        ? stickyNoticeWidget.dataset.mobileCollapsed === '1'
        : stickyNoticeWidget.dataset.desktopCollapsed === '1';
      stickyNoticeWidget.classList.toggle('is-collapsed', shouldCollapse);
      stickyNoticeToggle.innerHTML = shouldCollapse
        ? '<i class="fas fa-angle-left"></i>'
        : '<i class="fas fa-angle-right"></i>';
    };
    applyStickyNoticeState();
    window.addEventListener('resize', applyStickyNoticeState, { passive: true });
    cleanups.push(() => window.removeEventListener('resize', applyStickyNoticeState));

    const onStickyToggleClick = () => {
      if (!stickyNoticeWidget || !stickyNoticeToggle) return;
      stickyNoticeWidget.classList.toggle('is-collapsed');
      stickyNoticeToggle.innerHTML = stickyNoticeWidget.classList.contains('is-collapsed')
        ? '<i class="fas fa-angle-left"></i>'
        : '<i class="fas fa-angle-right"></i>';
    };
    stickyNoticeToggle?.addEventListener('click', onStickyToggleClick);
    cleanups.push(() => stickyNoticeToggle?.removeEventListener('click', onStickyToggleClick));

    // 11. Client-side navigation interception & Form submission handling
    const onContainerClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      // Ignore lightgallery thumbnails
      if (anchor.closest('#galleryRow')) return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref) return;

      // In-page hash links (e.g. Privacy Policy table of contents)
      if (rawHref.startsWith('#')) {
        if (rawHref === '#') {
          e.preventDefault();
          return;
        }
        const targetEl = root.querySelector(rawHref);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      // Check if it matches one of the 11 internal GPLC routes
      try {
        const url = new URL(rawHref, window.location.origin);
        if (url.origin === window.location.origin) {
          const matchedRoute = normalizePath(url.pathname);
          if (pagesData[matchedRoute] && (url.pathname === '/' || matchedRoute !== '/')) {
            e.preventDefault();
            if (matchedRoute !== currentRoute) {
              window.history.pushState({}, '', matchedRoute);
              setCurrentRoute(matchedRoute);
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      } catch {
        // Let external links proceed naturally
      }
    };

    const onContainerSubmit = (e: Event) => {
      const form = (e.target as HTMLElement)?.closest('form') as HTMLFormElement | null;
      if (!form) return;
      e.preventDefault();
      const formData = new FormData(form);
      const senderName = (formData.get('name') as string) || 'Applicant';
      form.reset();
      setToastMessage(
        `Thank you, ${senderName}! Your message has been sent to Green Peace Lincoln College.`
      );
      setTimeout(() => setToastMessage(null), 5000);
    };

    root.addEventListener('click', onContainerClick);
    root.addEventListener('submit', onContainerSubmit);
    cleanups.push(() => {
      root.removeEventListener('click', onContainerClick);
      root.removeEventListener('submit', onContainerSubmit);
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [currentRoute, page]);

  return (
    <>
      {page.styles.map((cssText, idx) => (
        <style key={`${currentRoute}-style-${idx}`} dangerouslySetInnerHTML={{ __html: cssText }} />
      ))}

      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #1a472a, #2d6a4f)',
            color: '#fff',
            padding: '14px 22px',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(26,71,42,0.28)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          <i className="fas fa-check-circle" style={{ fontSize: '18px', color: '#86efac' }} />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{
              background: 'transparent',
              border: 0,
              color: '#fff',
              marginLeft: '8px',
              cursor: 'pointer',
            }}
            aria-label="Close notification"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        dangerouslySetInnerHTML={{ __html: page.bodyHtml }}
      />
    </>
  );
}

