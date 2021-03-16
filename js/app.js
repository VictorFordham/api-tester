let auth0 = null;

const fetchAuthConfig = () => fetch("/api-tester/auth_config.json");

const configureClient = async () => {
    const response = await fetchAuthConfig();
    const config = await response.json();

    auth0 = await createAuth0Client({
        domain: config.domain,
        audience: config.audience,
        client_id: config.clientId,
        redirect_uri: window.location.href,
        cacheLocation: "localstorage"
    });
};


window.onload = async () => {
    await configureClient();
    updateUI();
    console.log(window.location.search);
    const isAuthenticated = await auth0.isAuthenticated();

    if (isAuthenticated) {
        //load resources from the api, not sure why this makes sense though
        //probably more appropriate to place this in the updateUI function
    } else {
        const query = window.location.search;
        if (query.includes("code=") && query.includes("state=")) {
            //process the login state
            await auth0.handleRedirectCallback();
            updateUI();
            window.history.replaceState({}, document.title, "/api-tester/");
        }
    }
};

const updateUI = async () => {
    const isAuthenticated = await auth0.isAuthenticated();

    document.getElementById("btn-logout").disabled = !isAuthenticated;
    document.getElementById("btn-login").disabled = isAuthenticated;

    if (isAuthenticated) {
        const userData = await auth0.getUser();

        document.getElementById("gated-content").classList.remove("hidden");
        
        document.getElementById(
            "ipt-access-token"
        ).innerHTML = await auth0.getTokenSilently();

        document.getElementById(
            "ipt-user-profile"
        ).textContent = JSON.stringify(
            userData
        );

        //document.getElementById("profile-pic").src = userData.picture;

    } else {
        document.getElementById("gated-content").classList.add("hidden");
    }
};

const login = async () => {
    await auth0.loginWithRedirect({
        redirect_uri: window.location.href
    });
};

const logout = () => {
    auth0.logout({
        returnTo: window.location.href //returns user to where they were, can change later
    });
};

const makeRequest = async(method) => {
    document.getElementById("output").value = "";
    const token = await auth0.getTokenSilently();
    const domain = document.getElementById("domain").value;
    const endpoint = document.getElementById("endpoint").value;
    const parameters = document.getElementById("parameters").value;

    let definition = {
        method: method,
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
        }
    }

    if(method != "GET") {
        definition.body = document.getElementById("payload").value;
        definition.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(domain + endpoint + parameters, definition);

    const payload = await response.text();
    document.getElementById("output").value = payload;
};

const getEndpointRequest = () => {
    makeRequest("GET");
};

const postEndpointRequest = () => {
    makeRequest("POST");
};

const putEndpointRequest = () => {
    makeRequest("PUT");
};

const deleteEndpointRequest = () => {
    makeRequest("DELETE");
};