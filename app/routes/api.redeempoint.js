export async function loader() {
  return new Response("Method Not Allowed", { status: 405 });
}

export async function action({ request }) {
  console.log("🚀 Redeem API triggered");

  try {
    const body = await request.json();
    console.log("📦 Request body:", body);

    const BASE_URL = "https://stg-rewardsapi.centerforautism.com";
    const USERNAME = "admin";
    const PASSWORD = "admin";

    /* ================= LOGIN ================= */
    console.log("🔐 Logging in to Rewards API");

    const loginRes = await fetch(`${BASE_URL}/Authentication/Login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Username: USERNAME,
        Password: PASSWORD,
      }),
    });

    console.log("📡 Login status:", loginRes.status);

    const loginText = await loginRes.text();
    console.log("📨 Login raw response:", loginText);

    let loginData;
    try {
      loginData = JSON.parse(loginText);
    } catch (e) {
      console.error("❌ Login response is not JSON");
      throw new Error("Invalid login response");
    }

    console.log("✅ Parsed login data:", loginData);

    const token =
      loginData.Token ||
      loginData.AccessToken ||
      loginData.access_token ||
      loginData.token;

    if (!token) {
      console.error("❌ Token not found in login response");
      throw new Error("Login failed: token missing");
    }

    console.log("🔑 Token received:", token);

    /* ================= REDEEM ================= */
    const redeemUrl =
      `${BASE_URL}/CardShopWrapper/SaveEmployeeOrderExternal` +
      `?EmployeeID=${body.employeeId}` +
      `&PointRedeemed=${body.points}` +
      `&Notes=Shopify Order` +
      `&ExternalReferenceID=${body.orderId}`;

    console.log("➡️ Redeem URL:", redeemUrl);

    const redeemRes = await fetch(redeemUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("📡 Redeem status:", redeemRes.status);

    const redeemText = await redeemRes.text();
    console.log("📨 Redeem raw response:", redeemText);

    if (!redeemRes.ok) {
      console.error("❌ Redeem API failed");
      throw new Error(redeemText);
    }

    console.log("🎉 Points redeemed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "Points redeemed successfully",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("🔥 API Error:", error.message);

    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      { status: 500 }
    );
  }
}
