document.addEventListener("DOMContentLoaded", () => {
    
    document.getElementById("otpbtn").onclick = async () => {
        const enteredOtp = document.querySelector(".otpinput").value.trim();
 
        // 1. Get email from localStorage
        const email = localStorage.getItem("authEmail");

        // 2. Check if email exists (if user landed here directly)
        if (!email) {
            alert("Invalid session. Please start from the login page.");
            window.location.href = "login_page.html";
            return;
        }

        if (!enteredOtp) {
            alert("Please enter OTP");
            return;
       }

        try {
        // 3. Verify OTP with backend
            const res = await fetch("http://localhost:5000/api/auth/login/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp: enteredOtp }), // 'email' is now valid
            });

        const data = await res.json();

        if (data.success) {
            // 4. SUCCESS! Just update the status flag
            localStorage.setItem("authStatus", "verified");
                
                // 5. Clean up temporary session storage (just in case)
            sessionStorage.clear();

            setTimeout(() => {
                window.location.href = "home_page.html";
            }, 100);
        } else {
                alert("❌ " + data.message); // e.g., "Invalid OTP"
            }
        } catch (err) {
            console.error("OTP verification error:", err);
            alert("⚠️ Server error. Try again later.");
        }
    };
});