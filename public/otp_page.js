// // otp_page.js

// document.getElementById("otpbtn").onclick = async () => {
//     const enteredOtp = document.querySelector(".otpinput").value.trim();
//     const email = localStorage.getItem("authEmail");
//     const username = localStorage.getItem("authUsername");

//     if (!enteredOtp) {
//         alert("Please enter OTP");
//         return;
//     }

//     try {
//         // Step 2: verify OTP with backend
//         const res = await fetch("http://localhost:5000/api/auth/login/verify-otp", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ email, otp: enteredOtp }),
//         });

//         const data = await res.json();
//         if (data.success) {
//             // alert("✅ Login successful! Welcome " + username);
//             // localStorage.removeItem("authEmail");
//             // localStorage.removeItem("authUsername");

//             //change 
//             // Move data from temporary session to permanent local storage
//             localStorage.setItem("authUsername", sessionStorage.getItem("authUsername"));
//             localStorage.setItem("authEmail", sessionStorage.getItem("authEmail"));
//             localStorage.setItem("authAccountNum", sessionStorage.getItem("authAccountNum"));
//             localStorage.setItem("authBalance", sessionStorage.getItem("authBalance"));

//             // Clean up temporary storage
//             sessionStorage.clear();
            
//             // redirect to home page (change if needed)
//             window.location.href = "home_page.html";
//         } else {
//             alert("❌ " + data.message);
//         }
//     } catch (err) {
//         console.error("OTP verification error:", err);
//         alert("⚠️ Server error. Try again later.");
//     }
// };


// Wrap in DOMContentLoaded to ensure page is loaded
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