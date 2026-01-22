import { getToken, setToken } from "../utils/rewardsToken.server";

/* ========================================================
   LOGIN
======================================================== */
async function login() {
  console.log("🔐 Logging in...");

  const res = await fetch(
    "https://stg-rewardsapi.centerforautism.com/Authentication/Login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Username: "admin",
        Password: "admin",
      }),
    }
  );

  const text = await res.text();
  if (!text) throw new Error("❌ Empty login response");

  const data = JSON.parse(text);
  if (!data?.token) throw new Error("❌ Login failed");

  setToken(data.token, 3600);
  console.log("✅ Token saved");

  return data.token;
}

/* ========================================================
   SAFE FETCH WITH TOKEN AUTO-REFRESH
======================================================== */
async function fetchWithAuth(url) {
  let token = getToken();
  if (!token) token = await login();

  let res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    console.log("🔁 Token expired. Re-login...");
    token = await login();

    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  const text = await res.text();
  if (!text) {
    console.warn("⚠️ Empty response:", url);
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("❌ Invalid JSON:", url);
    throw err;
  }
}

/* ========================================================
   FETCH ALL EMPLOYEE DATA (PAGINATED)
======================================================== */
async function fetchAllEmployeeRecords(pageSize = 20) {
  let page = 1;
  let hasMore = true;
  let allRecords = [];

  while (hasMore) {
    const url =
      `https://stg-rewardsapi.centerforautism.com/CardShopWrapper/EmployeeDetails` +
      `?PageNumber=${page}&PageSize=${pageSize}&FromDate=2025-01-01&ToDate=2025-12-31`;

    console.log(`📄 Fetching employee list page ${page}`);

    const res = await fetchWithAuth(url);

    const records = Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [];

    console.log(`📦 Records on page ${page}: ${records.length}`);

    allRecords.push(...records);

    if (records.length < pageSize) {
      hasMore = false;
    } else {
      page++;
    }
  }

  console.log("✅ ALL EMPLOYEES FETCHED:", allRecords.length);

  return {
    totalRecords: allRecords.length,
    totalPages: page,
    pageSize,
    data: allRecords,
  };
}

/* ========================================================
   FETCH SINGLE EMPLOYEE BY ID
======================================================== */
async function fetchEmployeeById(employeeId) {
  console.log(`👤 Fetching employee by ID: ${employeeId}`);

  const url =
    `https://stg-rewardsapi.centerforautism.com/CardShopWrapper/GetEmployeeById` +
    `?EmployeeId=${employeeId}`;

  const res = await fetchWithAuth(url);

  console.log("👤 Employee detail response:", res);

  return res;
}

/* ========================================================
   MAIN ACTION
======================================================== */
export async function action() {
  try {
    console.log("🚀 STARTING EMPLOYEE DATA EXTRACTION");

    // 1️⃣ Fetch all employees
    const allEmployees = await fetchAllEmployeeRecords(20);

    // 2️⃣ Fetch single employee details (example ID = 46)
    const employeeById = await fetchEmployeeById(18237);

    // 3️⃣ Combine & return everything
    const finalResponse = {
      summary: {
        totalEmployees: allEmployees.totalRecords,
        totalPages: allEmployees.totalPages,
        pageSize: allEmployees.pageSize,
      },
      allEmployees: allEmployees.data,
      selectedEmployee: employeeById,
    };

    console.log("=======================================");
    console.log("✅ FINAL COMBINED RESPONSE");
    console.log(finalResponse);
    console.log("=======================================");

    return new Response(JSON.stringify(finalResponse), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("🔥 SYSTEM FAILURE:", error);

    return new Response(
      JSON.stringify({ error: "Employee data extraction failed" }),
      { status: 500 }
    );
  }
}

// -----------------------------------------------------------------------

// import {
//   Page,
//   Layout,
//   Card,
//   DataTable,
//   Spinner,
//   Badge,
//   InlineStack,
//   BlockStack,
//   Text,
// } from "@shopify/polaris";
// import { useState } from "react";

// export default function RewardsEmployees() {
//   const [loading, setLoading] = useState(false);
//   const [employees, setEmployees] = useState([]);
//   const [selectedEmployee, setSelectedEmployee] = useState(null);
//   const [rawResponse, setRawResponse] = useState(null);
//   const [error, setError] = useState(null);

//   /* ========================================================
//      FETCH EMPLOYEES
//   ======================================================== */
//   async function fetchEmployees() {
//     setLoading(true);
//     setError(null);

//     try {
//       const res = await fetch("/api/rewards-employees", {
//         method: "POST",
//       });

//       const text = await res.text();
//       if (!text) throw new Error("Empty API response");

//       const json = JSON.parse(text);

//       // Validate backend contract
//       if (!Array.isArray(json?.allEmployees)) {
//         throw new Error("allEmployees array missing in response");
//       }

//       setRawResponse(json);
//       setEmployees(json.allEmployees);
//       setSelectedEmployee(json.selectedEmployee ?? null);
//     } catch (err) {
//       console.error("Fetch failed:", err);
//       setError(err.message);
//       setEmployees([]);
//       setSelectedEmployee(null);
//     } finally {
//       setLoading(false);
//     }
//   }

//   /* ========================================================
//      HELPERS
//   ======================================================== */
//   const badge = (value) => (
//     <Badge tone={value ? "success" : "critical"}>
//       {value ? "Active" : "Inactive"}
//     </Badge>
//   );

//   const formatDate = (d) =>
//     d ? new Date(d).toLocaleDateString() : "—";

//   /* ========================================================
//      TABLE 1: ALL EMPLOYEES
//   ======================================================== */
//   const employeeRows = employees.map((e) => [
//     e.employeeID ?? "—",
//     e.employeeNumber ?? "—",
//     `${e.firstName ?? ""} ${e.lastName ?? ""}`,
//     e.emailAddress ?? "—",
//     e.position ?? "—",
//     e.officeLocation ?? "—",
//     badge(e.isActive),
//     formatDate(e.hireDate),
//     e.workerType ?? "—",
//   ]);

//   /* ========================================================
//      TABLE 2: SELECTED EMPLOYEE DETAILS
//   ======================================================== */
//   const selectedEmployeeRows = selectedEmployee
//     ? [
//         ["Employee ID", selectedEmployee.employeeID ?? "—"],
//         ["Employee Number", selectedEmployee.employeeNumber ?? "—"],
//         [
//           "Name",
//           `${selectedEmployee.firstName ?? ""} ${
//             selectedEmployee.lastName ?? ""
//           }`,
//         ],
//         ["Email", selectedEmployee.emailAddress ?? "—"],
//         ["Position", selectedEmployee.position ?? "—"],
//         ["Office Location", selectedEmployee.officeLocation ?? "—"],
//         ["Status", badge(selectedEmployee.isActive)],
//         ["Provider Status", selectedEmployee.providerStatus ?? "—"],
//         ["Company ID", selectedEmployee.companyID ?? "—"],
//         ["Worker Type", selectedEmployee.workerType || "—"],
//         ["Hire Date", formatDate(selectedEmployee.hireDate)],
//         ["Termination Date", formatDate(selectedEmployee.terminationDate)],
//         ["Created Date", formatDate(selectedEmployee.createdDate)],
//         ["Updated Date", formatDate(selectedEmployee.updatedDate)],
//         ["Is Rescind", selectedEmployee.isRescind ? "Yes" : "No"],
//       ]
//     : [];

//   /* ========================================================
//      UI
//   ======================================================== */
//   return (
//     <Page
//       title="Employees"
//       primaryAction={{
//         content: "Fetch Employees",
//         onAction: fetchEmployees,
//         loading,
//       }}
//     >
//       <Layout>
//         <Layout.Section>
//           <BlockStack gap="400">
//             {/* ================= Loading ================= */}
//             {loading && (
//               <Card>
//                 <InlineStack gap="300">
//                   <Spinner />
//                   <Text>Loading employees…</Text>
//                 </InlineStack>
//               </Card>
//             )}

//             {/* ================= Error ================= */}
//             {!loading && error && (
//               <Card>
//                 <BlockStack gap="200">
//                   <Text tone="critical">❌ {error}</Text>
//                   {rawResponse && (
//                     <Text as="pre">
//                       {JSON.stringify(rawResponse, null, 2)}
//                     </Text>
//                   )}
//                 </BlockStack>
//               </Card>
//             )}

//             {/* ================= Empty State ================= */}
//             {!loading && !error && employees.length === 0 && (
//               <Card>
//                 <Text tone="subdued">
//                   No employees loaded yet. Click “Fetch Employees”.
//                 </Text>
//               </Card>
//             )}

//             {/* ================= Table 1: All Employees ================= */}
//             {employees.length > 0 && (
//               <Card>
//                 <BlockStack gap="300">
//                   <Text variant="headingMd">All Employees</Text>

//                   <DataTable
//                     columnContentTypes={[
//                       "text",
//                       "text",
//                       "text",
//                       "text",
//                       "text",
//                       "text",
//                       "text",
//                       "text",
//                       "text",
//                     ]}
//                     headings={[
//                       "ID",
//                       "Emp No",
//                       "Name",
//                       "Email",
//                       "Position",
//                       "Office",
//                       "Status",
//                       "Hire Date",
//                       "Worker Type",
//                     ]}
//                     rows={employeeRows}
//                   />
//                 </BlockStack>
//               </Card>
//             )}

//             {/* ================= Table 2: Selected Employee ================= */}
//             {selectedEmployee && (
//               <Card>
//                 <BlockStack gap="300">
//                   <Text variant="headingMd">
//                     Selected Employee Details
//                   </Text>

//                   <DataTable
//                     columnContentTypes={["text", "text"]}
//                     headings={["Field", "Value"]}
//                     rows={selectedEmployeeRows}
//                   />
//                 </BlockStack>
//               </Card>
//             )}
//           </BlockStack>
//         </Layout.Section>
//       </Layout>
//     </Page>
//   );
// }

