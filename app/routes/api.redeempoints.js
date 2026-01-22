export async function action({ request }) {
  try {
    /* =====================================
       1. READ DATA FROM SHOPIFY FLOW
    ===================================== */
    const body = await request.json();

    const {
      order_id,
      order_name,
      employee_id,
      points_to_redeem
    } = body;

    if (!order_id || !employee_id || !points_to_redeem) {
      return new Response(
        JSON.stringify({ error: "Missing required data" }),
        { status: 400 }
      );
    }

    /* =====================================
       2. LOGIN TO REWARDS API
    ===================================== */
    const loginRes = await fetch(
      "https://stg-rewardsapi.centerforautism.com/Authentication/Login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          Username: "admin",
          Password: "admin"
        })
      }
    );

    if (!loginRes.ok) {
      throw new Error("Rewards login failed");
    }

    const loginData = await loginRes.json();
    const token = loginData.token;

    if (!token) {
      throw new Error("Token not received");
    }

    /* =====================================
       3. DEDUCT EMPLOYEE POINTS
    ===================================== */
    const redeemUrl =
      "https://stg-rewardsapi.centerforautism.com/CardShopWrapper/SaveEmployeeOrderExternal" +
      `?EmployeeID=${employee_id}` +
      `&PointRedeemed=${points_to_redeem}` +
      `&Notes=Shopify Order` +
      `&ExternalReferenceID=${order_name}`;

    const redeemRes = await fetch(redeemUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!redeemRes.ok) {
      const errorText = await redeemRes.text();
      throw new Error(errorText);
    }

    /* =====================================
       4. SUCCESS RESPONSE TO FLOW
    ===================================== */
    return new Response(
      JSON.stringify({
        status: "success",
        order: order_name,
        employee_id,
        points_deducted: points_to_redeem
      }),
      { status: 200 }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        status: "error",
        message: error.message
      }),
      { status: 500 }
    );
  }
}
