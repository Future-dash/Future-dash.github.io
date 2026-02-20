PlayFab.settings.titleId = "114A51";

function register() {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();
    if (p.length < 6) return alert("Password must be 6+ chars.");

    const request = { Email: u + "@futuredash.com", Password: p, Username: u, DisplayName: u };
    PlayFabClientSDK.RegisterPlayFabUser(request, (result, error) => {
        if (result) alert("Account Created! Now Login.");
        else alert("Error: " + error.errorMessage);
    });
}

function login() {
    const u = document.getElementById("username").value.trim();
    const p = document.getElementById("password").value.trim();

    const request = { TitleId: PlayFab.settings.titleId, Email: u + "@futuredash.com", Password: p };
    PlayFabClientSDK.LoginWithEmailAddress(request, (result, error) => {
        if (result) {
            localStorage.setItem("loggedInUser", u);
            PlayFabClientSDK.GetUserData({}, (res) => {
                if (res.data.Data["playerColor"]) localStorage.setItem("temp_playerColor", res.data.Data["playerColor"].Value);
                window.location.href = "index.html";
            });
        } else alert("Login Failed: " + error.errorMessage);
    });
}
