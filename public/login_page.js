document.getElementById("loginbtn").onclick = async () => {
    const usernameinp = document.querySelector(".username").value.trim();
    const passwordinp = document.querySelector(".password").value;
    const displayedcaptcha = document.querySelector(".captcha p").innerText;
    const captchainp = document.querySelector(".usercaptcha").value;

    // Captcha check
    if (displayedcaptcha !== captchainp) {
        alert("Invalid captcha");
        document.querySelector(".usercaptcha").value = "";
        return;
    }

    if (!usernameinp || !passwordinp) {
        alert("Please enter username and password");
        return;
    }

    try {
        // Step 1: send credentials to backend -> backend checks password & sends OTP
        const res = await fetch("http://localhost:5000/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: usernameinp, password: passwordinp }),
        });

        const data = await res.json();
        if (data.success) {
            // Clear any old login data
            localStorage.clear();
            sessionStorage.clear();
 
            // Save new user data temporarily
            localStorage.setItem("authUsername", data.username);
            localStorage.setItem("authEmail", data.email);
            localStorage.setItem("authAccountNum", data.accountNumber);
            localStorage.setItem("authBalance", data.balance);
            localStorage.setItem("authStatus", "pending_otp");

            alert("✅ OTP sent to your registered email (valid for 5 minutes).");
            window.location.href = `otp_page.html?email=${encodeURIComponent(data.email)}`; //change2  // move to OTP entry page
        } else {
            alert(data.message || "Invalid username or password");
            // clear fields
            document.querySelector(".password").value = "";
            document.querySelector(".usercaptcha").value = "";
            document.querySelector(".username").value = "";
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("⚠️ Server error. Try again later.");
    }
};

// Captcha reload
document.getElementById("icon").onclick = () => {
    const array = ["xugxi", "1oOWk", "7aCCz", "RLVk8", "bP61l", "2G589", "aFTwl", "JZMCK", "DedN7", "1r5mv"];
    const gencaptcha = Math.floor(Math.random() * array.length);
    const dispcaptcha = document.querySelector(".captcha p");
    dispcaptcha.innerText = array[gencaptcha];
};
