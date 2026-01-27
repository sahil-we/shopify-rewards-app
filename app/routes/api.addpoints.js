// app/routes/api.addpoints.js

const BASE_URL = "https://stg-rewardsapi.centerforautism.com";
const USERNAME = "admin";
const PASSWORD = "admin";

export async function action() {
  try {
    // 🔐 LOGIN (CORRECT ENDPOINT)
    const loginRes = await fetch(`${BASE_URL}/Authentication/Login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        Username: USERNAME,
        Password: PASSWORD,
      }),
    });

    const loginData = await loginRes.json();

    const token =
      loginData.Token ||
      loginData.token ||
      loginData.data?.token ||
      loginData.accessToken;

    if (!token) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Token not found in login response",
          loginResponse: loginData,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // ➕ ADD EMPLOYEE POINTS
    const addPointsRes = await fetch(
      `${BASE_URL}/CardShopWrapper/AddEmployeePoints?EmployeeId=18237&Points=3000`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Accept": "application/json",
        },
      }
    );

    const addPointsData = await addPointsRes.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Points added successfully",
        data: addPointsData,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
