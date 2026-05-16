/* ─────────────────────────────────────────────
   StudySync — index.js
   Landing page interactions & animations
───────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navbar scroll shadow ── */
  const nav = document.getElementById('mainNav');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 16) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });


  /* ── Mobile hamburger toggle ── */
  const hamburgerBtn  = document.getElementById('hamburgerBtn');
  const hamburgerIcon = document.getElementById('hamburgerIcon');
  const mobileMenu    = document.getElementById('mobileMenu');

  hamburgerBtn.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
    hamburgerIcon.className = isOpen
      ? 'fa-solid fa-xmark'
      : 'fa-solid fa-bars';
  });

  // Close mobile menu when any link inside it is clicked
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
      hamburgerIcon.className = 'fa-solid fa-bars';
    });
  });


  /* ── Animate progress bars after hero fades in ── */
  const animateBars = () => {
    document.querySelectorAll('.preview-bar').forEach(bar => {
      const target = bar.style.getPropertyValue('--target') || '0%';
      bar.style.width = target;
    });
  };

  // Trigger after hero card animation delay (0.8s + 0.3s buffer)
  setTimeout(animateBars, 1200);


  /* ── Intersection Observer: reveal feature cards ── */
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px',
  };

  const revealOnScroll = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        // Staggered delay per card
        const delay = (entry.target.dataset.delay || 0);
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, delay);
        revealOnScroll.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach((card, i) => {
    card.dataset.delay = i * 80;
    revealOnScroll.observe(card);
  });

  // Step cards
  const stepCards = document.querySelectorAll('.step-card');
  stepCards.forEach((card, i) => {
    card.dataset.delay = i * 100;
    revealOnScroll.observe(card);
  });


  /* ── Motivational quotes rotation ── */
  const quotes = [
    { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
    { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "The more that you read, the more things you will know.", author: "Dr. Seuss" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
    { text: "Great things never come from comfort zones.", author: "Unknown" },
  ];

  const quoteText   = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');
  const quoteCard   = document.getElementById('quoteCard');

  let currentQuote = 0;

  const rotateQuote = () => {
    // Fade out
    quoteCard.style.transition = 'opacity 0.4s ease';
    quoteCard.style.opacity    = '0';

    setTimeout(() => {
      currentQuote = (currentQuote + 1) % quotes.length;
      quoteText.textContent   = `"${quotes[currentQuote].text}"`;
      quoteAuthor.textContent = `— ${quotes[currentQuote].author}`;

      // Fade in
      quoteCard.style.opacity = '1';
    }, 420);
  };

  // Rotate every 7 seconds
  setInterval(rotateQuote, 7000);


  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (!targetEl) return;

      e.preventDefault();
      const navHeight = nav.offsetHeight;
      const top = targetEl.getBoundingClientRect().top + window.scrollY - navHeight - 16;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });


  /* ── Active nav link highlight on scroll ── */
  const sections    = document.querySelectorAll('section[id]');
  const navAnchors  = document.querySelectorAll('.nav-links a[href^="#"]');

  const highlightNav = () => {
    let current = '';
    sections.forEach(sec => {
      const top = sec.getBoundingClientRect().top;
      if (top <= 100) current = sec.getAttribute('id');
    });

    navAnchors.forEach(a => {
      a.style.color = a.getAttribute('href') === `#${current}`
        ? 'var(--primary)'
        : '';
    });
  };

  window.addEventListener('scroll', highlightNav, { passive: true });

});