export default async function runDiscountScript({
  admin,
  shopifyCustomerId,
  email,
  coins,
}) {
  console.log("🎯 Running discount script");
  console.log("📧 Email:", email);
  console.log("💰 Coins:", coins);

  // ───────── DISCOUNT CODE ─────────
  const discountCode = `PTS-${email.split("@")[0].toUpperCase()}`;
  console.log("🎟️ Discount:", discountCode);

  const discountSearchRes = await admin.graphql(
    `
    query ($query: String!) {
      codeDiscountNodes(first: 10, query: $query) {
        nodes {
          id
          codeDiscount {
            ... on DiscountCodeBasic {
              codes(first: 10) { nodes { code } }
            }
          }
        }
      }
    }
    `,
    { variables: { query: `code:${discountCode}` } }
  );

  const discountSearchData = await discountSearchRes.json();

  let discountNode = null;

  for (const node of discountSearchData.data.codeDiscountNodes.nodes) {
    const codes = node.codeDiscount?.codes?.nodes || [];
    if (codes.some((c) => c.code === discountCode)) {
      discountNode = node;
      break;
    }
  }

  if (!discountNode) {
    console.log("➕ Creating discount");

    await admin.graphql(
      `
      mutation ($input: DiscountCodeBasicInput!) {
        discountCodeBasicCreate(basicCodeDiscount: $input) {
          userErrors { message }
        }
      }
      `,
      {
        variables: {
          input: {
            title: discountCode,
            code: discountCode,
            startsAt: new Date().toISOString(),
            customerSelection: {
              customers: { add: [shopifyCustomerId] },
            },
            customerGets: {
              items: { all: true },
              value: {
                discountAmount: {
                  amount: String(coins),
                  appliesOnEachItem: false,
                },
              },
            },
            usageLimit: 1,
            appliesOncePerCustomer: true,
          },
        },
      }
    );
  } else {
    console.log("✏️ Updating discount");

    await admin.graphql(
      `
      mutation ($id: ID!, $input: DiscountCodeBasicInput!) {
        discountCodeBasicUpdate(id: $id, basicCodeDiscount: $input) {
          userErrors { message }
        }
      }
      `,
      {
        variables: {
          id: discountNode.id,
          input: {
            customerGets: {
              items: { all: true },
              value: {
                discountAmount: {
                  amount: String(coins),
                  appliesOnEachItem: false,
                },
              },
            },
          },
        },
      }
    );
  }

  // ───────── METAFIELDS ─────────
  console.log("🧾 Updating metafields");

  await admin.graphql(
    `
    mutation ($input: CustomerInput!) {
      customerUpdate(input: $input) {
        userErrors { message }
      }
    }
    `,
    {
      variables: {
        input: {
          id: shopifyCustomerId,
          metafields: [
            {
              namespace: "custom",
              key: "coins",
              type: "single_line_text_field",
              value: String(coins),
            },
            {
              namespace: "custom",
              key: "discount_code",
              type: "single_line_text_field",
              value: discountCode,
            },
          ],
        },
      },
    }
  );

  console.log("✅ Discount + metafields synced");

  return {
    discountCode,
    coins,
  };
}
