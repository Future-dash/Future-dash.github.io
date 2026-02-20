PlayFab.settings.titleId = "114A51";

// Create a new account in the Cloud
function register() {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();
    
    if (p.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    const registerRequest = {
        Email: u + "@futuredash.com",
        Password: p,
        Username: u,
        DisplayName: u
    };

    PlayFabClientSDK.RegisterPlayFabUser(registerRequest, (result, error) => {
        if (result) {
            alert("Account created in Azure! You can now login on any computer.");
        } else {
            alert("Registration failed: " + error.errorMessage);
        }
    });
}

// Log in and pull user preferences (like color)
function login() {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();

    const loginRequest = {
        TitleId: PlayFab.settings.titleId,
        Email: u + "@futuredash.com",
        Password: p
    };

    PlayFabClientSDK.LoginWithEmailAddress(loginRequest, (result, error) => {
        if (result) {
            localStorage.setItem("loggedInUser", u);
            localStorage.setItem("playfabId", result.data.PlayFabId);
            
            // Get the player's saved color from the Cloud
            PlayFabClientSDK.GetUserData({}, (userData, userError) => {
                if (userData && userData.data.Data["playerColor"]) {
                    localStorage.setItem("temp_playerColor", userData.data.Data["playerColor"].Value);
                }
                window.location.href = "index.html";
            });
        } else {
            alert("Login failed: " + error.errorMessage);
        }
    });
}

function logout() {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("playfabId");
    localStorage.removeItem("temp_playerColor");
    window.location.href = "index.html";
}
