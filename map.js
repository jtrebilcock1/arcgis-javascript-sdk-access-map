require(["esri/config", "esri/Map", "esri/views/SceneView", "esri/Graphic",
    "esri/layers/GraphicsLayer", "esri/portal/Portal",
    "esri/identity/OAuthInfo",
    "esri/identity/IdentityManager",
    "esri/portal/PortalQueryParams",
    "esri/layers/FeatureLayer",
    "esri/layers/ElevationLayer",
    "esri/symbols/WebStyleSymbol"

], (esriConfig, Map, MapView, Graphic, GraphicsLayer, Portal, OAuthInfo, esriId, PortalQueryParams, FeatureLayer, ElevationLayer, WebStyleSymbol) => {

    const signInButton = document.getElementById("sign-in-button");
    const navLogo = document.getElementById("nav-logo");
    const navigationUser = document.getElementById("nav-user");
    signInButton.addEventListener("click", signInOrOut);
    navigationUser.addEventListener("click", signInOrOut);

    const info = new OAuthInfo({
        // Swap this ID out with an app ID registered in your ArcGIS Organization.
        appId: ""
    });

    // Add the OAuthInfo to the IdentityManager.
    esriId.registerOAuthInfos([info]);

    // Call the checkSignIn function to see if the user is already signed in.
    checkSignIn();

    // Function to check the current sign in status and query the portal if signed in.
    function checkSignIn() {
        esriId
            .checkSignInStatus(info.portalUrl + "/sharing")
            .then(() => {
                // If signed in, show the username in the UI.
                console.log(info.portalUrl)
                navigationUser.hidden = false;
                signInButton.hidden = true;
                const portal = new Portal({
                    authMode: "immediate"
                });
                // Check if using a portal other than ArcGIS Online.
                if (info.portalUrl !== "https://www.arcgis.com") {
                    portal.url = info.portalUrl;
                }
                // Load the portal, display the name and username, then call the query items function.
                portal.load().then(() => {
                    console.log(portal)
                    navigationUser.fullName = portal.user.fullName;
                    navigationUser.username = portal.user.username;
                    navLogo.description =
                        "a private map";
                    //  queryItems(portal);
                });
            })
            .catch(() => {
                // If not signed in, then show the sign in button.
                signInButton.hidden = false;
                navigationUser.hidden = true;
                navLogo.description = "Use OAuth to log in to an ArcGIS Organization to view your items.";
            });
    }

    // Function to sign in or out of the portal used by the sign in/out button click event.
    function signInOrOut() {
        esriId
            .checkSignInStatus(info.portalUrl + "/sharing")
            .then(() => {
                // If already signed in, then destroy the credentials to sign out.
                esriId.destroyCredentials();
                window.location.reload();
            })
            .catch(() => {
                // If the user is not signed in, generate a new credential.
                esriId
                    .getCredential(info.portalUrl + "/sharing", {
                        // Set the following property to false to not show a dialog
                        // before the OAuth popup window is open.
                        //oAuthPopupConfirmation: false,
                    })
                    .then(() => {
                        // Once a credential is returned from the promise, check the
                        // sign in status to query the portal for items.
                        checkSignIn();
                    });
            });
    }

    let elevLyr = new ElevationLayer({
        // Custom elevation service
        url: "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/TopoBathy3D/ImageServer"
    });

    const map = new Map({
        basemap: "osm-3d",//topo-3d", // basemap styles service
        container: "viewDiv"
    });
    const view = new MapView({
        map: map,
        center: [-162.0235966, 60.2178592], // Longitude, latitude
        zoom: 13, // Zoom level
        container: "viewDiv" // Div element
    });

    const WebStyleSymbol1 = new WebStyleSymbol({
        name: "Powerline_Pole",
        styleName: "EsriInfrastructureStyle"
    });

    const popupnodes = {
        "title": "node",
        "content": "<b>Node:</b> {OBJECTID}<br><b>node:</b> {node_id}"
    }
    //nodesLayer url should be the rest url for a private agol layer of points
    const nodesLayer = new FeatureLayer({
        url: "",

        elevationInfo: {
            mode: "relative-to-ground",
            featureExpressionInfo: {
                expression: "Geometry($feature).z * 100 + $feature.HEIGHT100"
            }
        },
        outFields: ["OBJECTID", "node_id"],

        popupTemplate: popupnodes
    });

    nodesLayer.renderer = {
        type: "simple",  // autocasts as new SimpleRenderer()
        symbol: WebStyleSymbol1,
        visualVariables: [
            {
                type: "size",
                axis: "height", // specify which axis to apply the data values to
                field: "test",
                valueUnit: "feet"
            }]
    };

    map.add(nodesLayer);
    map.ground.layers.add(elevLyr);
});