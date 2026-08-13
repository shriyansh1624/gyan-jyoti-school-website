// ===============================
// MAIN.JS
// Common JS Only
// ===============================

document.addEventListener("DOMContentLoaded", function () {

    // ===============================
    // Mobile Hamburger Menu
    // ===============================

    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {

        hamburger.addEventListener("click", function () {

            hamburger.classList.toggle("open");

            navMenu.classList.toggle("open");

        });

    }

    // ===============================
    // Contact Form Validation
    // ===============================

    const contactForm = document.querySelector(".contact-form");

    if (contactForm) {

        contactForm.addEventListener("submit", function (e) {

            const email =
                contactForm.querySelector('input[name="email"]')?.value || "";

            const phone =
                contactForm.querySelector('input[name="phone"]')?.value || "";

            if (email && !/^\S+@\S+\.\S+$/.test(email)) {

                e.preventDefault();

                alert("Please enter a valid email address.");

                return;

            }

            if (phone && phone.replace(/\D/g, "").length < 10) {

                e.preventDefault();

                alert("Please enter a valid phone number.");

                return;

            }

        });

    }

});
// Carousel code

// Contact form code


// Hero animation

