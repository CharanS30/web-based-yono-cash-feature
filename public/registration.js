const agreeCheck = document.getElementById("agreeCheck");
const nextBtn = document.getElementById("nextBtn");
const otpSection = document.getElementById("otpSection");
const registerBtn = document.getElementById("registerBtn");
const thankYou = document.getElementById("thankYou");

let userData = {}; // temporary storage until OTP verified

// ✅ Show Next button only when checkbox is checked
agreeCheck.addEventListener("change", () => {
    nextBtn.style.display = agreeCheck.checked ? "block" : "none";
});

// ✅ On Next -> validate form & request OTP from backend
nextBtn.addEventListener("click", async () => {
    const form = document.getElementById("regForm");
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    if (password !== confirmPassword) {
        alert("❌ Password and Confirm Password do not match!");
        return;
    }

    // collect form data
    const formData = new FormData(form);
    userData = Object.fromEntries(formData.entries());

    try {
        // call backend to send OTP
        const response = await fetch("http://localhost:5000/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: userData.email })
        });

        const result = await response.json();

        // ✅ Handle existing email case
        if (result.redirectToLogin) {
            alert(result.message);
            window.location.href = "login_page.html";
            return;
        }

        if (result.success) {
            alert("✅ OTP has been sent to your Email");
            otpSection.style.display = "block";
            nextBtn.style.display = "none";
        } else {
            alert("❌ Error sending OTP: " + result.message);
        }
    } catch (err) {
        console.error(err);
        alert("⚠️ Server error while sending OTP");
    }
});

// ✅ On Register -> verify OTP and save user
registerBtn.addEventListener("click", async () => {
    const enteredOtp = document.getElementById("otpInput").value;

    if (!enteredOtp) {
        alert("Please enter OTP");
        return;
    }

    try {
        const response = await fetch("http://localhost:5000/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: userData.username,
                email: userData.email,
                password: userData.password,
                otp: enteredOtp
            })
        });

        const result = await response.json();
        if (result.success) {
            document.getElementById("regForm").style.display = "none";
            otpSection.style.display = "none";
            thankYou.style.display = "block";

            alert("🎉 Registration successful! You can now login.");
            window.location.href = "login_page.html"; // redirect to login
        } else {
            alert("❌ Registration failed: " + result.message);
        }
    } catch (err) {
        console.error(err);
        alert("⚠️ Server error during registration");
    }
});
