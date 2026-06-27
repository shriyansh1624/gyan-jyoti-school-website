// main.js - carousel, hamburger menu
document.addEventListener('DOMContentLoaded', function () {
  // Hamburger toggle for small screens
  const hamburger = document.querySelector('.hamburger');
  const navMenu = document.querySelector('.nav-menu');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navMenu.classList.toggle('open');
    });
  }

  // Simple carousel auto-advance fallback (works with markup in index.ejs)
  let slideIndex = 0;
  const slides = document.querySelectorAll('.carousel-item');
  const carouselInner = document.getElementById('carouselInner');

  function showSlide(n) {
    if (!slides || slides.length === 0) return;
    if (n >= slides.length) slideIndex = 0;
    if (n < 0) slideIndex = slides.length - 1;
    carouselInner.style.transform = `translateX(-${slideIndex * 100}%)`;
  }

  window.changeSlide = function (n) {
    slideIndex += n;
    showSlide(slideIndex);
  };

  // Auto advance
  setInterval(() => {
    slideIndex++;
    showSlide(slideIndex);
  }, 5000);

  // Basic client-side validation enhancement (optional)
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      const email = contactForm.querySelector('input[name="email"]').value;
      const phone = contactForm.querySelector('input[name="phone"]').value;
      // Minimal checks
      if (email && !/^\S+@\S+\.\S+$/.test(email)) {
        e.preventDefault();
        alert('Please enter a valid email address.');
        return;
      }
      if (phone && phone.replace(/\D/g, '').length < 10) {
        e.preventDefault();
        alert('Please enter a valid phone number.');
        return;
      }
    });
  }
});